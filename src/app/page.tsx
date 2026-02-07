"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { editor, languages } from "monaco-editor";
import { useStatusManager } from "@/hooks/useStatusManager";
import { diffJson, patchJson } from "@/utils/jsonPatch";
import { diffLang, patchLang } from "@/utils/langPatch";
import type { Monaco } from "@monaco-editor/react";
import { DiffEditor } from "@monaco-editor/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import ILanguageExtensionPoint = languages.ILanguageExtensionPoint;

const commonOptions: editor.IDiffEditorConstructionOptions = {
  enableSplitViewResizing: true,
  renderSideBySide: true,
  automaticLayout: true,
  originalEditable: true,
  readOnly: false,
};

const minecraftLangId = "minecraft-lang";

const registerMinecraftLang = (monaco: Monaco) => {
  const alreadyRegistered = monaco.languages.getLanguages()
    .some((lang: ILanguageExtensionPoint) => lang.id === minecraftLangId);
  if (alreadyRegistered) return;

  monaco.languages.register({
    id: minecraftLangId,
    extensions: [".lang"],
    aliases: ["Minecraft Lang", "minecraft-lang"],
  });

  monaco.languages.setLanguageConfiguration(minecraftLangId, {
    comments: {
      lineComment: "#",
    },
  });

  monaco.languages.setMonarchTokensProvider(minecraftLangId, {
    tokenizer: {
      root: [
        [/^[\s]*[#;].*$/, "comment"],
        [/^[^=#\s][^=]*?(?==)/, "key"],
        [/=/, "delimiter"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/[^#;]+$/, "string"],
      ],
    },
  });
};

type MarkerErrors = { oldSource: string | null; source: string | null; target: string | null };

export default function Home() {
  const [editorsLoaded, setEditorsLoaded] = useState(0);
  const [language, setLanguage] = useState<"lang" | "json">("json");
  const [oldSource, setOldSource] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const secondDiffRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const languageId = useMemo(() => (language === "lang" ? minecraftLangId : "json"), [language]);
  const { activeMessages, pushStatusMessage, removeStatusMessage } = useStatusManager(editorsLoaded < 2);
  const [markerErrors, setMarkerErrors] = useState<MarkerErrors>({ oldSource: null, source: null, target: null });
  const { resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    registerMinecraftLang(monaco);
  }, []);

  const handleFirstEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor, monaco: Monaco) => {
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "[任意] 古い翻訳元ファイルを貼り付けてください\n新しい翻訳元ファイルと差異があるキーはパッチされません",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルを貼り付けてください\nAlt+Shift+Fでフォーマット",
    });

    const originalModel = diffEditor.getOriginalEditor().getModel();
    const modifiedModel = diffEditor.getModifiedEditor().getModel();

    const updateMarkers = () => {
      if (originalModel) {
        const markers = monaco.editor.getModelMarkers({ resource: originalModel.uri });
        const errors = markers
          .filter((m: editor.IMarker) => m.severity === monaco.MarkerSeverity.Error)
          .map((m: editor.IMarker) => `[古い翻訳元] Line ${m.startLineNumber}: ${m.message}`)
          .join("\n");
        setMarkerErrors((prev) => (prev.oldSource === (errors || null) ? prev : { ...prev, oldSource: errors || null }));
      }
      if (modifiedModel) {
        const markers = monaco.editor.getModelMarkers({ resource: modifiedModel.uri });
        const errors = markers
          .filter((m: editor.IMarker) => m.severity === monaco.MarkerSeverity.Error)
          .map((m: editor.IMarker) => `[翻訳元] Line ${m.startLineNumber}: ${m.message}`)
          .join("\n");
        setMarkerErrors((prev) => (prev.source === (errors || null) ? prev : { ...prev, source: errors || null }));
      }
    };

    const disposeMarkers = monaco.editor.onDidChangeMarkers(() => {
      updateMarkers();
    });

    const disposeOriginal = diffEditor.getOriginalEditor().onDidChangeModelContent(() => {
      setOldSource(diffEditor.getOriginalEditor().getValue());
    });
    const disposeModified = diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
      setSource(diffEditor.getModifiedEditor().getValue());
    });

    diffEditor.onDidDispose(() => {
      disposeOriginal.dispose();
      disposeModified.dispose();
      disposeMarkers.dispose();
    });
    setEditorsLoaded((prev) => prev + 1);
  }, []);

  const handleSecondEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor, monaco: Monaco) => {
    secondDiffRef.current = diffEditor;
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "翻訳先ファイルを貼り付けてください",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルに翻訳先ファイルがパッチされます",
      readOnly: true,
    });

    const originalModel = diffEditor.getOriginalEditor().getModel();

    const updateMarkers = () => {
      if (originalModel) {
        const markers = monaco.editor.getModelMarkers({ resource: originalModel.uri });
        const errors = markers
          .filter((m: editor.IMarker) => m.severity === monaco.MarkerSeverity.Error)
          .map((m: editor.IMarker) => `[翻訳先] Line ${m.startLineNumber}: ${m.message}`)
          .join("\n");
        setMarkerErrors((prev) => (prev.target === (errors || null) ? prev : { ...prev, target: errors || null }));
      }
    };

    const disposeMarkers = monaco.editor.onDidChangeMarkers(() => {
      updateMarkers();
    });

    const disposeOriginal = diffEditor.getOriginalEditor().onDidChangeModelContent(() => {
      setTarget(diffEditor.getOriginalEditor().getValue());
    });

    diffEditor.onDidDispose(() => {
      disposeOriginal.dispose();
      disposeMarkers.dispose();
    });
    setEditorsLoaded((prev) => prev + 1);
  }, []);

  const patched = useMemo(() => {
    if (!source || !target) return target;

    if (language === "json") {
      const errors = [markerErrors.oldSource, markerErrors.source, markerErrors.target].filter(Boolean).join("\n\n");
      if (errors) return errors;
    }

    try {
      return language === "json"
        ? patchJson({ oldSource: oldSource || undefined, source, target, duplicatedKey: "pop" })
        : patchLang({ oldSource: oldSource || undefined, source, target, duplicatedKey: "pop" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `エラーが発生しました:\n${message}`;
    }
  }, [language, oldSource, source, target, markerErrors]);

  useEffect(() => {
    const modifiedEditor = secondDiffRef.current?.getModifiedEditor();
    if (!modifiedEditor) return;
    const current = modifiedEditor.getValue();
    if (current === patched) return;
    modifiedEditor.setValue(patched);
  }, [patched]);

  const canCopyDiff = useMemo(() => source.trim().length > 0, [source]);

  const handleCopyDiff = useCallback(async () => {
    const pendingId = pushStatusMessage("差分をコピー中...", true);
    try {
      const diff = language === "json"
        ? diffJson({ oldSource: oldSource || undefined, source, duplicatedKey: "pop" })
        : diffLang({ oldSource: oldSource || undefined, source, duplicatedKey: "pop" });
      await navigator.clipboard.writeText(diff);
      removeStatusMessage(pendingId);
      const doneId = pushStatusMessage("差分をコピーしました");
      setTimeout(() => removeStatusMessage(doneId), 2500);
    } catch (err) {
      removeStatusMessage(pendingId);
      const errorId = pushStatusMessage("差分のコピーに失敗しました");
      setTimeout(() => removeStatusMessage(errorId), 3000);
    }
  }, [language, oldSource, source, pushStatusMessage, removeStatusMessage]);

  return (
    <main className="flex min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="flex w-full flex-1 flex-col gap-3 px-3 py-2 md:px-4 md:py-4 box-border">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface/80 backdrop-blur-sm px-2.5 py-1 shadow-sm">
          <label htmlFor="language" className="text-sm font-medium text-text-primary leading-none">
            ファイル形式:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "lang" | "json")}
            className="h-8 rounded-md border border-border bg-surface px-2 text-sm text-text-primary shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="json">.json</option>
            <option value="lang">.lang</option>
          </select>

          <button
            type="button"
            onClick={handleCopyDiff}
            disabled={!canCopyDiff}
            className="h-8 rounded-md border border-border bg-surface px-2.5 text-sm font-medium text-text-primary shadow-sm transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            新旧差分をコピー
          </button>

          <span id="status" className="inline-flex flex-1 items-center gap-1.5 min-h-[1.25rem] text-sm text-text-secondary leading-none">
            {activeMessages.map((msg) => (
              <span
                key={msg.uuid}
                className={`inline-flex items-center gap-1 ${msg.spinner ? "cli-spinner" : ""}`}
              >
                {msg.content}
              </span>
            ))}
          </span>

          <ThemeToggle />
        </div>

        <div className="grid min-h-[60vh] flex-1 grid-rows-2 gap-3 md:gap-4">
          <div className="min-h-0 overflow-hidden rounded-lg border border-border bg-surface-secondary shadow-sm">
            <DiffEditor
              height="100%"
              options={commonOptions}
              onMount={handleFirstEditorMount}
              beforeMount={handleBeforeMount}
              language={languageId}
              theme={monacoTheme}
            />
          </div>
          <div className="min-h-0 overflow-hidden rounded-lg border border-border bg-surface-secondary shadow-sm">
            <DiffEditor
              height="100%"
              options={commonOptions}
              onMount={handleSecondEditorMount}
              beforeMount={handleBeforeMount}
              language={languageId}
              theme={monacoTheme}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
