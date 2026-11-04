#!/usr/bin/env bash
# Запуск віртуального працівника без людини за клавіатурою (cron, CI): claude -p («print», headless).
# Вхід — ваша підписка Claude (claude /login один раз) або CLAUDE_CODE_OAUTH_TOKEN з `claude setup-token`.
# Лише для ОСОБИСТОГО використання: продукт для інших людей — лише з API-ключем (див. README, «Політика»).
#
#   ./run.sh                 # період за замовчуванням data/2026-10
#   ./run.sh 2026-11         # інший період
#
# Чому без --bare (хоча документація радить його для скриптів): --bare пропускає CLAUDE.md, скіли,
# .claude/agents і хуки та НЕ читає вхід підпискою чи CLAUDE_CODE_OAUTH_TOKEN — працівник без них не існує.
set -euo pipefail
cd "$(dirname "$0")"
# Git Bash на Windows перетворює аргументи, що починаються з «/», на шляхи Windows
# («/reconciler» → «C:/Program Files/Git/reconciler»). Для Linux і macOS змінна нічого не робить.
export MSYS_NO_PATHCONV=1

PERIOD="${1:-2026-10}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
STAMP="$(date +%Y-%m-%dT%H-%M-%S)"
mkdir -p out/runs

# --permission-mode dontAsk: усе, що не дозволено явно, — відмова (без людини нема кому натиснути «так»).
# --allowedTools: що дозволено без питань (те саме, що в .claude/settings.json, — на випадок, якщо його змінять).
# --max-turns: стеля кроків агента; --output-format json: результат, кількість кроків і total_cost_usd у файл.
set +e
"$CLAUDE_BIN" -p "/reconciler data/${PERIOD}" \
  --permission-mode dontAsk \
  --allowedTools "Skill(reconciler),Agent(reconciler-verifier),Bash(node scripts/reconcile.mjs *),PowerShell(node scripts/reconcile.mjs *),Read,Grep,Glob,Edit(/out/**)" \
  --max-turns 30 \
  --output-format json \
  > "out/runs/${STAMP}.json"
code=$?
set -e

echo "Результат запуску: out/runs/${STAMP}.json (код виходу ${code}); звіт — новий файл у out/"
exit "$code"
