"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { editor, languages } from "monaco-editor";
import { Editor } from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";
import ILanguageExtensionPoint = languages.ILanguageExtensionPoint;

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

export type PatchedOutputProps = {
  content: string;
  language: "lang" | "json";
};

export function PatchedOutput({ content, language }: PatchedOutputProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = React.useState(false);

  const languageId = language === "lang" ? minecraftLangId : "json";

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    registerMinecraftLang(monaco);
  }, []);

  const handleMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
  }, []);

  useEffect(() => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    const currentValue = currentEditor.getValue();
    if (currentValue !== content) {
      currentEditor.setValue(content);
    }
  }, [content]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore copy error
    }
  }, [content]);

  return (
    <div className="patched-output-container">
      <div className="patched-output-header">
        <h3>パッチ済み出力</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="copy-button"
          disabled={!content}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? "コピーしました" : "コピー"}</span>
        </button>
      </div>
      <div className="patched-output-editor">
        <Editor
          height="300px"
          language={languageId}
          value={content}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 13,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
