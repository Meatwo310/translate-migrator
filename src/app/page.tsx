"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { editor, languages } from "monaco-editor";
import { useStatusManager } from "@/hooks/useStatusManager";
import { diffJson, patchJson } from "@/utils/jsonPatch";
import { diffLang, patchLang } from "@/utils/langPatch";
import { extractTranslationRows, TranslationRow } from "@/utils/extractTranslationRows";
import { TranslationTable } from "@/components/TranslationTable";
import { PatchedOutput } from "@/components/PatchedOutput";
import { Table, Columns } from "lucide-react";
import type { Monaco } from "@monaco-editor/react";
import { DiffEditor } from "@monaco-editor/react";
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
type ViewMode = "diff" | "table";

export default function Home() {
  const [editorsLoaded, setEditorsLoaded] = useState(0);
  const [language, setLanguage] = useState<"lang" | "json">("json");
  const [oldSource, setOldSource] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("diff");
  const [newTranslations, setNewTranslations] = useState<Map<string, string>>(new Map());
  const secondDiffRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const languageId = useMemo(() => (language === "lang" ? minecraftLangId : "json"), [language]);
  const { activeMessages, pushStatusMessage, removeStatusMessage } = useStatusManager(editorsLoaded < 2);
  const [markerErrors, setMarkerErrors] = useState<MarkerErrors>({ oldSource: null, source: null, target: null });

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

  // テーブルビュー用の翻訳行を抽出
  const translationRows = useMemo<TranslationRow[]>(() => {
    if (!source) return [];
    try {
      return extractTranslationRows({
        oldSource: oldSource || undefined,
        source,
        target: target || undefined,
        duplicatedKey: "pop",
        format: language,
      });
    } catch {
      return [];
    }
  }, [oldSource, source, target, language]);

  // newTranslationsを適用したtargetを生成
  const targetWithNewTranslations = useMemo(() => {
    if (newTranslations.size === 0) return target;

    // newTranslationsマップから各キーの翻訳値を収集
    // キーは "key-index" の形式なので、キーごとにindexでソートする
    const keyTranslations = new Map<string, string[]>();

    for (const [rowKey, value] of newTranslations) {
      if (!value.trim()) continue;
      const lastDashIndex = rowKey.lastIndexOf("-");
      const actualKey = rowKey.slice(0, lastDashIndex);
      const keyIndex = parseInt(rowKey.slice(lastDashIndex + 1), 10);

      if (!keyTranslations.has(actualKey)) {
        keyTranslations.set(actualKey, []);
      }
      const arr = keyTranslations.get(actualKey)!;
      arr[keyIndex] = value;
    }

    // targetを解析して、newTranslationsで上書き
    if (!target) {
      // targetがない場合、新規翻訳のみでtargetを生成
      if (language === "json") {
        const entries: string[] = [];
        for (const row of translationRows) {
          const rowKey = `${row.key}-${translationRows.indexOf(row)}`;
          const newValue = newTranslations.get(rowKey);
          if (newValue?.trim()) {
            entries.push(`  "${row.key}": "${newValue}"`);
          }
        }
        if (entries.length === 0) return target;
        return `{\n${entries.join(",\n")}\n}`;
      } else {
        const lines: string[] = [];
        for (const row of translationRows) {
          const rowKey = `${row.key}-${translationRows.indexOf(row)}`;
          const newValue = newTranslations.get(rowKey);
          if (newValue?.trim()) {
            lines.push(`${row.key}=${newValue}`);
          }
        }
        return lines.join("\n");
      }
    }

    // 既存のtargetに新規翻訳を追加
    const lines = target.split(/\r?\n/);
    const keyIndices = new Map<string, number>();

    const updatedLines = lines.map((line) => {
      if (language === "json") {
        const matches = line.match(/^([ \t]*)"([^"]*)"( *: *)"(.*)"(,? *)$/);
        if (!matches) return line;
        const [, indent, key, colon, _value, comma] = matches;
        const idx = keyIndices.get(key) ?? 0;
        keyIndices.set(key, idx + 1);

        const translations = keyTranslations.get(key);
        if (translations && translations[idx]) {
          return `${indent}"${key}"${colon}"${translations[idx]}"${comma}`;
        }
        return line;
      } else {
        const matches = line.match(/^([ \t]*)([^#=\s][^=]*?)([ \t]*=[ \t]*)(.*)$/);
        if (!matches) return line;
        const [, indent, key, separator] = matches;
        const idx = keyIndices.get(key) ?? 0;
        keyIndices.set(key, idx + 1);

        const translations = keyTranslations.get(key);
        if (translations && translations[idx]) {
          return `${indent}${key}${separator}${translations[idx]}`;
        }
        return line;
      }
    });

    // 新規キーの追加（targetに存在しないキー）
    const existingKeys = new Set<string>();
    for (const line of lines) {
      if (language === "json") {
        const matches = line.match(/^[ \t]*"([^"]*)"[ \t]*:[ \t]*".*"[,]?[ \t]*$/);
        if (matches) existingKeys.add(matches[1]);
      } else {
        const matches = line.match(/^[ \t]*([^#=\s][^=]*?)[ \t]*=[ \t]*.*$/);
        if (matches) existingKeys.add(matches[1]);
      }
    }

    const newEntries: string[] = [];
    for (const row of translationRows) {
      if (existingKeys.has(row.key)) continue;
      const rowKey = `${row.key}-${translationRows.indexOf(row)}`;
      const newValue = newTranslations.get(rowKey);
      if (newValue?.trim()) {
        if (language === "json") {
          newEntries.push(`  "${row.key}": "${newValue}"`);
        } else {
          newEntries.push(`${row.key}=${newValue}`);
        }
      }
    }

    if (newEntries.length > 0) {
      if (language === "json") {
        // JSONの場合、閉じ括弧の前に追加
        const lastLineIndex = updatedLines.length - 1;
        if (updatedLines[lastLineIndex]?.trim() === "}") {
          // 最後のプロパティ行にカンマを追加
          for (let i = lastLineIndex - 1; i >= 0; i--) {
            if (updatedLines[i].match(/^[ \t]*"[^"]*"[ \t]*:[ \t]*".*"[ \t]*$/)) {
              updatedLines[i] = updatedLines[i] + ",";
              break;
            }
          }
          updatedLines.splice(lastLineIndex, 0, ...newEntries.map((e, i, arr) =>
            i === arr.length - 1 ? e : e + ",",
          ));
        } else {
          updatedLines.push(...newEntries);
        }
      } else {
        updatedLines.push(...newEntries);
      }
    }

    return updatedLines.join("\n");
  }, [target, newTranslations, translationRows, language]);

  const patched = useMemo(() => {
    const effectiveTarget = viewMode === "table" ? targetWithNewTranslations : target;
    if (!source || !effectiveTarget) return effectiveTarget;

    if (language === "json") {
      const errors = [markerErrors.oldSource, markerErrors.source, markerErrors.target].filter(Boolean).join("\n\n");
      if (errors) return errors;
    }

    try {
      return language === "json"
        ? patchJson({ oldSource: oldSource || undefined, source, target: effectiveTarget, duplicatedKey: "pop" })
        : patchLang({ oldSource: oldSource || undefined, source, target: effectiveTarget, duplicatedKey: "pop" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `エラーが発生しました:\n${message}`;
    }
  }, [language, oldSource, source, target, targetWithNewTranslations, markerErrors, viewMode]);

  useEffect(() => {
    if (viewMode !== "diff") return;
    const modifiedEditor = secondDiffRef.current?.getModifiedEditor();
    if (!modifiedEditor) return;
    const current = modifiedEditor.getValue();
    if (current === patched) return;
    modifiedEditor.setValue(patched);
  }, [patched, viewMode]);

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
    } catch {
      removeStatusMessage(pendingId);
      const errorId = pushStatusMessage("差分のコピーに失敗しました");
      setTimeout(() => removeStatusMessage(errorId), 3000);
    }
  }, [language, oldSource, source, pushStatusMessage, removeStatusMessage]);

  const handleTranslationChange = useCallback((key: string, value: string, index: number) => {
    setNewTranslations((prev) => {
      const next = new Map(prev);
      const rowKey = `${key}-${index}`;
      if (value.trim()) {
        next.set(rowKey, value);
      } else {
        next.delete(rowKey);
      }
      return next;
    });
  }, []);

  const handleViewModeToggle = useCallback(() => {
    setViewMode((prev) => (prev === "diff" ? "table" : "diff"));
  }, []);

  return (
    <main className="flex min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="flex w-full flex-1 flex-col gap-3 px-3 py-2 md:px-4 md:py-4 box-border">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/80 px-2.5 py-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/80">
          <label htmlFor="language" className="text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-none">
            ファイル形式:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "lang" | "json")}
            className="h-8 rounded-md border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-neutral-200"
          >
            <option value="json">.json</option>
            <option value="lang">.lang</option>
          </select>

          <button
            type="button"
            onClick={handleCopyDiff}
            disabled={!canCopyDiff}
            className="h-8 rounded-md border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 shadow-sm transition hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            新旧差分をコピー
          </button>

          <button
            type="button"
            onClick={handleViewModeToggle}
            className={`view-toggle ${viewMode === "table" ? "active" : ""}`}
            title={viewMode === "diff" ? "テーブルビューに切り替え" : "差分ビューに切り替え"}
          >
            {viewMode === "diff" ? <Table size={16} /> : <Columns size={16} />}
            <span>{viewMode === "diff" ? "テーブル" : "差分"}</span>
          </button>

          <span id="status" className="inline-flex items-center gap-1.5 min-h-[1.25rem] text-sm text-neutral-700 dark:text-neutral-300 leading-none">
            {activeMessages.map((msg) => (
              <span
                key={msg.uuid}
                className={`inline-flex items-center gap-1 ${msg.spinner ? "cli-spinner" : ""}`}
              >
                {msg.content}
              </span>
            ))}
          </span>
        </div>

        {viewMode === "diff" ? (
          <div className="grid min-h-[60vh] flex-1 grid-rows-2 gap-3 md:gap-4">
            <div className="min-h-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 shadow-sm">
              <DiffEditor
                height="100%"
                options={commonOptions}
                onMount={handleFirstEditorMount}
                beforeMount={handleBeforeMount}
                language={languageId}
              />
            </div>
            <div className="min-h-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 shadow-sm">
              <DiffEditor
                height="100%"
                options={commonOptions}
                onMount={handleSecondEditorMount}
                beforeMount={handleBeforeMount}
                language={languageId}
              />
            </div>
          </div>
        ) : (
          <div className="table-view-container flex-1">
            <div className="table-view-main">
              <TranslationTable
                rows={translationRows}
                newTranslations={newTranslations}
                onTranslationChange={handleTranslationChange}
              />
            </div>
            <PatchedOutput content={patched} language={language} />
          </div>
        )}
      </div>
    </main>
  );
}
