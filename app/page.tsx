"use client";

import {DiffEditor, DiffEditorProps} from "@monaco-editor/react";
import {editor} from "monaco-editor";
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
  return (<>
    <label htmlFor="language">言語: </label>
    <select id="language">
      {/*<option value="json">.json</option>*/}
      <option value="lang">.lang</option>
    </select>
    <CustomDiffEditor onMount={editor => {
      editor.getOriginalEditor().updateOptions({
        placeholder: "[任意] 旧バージョンの翻訳元ファイルを貼り付けてください\n新バージョンの翻訳元ファイルと差異がある場合パッチがスキップされます",
      });
      editor.getModifiedEditor().updateOptions({
        placeholder: "翻訳元ファイルを貼り付けてください",
      });
    }}/>
    <CustomDiffEditor onMount={editor => {
      editor.getOriginalEditor().updateOptions({
        placeholder: "翻訳先ファイルを貼り付けてください",
      });
      editor.getModifiedEditor().updateOptions({
        placeholder: "翻訳元ファイルに翻訳先ファイルがパッチされ表示されます",
      });
    }}/>
  </>);
};
