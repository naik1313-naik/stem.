$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $projectRoot 'apps\web'

Push-Location $webRoot
try {
    npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Circuit unit tests failed.' }

    npm.cmd run verify:tokens
    if ($LASTEXITCODE -ne 0) { throw 'Design token verification failed.' }

    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }

    Write-Host 'All local verification commands passed.'
    Write-Host 'For the browser/screenshot suite, run: npx playwright install chromium; npm.cmd run test:e2e'
}
finally {
    Pop-Location
}
