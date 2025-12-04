// noinspection NpmUsedModulesInstalled
import * as monaco from 'monaco-editor';
import PowerDiff from "./powerdiff";

/*
{
  "block.compressed_copper.machine_core": "Machine Core",
  "container.compressed_copper.machine_core": "Machine Core",
  "container.compressed_copper.machine_core.custom": "マシン(%s)",
  "item.compressed_copper.compressed_copper": "Compressed Copper",
  "item.compressed_copper.machine_cover_1": "1x Machine Cover",
  "item.compressed_copper.test_module_1": "1x Test Module",
  "item.compressed_copper.test_upgrade_1": "1x Test Upgrade",
  "item_group.compressed_copper.general": "Compressed Copper"
}

{
  "block.compressed_copper.machine_core": "Machine Core",
  "container.compressed_copper.machine_core": "Machine Core (No Module)",
  "container.compressed_copper.machine_core.custom": "Machine (%s)",
  "item.compressed_copper.compressed_copper": "Compressed Copper",
  "item.compressed_copper.test_module": "Test Module",
  "item.compressed_copper.test_upgrade": "Test Upgrade",
  "item_group.compressed_copper.general": "Compressed Copper"
}
*/

const getEditorValue = (editor) => {
  const text = editor.getValue().trim();
  return text ? text : null;
};

const parseJsonSafely = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('JSONパースエラー:', e);
    return {};
  }
};

const formatJson = (obj) => {
  return JSON.stringify(obj, null, 2);
};

const parseLangSafely = (text) => {
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
};

const formatLang = (obj) => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
};

const parsers = {
  json: parseJsonSafely,
  lang: parseLangSafely,
};

const formatters = {
  json: formatJson,
  lang: formatLang,
};


/**
 * @param id {string}
 * @param readOnly {boolean}
 * @returns {monaco.editor.IStandaloneDiffEditor}
 */
const newDiffEditor = (id, readOnly) => {
  return monaco.editor.createDiffEditor(
    document.getElementById(id),
    {
      enableSplitViewResizing: true,
      renderSideBySide: true,
      automaticLayout: true,
      originalEditable: true,
      readOnly: readOnly,
    }
  );
};

const fileFormatSelect = document.getElementById('file-format');
const getSelectedFormat = () => fileFormatSelect?.value ?? 'json';

const diffEditors = [
  newDiffEditor("diff-container-1", false),
  newDiffEditor("diff-container-2", true),
];

const setEditorsLanguage = (format) => {
  const language = format === 'json' ? 'json' : 'plaintext';
  diffEditors.forEach((diff) => {
    monaco.editor.setModelLanguage(diff.getOriginalEditor().getModel(), language);
    monaco.editor.setModelLanguage(diff.getModifiedEditor().getModel(), language);
  });
};

diffEditors.forEach((diff) => {
  diff.setModel({
    original: monaco.editor.createModel('', 'json'),
    modified: monaco.editor.createModel('', 'json'),
  });
});

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
  }
};

const updatePlaceholders = (format) => {
  const placeholders = placeholderTexts[format] ?? placeholderTexts.json;
  diffEditors[0].getOriginalEditor().updateOptions({
    placeholder: placeholders.oldEn,
  });
  diffEditors[0].getModifiedEditor().updateOptions({
    placeholder: placeholders.newEn,
  });
  diffEditors[1].getOriginalEditor().updateOptions({
    placeholder: placeholders.oldJa,
  });
  diffEditors[1].getModifiedEditor().updateOptions({
    placeholder: placeholders.newJa,
  });
};

updatePlaceholders(getSelectedFormat());
setEditorsLanguage(getSelectedFormat());

const autoUpdateTranslation = () => {
  try {
    // 各エディタからテキストを取得
    const format = getSelectedFormat();
    const parser = parsers[format] ?? parseJsonSafely;
    const formatter = formatters[format] ?? formatJson;

    const oldEnText = getEditorValue(diffEditors[0].getOriginalEditor());
    const newEnText = getEditorValue(diffEditors[0].getModifiedEditor());
    const oldJaText = getEditorValue(diffEditors[1].getOriginalEditor());

    // すべてのテキストが入力されているか確認
    if (!oldEnText || !newEnText || !oldJaText) {
      return; // いずれかが空の場合は更新しない
    }

    // JSONオブジェクトへパース
    const oldEn = parser(oldEnText);
    const newEn = parser(newEnText);
    const oldJa = parser(oldJaText);

    // PowerDiffを使用して差分を検出し、パッチを適用
    const diffProcessor = new PowerDiff(oldEn, newEn);
    const newJa = diffProcessor.applyPatch(oldJa);

    // 更新された日本語翻訳をエディタに設定
    // const formattedJson = formatJson(newJa);
    // diffEditors[1].getModifiedEditor().setValue(formattedJson === '{}' ? '' : formattedJson);
    const formattedOutput = formatter(newJa);
    diffEditors[1].getModifiedEditor().setValue(formattedOutput ? formattedOutput : '');

    console.log('翻訳が自動更新されました');
  } catch (e) {
    console.error('翻訳の自動更新中にエラーが発生しました:', e);
    // 自動更新ではアラートは表示しない
  }
};

// 各エディタの変更を監視
const setupChangeListeners = () => {
  // debounce関数でエディタの連続変更を制御
  let debounceTimer;
  const debounce = (func, delay) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
  };

  // 各エディタに変更イベントリスナーを追加
  diffEditors[0].getOriginalEditor().onDidChangeModelContent(() => {
    debounce(autoUpdateTranslation, 500);
  });

  diffEditors[0].getModifiedEditor().onDidChangeModelContent(() => {
    debounce(autoUpdateTranslation, 500);
  });

  diffEditors[1].getOriginalEditor().onDidChangeModelContent(() => {
    debounce(autoUpdateTranslation, 500);
  });
};

// 変更リスナーのセットアップを実行
setupChangeListeners();

fileFormatSelect?.addEventListener('change', (event) => {
  const format = event.target.value;
  setEditorsLanguage(format);
  updatePlaceholders(format);
  autoUpdateTranslation();
});

document.getElementById('status-bar').innerText = '';
