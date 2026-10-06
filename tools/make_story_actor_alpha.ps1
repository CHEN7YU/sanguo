Add-Type -AssemblyName System.Drawing
$sourcePath = (Resolve-Path "$PSScriptRoot\..\assets\story-actors-original.png").Path
$outputPath = Join-Path (Split-Path $sourcePath) 'story-actors.png'
$bitmap = [System.Drawing.Bitmap]::new($sourcePath)
for ($y = 0; $y -lt $bitmap.Height; $y++) {
  for ($x = 0; $x -lt $bitmap.Width; $x++) {
    $pixel = $bitmap.GetPixel($x, $y)
    if ($pixel.R -le 7 -and $pixel.G -le 7 -and $pixel.B -le 7) {
      $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
Write-Output $outputPath
