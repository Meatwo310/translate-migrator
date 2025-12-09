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
    <>
      <label htmlFor="language">ファイル形式: </label>
      <select id="language" defaultValue="lang">
        <option value="lang">.lang</option>
      </select>

      <span id="status" style={{marginLeft: "0.5em", display: "inline-block"}}>
        {activeMessages.map((msg) => (
          <span key={msg.uuid} className={msg.spinner ? "cli-spinner" : ""}>
            {msg.content}
          </span>
        ))}
      </span>

      <CustomDiffEditor onMount={handleFirstEditorMount}/>
      <CustomDiffEditor onMount={handleSecondEditorMount}/>
    </>
  );
}
