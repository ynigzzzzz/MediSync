# ============================================================
# MEDISYNC SOURCE CODE COMPILER
# Compatible with Windows PowerShell 5.1
# ============================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path ".").Path.TrimEnd('\')
$ParentFolder = Split-Path $ProjectRoot -Parent
$OutputFile = Join-Path $ParentFolder "Medisync-source-bundle.txt"

if (!(Test-Path ".\artisan") -or !(Test-Path ".\composer.json")) {
    throw "Run this script from the Medisync project root."
}

$ExcludedDirectories = @(
    ".git",
    "vendor",
    "node_modules",
    "storage",
    "coverage",
    "dist",
    ".idea",
    ".vscode",
    "tmp",
    "temp",
    "cache",
    ".phpunit.cache",
    ".next",
    ".nuxt",
    ".turbo"
)

$AllowedExtensions = @(
    ".php", ".js", ".jsx", ".ts", ".tsx",
    ".vue", ".css", ".scss", ".sass", ".less",
    ".html", ".md", ".json", ".xml",
    ".yml", ".yaml", ".toml", ".ini",
    ".sh", ".ps1", ".sql", ".graphql", ".gql"
)

$AllowedNames = @(
    "artisan",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
    ".env.example",
    "Dockerfile",
    "Makefile"
)

$ExcludedNames = @(
    "composer.lock",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lockb",
    "auth.json",
    ".npmrc",
    ".pypirc",
    ".netrc"
)

$MaxFileSize = 2MB

function Get-RelativePath {
    param([string]$FullPath)

    return $FullPath.Substring(
        $ProjectRoot.Length
    ).TrimStart([char[]]@('\', '/')).Replace('\', '/')
}

function Get-SourceFiles {
    param([string]$Directory)

    foreach ($Item in Get-ChildItem -LiteralPath $Directory -Force) {

        if (
            ($Item.Attributes -band
            [System.IO.FileAttributes]::ReparsePoint) -ne 0
        ) {
            continue
        }

        $RelativePath = Get-RelativePath $Item.FullName

        if ($Item.PSIsContainer) {

            if ($ExcludedDirectories -contains $Item.Name) {
                continue
            }

            if (
                $RelativePath -eq "public/build" -or
                $RelativePath.StartsWith("public/build/")
            ) {
                continue
            }

            Get-SourceFiles -Directory $Item.FullName
            continue
        }

        $Name = $Item.Name
        $Extension = $Item.Extension.ToLowerInvariant()

        # Exclude environment files except the safe example
        if (
            $Name -match '(?i)^\.env' -and
            $Name -ne ".env.example"
        ) {
            continue
        }

        # Exclude credentials and private keys
        if (
            $Name -match '(?i)secret|credential|id_rsa|id_ed25519|service[-_]?account|firebase-adminsdk'
        ) {
            continue
        }

        # Exclude lockfiles, databases and generated files
        if (
            $ExcludedNames -contains $Name -or
            $Extension -match '^\.(pem|key|p12|pfx|crt|cer|log|lock|sqlite|db|dump|bak|zip|map)$' -or
            $Name -match '(?i)\.min\.(js|css)$' -or
            $RelativePath -eq "public/hot"
        ) {
            continue
        }

        if ($Item.Length -gt $MaxFileSize) {
            continue
        }

        if (
            ($AllowedExtensions -contains $Extension) -or
            ($AllowedNames -contains $Name)
        ) {
            Write-Output $Item
        }
    }
}

$Writer = $null

try {

    Write-Host "`nScanning Medisync..." -ForegroundColor Cyan

    $Files = @(
        Get-SourceFiles -Directory $ProjectRoot |
        Sort-Object FullName
    )

    if ($Files.Count -eq 0) {
        throw "No source files found."
    }

    $Encoding = New-Object System.Text.UTF8Encoding($false)

    $Writer = [System.IO.StreamWriter]::new(
        $OutputFile,
        $false,
        $Encoding
    )

    $Writer.WriteLine("================================================")
    $Writer.WriteLine("MEDISYNC SOURCE CODE BUNDLE")
    $Writer.WriteLine("Generated: $(Get-Date)")
    $Writer.WriteLine("Project: $ProjectRoot")
    $Writer.WriteLine("Total files found: $($Files.Count)")
    $Writer.WriteLine("================================================")

    $SuccessfulFiles = 0
    $SkippedFiles = 0

    foreach ($File in $Files) {

        $RelativePath = Get-RelativePath $File.FullName

        try {

            $Content = [System.IO.File]::ReadAllText(
                $File.FullName
            )

            $Writer.WriteLine("")
            $Writer.WriteLine("================================================")
            $Writer.WriteLine("FILE: $RelativePath")
            $Writer.WriteLine("================================================")
            $Writer.WriteLine($Content)

            $SuccessfulFiles++

            Write-Host "[OK] $RelativePath" -ForegroundColor Gray
        }
        catch {

            $SkippedFiles++

            Write-Warning "Could not read: $RelativePath"
        }
    }

    $Writer.Flush()
    $Writer.Dispose()
    $Writer = $null

    if (!(Test-Path $OutputFile)) {
        throw "Output file was not created."
    }

    $OutputSize = (Get-Item $OutputFile).Length

    if ($OutputSize -eq 0) {
        throw "Output file is empty."
    }

    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "MEDISYNC COMPILATION SUCCESSFUL" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Files found: $($Files.Count)"
    Write-Host "Files compiled: $SuccessfulFiles"
    Write-Host "Files skipped: $SkippedFiles"
    Write-Host "Output size: $([math]::Round($OutputSize / 1KB, 2)) KB"
    Write-Host "Output file: $OutputFile"
    Write-Host "============================================" -ForegroundColor Green

}
catch {

    if ($Writer) {
        $Writer.Dispose()
    }

    Write-Host "`nCOMPILATION FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    throw
}
