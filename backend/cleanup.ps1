# Remove test and temporary files
$filesToRemove = @(
    "check-pg.ps1",
    "check-pg-service.bat",
    "init-db.js",
    "init-meta.js",
    "migrate.js",
    "setup-database.sql",
    "test-connection.js",
    "test-db-connection.js",
    "test-pg-connection.js",
    "test-pg-simple.js",
    "verify-schema.js",
    "verify-tables.ps1"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed: $file"
    }
}

Write-Host "Cleanup completed!"
