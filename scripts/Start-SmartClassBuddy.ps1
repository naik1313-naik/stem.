$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $projectRoot 'apps\web'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required. Install Node.js 22.12 or newer first.'
}

Push-Location $webRoot
try {
    if (-not (Test-Path 'node_modules')) {
        Write-Host 'Installing frontend dependencies...'
        npm.cmd install
        if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
    }
    Write-Host 'Starting SmartClass Buddy frontend...'
    npm.cmd run dev
    if ($LASTEXITCODE -ne 0) { throw 'Vite stopped with an error.' }
}
finally {
    Pop-Location
}
