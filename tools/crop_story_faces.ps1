Add-Type -AssemblyName System.Drawing
$sourcePath = (Resolve-Path "$PSScriptRoot\..\tools\koei_viewer\output\hero-faces.png").Path
$outputDir = (Resolve-Path "$PSScriptRoot\..\assets\story-portraits").Path
$source = [System.Drawing.Bitmap]::new($sourcePath)
$faces = @{
  'lv-bu-original.png' = 4
  'li-ru-original.png' = 6
  'kong-rong-original.png' = 7
  'li-su-original.png' = 20
  'hu-zhen-original.png' = 21
  'li-jue-original.png' = 46
  'guo-si-original.png' = 47
  'zhao-cen-original.png' = 27
  'dong-cheng-original.png' = 142
  'emperor-original.png' = 143
  'officer-original.png' = 176
  'shopkeeper-original.png' = 182
}
foreach ($entry in $faces.GetEnumerator()) {
  $id = [int]$entry.Value
  $sx = ($id % 20) * 64
  $sy = [Math]::Floor($id / 20) * 80
  $result = [System.Drawing.Bitmap]::new(256, 320)
  $graphics = [System.Drawing.Graphics]::FromImage($result)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0,0,256,320), $sx,$sy,64,80, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  $result.Save((Join-Path $outputDir $entry.Key), [System.Drawing.Imaging.ImageFormat]::Png)
  $result.Dispose()
}
$source.Dispose()
Write-Output "Story portraits extracted from FACEDAT.R3 sheet."
