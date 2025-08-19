# PowerShell script to verify database tables

Write-Host "🔍 Checking database tables..."

# Run the query to list all tables
$query = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"@

try {
    $result = psql -U postgres -d debt_manager -c $query -t
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database tables:"
        $result | Where-Object { $_ -match '\S' } | ForEach-Object { 
            $table = $_.Trim()
            Write-Host " - $table"
            
            # Show table structure
            $columns = psql -U postgres -d debt_manager -c "\d $table" -t
            Write-Host "   Columns:"
            $columns | Where-Object { $_ -match '\|' -and $_ -notmatch 'Column' } | ForEach-Object {
                $col = ($_ -split '\|').Trim()
                Write-Host "     - $($col[0]) : $($col[1])$($col[2])"
            }
        }
    } else {
        Write-Host "❌ Failed to query database tables"
    }
} catch {
    Write-Host "❌ Error: $_"
}
