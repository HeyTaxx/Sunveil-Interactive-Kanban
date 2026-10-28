# ==============================================================================
# Sunveil - Native Executable Builder & Digital Signer
# Compiles Sunveil.exe with full PE metadata, manifest, and Authenticode signature.
# ==============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$ProjectDir = (Get-Item $ScriptDir).Parent.FullName

Set-Location $ProjectDir

$CscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $CscPath)) {
    $CscPath = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

if (-not (Test-Path $CscPath)) {
    Write-Error "Microsoft .NET C# Compiler (csc.exe) not found."
    exit 1
}

$OutExe = "Sunveil.exe"

Write-Host "Compiling Sunveil.exe with Windows GUI subsystem and PE metadata..." -ForegroundColor Cyan

$CompileArgs = @(
    "/target:winexe",
    "/optimize+",
    "/platform:anycpu",
    "/win32manifest:build\app.manifest",
    "/out:Sunveil.exe",
    "/r:System.dll,System.Windows.Forms.dll",
    "build\AssemblyInfo.cs",
    "build\Launcher.cs"
)

$proc = Start-Process -FilePath $CscPath -ArgumentList $CompileArgs -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "Compilation failed with exit code $($proc.ExitCode)"
    exit 1
}

$fullExePath = Join-Path $ProjectDir $OutExe
$size = (Get-Item $fullExePath).Length
Write-Host "Sunveil.exe successfully compiled ($size bytes)." -ForegroundColor Green

# ------------------------------------------------------------------------------
# Authenticode Code Signing
# ------------------------------------------------------------------------------
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

Write-Host "Signing Sunveil.exe with Authenticode Signature..." -ForegroundColor Cyan
$signResult = Set-AuthenticodeSignature -FilePath $fullExePath -Certificate $ExistingCert -HashAlgorithm SHA256

$verify = Get-AuthenticodeSignature $fullExePath
$subj = $ExistingCert.Subject
$st = $verify.Status
$msg = $verify.StatusMessage

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Binary:        $fullExePath" -ForegroundColor White
Write-Host "  Signer:        $subj" -ForegroundColor White
Write-Host "  Status:        $st" -ForegroundColor Green
Write-Host "  StatusMessage: $msg" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

if ($verify.Status -eq "Valid") {
    Write-Host "SUCCESS: Sunveil.exe is compiled, signed, and trusted!" -ForegroundColor Green
} else {
    Write-Host "INFO: Sunveil.exe compiled and signed with status: $st" -ForegroundColor Yellow
}
