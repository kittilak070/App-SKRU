# =========================================================
# SKRU Appointment System - Built-in Windows HTTP Server
# Runs out-of-the-box on any Windows machine (No Node install required)
# =========================================================

$port = 3000
$prefix = "http://localhost:$port/"
$publicDir = Join-Path $PSScriptRoot "public"
$dataDir = Join-Path $PSScriptRoot "data"
$appointmentsFile = Join-Path $dataDir "appointments.json"
$teacherFile = Join-Path $dataDir "teacher.json"

if (!(Test-Path $dataDir)) { New-Item -ItemType Directory -Force -Path $dataDir | Out-Null }

function Get-JsonData($filePath, $defaultObj) {
    if (Test-Path $filePath) {
        try {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            return $content | ConvertFrom-Json
        } catch {
            return $defaultObj
        }
    }
    return $defaultObj
}

function Save-JsonData($filePath, $obj) {
    $json = $obj | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($filePath, $json, [System.Text.Encoding]::UTF8)
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Error starting listener on $prefix : $_" -ForegroundColor Red
    Exit
}

Write-Host "===================================================" -ForegroundColor Green
Write-Host "🚀 SKRU Appointment System is now RUNNING!" -ForegroundColor Cyan
Write-Host "📱 Student Portal: http://localhost:$port" -ForegroundColor Yellow
Write-Host "👨‍🏫 Teacher Portal: http://localhost:$port/admin.html" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C in this window to stop server." -ForegroundColor Gray

# Open browser automatically
Start-Process "http://localhost:$port"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $response.AddHeader("Access-Control-Allow-Origin", "*")
    $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

    if ($request.HttpMethod -eq "OPTIONS") {
        $response.StatusCode = 204
        $response.Close()
        continue
    }

    $rawUrl = $request.Url.AbsolutePath
    $method = $request.HttpMethod

    # Helper to send JSON
    function Send-Json($code, $data) {
        $jsonStr = $data | ConvertTo-Json -Depth 10 -Compress
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
        $response.StatusCode = $code
        $response.ContentType = "application/json; charset=utf-8"
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
    }

    # Helper to read body
    function Get-Body {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()
        if ([string]::IsNullOrWhiteSpace($bodyText)) { return @{} }
        return $bodyText | ConvertFrom-Json
    }

    # Route: /api/teacher
    if ($rawUrl -eq "/api/teacher" -and $method -eq "GET") {
        $teacher = Get-JsonData $teacherFile @{
            id = "T001"
            name = "MR.Panukorn"
            faculty = "คณะวิทยาศาสตร์และเทคโนโลยี"
            status = "พร้อมให้เข้าพบ"
            isAvailable = $true
            consultationHours = "จันทร์, พุธ 13:00 - 16:00 น."
        }
        Send-Json 200 @{ success = $true; data = $teacher }
        continue
    }

    if ($rawUrl -eq "/api/teacher" -and $method -eq "PUT") {
        $body = Get-Body
        $teacher = Get-JsonData $teacherFile @{}
        foreach ($prop in $body.PSObject.Properties) {
            $teacher | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value -Force
        }
        Save-JsonData $teacherFile $teacher
        Send-Json 200 @{ success = $true; message = "อัปเดตข้อมูลสำเร็จ"; data = $teacher }
        continue
    }

    # Route: /api/appointments
    if ($rawUrl -eq "/api/appointments" -and $method -eq "GET") {
        $appointments = Get-JsonData $appointmentsFile @()
        $studentId = $request.QueryString["studentId"]
        $status = $request.QueryString["status"]

        $resultList = @()
        foreach ($item in $appointments) {
            $match = $true
            if ($studentId -and $item.studentId -notlike "*$studentId*" -and $item.id -notlike "*$studentId*") {
                $match = $false
            }
            if ($status -and $status -ne "ALL" -and $item.status -ne $status) {
                $match = $false
            }
            if ($match) { $resultList += $item }
        }
        Send-Json 200 @{ success = $true; count = $resultList.Count; data = $resultList }
        continue
    }

    if ($rawUrl -eq "/api/appointments" -and $method -eq "POST") {
        $body = Get-Body
        $appointments = Get-JsonData $appointmentsFile @()
        $dateCode = (Get-Date).ToString("yyyyMMdd")
        $randomSeq = (Get-Random -Minimum 100 -Maximum 999)
        $newId = "APT-$dateCode-$randomSeq"

        $newObj = [PSCustomObject]@{
            id = $newId
            studentName = "$($body.studentName)".Trim()
            studentId = "$($body.studentId)".Trim()
            contact = "$($body.contact)".Trim()
            date = "$($body.date)"
            time = "$($body.time)"
            topic = "$($body.topic)".Trim()
            teacherId = "T001"
            teacherName = "MR.Panukorn"
            status = "PENDING"
            teacherNote = ""
            createdAt = (Get-Date).ToString("o")
        }

        $appointments = @($newObj) + @($appointments)
        Save-JsonData $appointmentsFile $appointments
        Send-Json 201 @{ success = $true; message = "ส่งคำขอสำเร็จ"; data = $newObj }
        continue
    }

    # Route: /api/appointments/:id (PATCH / PUT)
    if ($rawUrl -match "^/api/appointments/(.+)$" -and ($method -eq "PATCH" -or $method -eq "PUT")) {
        $targetId = $Matches[1]
        $body = Get-Body
        $appointments = Get-JsonData $appointmentsFile @()
        $found = $null

        foreach ($item in $appointments) {
            if ($item.id -eq $targetId) {
                if ($body.status) { $item.status = "$($body.status)" }
                if ($body.teacherNote -ne $null) { $item.teacherNote = "$($body.teacherNote)" }
                $item | Add-Member -MemberType NoteProperty -Name "updatedAt" -Value (Get-Date).ToString("o") -Force
                $found = $item
                break
            }
        }

        if ($found) {
            Save-JsonData $appointmentsFile $appointments
            Send-Json 200 @{ success = $true; message = "อัปเดตสถานะสำเร็จ"; data = $found }
        } else {
            Send-Json 404 @{ success = $false; error = "ไม่พบคำขอนัดหมาย" }
        }
        continue
    }

    # Static file serving
    $relPath = $rawUrl.TrimStart('/')
    if ([string]::IsNullOrEmpty($relPath) -or $relPath -eq "/") {
        $relPath = "index.html"
    }

    $filePath = Join-Path $publicDir $relPath
    if (!(Test-Path $filePath) -and (Test-Path "$filePath.html")) {
        $filePath = "$filePath.html"
    }

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
        
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.StatusCode = 200
        $response.ContentType = $contentType
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.Close()
    } else {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
    }
}
