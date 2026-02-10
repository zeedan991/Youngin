# PowerShell Script to Safely Reset Git History
# Usage: .\RESET_HISTORY.ps1

Write-Host "🚧 STARTING GIT HISTORY RESET..." -ForegroundColor Yellow

# 1. Check if git is clean
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes. Stashing them..." -ForegroundColor Red
    git stash
}

# 2. Create orphaned branch (no history)
Write-Host "🌿 Creating new fresh branch..." -ForegroundColor Green
git checkout --orphan hackathon_fresh_start
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to checkout orphan branch"; exit }

# 3. Add all files
Write-Host "📦 Adding files..." -ForegroundColor Green
git add -A

# 4. Commit
Write-Host "💾 Committing as 'Initial Commit'..." -ForegroundColor Green
git commit -m "Initial commit: AI Fashion Platform V2"

# 5. Delete old main branch
Write-Host "🗑️  Deleting old history..." -ForegroundColor Green
git branch -D main

# 6. Rename current branch to main
Write-Host "🏷️  Renaming to main..." -ForegroundColor Green
git branch -m main

# 7. Force Push
Write-Host "🚀 Force Pushing to GitHub (This triggers Vercel)..." -ForegroundColor Magenta
git push -f origin main

Write-Host "✅ DONE! History is wiped. Vercel is deploying the new 'Initial Commit'." -ForegroundColor Cyan
Write-Host "NOTE: Vercel will NOT crash. The old site stays live until the new build finishes." -ForegroundColor Gray
