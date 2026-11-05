param([string]$SqlFile)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText($SqlFile, [System.Text.Encoding]::UTF8)

$servers = @(".", "(localdb)\mssqllocaldb", "localhost", "127.0.0.1")
$conn = $null
$lastEx = $null

foreach ($s in $servers) {
    try {
        $c = New-Object System.Data.SqlClient.SqlConnection("Server=$s;Database=retail_spoilage_db;Integrated Security=True;Connection Timeout=2")
        $c.Open()
        $conn = $c
        break
    } catch {
        $lastEx = $_.Exception
    }
}

if (-not $conn) {
    [Console]::Error.WriteLine("Cannot connect to SQL Server database 'retail_spoilage_db' on any local instance: " + $lastEx.Message)
    exit 1
}

# Split by GO batch separator (case-insensitive, whole line)
$batches = [System.Text.RegularExpressions.Regex]::Split($content, "(?mi)^\s*GO\s*$")

try {
    foreach ($batch in $batches) {
        $trimmed = $batch.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $trimmed
        $cmd.CommandTimeout = 90
        
        $reader = $cmd.ExecuteReader()
        do {
            while ($reader.Read()) {
                $sb = New-Object System.Text.StringBuilder
                for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                    if (-not $reader.IsDBNull($i)) {
                        [void]$sb.Append($reader.GetValue($i).ToString())
                    }
                }
                [Console]::WriteLine($sb.ToString())
            }
        } while ($reader.NextResult())
        $reader.Close()
    }
    $conn.Close()
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    if ($conn.State -eq [System.Data.ConnectionState]::Open) {
        $conn.Close()
    }
    exit 1
}
