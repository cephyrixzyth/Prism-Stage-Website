$ErrorActionPreference = 'Stop'
$siteRoot = $PSScriptRoot
$port = 8765
$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if (-not $existing) {
    Start-Process -FilePath 'python' -ArgumentList @(
        '-m', 'http.server', "$port", '--bind', '127.0.0.1', '--directory', $siteRoot
    ) -WindowStyle Hidden

    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 250
        try {
            $null = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -TimeoutSec 1
            break
        } catch {}
    }
}

Start-Process "http://127.0.0.1:$port/"
