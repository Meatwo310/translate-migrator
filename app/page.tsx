"use client";

import {DiffEditor, DiffEditorProps} from "@monaco-editor/react";
import {editor} from "monaco-editor";
import {useCallback, useMemo, useState} from "react";
import IDiffEditorConstructionOptions = editor.IDiffEditorConstructionOptions;

const commonOptions: IDiffEditorConstructionOptions = {
  enableSplitViewResizing: true,
  renderSideBySide: true,
  automaticLayout: true,
  originalEditable: true,
  readOnly: false,
};

const CustomDiffEditor = (props: DiffEditorProps) => {
  return (
    <DiffEditor
      height="50dvh"
      language="json"
      options={commonOptions}
      {...props}
    />
  );
};

export default function Home() {
  const [editorsLoaded, setEditorsLoaded] = useState(0);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);

  const pushStatusMessage = useCallback((message: string) => {
    setStatusMessages((prev) => {
      return [...prev, message];
    });
  }, []);

  const status = useMemo(() => {
    return editorsLoaded < 2 ? <span className="cli-spinner">Loading Monaco</span> :
      statusMessages.map((message) => <span key={message}>{message}</span>);
  }, [editorsLoaded, statusMessages]);

  const handleFirstEditorMount = (diffEditor: editor.IStandaloneDiffEditor) => {
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "[任意] 旧バージョンの翻訳元ファイルを貼り付けてください\n新バージョンの翻訳元ファイルと差異がある場合パッチがスキップされます",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルを貼り付けてください",
    });
    setEditorsLoaded(prev => prev + 1);
  };

  const handleSecondEditorMount = (diffEditor: editor.IStandaloneDiffEditor) => {
    diffEditor.getOriginalEditor().updateOptions({
      placeholder: "翻訳先ファイルを貼り付けてください",
    });
    diffEditor.getModifiedEditor().updateOptions({
      placeholder: "翻訳元ファイルに翻訳先ファイルがパッチされ表示されます",
    });
    setEditorsLoaded(prev => prev + 1);
  };

  return (<>
    <label htmlFor="language">言語: </label>
    <select id="language">
      {/*<option value="json">json</option>*/}
      <option value="lang">lang</option>
    </select>
    <span id="status" style={{ marginLeft: "0.5em", display: "inline-block" }}>{status}</span>
    <CustomDiffEditor onMount={handleFirstEditorMount}/>
    <CustomDiffEditor onMount={handleSecondEditorMount}/>
  </>);
};
