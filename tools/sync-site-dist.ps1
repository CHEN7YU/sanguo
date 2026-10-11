$ErrorActionPreference = 'Stop'

$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$siteRoot = [System.IO.Path]::GetFullPath('C:\Users\Duanyang Home\Documents\ChatGPT\sanguo\site-publish-v78')
$targetRoot = [System.IO.Path]::GetFullPath((Join-Path $siteRoot 'dist'))

if (-not $targetRoot.StartsWith($siteRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to replace a target outside the Sites checkout: $targetRoot"
}

$runtimeFiles = @(
  'audio-config.js',
  'battle-rules.js',
  'battle-sfx.js',
  'battle-view.js',
  'game.js',
  'index.html',
  'leaderboard.js',
  'level-01.js',
  'level-02-animation-bounds.js',
  'zhao-yun-animation-bounds.js',
  'wen-chou-animation-bounds.js',
  'jieqiao-core-animation-bounds.js',
  'beihai-animation-bounds.js',
  'level-02.js',
  'level-03-guangchuan.js',
  'level-03-xindu.js',
  'level-04-julu.js',
  'level-04-qinghe.js',
  'level-05-jieqiao.js',
  'level-06-beihai.js',
  'story-data.js',
  'style.css'
)

if (Test-Path -LiteralPath $targetRoot) {
  Remove-Item -LiteralPath $targetRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $targetRoot | Out-Null

foreach ($file in $runtimeFiles) {
  $source = Join-Path $sourceRoot $file
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Missing runtime file: $source"
  }
  Copy-Item -LiteralPath $source -Destination (Join-Path $targetRoot $file)
}

$assetPattern = 'assets/[A-Za-z0-9_./\- ()\u3400-\u9fff]+?\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)'
$assetRootPattern = 'const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*[''"](assets/[A-Za-z0-9_./\- ()\u3400-\u9fff]+/)[''"]'
$assetSuffixPattern = '[A-Za-z0-9_./\- ()\u3400-\u9fff]+?\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)'
$assetReferences = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($file in $runtimeFiles) {
  $content = Get-Content -LiteralPath (Join-Path $sourceRoot $file) -Raw
  foreach ($match in [regex]::Matches($content, $assetPattern)) {
    [void]$assetReferences.Add($match.Value)
  }
  # Runtime maps keep large related asset families readable by joining a
  # literal assets root with individual filenames. Resolve those joins here
  # so the lightweight release package does not silently omit story art.
  foreach ($rootMatch in [regex]::Matches($content, $assetRootPattern)) {
    $variable = [regex]::Escape($rootMatch.Groups[1].Value)
    $root = $rootMatch.Groups[2].Value
    $joinedPattern = $variable + '\s*\+\s*[''"](' + $assetSuffixPattern + ')[''"]'
    foreach ($joinedMatch in [regex]::Matches($content, $joinedPattern)) {
      [void]$assetReferences.Add($root + $joinedMatch.Groups[1].Value)
    }
  }
}

foreach ($reference in $assetReferences) {
  $relative = $reference.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
  $source = Join-Path $sourceRoot $relative
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Missing referenced release asset: $source"
  }
  $destination = Join-Path $targetRoot $relative
  $destinationDirectory = Split-Path -Parent $destination
  New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination
}

$files = Get-ChildItem -LiteralPath $targetRoot -File -Recurse
$size = ($files | Measure-Object -Property Length -Sum).Sum
Write-Output "Synced $($files.Count) release files ($size bytes, $($assetReferences.Count) referenced assets) to $targetRoot"
