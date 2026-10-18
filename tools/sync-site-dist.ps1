param(
  [string]$SiteRoot = 'C:\Users\Duanyang Home\Documents\ChatGPT\sanguo\game-site-publish'
)

$ErrorActionPreference = 'Stop'

$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$siteRoot = [System.IO.Path]::GetFullPath($SiteRoot)
$targetRoot = [System.IO.Path]::GetFullPath((Join-Path $siteRoot 'dist'))

if (-not $targetRoot.StartsWith($siteRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to replace a target outside the Sites checkout: $targetRoot"
}

$index = Get-Content -LiteralPath (Join-Path $sourceRoot 'index.html') -Raw
$runtimeFiles = @('index.html')
foreach ($match in [regex]::Matches($index, '<(?:script|link)\b[^>]*\b(?:src|href)=["'']([^"'']+)["'']', 'IgnoreCase')) {
  $filename = ($match.Groups[1].Value -split '[?#]')[0]
  if ($filename -notmatch '^[A-Za-z0-9_-]+\.(?:m?js|css)$') {
    throw "Unsupported runtime reference: $filename"
  }
  $runtimeFiles += $filename
}
$runtimeFiles = @($runtimeFiles | Select-Object -Unique)
foreach ($file in $runtimeFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot $file) -PathType Leaf)) {
    throw "Missing runtime file: $file"
  }
}

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

$assetJson = & node (Join-Path $sourceRoot 'tools\release-assets.mjs') $sourceRoot @runtimeFiles
if ($LASTEXITCODE -ne 0) { throw 'Release asset collection failed' }
$assetReferences = $assetJson | ConvertFrom-Json

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

# Xuzhou action-sheet paths are assembled from unit IDs at runtime. Include
# this small chapter directory as a unit so the static scanner cannot omit a
# walk, attack, hurt, or portrait sheet that does not appear as one literal.
foreach ($tree in @('assets/level-07-xuzhou')) {
  $source = Join-Path $sourceRoot $tree
  $destination = Join-Path $targetRoot $tree
  if (Test-Path -LiteralPath $destination) {
    Remove-Item -LiteralPath $destination -Recurse -Force
  }
  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

$files = Get-ChildItem -LiteralPath $targetRoot -File -Recurse
$size = ($files | Measure-Object -Property Length -Sum).Sum
Write-Output "Synced $($files.Count) release files ($size bytes, $($assetReferences.Count) referenced assets) to $targetRoot"
