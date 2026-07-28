Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\samue\.cursor\projects\c-Users-samue-OneDrive-Desktop-ChipperApp\assets\c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_7d71f03b5a11149043561d063d9555c5_images_Cookie-7e75b7c2-833e-4d81-bad5-362b282a1fae.png"
$dest = "c:\Users\samue\OneDrive\Desktop\ChipperApp\assets\watermarks\cookie-ring.png"

New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null

$img = [System.Drawing.Bitmap]::FromFile($srcPath)
$out = New-Object System.Drawing.Bitmap $img.Width, $img.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Source ring is very dark (max lum ~32). Map faint grey → usable ink alpha.
$floor = 6
$ceil = 36

for ($y = 0; $y -lt $img.Height; $y++) {
  for ($x = 0; $x -lt $img.Width; $x++) {
    $c = $img.GetPixel($x, $y)
    $lum = [int]((0.299 * $c.R) + (0.587 * $c.G) + (0.114 * $c.B))
    if ($lum -le $floor) {
      $a = 0
    } else {
      $t = [Math]::Min(1.0, ($lum - $floor) / ($ceil - $floor))
      $a = [int](40 + (215 * $t))
    }
    $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, 25, 22, 18))
  }
}

$out.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$out.Dispose()
Write-Output "saved $dest"
