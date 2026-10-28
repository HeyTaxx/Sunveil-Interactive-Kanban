Add-Type -AssemblyName System.Drawing

function New-KanbanBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $padding = [Math]::Max(1, [int]($size * 0.06))
    $boxSize = $size - (2 * $padding)
    $radius = [Math]::Max(2, [int]($size * 0.22))

    # Background rounded rectangle with indigo-to-purple gradient
    $rect = New-Object System.Drawing.Rectangle($padding, $padding, $boxSize, $boxSize)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 79, 70, 229),   # Indigo #4f46e5
        [System.Drawing.Color]::FromArgb(255, 124, 58, 237),  # Violet #7c3aed
        45.0
    )

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $g.FillPath($brush, $path)

    # Subtle inner border
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 255, 255, 255), [Math]::Max(1.0, $size * 0.02))
    $g.DrawPath($borderPen, $path)

    # Draw 4 Kanban Cards (white with rounded corners or rectangles)
    # Layout inside box:
    # Col 1: Card 1 (tall), Card 2 (short)
    # Col 2: Card 3 (medium), Card 4 (tall)
    $innerX = $padding + ($boxSize * 0.18)
    $innerY = $padding + ($boxSize * 0.18)
    $innerW = $boxSize * 0.64
    $innerH = $boxSize * 0.64
    $colW = ($innerW - ($boxSize * 0.08)) / 2.0
    $colGap = $boxSize * 0.08

    $cardBrushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
    $cardBrushAccent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 224, 231, 255))

    # Helper to draw rounded card
    function Draw-Card($x, $y, $w, $h, $b) {
        $cRad = [Math]::Max(1, [int]($w * 0.2))
        $cDiam = $cRad * 2
        if ($cDiam -gt $w) { $cDiam = $w }
        if ($cDiam -gt $h) { $cDiam = $h }
        $cPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $cPath.AddArc($x, $y, $cDiam, $cDiam, 180, 90)
        $cPath.AddArc($x + $w - $cDiam, $y, $cDiam, $cDiam, 270, 90)
        $cPath.AddArc($x + $w - $cDiam, $y + $h - $cDiam, $cDiam, $cDiam, 0, 90)
        $cPath.AddArc($x, $y + $h - $cDiam, $cDiam, $cDiam, 90, 90)
        $cPath.CloseFigure()
        $g.FillPath($b, $cPath)
        $cPath.Dispose()
    }

    $c1H = $innerH * 0.52
    $c2H = $innerH * 0.36
    $gapY = $innerH * 0.12

    # Column 1
    Draw-Card $innerX $innerY $colW $c1H $cardBrushWhite
    Draw-Card $innerX ($innerY + $c1H + $gapY) $colW $c2H $cardBrushAccent

    # Column 2
    $c3H = $innerH * 0.38
    $c4H = $innerH * 0.50
    $col2X = $innerX + $colW + $colGap
    Draw-Card $col2X $innerY $colW $c3H $cardBrushAccent
    Draw-Card $col2X ($innerY + $c3H + $gapY) $colW $c4H $cardBrushWhite

    $borderPen.Dispose()
    $brush.Dispose()
    $path.Dispose()
    $cardBrushWhite.Dispose()
    $cardBrushAccent.Dispose()
    $g.Dispose()

    return $bmp
}

$sizes = @(256, 128, 64, 48, 32, 16)
$pngStreams = @()

foreach ($sz in $sizes) {
    $bmp = New-KanbanBitmap $sz
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngStreams += @{
        Size = $sz
        Bytes = $ms.ToArray()
    }
    $ms.Dispose()
}

$icoPath = Join-Path $PSScriptRoot "app.ico"
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR header
$bw.Write([uint16]0)                  # Reserved
$bw.Write([uint16]1)                  # Type 1 = Icon
$bw.Write([uint16]$pngStreams.Count) # Image count

$dataOffset = 6 + ($pngStreams.Count * 16)

# Write Directory Entries
foreach ($entry in $pngStreams) {
    $szByte = if ($entry.Size -ge 256) { 0 } else { [byte]$entry.Size }
    $bw.Write([byte]$szByte)          # Width
    $bw.Write([byte]$szByte)          # Height
    $bw.Write([byte]0)                # Color count
    $bw.Write([byte]0)                # Reserved
    $bw.Write([uint16]1)              # Color planes
    $bw.Write([uint16]32)             # Bits per pixel
    $bw.Write([uint32]$entry.Bytes.Length) # Image size in bytes
    $bw.Write([uint32]$dataOffset)    # Offset to image
    $dataOffset += $entry.Bytes.Length
}

# Write Image Data (PNG streams)
foreach ($entry in $pngStreams) {
    $bw.Write($entry.Bytes)
}

$bw.Flush()
$bw.Close()
$fs.Close()

Write-Host "Created valid multi-resolution app.ico at: $icoPath" -ForegroundColor Green
