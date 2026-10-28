# Sunveil Kanban - 100% .EXE Free PowerShell Server Fallback
# No custom .exe binary needed - Microsoft Windows PowerShell is digitally signed & antivirus-safe!
# Security Hardened: Strict Loopback (127.0.0.1), Anti-Path-Traversal, DNS-Rebinding Protection

$ErrorActionPreference = "SilentlyContinue"
$BaseDir = [System.IO.Path]::GetFullPath($PSScriptRoot)
$DataDir = Join-Path $BaseDir "data"
$DataFile = Join-Path $DataDir "kanban_data.json"
$ProfileDir = Join-Path $DataDir "profile"

if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
}

# Finde freien Port auf Loopback (127.0.0.1)
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$Port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
$listener.Stop()

$HttpListener = New-Object System.Net.HttpListener
$HttpListener.Prefixes.Add("http://127.0.0.1:$Port/")
$HttpListener.Start()

$AppUrl = "http://127.0.0.1:$Port/index.html"

# Browser finden
$EdgePaths = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$Browser = $null
foreach ($p in $EdgePaths) {
    if (Test-Path $p) {
        $Browser = $p
        break
    }
}

if ($Browser) {
    Start-Process -FilePath $Browser -ArgumentList "--app=`"$AppUrl`" --user-data-dir=`"$ProfileDir`" --window-size=1540,960 --disable-features=TranslateUI --disable-extensions --no-first-run"
} else {
    Start-Process $AppUrl
}

$LastHeartbeat = (Get-Date).AddSeconds(20)

while ($HttpListener.IsListening) {
    $asyncResult = $HttpListener.BeginGetContext($null, $null)
    while (-not $asyncResult.AsyncWaitHandle.WaitOne(2000)) {
        if (((Get-Date) - $LastHeartbeat).TotalSeconds -gt 15) {
            $HttpListener.Stop()
            exit
        }
    }
    
    $Context = $HttpListener.EndGetContext($asyncResult)
    $Request = $Context.Request
    $Response = $Context.Response

    $LastHeartbeat = Get-Date

    # 1. DNS Rebinding Schutz: Host Header prüfen
    $HostHeader = $Request.UserHostName
    if (-not [string]::IsNullOrEmpty($HostHeader)) {
        $HostOnly = $HostHeader.Split(':')[0].ToLower()
        if ($HostOnly -ne "127.0.0.1" -and $HostOnly -ne "localhost") {
            $Response.StatusCode = 403
            $Response.Close()
            continue
        }
    }

    # 2. CORS / Cross-Site Schutz: Nur lokale Ursprünge erlauben
    $Origin = $Request.Headers["Origin"]
    if (-not [string]::IsNullOrEmpty($Origin)) {
        try {
            $uri = [System.Uri]$Origin
            $origHost = $uri.Host.ToLower()
            if ($origHost -eq "127.0.0.1" -or $origHost -eq "localhost") {
                $Response.AddHeader("Access-Control-Allow-Origin", $Origin)
                $Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                $Response.AddHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
            } else {
                $Response.StatusCode = 403
                $Response.Close()
                continue
            }
        } catch {
            $Response.StatusCode = 403
            $Response.Close()
            continue
        }
    }

    # Sicherheits-Header
    $Response.AddHeader("X-Content-Type-Options", "nosniff")
    $Response.AddHeader("X-Frame-Options", "DENY")
    $Response.AddHeader("Referrer-Policy", "no-referrer")

    if ($Request.HttpMethod -eq "OPTIONS") {
        $Response.StatusCode = 204
        $Response.Close()
        continue
    }

    $Path = $Request.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrEmpty($Path)) { $Path = "index.html" }

    if ($Path -eq "api/ping") {
        $buf = [System.Text.Encoding]::UTF8.GetBytes('{"pong":true}')
        $Response.ContentType = "application/json"
        $Response.OutputStream.Write($buf, 0, $buf.Length)
        $Response.Close()
        continue
    }

    if ($Path -eq "api/shutdown") {
        $buf = [System.Text.Encoding]::UTF8.GetBytes('{"bye":true}')
        $Response.ContentType = "application/json"
        $Response.OutputStream.Write($buf, 0, $buf.Length)
        $Response.Close()
        $HttpListener.Stop()
        exit
    }

    if ($Path -eq "api/version") {
        $mtime = 0
        if (Test-Path $DataFile) {
            $mtime = (Get-Item $DataFile).LastWriteTimeUtc.Ticks
        }
        $buf = [System.Text.Encoding]::UTF8.GetBytes("{`"version`":$mtime}")
        $Response.ContentType = "application/json"
        $Response.OutputStream.Write($buf, 0, $buf.Length)
        $Response.Close()
        continue
    }

    if ($Path -eq "api/data" -and $Request.HttpMethod -eq "GET") {
        $dataBytes = [byte[]]@()
        if (Test-Path $DataFile) {
            $dataBytes = [System.IO.File]::ReadAllBytes($DataFile)
        } else {
            $dataBytes = [System.Text.Encoding]::UTF8.GetBytes('{}')
        }
        $Response.ContentType = "application/json; charset=utf-8"
        $Response.OutputStream.Write($dataBytes, 0, $dataBytes.Length)
        $Response.Close()
        continue
    }

    if ($Path -eq "api/data" -and $Request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($Request.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd()
        [System.IO.File]::WriteAllText($DataFile, $body, [System.Text.Encoding]::UTF8)
        $buf = [System.Text.Encoding]::UTF8.GetBytes('{"saved":true}')
        $Response.ContentType = "application/json; charset=utf-8"
        $Response.OutputStream.Write($buf, 0, $buf.Length)
        $Response.Close()
        continue
    }

    # 3. Statische Dateien mit vollständigem Path-Traversal Schutz
    $UnsafeTarget = Join-Path $BaseDir ($Path -replace '/', '\')
    $ResolvedTarget = [System.IO.Path]::GetFullPath($UnsafeTarget)

    # Prüfen, ob die Datei innerhalb des Basisverzeichnisses liegt
    if (-not $ResolvedTarget.StartsWith($BaseDir, [System.StringComparison]::OrdinalIgnoreCase)) {
        $Response.StatusCode = 403
        $Response.Close()
        continue
    }

    # Schutz vor Zugriff auf vertrauliche Ordner (.git, data\profile)
    $ProfilePath = [System.IO.Path]::GetFullPath((Join-Path $BaseDir "data\profile"))
    $GitPath = [System.IO.Path]::GetFullPath((Join-Path $BaseDir ".git"))
    if ($ResolvedTarget.StartsWith($ProfilePath, [System.StringComparison]::OrdinalIgnoreCase) -or 
        $ResolvedTarget.StartsWith($GitPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        $Response.StatusCode = 403
        $Response.Close()
        continue
    }

    if (Test-Path $ResolvedTarget -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($ResolvedTarget).ToLower()
        $mime = "application/octet-stream"
        switch ($ext) {
            ".html" { $mime = "text/html; charset=utf-8" }
            ".css"  { $mime = "text/css; charset=utf-8" }
            ".js"   { $mime = "application/javascript; charset=utf-8" }
            ".json" { $mime = "application/json; charset=utf-8" }
            ".png"  { $mime = "image/png" }
            ".svg"  { $mime = "image/svg+xml" }
            ".ico"  { $mime = "image/x-icon" }
        }
        $bytes = [System.IO.File]::ReadAllBytes($ResolvedTarget)
        $Response.ContentType = $mime
        $Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $Response.Close()
    } else {
        $Response.StatusCode = 404
        $Response.Close()
    }
}
