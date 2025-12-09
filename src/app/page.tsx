"use client";

import {useCallback, useState} from "react";
import {editor} from "monaco-editor";
import {CustomDiffEditor} from "@/src/components/CustomDiffEditor";
import {useStatusManager} from "@/src/hooks/useStatusManager";

export default function Home() {
  const [editorsLoaded, setEditorsLoaded] = useState(0);
  const {activeMessages} = useStatusManager(editorsLoaded < 2);

  const handleFirstEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "[任意] 旧バージョンの翻訳元ファイルを貼り付けてください\n新バージョンの翻訳元ファイルと差異がある場合パッチがスキップされます",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルを貼り付けてください",
    });
    setEditorsLoaded((prev) => prev + 1);
  }, []);

  const handleSecondEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "翻訳先ファイルを貼り付けてください",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルに翻訳先ファイルがパッチされ表示されます",
    });
    setEditorsLoaded((prev) => prev + 1);
  }, []);

  return (
    <main className="page-layout">
      <div className="status-bar">
        <label htmlFor="language">ファイル形式:</label>
        <select id="language" defaultValue="lang">
          <option value="lang">.lang</option>
        </select>

        <span id="status" className="status-messages">
          {activeMessages.map((msg) => (
            <span key={msg.uuid} className={msg.spinner ? "cli-spinner" : ""}>
              {msg.content}
            </span>
          ))}
        </span>
      </div>

      <div className="editor-stack">
        <div className="editor-shell">
          <CustomDiffEditor onMount={handleFirstEditorMount}/>
        </div>
        <div className="editor-shell">
          <CustomDiffEditor onMount={handleSecondEditorMount}/>
        </div>
      </div>
    </main>
  );
}
