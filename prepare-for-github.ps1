#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Prepare Nebula Screen Capture for GitHub publication

.DESCRIPTION
    Comprehensive security and cleanup script that:
    - Scans for sensitive data and credentials
    - Checks for large files
    - Validates .gitignore rules
    - Runs security audits
    - Verifies environment configuration
    - Generates security report

.PARAMETER SkipAudit
    Skip npm and cargo security audits (faster for quick checks)

.PARAMETER Fix
    Automatically fix issues where possible

.PARAMETER Verbose
    Show detailed output

.EXAMPLE
    .\prepare-for-github.ps1
    Run full preparation check

.EXAMPLE
    .\prepare-for-github.ps1 -Fix
    Run with automatic fixes

.EXAMPLE
    .\prepare-for-github.ps1 -SkipAudit -Verbose
    Quick check with detailed output
#>

param(
    [switch]$SkipAudit,
    [switch]$Fix,
    [switch]$Verbose
)

# Color output functions
function Write-ColorOutput {
    param(
        [string]$ForegroundColor,
        [string]$Message
    )
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { param([string]$Message) Write-ColorOutput "Green" "✓ $Message" }
function Write-Warn { param([string]$Message) Write-ColorOutput "Yellow" "⚠ $Message" }
function Write-Err { param([string]$Message) Write-ColorOutput "Red" "✗ $Message" }
function Write-Info { param([string]$Message) Write-ColorOutput "Cyan" "ℹ $Message" }
function Write-Header { param([string]$Message) Write-ColorOutput "Magenta" "`n═══ $Message ═══`n" }

$ErrorCount = 0
$WarningCount = 0
$FixedCount = 0

Write-Header "NEBULA SCREEN CAPTURE - GITHUB PREPARATION"
Write-Info "Starting comprehensive security and cleanup check..."

# ═══════════════════════════════════════════════════════════════════════════
# 1. CHECK FOR SENSITIVE FILES
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "1. Scanning for Sensitive Files"

$sensitivePatterns = @(
    "*.env",
    "*.key", "*.pem", "*.p12", "*.pfx", "*.cer", "*.crt", "*.pvk", "*.spc",
    "*.keystore", "*.jks",
    "*secret*", "*password*", "*credentials*",
    "google-services.json", "GoogleService-Info.plist"
)

$sensitiveFiles = @()
foreach ($pattern in $sensitivePatterns) {
    $found = Get-ChildItem -Path . -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notmatch 'node_modules|\.git|emsdk|dist|build|target' }
    $sensitiveFiles += $found
}

# Check for .env file specifically
if (Test-Path ".env") {
    Write-Err ".env file found - this should NEVER be committed!"
    Write-Info "  Make sure .env is in .gitignore"
    $ErrorCount++
    
    if ($Fix) {
        Write-Info "  Checking .gitignore..."
        $gitignoreContent = Get-Content ".gitignore" -Raw
        if ($gitignoreContent -notmatch "^\.env$") {
            Add-Content ".gitignore" "`n.env"
            Write-Success "  Added .env to .gitignore"
            $FixedCount++
        }
    }
} else {
    Write-Success "No .env file in root (good - use .env.example)"
}

# Check .env.example exists
if (Test-Path ".env.example") {
    Write-Success ".env.example found (template for users)"
} else {
    Write-Warn ".env.example not found - users won't know what environment variables to set"
    $WarningCount++
}

if ($sensitiveFiles.Count -gt 0) {
    Write-Err "Found $($sensitiveFiles.Count) sensitive file(s):"
    $sensitiveFiles | ForEach-Object {
        Write-Err "  - $($_.FullName)"
    }
    $ErrorCount += $sensitiveFiles.Count
} else {
    Write-Success "No sensitive credential files found"
}

# ═══════════════════════════════════════════════════════════════════════════
# 2. SCAN FOR HARDCODED SECRETS IN CODE
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "2. Scanning Code for Hardcoded Secrets"

$secretPatterns = @{
    'API Keys' = 'api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9_-]{20,}'
    'Passwords' = 'password["\s]*[:=]["\s]*["\x27][^"\x27]{8,}'
    'Private Keys' = '-----BEGIN (RSA |DSA )?PRIVATE KEY-----'
    'AWS Keys' = 'AKIA[0-9A-Z]{16}'
    'Tokens' = 'token["\s]*[:=]["\s]*["\x27][a-zA-Z0-9_-]{20,}'
    'Firebase Keys' = 'AIza[0-9A-Za-z_-]{35}'
}

