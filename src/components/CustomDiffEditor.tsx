"use client";

import { DiffEditor, DiffEditorProps } from "@monaco-editor/react";
import { editor } from "monaco-editor";

export const commonOptions: editor.IDiffEditorConstructionOptions = {
  enableSplitViewResizing: true,
  renderSideBySide: true,
  automaticLayout: true,
  originalEditable: true,
  readOnly: false,
};

export const CustomDiffEditor = (props: DiffEditorProps) => {
  return (
    <DiffEditor
      height="100%"
      language="json"
      options={commonOptions}
      {...props}
    />
  );
};
