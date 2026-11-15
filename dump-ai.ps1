# dump-ai.ps1
$out = "..\"

# Helper function to write files
function Write-Chunk {
    param($FileName, $Targets)
    $fullPath = Join-Path $out $FileName
    Remove-Item $fullPath -ErrorAction SilentlyContinue
    
    foreach ($target in $Targets) {
        if (Test-Path $target) {
            # Get files, exclude binary/lock files
            $files = Get-ChildItem -Path $target -Recurse -File | Where-Object { 
                $_.Name -notmatch '\.(png|jpg|jpeg|ico|lock|svg)$' -and 
                $_.FullName -notmatch '\\(node_modules|vendor|build|storage)\\' 
            }
            
            foreach ($f in $files) {
                $rel = $f.FullName.Replace($PWD.Path, '.').Replace('\','/')
                Add-Content -Path $fullPath -Value "`n`n===== FILE: $rel =====`n`n" -Encoding UTF8
                Add-Content -Path $fullPath -Value (Get-Content $f.FullName -Raw) -Encoding UTF8
            }
        }
    }
    $size = [math]::Round((Get-Item $fullPath).Length / 1KB, 1)
    Write-Host "Created: $FileName ($size KB)" -ForegroundColor Green
}

Write-Host "`nGenerating code dumps for AI review..." -ForegroundColor Cyan

# 1. Backend Controllers & Requests (For checking Slim Controllers)
Write-Chunk "ai-1-backend-controllers.txt" @(
    "app\Http\Controllers",
    "app\Http\Requests",
    "app\Http\Middleware"
)

# 2. Backend Models & Services (For checking Fat Models)
Write-Chunk "ai-2-backend-models.txt" @(
    "app\Models",
    "app\Services"
)

# 3. Frontend Pages (Main Index files)
Write-Chunk "ai-3-frontend-pages.txt" @(
    "resources\js\Pages\Dashboard",
    "resources\js\Pages\MedicineCatalog",
    "resources\js\Pages\StockReceiving",
    "resources\js\Pages\StockDispensing",
    "resources\js\Pages\Reports"
)

# 4. Frontend Partials & Components (For checking React structure)
Write-Chunk "ai-4-frontend-partials.txt" @(
    "resources\js\Pages\MedicineCatalog\Partials",
    "resources\js\Pages\StockReceiving\Partials",
    "resources\js\Pages\StockDispensing\Partials",
    "resources\js\Pages\Suppliers\Partials",
    "resources\js\Pages\UserManagement\Partials",
    "resources\js\Pages\Reports\Partials",
    "resources\js\Components",
    "resources\js\Layouts"
)

# 5. Routing & Config (Just in case they need it)
Write-Chunk "ai-5-config.txt" @(
    "routes",
    "bootstrap\app.php",
    "composer.json"
)

Write-Host "`nDone! The text files are in C:\Users\user\Herd\`n" -ForegroundColor Cyan