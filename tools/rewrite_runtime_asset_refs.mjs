import fs from 'node:fs';
import path from 'node:path';

const runtimeRoot = path.resolve(process.argv[2] || '.');
const extensions = new Set(['.html', '.css', '.js', '.mjs', '.cjs']);

if (!fs.existsSync(runtimeRoot)) {
  console.error(`Runtime root does not exist: ${runtimeRoot}`);
  process.exit(1);
}

const sourceFiles = fs.readdirSync(runtimeRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => path.join(runtimeRoot, entry.name));

let replacements = 0;
const changedFiles = [];
const unresolved = new Set();

for (const sourceFile of sourceFiles) {
  const original = fs.readFileSync(sourceFile, 'utf8');
  const updated = original.replace(/(?:\.\/)?assets\/[A-Za-z0-9_@%+.,\-/]+\.png(?:\?[^\s"')}]*)?/g, (reference) => {
    const queryAt = reference.indexOf('?');
    const pathname = queryAt >= 0 ? reference.slice(0, queryAt) : reference;
    const query = queryAt >= 0 ? reference.slice(queryAt) : '';
    const relativePath = pathname.replace(/^\.\//, '').replace(/\.png$/i, '.webp');
    const target = path.join(runtimeRoot, ...relativePath.split('/'));
    if (!fs.existsSync(target)) {
      unresolved.add(reference);
      return reference;
    }
    replacements += 1;
    return `${pathname.replace(/\.png$/i, '.webp')}${query}`;
  });

  if (updated !== original) {
    fs.writeFileSync(sourceFile, updated, 'utf8');
    changedFiles.push(path.basename(sourceFile));
  }
}

console.log(`Runtime root: ${runtimeRoot}`);
console.log(`Updated ${changedFiles.length} source files with ${replacements} PNG-to-WebP reference replacements.`);
if (changedFiles.length) console.log(`Changed: ${changedFiles.join(', ')}`);
if (unresolved.size) {
  console.log(`Kept ${unresolved.size} PNG references because no WebP counterpart exists:`);
  for (const reference of [...unresolved].sort()) console.log(`  ${reference}`);
}
