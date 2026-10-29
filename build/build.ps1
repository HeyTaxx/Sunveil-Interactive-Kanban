# ==============================================================================
# Sunveil - Native Executable Builder & Digital Signer
# Compiles Sunveil.exe with embedded WebView2 host, explicit AppUserModelID,
# custom icon, and digital Authenticode signature for taskbar pinning.
# ==============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$ProjectDir = (Get-Item $ScriptDir).Parent.FullName

Set-Location $ProjectDir

# 1. Ensure app.ico exists
$icoPath = Join-Path $ScriptDir "app.ico"
if (-not (Test-Path $icoPath)) {
    Write-Host "Generating app.ico..." -ForegroundColor Cyan
    & (Join-Path $ScriptDir "create_icon.ps1")
}

Copy-Item $icoPath (Join-Path $ScriptDir "host\app.ico") -Force
Copy-Item $icoPath (Join-Path $ProjectDir "app.ico") -Force

# 2. Build & Publish Sunveil.exe via .NET
Write-Host "Building Sunveil.exe (Native WebView2 Desktop App)..." -ForegroundColor Cyan

$hostProj = Join-Path $ScriptDir "host\SunveilHost.csproj"
$publishDir = Join-Path $ProjectDir "build\bin"

if (Test-Path $publishDir) {
    Remove-Item $publishDir -Recurse -Force
}

$buildArgs = @(
    "publish",
    "`"$hostProj`"",
    "-c", "Release",
    "-r", "win-x64",
    "--self-contained", "false",
    "-p:PublishSingleFile=true",
    "-p:IncludeNativeLibrariesForSelfExtract=true",
    "-o", "`"$publishDir`""
)

$proc = Start-Process -FilePath "dotnet" -ArgumentList $buildArgs -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "dotnet publish failed with exit code $($proc.ExitCode)"
    exit 1
}

# 3. Copy Sunveil.exe to project root
$builtExe = Join-Path $publishDir "Sunveil.exe"
if (-not (Test-Path $builtExe)) {
    Write-Error "Expected $builtExe was not created."
    exit 1
}

$targetExe = Join-Path $ProjectDir "Sunveil.exe"

# If Sunveil.exe is currently running, stop it so we can update the binary
Get-Process -Name "Sunveil" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 300

Copy-Item $builtExe $targetExe -Force

$size = (Get-Item $targetExe).Length
Write-Host "Sunveil.exe successfully created ($size bytes)." -ForegroundColor Green

# 4. Authenticode Code Signing
Write-Host "Checking Authenticode Code-Signing Certificate..." -ForegroundColor Cyan

$CertSubject = "CN=Sunveil Software, O=Sunveil Open Source"
$ExistingCert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert -ErrorAction SilentlyContinue | 
                Where-Object { $_.Subject -like "*Sunveil Software*" } | 
                Select-Object -First 1

if (-not $ExistingCert) {
    Write-Host "Creating local Code Signing Certificate in CurrentUser\My..." -ForegroundColor Yellow
    $ExistingCert = New-SelfSignedCertificate -Type CodeSigningCert `
        -Subject $CertSubject `
        -FriendlyName "Sunveil Application Signer" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(10)
}

# Trust certificate locally if possible without blocking GUI dialogs
try {
    $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root", "CurrentUser"
    $rootStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadOnly)
    $alreadyTrusted = $rootStore.Certificates | Where-Object { $_.Thumbprint -eq $ExistingCert.Thumbprint }
    $rootStore.Close()
} catch { }

Write-Host "Signing Sunveil.exe with Authenticode Signature..." -ForegroundColor Cyan
$signResult = Set-AuthenticodeSignature -FilePath $targetExe -Certificate $ExistingCert -HashAlgorithm SHA256

$verify = Get-AuthenticodeSignature $targetExe
$subj = $ExistingCert.Subject
$st = $verify.Status
$msg = $verify.StatusMessage

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Binary:        $targetExe" -ForegroundColor White
Write-Host "  Signer:        $subj" -ForegroundColor White
Write-Host "  Status:        $st" -ForegroundColor Green
Write-Host "  StatusMessage: $msg" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

if ($verify.Status -eq "Valid") {
    Write-Host "SUCCESS: Sunveil.exe is compiled, signed, and ready for taskbar pinning!" -ForegroundColor Green
} else {
    Write-Host "INFO: Sunveil.exe compiled and signed with status: $st" -ForegroundColor Yellow
}
