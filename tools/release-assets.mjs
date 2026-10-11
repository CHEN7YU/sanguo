import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const assetPattern = /assets\/[A-Za-z0-9_./\- ()\u3400-\u9fff]+?\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)/g;
const assetRootPattern = /const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*['"](assets\/[A-Za-z0-9_./\- ()\u3400-\u9fff]+\/)["']/g;
const assetSuffixPattern = '[A-Za-z0-9_./\\- ()\\u3400-\\u9fff]+?\\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)';

export function collectReleaseAssets(sources) {
  const references = new Set();
  for (const text of sources) {
    for (const match of text.matchAll(assetPattern)) references.add(match[0]);
    for (const rootMatch of text.matchAll(assetRootPattern)) {
      const variable = rootMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const joinedPattern = new RegExp(`${variable}\\s*\\+\\s*['"](${assetSuffixPattern})['"]`, 'g');
      for (const joinedMatch of text.matchAll(joinedPattern)) {
        references.add(rootMatch[2] + joinedMatch[1]);
      }
    }
    const enumerated = /for\s*\(\s*const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+of\s*\[([^\]]*)\]\s*\)\s*(?:\{\s*)?[A-Za-z_$][A-Za-z0-9_$]*\s*\[\s*\1\s*\]\s*=\s*`(assets\/[^`]+)`/g;
    for (const match of text.matchAll(enumerated)) {
      const literals = /(['"])([A-Za-z0-9_-]+)\1/g;
      const values = [...match[2].matchAll(literals)].map(value => value[2]);
      if (!values.length || match[2].replace(literals, '').replace(/[\s,]/g, '')) {
        throw new Error('Asset template enumeration must use a literal list');
      }
      for (const value of values) {
        const filename = match[3].split('${' + match[1] + '}').join(value);
        if (!/^assets\/[A-Za-z0-9_./\- ()\u3400-\u9fff]+\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)$/.test(filename)) {
          throw new Error(`Unsupported enumerated asset template: ${match[3]}`);
        }
        references.add(filename);
      }
    }
  }

  return references;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = process.argv[2];
  const sources = process.argv.slice(3).map(file => fs.readFileSync(path.join(root, file), 'utf8'));
  console.log(JSON.stringify([...collectReleaseAssets(sources)]));
}
