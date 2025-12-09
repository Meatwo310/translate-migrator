"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {editor, languages} from "monaco-editor";
import {useStatusManager} from "@/hooks/useStatusManager";
import {patchJson} from "@/utils/jsonPatch";
import {patchLang} from "@/utils/langPatch";
import type {Monaco} from "@monaco-editor/react";
import {DiffEditor} from "@monaco-editor/react";
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

export default function Home() {
  const [editorsLoaded, setEditorsLoaded] = useState(0);
  const [language, setLanguage] = useState<"lang" | "json">("json");
  const [oldSource, setOldSource] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const secondDiffRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const languageId = useMemo(() => (language === "lang" ? minecraftLangId : "json"), [language]);
  const {activeMessages} = useStatusManager(editorsLoaded < 2);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    registerMinecraftLang(monaco);
  }, []);

  const handleFirstEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "[任意] 古い翻訳元ファイルを貼り付けてください\n新しい翻訳元ファイルと差異があるキーはパッチされません",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルを貼り付けてください\nAlt+Shift+Fでフォーマット",
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
    });
    setEditorsLoaded((prev) => prev + 1);
  }, []);

  const handleSecondEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    secondDiffRef.current = diffEditor;
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "翻訳先ファイルを貼り付けてください",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルに翻訳先ファイルがパッチされます",
      readOnly: true,
    });

    const disposeOriginal = diffEditor.getOriginalEditor().onDidChangeModelContent(() => {
      setTarget(diffEditor.getOriginalEditor().getValue());
    });

    diffEditor.onDidDispose(() => {
      disposeOriginal.dispose();
    });
    setEditorsLoaded((prev) => prev + 1);
  }, []);

  const patched = useMemo(() => {
    if (!source || !target) return target;

    try {
      return language === "json"
        ? patchJson({oldSource: oldSource || undefined, source, target, duplicatedKey: "pop"})
        : patchLang({oldSource: oldSource || undefined, source, target, duplicatedKey: "pop"});
    } catch (_err) {
      return target;
    }
  }, [language, oldSource, source, target]);

  useEffect(() => {
    const modifiedEditor = secondDiffRef.current?.getModifiedEditor();
    if (!modifiedEditor) return;
    const current = modifiedEditor.getValue();
    if (current === patched) return;
    modifiedEditor.setValue(patched);
  }, [patched]);

  return (
    <main className="flex min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="flex w-full flex-1 flex-col gap-3 px-3 py-2 md:px-4 md:py-4 box-border">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/80 px-2.5 py-1 shadow-sm">
          <label htmlFor="language" className="text-sm font-medium text-neutral-800 leading-none">
            ファイル形式:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "lang" | "json")}
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="json">.json</option>
            <option value="lang">.lang</option>
          </select>

          <span id="status" className="inline-flex items-center gap-1.5 min-h-[1.25rem] text-sm text-neutral-700 leading-none">
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

        <div className="grid min-h-[60vh] flex-1 grid-rows-2 gap-3 md:gap-4">
          <div className="min-h-0 overflow-hidden rounded-lg border border-neutral-200 bg-slate-50 shadow-sm">
            <DiffEditor
              height="100%"
              options={commonOptions}
              onMount={handleFirstEditorMount}
              beforeMount={handleBeforeMount}
              language={languageId}
            />
          </div>
          <div className="min-h-0 overflow-hidden rounded-lg border border-neutral-200 bg-slate-50 shadow-sm">
            <DiffEditor
              height="100%"
              options={commonOptions}
              onMount={handleSecondEditorMount}
              beforeMount={handleBeforeMount}
              language={languageId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