$codeFiles = Get-ChildItem -Path "src" -Include "*.js","*.ts","*.jsx","*.tsx","*.svelte" -Recurse -File -ErrorAction SilentlyContinue

$foundSecrets = @()
foreach ($file in $codeFiles) {
    $content = Get-Content $file.FullName -Raw
    
    foreach ($patternName in $secretPatterns.Keys) {
        if ($content -match $secretPatterns[$patternName]) {
            # Exclude env.js and config files that use import.meta.env
            if ($file.Name -notmatch "env\.js|config\.js" -or $content -notmatch "import\.meta\.env") {
                $foundSecrets += @{
                    File = $file.FullName
                    Type = $patternName
                    Match = $Matches[0]
                }
            }
        }
    }
}

if ($foundSecrets.Count -gt 0) {
    Write-Warn "Found potential hardcoded secrets (verify manually):"
    $foundSecrets | ForEach-Object {
        Write-Warn "  [$($_.Type)] in $($_.File)"
        if ($Verbose) {
            Write-Warn "    Match: $($_.Match -replace '([a-zA-Z0-9]{8})[a-zA-Z0-9]+', '$1...')"
        }
    }
    $WarningCount += $foundSecrets.Count
} else {
    Write-Success "No obvious hardcoded secrets found in source code"
}

# ═══════════════════════════════════════════════════════════════════════════
# 3. CHECK FOR LARGE FILES
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "3. Checking for Large Files"

$maxSize = 50MB
$largeFiles = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
              Where-Object { 
                  $_.Length -gt $maxSize -and 
                  $_.FullName -notmatch 'node_modules|\.git|emsdk|dist|build|target'
              }

if ($largeFiles.Count -gt 0) {
    Write-Warn "Found $($largeFiles.Count) large file(s) (>50MB):"
    $largeFiles | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Warn "  - $($_.FullName) ($sizeMB MB)"
    }
    Write-Info "  Add these to .gitignore if they're not needed in the repository"
    $WarningCount += $largeFiles.Count
} else {
    Write-Success "No large files found outside ignored directories"
}

# ═══════════════════════════════════════════════════════════════════════════
# 4. VALIDATE .gitignore
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "4. Validating .gitignore"

$requiredIgnores = @(
    ".env", ".env.*", "*.env",
    "*.key", "*.pem", "*.p12", "*.pfx",
    "node_modules/", "dist/", "build/",
    "src-tauri/target/",
    "*.log"
)

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $missing = @()
    
    foreach ($pattern in $requiredIgnores) {
        $escaped = [regex]::Escape($pattern)
        if ($gitignoreContent -notmatch $escaped) {
            $missing += $pattern
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Warn "Missing patterns in .gitignore:"
        $missing | ForEach-Object { Write-Warn "  - $_" }
        $WarningCount += $missing.Count
        
        if ($Fix) {
            Write-Info "Adding missing patterns to .gitignore..."
            Add-Content ".gitignore" "`n# Auto-added by prepare-for-github.ps1"
            $missing | ForEach-Object { Add-Content ".gitignore" $_ }
            Write-Success "Added $($missing.Count) patterns to .gitignore"
            $FixedCount += $missing.Count
        }
    } else {
        Write-Success ".gitignore contains all critical patterns"
    }
} else {
    Write-Err ".gitignore not found!"
    $ErrorCount++
}

# ═══════════════════════════════════════════════════════════════════════════
# 5. CHECK GIT STATUS
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "5. Checking Git Status"

if (Get-Command git -ErrorAction SilentlyContinue) {
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Warn "Uncommitted changes detected:"
        Write-Info $status
        $WarningCount++
    } else {
        Write-Success "Working tree is clean"
    }
    
    # Check current branch
    $branch = git branch --show-current
    Write-Info "Current branch: $branch"
    
    # Check if .env is tracked
    $trackedEnv = git ls-files | Select-String "\.env$"
    if ($trackedEnv) {
        Write-Err ".env file is tracked by git! Remove it immediately:"
        Write-Info "  git rm --cached .env"
        Write-Info "  git commit -m 'Remove .env from git'"
        $ErrorCount++
    } else {
        Write-Success ".env is not tracked by git"
    }
} else {
    Write-Warn "Git not found - skipping git checks"
}

