// noinspection NpmUsedModulesInstalled
import * as monaco from 'monaco-editor';

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
}

const diffEditors = [
  newDiffEditor("diff-container-1", false),
  newDiffEditor("diff-container-2", true),
];

diffEditors.forEach((diff) => {
  diff.setModel({
    original: monaco.editor.createModel('', 'json'),
    modified: monaco.editor.createModel('', 'json'),
  });
});

diffEditors[0].getOriginalEditor().updateOptions({
  placeholder: '旧バージョンの en_us.json を貼り付けてください',
});
diffEditors[0].getModifiedEditor().updateOptions({
  placeholder: '新バージョンの en_us.json を貼り付けてください',
});
diffEditors[1].getOriginalEditor().updateOptions({
  placeholder: '旧バージョンの ja_jp.json を貼り付けてください',
});
diffEditors[1].getModifiedEditor().updateOptions({
  placeholder: '新バージョンへアップデートされた ja_jp.json が表示されます',
});

