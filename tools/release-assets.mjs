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
  }
  return references;
}