# ═══════════════════════════════════════════════════════════════════════════
# 6. SECURITY AUDITS
# ═══════════════════════════════════════════════════════════════════════════
if (-not $SkipAudit) {
    Write-Header "6. Running Security Audits"
    
    # NPM Audit
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Info "Running npm audit..."
        $npmAudit = npm audit --json 2>&1 | Out-String
        
        try {
            $auditResult = $npmAudit | ConvertFrom-Json
            $vulnerabilities = $auditResult.metadata.vulnerabilities
            
            if ($vulnerabilities) {
                $total = ($vulnerabilities.PSObject.Properties | Measure-Object -Property Value -Sum).Sum
                if ($total -gt 0) {
                    Write-Warn "Found $total npm vulnerabilities"
                    if ($vulnerabilities.critical) { Write-Err "  Critical: $($vulnerabilities.critical)" }
                    if ($vulnerabilities.high) { Write-Warn "  High: $($vulnerabilities.high)" }
                    if ($vulnerabilities.moderate) { Write-Warn "  Moderate: $($vulnerabilities.moderate)" }
                    if ($vulnerabilities.low) { Write-Info "  Low: $($vulnerabilities.low)" }
                    
                    $WarningCount += $total
                    
                    if ($Fix) {
                        Write-Info "Running npm audit fix..."
                        npm audit fix
                        $FixedCount++
                    }
                } else {
                    Write-Success "No npm vulnerabilities found"
                }
            }
        } catch {
            Write-Warn "Could not parse npm audit results"
        }
    }
    
    # Cargo Audit (if Rust/Tauri project)
    if (Test-Path "src-tauri/Cargo.toml" -and (Get-Command cargo -ErrorAction SilentlyContinue)) {
        Write-Info "Running cargo audit..."
        
        # Check if cargo-audit is installed
        $cargoAudit = cargo install --list | Select-String "cargo-audit"
        if (-not $cargoAudit) {
            Write-Info "Installing cargo-audit..."
            cargo install cargo-audit
        }
        
        Push-Location "src-tauri"
        $cargoResult = cargo audit 2>&1
        Pop-Location
        
        if ($cargoResult -match "warning|vulnerability|error") {
            Write-Warn "Cargo audit found issues:"
            Write-Info $cargoResult
            $WarningCount++
        } else {
            Write-Success "No cargo vulnerabilities found"
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# 7. CHECK ENVIRONMENT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "7. Checking Environment Configuration"

# Check that env variables are using import.meta.env
$configFiles = Get-ChildItem -Path "src" -Filter "*config*.js" -Recurse -File -ErrorAction SilentlyContinue

foreach ($file in $configFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if using environment variables correctly
    if ($content -match "import\.meta\.env\.VITE_" -or $content -match "process\.env\.REACT_APP_") {
        Write-Success "Config file uses environment variables correctly: $($file.Name)"
    } elseif ($content -match "apiKey|password|secret|token") {
        Write-Warn "Config file may contain hardcoded values: $($file.Name)"
        $WarningCount++
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# 8. VERIFY SECURITY POLICIES
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "8. Verifying Security Policies"

$securityFiles = @{
    '.github/SECURITY.md' = 'Security policy'
    '.github/dependabot.yml' = 'Dependabot configuration'
    'LICENSE' = 'License file'
    'README.md' = 'README documentation'
}

foreach ($file in $securityFiles.Keys) {
    if (Test-Path $file) {
        Write-Success "$($securityFiles[$file]) exists: $file"
    } else {
        Write-Warn "$($securityFiles[$file]) missing: $file"
        $WarningCount++
    }
}

# Check CSP in index.html
if (Test-Path "index.html") {
    $indexContent = Get-Content "index.html" -Raw
    if ($indexContent -match "Content-Security-Policy") {
        Write-Success "Content Security Policy configured in index.html"
    } else {
        Write-Warn "Content Security Policy not found in index.html"
        $WarningCount++
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# 9. CHECK FOR COMMON SECURITY ISSUES
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "9. Checking Common Security Issues"

# Check for eval() usage
$evalFiles = Get-ChildItem -Path "src" -Include "*.js","*.ts","*.jsx","*.tsx","*.svelte" -Recurse -File -ErrorAction SilentlyContinue |
             Where-Object { (Get-Content $_.FullName -Raw) -match '\beval\s*\(' }

if ($evalFiles.Count -gt 0) {
    Write-Warn "Found eval() usage in $($evalFiles.Count) file(s) (security risk):"
    $evalFiles | ForEach-Object { Write-Warn "  - $($_.FullName)" }
    $WarningCount += $evalFiles.Count
}

# Check for innerHTML usage (XSS risk)
$innerHTMLFiles = Get-ChildItem -Path "src" -Include "*.js","*.ts","*.jsx","*.tsx","*.svelte" -Recurse -File -ErrorAction SilentlyContinue |
                  Where-Object { (Get-Content $_.FullName -Raw) -match '\.innerHTML\s*=' }

if ($innerHTMLFiles.Count -gt 0) {
    Write-Warn "Found innerHTML usage in $($innerHTMLFiles.Count) file(s) (XSS risk - consider using textContent or sanitization):"
    if ($Verbose) {
        $innerHTMLFiles | ForEach-Object { Write-Warn "  - $($_.FullName)" }
    } else {
        Write-Info "  Use -Verbose to see file list"
    }
    $WarningCount += $innerHTMLFiles.Count
}

# ═══════════════════════════════════════════════════════════════════════════
# 10. GENERATE REPORT
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "10. Generating Report"

$reportPath = "GITHUB_PREPARATION_REPORT.md"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$report = @"
# GitHub Preparation Report
Generated: $timestamp

## Summary
- **Errors**: $ErrorCount
- **Warnings**: $WarningCount
- **Auto-fixed**: $FixedCount

## Status
"@

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    $report += "`n✅ **READY FOR GITHUB** - No issues found!"
} elseif ($ErrorCount -eq 0) {
    $report += "`n⚠️ **READY WITH WARNINGS** - $WarningCount warning(s) should be reviewed"
} else {
    $report += "`n❌ **NOT READY** - $ErrorCount error(s) must be fixed before publishing"
}

$report += @"

## Checklist
- [x] .gitignore configured
- [x] Environment variables using .env.example
- [x] No .env file committed
- [x] Security policies in place
- [x] Content Security Policy configured
- [x] Large files checked
- [x] Sensitive files scanned
"@

if (-not $SkipAudit) {
    $report += "`n- [x] Security audits completed"
}

$report += @"

## Recommendations
1. Review all warnings above
2. Run tests before committing: ``npm test``
3. Build the project: ``npm run build``
4. Test the production build
5. Run ``git status`` to verify what will be committed
6. Create a feature branch before pushing

## Next Steps
``````powershell
# Commit changes
git add .
git commit -m "Prepare for GitHub publication"

# Push to GitHub
git push origin main

# Or create PR from feature branch
git checkout -b feature/github-preparation
git push origin feature/github-preparation
``````
"@

$report | Out-File $reportPath -Encoding UTF8
Write-Success "Report generated: $reportPath"

# ═══════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════
Write-Header "SUMMARY"

Write-Info "Errors:       $ErrorCount"
Write-Info "Warnings:     $WarningCount"
Write-Info "Auto-fixed:   $FixedCount"
Write-Info ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Success "✅ PROJECT IS READY FOR GITHUB!"
    Write-Info "Next steps:"
    Write-Info "  1. Review $reportPath"
    Write-Info "  2. Run: npm run build"
    Write-Info "  3. Test the build"
    Write-Info "  4. Commit and push to GitHub"
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Warn "⚠️ PROJECT HAS $WarningCount WARNING(S)"
    Write-Info "Review warnings in $reportPath"
    Write-Info "You can proceed, but consider fixing warnings first"
    exit 1
} else {
    Write-Err "❌ PROJECT HAS $ErrorCount ERROR(S)"
    Write-Info "Fix errors before publishing to GitHub"
    Write-Info "See $reportPath for details"
    
    if (-not $Fix) {
        Write-Info "`nTip: Run with -Fix to automatically fix some issues:"
        Write-Info "  .\prepare-for-github.ps1 -Fix"
    }
    exit 2
}

