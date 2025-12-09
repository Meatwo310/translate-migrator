"use client";

import {DiffEditor, Monaco, MonacoDiffEditor} from "@monaco-editor/react";

export default function Home() {
  function handleEditorDidMount(editor: MonacoDiffEditor, monaco: Monaco) {
    // console.log("Editor mounted:", editor, monaco);
  }

  return (<>
    <DiffEditor
      height="50dvh"
      language="json"
      onMount={handleEditorDidMount}
      options={{
        enableSplitViewResizing: true,
        renderSideBySide: true,
        automaticLayout: true,
        originalEditable: true,
        readOnly: false,
      }}
    />
    <DiffEditor
      height="50dvh"
      language="json"
      onMount={handleEditorDidMount}
      options={{
        enableSplitViewResizing: true,
        renderSideBySide: true,
        automaticLayout: true,
        originalEditable: true,
        readOnly: false,
      }}
    />
  </>);
};
