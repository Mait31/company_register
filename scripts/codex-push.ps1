param(
    [Parameter(Mandatory = $true)]
    [string]$Message,

    [string[]]$Paths = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

$branch = (git branch --show-current).Trim()
if (-not $branch) {
    throw "Could not determine current git branch."
}

Write-Host "Branch: $branch"
Write-Host "Status before staging:"
git status --short

if ($Paths.Count -eq 0) {
    throw "No paths were provided. Pass -Paths to avoid staging unrelated files."
}

Write-Host "Staging selected paths:"
foreach ($path in $Paths) {
    Write-Host "  $path"
}
git add -- $Paths

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No staged changes. Nothing to commit."
    exit 0
}

git commit -m $Message
$commit = (git rev-parse --short HEAD).Trim()
Write-Host "Committed: $commit"

git push origin $branch
Write-Host "Pushed: origin/$branch"

Write-Host "Status after push:"
git status --short
