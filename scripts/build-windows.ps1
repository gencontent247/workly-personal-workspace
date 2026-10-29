$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$env:NODE_OPTIONS = ($env:NODE_OPTIONS + ' --use-system-ca').Trim()
& npm.cmd install
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
& npm.cmd run dist:win
if ($LASTEXITCODE -ne 0) { throw 'Windows build failed' }
Write-Host 'Installer: release/'
