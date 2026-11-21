[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$servers = @("(localdb)\mssqllocaldb", "(localdb)\mssqllocaldb", "(localdb)\mssqllocaldb")

function Connect-Db {
    $lastEx = $null
    for ($idx = 0; $idx -lt $servers.Count; $idx++) {
        $s = $servers[$idx]
        try {
            $c = New-Object System.Data.SqlClient.SqlConnection("Server=$s;Database=retail_spoilage_db;Integrated Security=True;Connection Timeout=5")
            $c.Open()
            return $c
        } catch {
            $lastEx = $_.Exception
            if ($idx -lt ($servers.Count - 1)) { Start-Sleep -Milliseconds 150 }
        }
    }
    try {
        $c = New-Object System.Data.SqlClient.SqlConnection("Server=.;Database=retail_spoilage_db;Integrated Security=True;Connection Timeout=1")
        $c.Open()
        return $c
    } catch {
        $lastEx = $_.Exception
    }
    throw $lastEx
}

function Close-Db($c) {
    if ($null -ne $c) {
        try {
            if ($c.State -ne [System.Data.ConnectionState]::Closed) { $c.Close() }
            $c.Dispose()
        } catch {}
    }
}

$conn = $null
try {
    $conn = Connect-Db
} catch {
    $errMsg = if ($_.Exception) { $_.Exception.Message } else { "Failed to connect to SQL Server" }
    $errB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($errMsg))
    [Console]::Out.WriteLine("{""id"":0,""ok"":false,""errB64"":""$errB64""}")
    [Console]::Out.Flush()
    exit 1
}

[Console]::Out.WriteLine("{""ready"":true}")
[Console]::Out.Flush()

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    $reqId = 0
    try {
        $req = $line | ConvertFrom-Json
        $reqId = [int64]$req.id
        $sqlBytes = [Convert]::FromBase64String([string]$req.sqlB64)
        $sqlText = [System.Text.Encoding]::UTF8.GetString($sqlBytes)

        if ($null -eq $conn -or $conn.State -ne [System.Data.ConnectionState]::Open) {
            Close-Db $conn
            $conn = Connect-Db
        }

        $batches = [System.Text.RegularExpressions.Regex]::Split($sqlText, "(?mi)^\s*GO\s*$")
        $outSb = New-Object System.Text.StringBuilder

        foreach ($batch in $batches) {
            $trimmed = $batch.Trim()
            if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }

            $cmd = $conn.CreateCommand()
            $cmd.CommandText = $trimmed
            $cmd.CommandTimeout = 90
            $reader = $null
            try {
                $reader = $cmd.ExecuteReader()
                do {
                    while ($reader.Read()) {
                        $rowSb = New-Object System.Text.StringBuilder
                        for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                            if (-not $reader.IsDBNull($i)) {
                                [void]$rowSb.Append($reader.GetValue($i).ToString())
                            }
                        }
                        [void]$outSb.AppendLine($rowSb.ToString())
                    }
                } while ($reader.NextResult())
            } finally {
                if ($null -ne $reader) { try { $reader.Close() } catch {} }
                if ($null -ne $cmd) { try { $cmd.Dispose() } catch {} }
            }
        }

        $outB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($outSb.ToString()))
        [Console]::Out.WriteLine("{""id"":$reqId,""ok"":true,""outB64"":""$outB64""}")
        [Console]::Out.Flush()
    } catch {
        $errMsg = if ($_.Exception) { $_.Exception.Message } else { [string]$_ }
        Close-Db $conn
        $conn = $null
        try { $conn = Connect-Db } catch {}
        $errB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($errMsg))
        [Console]::Out.WriteLine("{""id"":$reqId,""ok"":false,""errB64"":""$errB64""}")
        [Console]::Out.Flush()
    }
}

Close-Db $conn
