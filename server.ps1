$Port = 3000
$PublicDir = Join-Path $PSScriptRoot "public"
$DataDir = Join-Path $PSScriptRoot "data"
$DataFile = Join-Path $DataDir "ratings.json"

if (!(Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}
if (!(Test-Path $DataFile)) {
    Set-Content -Path $DataFile -Value "[]" -Encoding UTF8
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "🚀 Server is running on http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "👉 Form:  http://localhost:$Port" -ForegroundColor Yellow
    Write-Host "👉 Admin: http://localhost:$Port/admin.html" -ForegroundColor Yellow
    Write-Host "====================================================" -ForegroundColor Green
} catch {
    Write-Error "Failed to start listener: $_"
    exit 1
}

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        $urlPath = $request.Url.AbsolutePath

        # API: POST /api/ratings
        if ($urlPath -eq "/api/ratings" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $reader.Close()

            $parsed = $body | ConvertFrom-Json
            $score = [int]$parsed.score
            $comment = if ($parsed.comment) { $parsed.comment.Trim() } else { "" }

            if ($score -lt 1 -or $score -gt 5) {
                $response.StatusCode = 400
                $response.ContentType = "application/json; charset=utf-8"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"คะแนนต้องอยู่ระหว่าง 1 ถึง 5"}')
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                $response.Close()
                continue
            }

            $currentData = @()
            if (Test-Path $DataFile) {
                $raw = Get-Content $DataFile -Raw -Encoding UTF8
                if ($raw) {
                    $currentData = $raw | ConvertFrom-Json
                    if ($currentData -isnot [System.Collections.IEnumerable]) {
                        $currentData = @($currentData)
                    }
                }
            }

            $newEntry = [PSCustomObject]@{
                id = "rate_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                score = $score
                comment = $comment
                createdAt = (Get-Date).ToString("o")
                formattedDate = (Get-Date).ToString("dd/MM/yyyy HH:mm:ss")
            }

            $list = [System.Collections.ArrayList]@($newEntry)
            if ($currentData) {
                foreach ($item in $currentData) { $list.Add($item) | Out-Null }
            }

            $list | ConvertTo-Json -Depth 5 | Set-Content -Path $DataFile -Encoding UTF8

            $response.StatusCode = 201
            $response.ContentType = "application/json; charset=utf-8"
            $resObj = [PSCustomObject]@{
                success = $true
                message = "บันทึกข้อมูลเรียบร้อยแล้ว"
                data = $newEntry
            }
            $outBytes = [System.Text.Encoding]::UTF8.GetBytes(($resObj | ConvertTo-Json))
            $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
            $response.Close()
            continue
        }

        # API: GET /api/ratings
        if ($urlPath -eq "/api/ratings" -and $request.HttpMethod -eq "GET") {
            $currentData = @()
            if (Test-Path $DataFile) {
                $raw = Get-Content $DataFile -Raw -Encoding UTF8
                if ($raw) {
                    $currentData = $raw | ConvertFrom-Json
                    if ($currentData -isnot [System.Collections.IEnumerable]) {
                        $currentData = @($currentData)
                    }
                }
            }

            $total = if ($currentData) { $currentData.Count } else { 0 }
            $sum = 0
            $dist = @{ 1 = 0; 2 = 0; 3 = 0; 4 = 0; 5 = 0 }

            if ($currentData) {
                foreach ($item in $currentData) {
                    $s = [int]$item.score
                    $sum += $s
                    if ($dist.ContainsKey($s)) {
                        $dist[$s]++
                    }
                }
            }

            $avg = if ($total -gt 0) { [Math]::Round($sum / $total, 2) } else { 0.00 }

            $statsObj = [PSCustomObject]@{
                success = $true
                stats = [PSCustomObject]@{
                    total = $total
                    average = $avg
                    distribution = $dist
                }
                ratings = $currentData
            }

            $response.StatusCode = 200
            $response.ContentType = "application/json; charset=utf-8"
            $outBytes = [System.Text.Encoding]::UTF8.GetBytes(($statsObj | ConvertTo-Json -Depth 5))
            $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
            $response.Close()
            continue
        }

        # Static files
        $relPath = if ($urlPath -eq "/") { "index.html" } else { $urlPath.TrimStart("/") }
        $filePath = Join-Path $PublicDir $relPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($MimeTypes.ContainsKey($ext)) { $MimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $mime
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $response.ContentType = "text/html; charset=utf-8"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("<h2>404 Not Found</h2><p><a href='/'>Go to Rating Page</a></p>")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # continue listening on errors
    }
}
