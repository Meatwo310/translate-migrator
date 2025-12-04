import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import PowerDiff from './powerdiff';

const placeholderTexts = {
  json: {
    oldEn: '旧バージョンの en_us.json を貼り付けてください',
    newEn: '新バージョンの en_us.json を貼り付けてください',
    oldJa: '旧バージョンの ja_jp.json を貼り付けてください',
    newJa: '新バージョンへアップデートされた ja_jp.json が表示されます',
  },
  lang: {
    oldEn: '旧バージョンの en_us.lang を貼り付けてください',
    newEn: '新バージョンの en_us.lang を貼り付けてください',
    oldJa: '旧バージョンの ja_jp.lang を貼り付けてください',
    newJa: '新バージョンへアップデートされた ja_jp.lang が表示されます',
  },
};

const parsers = {
  json: (text) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSONパースエラー:', e);
      return {};
    }
  },
  lang: (text) => {
    const translations = {};

    text.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();

      if (key) {
        translations[key] = value;
      }
    });

    return translations;
  },
};

const formatters = {
  json: (obj) => JSON.stringify(obj, null, 2),
  lang: (obj) =>
    Object.entries(obj)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n'),
};

const getEditorValue = (editor) => {
  const text = editor.getValue().trim();
  return text ? text : null;
};

const App = () => {
  const [format, setFormat] = useState('json');
  const [status, setStatus] = useState('Monaco Editorを読み込み中...');
  const diffEditorsRef = useRef([]);
  const debounceTimerRef = useRef();

  const editorContainers = useMemo(
    () => [{ id: 'diff-container-1' }, { id: 'diff-container-2' }],
    []
  );
  const containerRefs = useRef(
    Array.from({ length: editorContainers.length }, () => React.createRef())
  );

  const updatePlaceholders = useCallback(
    (selectedFormat) => {
      const placeholders = placeholderTexts[selectedFormat] ?? placeholderTexts.json;
      diffEditorsRef.current[0]?.getOriginalEditor().updateOptions({
        placeholder: placeholders.oldEn,
      });
      diffEditorsRef.current[0]?.getModifiedEditor().updateOptions({
        placeholder: placeholders.newEn,
      });
      diffEditorsRef.current[1]?.getOriginalEditor().updateOptions({
        placeholder: placeholders.oldJa,
      });
      diffEditorsRef.current[1]?.getModifiedEditor().updateOptions({
        placeholder: placeholders.newJa,
      });
    },
    []
  );

  const setEditorsLanguage = useCallback((selectedFormat) => {
    const language = selectedFormat === 'json' ? 'json' : 'plaintext';
    diffEditorsRef.current.forEach((diff) => {
      const originalModel = diff.getOriginalEditor().getModel();
      const modifiedModel = diff.getModifiedEditor().getModel();
      monaco.editor.setModelLanguage(originalModel, language);
      monaco.editor.setModelLanguage(modifiedModel, language);
    });
  }, []);

  const autoUpdateTranslation = useCallback(() => {
    const parser = parsers[format] ?? parsers.json;
    const formatter = formatters[format] ?? formatters.json;

    try {
      const [enDiff, jaDiff] = diffEditorsRef.current;
      if (!enDiff || !jaDiff) return;

      const oldEnText = getEditorValue(enDiff.getOriginalEditor());
      const newEnText = getEditorValue(enDiff.getModifiedEditor());
      const oldJaText = getEditorValue(jaDiff.getOriginalEditor());

      if (!oldEnText || !newEnText || !oldJaText) {
        return;
      }

      const oldEn = parser(oldEnText);
      const newEn = parser(newEnText);
      const oldJa = parser(oldJaText);

      const diffProcessor = new PowerDiff(oldEn, newEn);
      const newJa = diffProcessor.applyPatch(oldJa);

      const formattedOutput = formatter(newJa);
      jaDiff.getModifiedEditor().setValue(formattedOutput ? formattedOutput : '');
    } catch (e) {
      console.error('翻訳の自動更新中にエラーが発生しました:', e);
    }
  }, [format]);

  const setupChangeListeners = useCallback(() => {
    diffEditorsRef.current[0]
      ?.getOriginalEditor()
      .onDidChangeModelContent(() => {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(autoUpdateTranslation, 500);
      });

    diffEditorsRef.current[0]
      ?.getModifiedEditor()
      .onDidChangeModelContent(() => {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(autoUpdateTranslation, 500);
      });

    diffEditorsRef.current[1]
      ?.getOriginalEditor()
      .onDidChangeModelContent(() => {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(autoUpdateTranslation, 500);
      });
  }, [autoUpdateTranslation]);

  useEffect(() => {
    const editors = containerRefs.current.map((ref) =>
      monaco.editor.createDiffEditor(ref.current, {
        enableSplitViewResizing: true,
        renderSideBySide: true,
        automaticLayout: true,
        originalEditable: true,
        readOnly: false,
      })
    );

    editors.forEach((diff) => {
      diff.setModel({
        original: monaco.editor.createModel('', 'json'),
        modified: monaco.editor.createModel('', 'json'),
      });
    });

    diffEditorsRef.current = editors;
    setEditorsLanguage(format);
    updatePlaceholders(format);
    setupChangeListeners();
    setStatus('');

    return () => {
      clearTimeout(debounceTimerRef.current);
      diffEditorsRef.current.forEach((diff) => {
        diff.getOriginalEditor().getModel()?.dispose();
        diff.getModifiedEditor().getModel()?.dispose();
        diff.dispose();
      });
    };
  }, [format, setEditorsLanguage, setupChangeListeners, updatePlaceholders]);

  useEffect(() => {
    if (diffEditorsRef.current.length) {
      setEditorsLanguage(format);
      updatePlaceholders(format);
      autoUpdateTranslation();
    }
  }, [autoUpdateTranslation, format, setEditorsLanguage, updatePlaceholders]);

  return (
    <>
      <div id="status-bar" className="status-bar">
        {status}
      </div>
      <div className="controls">
        <label htmlFor="file-format">ファイル形式</label>
        <select id="file-format" value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="json">JSON (.json)</option>
          <option value="lang">key=value (.lang)</option>
        </select>
      </div>
      <div className="container-wrapper">
        {editorContainers.map((container, index) => (
          <div
            key={container.id}
            id={container.id}
            className="editor-container"
            ref={containerRefs.current[index]}
          />
        ))}
      </div>
    </>
  );
};

export default App;
