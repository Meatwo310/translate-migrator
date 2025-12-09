"use client";

import {DiffEditor, DiffEditorProps} from "@monaco-editor/react";
import {editor} from "monaco-editor";
import {useMemo, useState} from "react";
import {randomUUID, UUID} from "crypto";
import IDiffEditorConstructionOptions = editor.IDiffEditorConstructionOptions;

type StatusMessage = {
  uuid: UUID;
  content: string;
  spinner?: boolean;
};
const defaultStatusMessage = {
  uuid: "b3332455-b003-40fd-ba97-ce358099bf1d",
  content: "Loading Monaco",
  spinner: true,
};

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
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);

  const pushStatusMessage = (content: string, spinner?: boolean) => {
    const message = {
      content,
      spinner,
      uuid: randomUUID(),
    };
    setStatusMessages((prev) => {
      return [...prev, message];
    });
    return message;
  };

  const removeStatusMessage = (toPop: StatusMessage | string) => {
    setStatusMessages((prev) => {
      const index = prev.findIndex(typeof toPop === "string"
        ? (msg) => msg.content === toPop
        : (msg) => msg.uuid === toPop.uuid,
      );
      return index === -1 ? prev : [...prev];
    });
  };

  const status = useMemo(() => {
    return (editorsLoaded < 2 ? [defaultStatusMessage] : statusMessages)
      .map((message) => <span
        key={message.content}
        className={message.spinner ? "cli-spinner" : undefined}
      >{message.content}</span>);
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
    <label htmlFor="language">ファイル形式: </label>
    <select id="language">
      {/*<option value="json">.json</option>*/}
      <option value="lang">.lang</option>
    </select>
    <span id="status" style={{marginLeft: "0.5em", display: "inline-block"}}>{status}</span>
    <CustomDiffEditor onMount={handleFirstEditorMount}/>
    <CustomDiffEditor onMount={handleSecondEditorMount}/>
  </>);
};
