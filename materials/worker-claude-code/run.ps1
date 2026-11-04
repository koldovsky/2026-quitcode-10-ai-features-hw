# Запуск віртуального працівника без людини за клавіатурою (Планувальник завдань Windows): claude -p (headless).
# Вхід — ваша підписка Claude (claude /login один раз) або CLAUDE_CODE_OAUTH_TOKEN з `claude setup-token`.
# Лише для ОСОБИСТОГО використання: продукт для інших людей — лише з API-ключем (див. README, «Політика»).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\run.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\run.ps1 -Period 2026-11
#
# Чому без --bare (хоча документація радить його для скриптів): --bare пропускає CLAUDE.md, скіли,
# .claude/agents і хуки та НЕ читає вхід підпискою чи CLAUDE_CODE_OAUTH_TOKEN — працівник без них не існує.
param(
  [string]$Period = "2026-10",
  [string]$ClaudeBin = "claude"
)
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

$stamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
New-Item -ItemType Directory -Force -Path "out\runs" | Out-Null
$outFile = "out\runs\$stamp.json"

# --permission-mode dontAsk: усе, що не дозволено явно, — відмова (без людини нема кому натиснути «так»).
# --allowedTools: що дозволено без питань (те саме, що в .claude/settings.json, — на випадок, якщо його змінять).
# --max-turns: стеля кроків агента; --output-format json: результат, кількість кроків і total_cost_usd у файл.
$allowed = "Skill(reconciler),Agent(reconciler-verifier),Bash(node scripts/reconcile.mjs *),PowerShell(node scripts/reconcile.mjs *),Read,Grep,Glob,Edit(/out/**)"
$ErrorActionPreference = "Continue"
& $ClaudeBin -p "/reconciler data/$Period" `
  --permission-mode dontAsk `
  --allowedTools $allowed `
  --max-turns 30 `
  --output-format json | Out-File -FilePath $outFile -Encoding utf8
$code = $LASTEXITCODE

Write-Output "Результат запуску: $outFile (код виходу $code); звіт — новий файл у out\"
exit $code
