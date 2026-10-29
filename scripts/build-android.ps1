$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$env:NODE_OPTIONS = ($env:NODE_OPTIONS + ' --use-system-ca').Trim()

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Node.js/npm is required.' }
$javaFromHome = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin\java.exe' } else { '' }
if (-not (Get-Command java.exe -ErrorAction SilentlyContinue) -and (-not $javaFromHome -or -not (Test-Path -LiteralPath $javaFromHome))) { throw 'Java 17 or newer is required. Set JAVA_HOME to the Android Studio JDK.' }
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:ANDROID_SDK_ROOT }
if (-not $sdk -or -not (Test-Path -LiteralPath $sdk)) { throw 'Set ANDROID_HOME to your Android SDK directory.' }
if (-not (Test-Path -LiteralPath 'node_modules')) {
  & npm.cmd ci
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
}

& npm.cmd run android:sync
if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed.' }

Push-Location android
try {
  & .\gradlew.bat assembleDebug
  if ($LASTEXITCODE -ne 0) { throw 'Gradle APK build failed.' }
} finally { Pop-Location }

$apk = Join-Path (Get-Location) 'android\app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path -LiteralPath $apk)) { throw 'APK output was not found.' }
$output = Join-Path (Get-Location) 'release\android'
New-Item -ItemType Directory -Path $output -Force | Out-Null
Copy-Item -LiteralPath $apk -Destination (Join-Path $output 'PersonalWorkspace-debug.apk') -Force
Write-Host "APK: $output\PersonalWorkspace-debug.apk"
