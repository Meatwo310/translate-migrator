// noinspection NpmUsedModulesInstalled
import * as monaco from 'monaco-editor';


const json = `{
  "block.compressed_copper.machine_core": "Machine Core",
  "container.compressed_copper.machine_core": "Machine Core (No Module)",
  "container.compressed_copper.machine_core.custom": "Machine (%s)",
  "item.compressed_copper.compressed_copper": "Compressed Copper",
  "item.compressed_copper.test_module": "Test Module",
  "item.compressed_copper.test_upgrade": "Test Upgrade",
  "item_group.compressed_copper.general": "Compressed Copper"
}`;
monaco.editor.create(document.getElementById('container'), {
  value: json,
  language: 'json'
});
