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

const diffEditors = [
  "diff-container-1",
  "diff-container-2"
].map(containerId => {
  return monaco.editor.createDiffEditor(
    document.getElementById(containerId),
    {
      enableSplitViewResizing: true,
      renderSideBySide: true,
      automaticLayout: true,
      originalEditable: true,
    }
  );
});

diffEditors.forEach((diff) => {
  diff.setModel({
    original: monaco.editor.createModel('', 'json'),
    modified: monaco.editor.createModel('', 'json')
  });
})
