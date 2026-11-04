// Запуск працівника: node src/worker.ts [--dry-run] [--inbox data/inbox.csv]
//   --dry-run  показує конфігурацію, заявки й перевірку меж БЕЗ виклику моделі (ключ не потрібен).
// Коди виходу: 0 — розбір пройшов перевірку; 1 — перевіряльник знайшов проблеми; 2 — помилка запуску.
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { describeConfig, resolveConfig } from "./config.ts";
import { checkWritePath } from "./guard.ts";
import { readInbox } from "./inbox.ts";
import { INBOX_TOOL, OUT_DIR, buildOptions, buildPrompt } from "./options.ts";
import { triageJsonSchema, verifyTriage } from "./report.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inboxArg = args.indexOf("--inbox");
const cwd = process.cwd();
const inboxPath = path.resolve(cwd, inboxArg >= 0 ? args[inboxArg + 1] ?? "" : "data/inbox.csv");
// Локальна дата у форматі РРРР-ММ-ДД (шведська локаль якраз так її пише).
const today = new Date().toLocaleDateString("sv-SE");
const log = (line: string) => console.error(line);

async function dry(): Promise<number> {
  console.log("=== DRY RUN: модель не викликається ===");
  const resolved = resolveConfig(process.env);
  if (resolved.ok) {
    const { warnings, ...shown } = describeConfig(resolved.config);
    console.log("Конфігурація:", JSON.stringify(shown, null, 2));
    for (const w of warnings as string[]) console.log("УВАГА:", w);
  } else {
    console.log("Конфігурація: не готова —", resolved.error, "(для --dry-run це нормально)");
  }
  const inbox = await readInbox(inboxPath);
  console.log(`Заявки (${inbox.length}):`, inbox.map((r) => r.id).join(", "));
  console.log("Інструменти: існують [Write] + MCP", INBOX_TOOL, "; без питань:", [INBOX_TOOL, "Write"].join(", "));
  console.log("Межа запису (хук PreToolUse):");
  for (const p of [`${OUT_DIR}/${today}-triage.md`, "../secrets.txt", "src/worker.ts", "C:/Windows/x.txt", "/etc/passwd"]) {
    const c = checkWritePath(p, cwd, OUT_DIR);
    console.log(`  ${c.ok ? "дозволено" : "ВІДМОВА  "}  ${p}`);
  }
  const schema = triageJsonSchema() as { properties?: Record<string, unknown> };
  console.log("Схема результату, поля:", Object.keys(schema.properties ?? {}).join(", "));
  console.log("Промпт:", buildPrompt(today));
  return 0;
}

async function run(): Promise<number> {
  const resolved = resolveConfig(process.env);
  if (!resolved.ok) {
    console.error("Не можу запустити:", resolved.error);
    return 2;
  }
  const config = resolved.config;
  for (const w of config.warnings) console.error("УВАГА:", w);
  const inbox = await readInbox(inboxPath);
  const options = buildOptions(config, { cwd, inboxPath, log, baseEnv: process.env });

  let result: SDKResultMessage | undefined;
  try {
    for await (const msg of query({ prompt: buildPrompt(today), options })) {
      if (msg.type === "assistant") {
        for (const block of msg.message.content) {
          if (block.type === "tool_use") log(`→ ${block.name}`);
        }
      } else if (msg.type === "result") {
        result = msg;
      }
    }
  } catch (e) {
    // query() кидає помилку після результату-помилки (ліміт кроків, бюджет, недоступна модель…).
    console.error("Запуск перервано:", (e as Error).message);
  }

  await mkdir(path.join(cwd, OUT_DIR, "runs"), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runFile = path.join(OUT_DIR, "runs", `${stamp}.json`);

  if (!result) {
    console.error("Результату немає. Перевірте ключ, модель і ліміти.");
    return 2;
  }
  const base = {
    provider: config.provider,
    model: config.model,
    subtype: result.subtype,
    num_turns: result.num_turns,
    total_cost_usd_estimate: result.total_cost_usd,
  };
  if (result.subtype !== "success") {
    await writeFile(runFile, JSON.stringify({ ...base, errors: result.errors }, null, 2));
    console.error(`Зупинено: ${result.subtype}. Деталі: ${runFile}`);
    return 2;
  }
  let verdict = verifyTriage(result.structured_output, inbox, cwd, OUT_DIR);
  if (verdict.ok) {
    // Модель могла сказати «записав», а запису не було (пропустила Write або хук відмовив).
    const file = path.resolve(cwd, verdict.report.report_file);
    const exists = await stat(file).then((s) => s.isFile(), () => false);
    if (!exists) verdict = { ok: false, problems: [`файлу звіту ${verdict.report.report_file} немає на диску`] };
  }
  await writeFile(runFile, JSON.stringify({ ...base, verdict }, null, 2));
  if (verdict.ok) {
    console.log(`ПЕРЕВІРЕНО: ${verdict.report.items.length} заявок, статус ${verdict.report.status}.`);
    console.log(verdict.report.summary);
    console.log(`Звіт для людини: ${verdict.report.report_file}; запуск: ${runFile}`);
    return 0;
  }
  console.log("ПРОБЛЕМИ (перевіряльник у коді):");
  for (const p of verdict.problems) console.log(" -", p);
  console.log(`Запуск: ${runFile}`);
  return 1;
}

try {
  process.exitCode = dryRun ? await dry() : await run();
} catch (e) {
  console.error("Помилка:", (e as Error).message);
  process.exitCode = 2;
}
