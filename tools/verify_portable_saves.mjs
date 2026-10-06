import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const check = (condition, message) => { if (!condition) throw new Error(message); };

for (const id of ['titleExportSaveBtn','titleImportSaveBtn','titleUndoImportBtn','menuExportSaveBtn','menuImportSaveBtn','saveImportInput']) {
  check(html.includes(`id="${id}"`), `missing portable-save control: ${id}`);
}
check(html.includes('accept=".json,.zhaolie-save,application/json"'), 'save import file type filter is missing');
check(game.includes("PORTABLE_SAVE_KIND='sanguozhi-zhaolie-portable-save'"), 'portable save identity is missing');
check(game.includes("IMPORT_BACKUP_KEY='sanguozhi-zhaolie-import-backup-v1'"), 'pre-import backup is missing');
check(game.includes('bundle.checksum!==portableChecksum(JSON.stringify(bundle.payload))'), 'corruption check is missing');
check(game.includes('if(file.size>MAX_IMPORT_BYTES)'), 'oversized import protection is missing');
check(game.includes('navigator.canShare?.({files:[file]})'), 'mobile file sharing path is missing');
check(game.includes("link.download=filename"), 'desktop file download fallback is missing');
check(game.includes('applyPortablePayload(backup.payload,{createBackup:false})'), 'undo-import restore path is missing');
check(game.includes('refreshContinueButton();renderSaveSlots();refreshPortableSaveButtons()'), 'save UI is not refreshed after import');
check(css.includes('.title-save-tools{display:grid;grid-template-columns:1fr 1fr'), 'title save controls are not laid out for touch');

console.log('Portable saves verified: title/game-menu export and import, checksum validation, automatic backup, undo, mobile sharing and desktop download.');
