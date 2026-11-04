import { test } from "node:test";
import assert from "node:assert/strict";
import { describeConfig, resolveConfig } from "../src/config.ts";
import { INBOX_TOOL, buildOptions } from "../src/options.ts";

test("без ключів — зрозуміла помилка, а не виклик", () => {
  const r = resolveConfig({});
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /ANTHROPIC_API_KEY/);
});

test("варіант A: ключ Anthropic, alias haiku, підтримується, без змін середовища", () => {
  const r = resolveConfig({ ANTHROPIC_API_KEY: "test-not-a-key" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.config.model, "haiku");
    assert.equal(r.config.supported, true);
    assert.deepEqual(r.config.extraEnv, {});
  }
});

test("варіант B: OpenRouter — :free моделі, порожній ANTHROPIC_API_KEY, позначка «не підтримується»", () => {
  const r = resolveConfig({ WORKER_PROVIDER: "openrouter", OPENROUTER_API_KEY: "test-not-a-key" });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const c = r.config;
  assert.equal(c.supported, false);
  assert.equal(c.extraEnv.ANTHROPIC_BASE_URL, "https://openrouter.ai/api");
  assert.equal(c.extraEnv.ANTHROPIC_API_KEY, "");
  assert.equal(c.extraEnv.ANTHROPIC_AUTH_TOKEN, "test-not-a-key");
  assert.equal(c.extraEnv.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS, "1");
  for (const m of [c.model, ...(c.fallbackModel ?? "").split(","), c.extraEnv.ANTHROPIC_DEFAULT_HAIKU_MODEL]) {
    assert.ok(m.endsWith(":free"), m);
  }
  assert.ok(c.warnings.some((w) => /не підтримується/.test(w)));
  assert.ok(c.warnings.some((w) => /не стеля/.test(w)));
});

test("платна модель у варіанті B — попередження", () => {
  const r = resolveConfig({ WORKER_PROVIDER: "openrouter", OPENROUTER_API_KEY: "k", WORKER_MODEL: "some/paid-model" });
  assert.ok(r.ok && r.config.warnings.some((w) => /платними/.test(w)));
});

test("неправильні стелі й провайдер — помилка", () => {
  assert.equal(resolveConfig({ ANTHROPIC_API_KEY: "k", WORKER_MAX_TURNS: "0" }).ok, false);
  assert.equal(resolveConfig({ ANTHROPIC_API_KEY: "k", WORKER_MAX_BUDGET_USD: "abc" }).ok, false);
  assert.equal(resolveConfig({ WORKER_PROVIDER: "gpt" }).ok, false);
});

test("describeConfig не показує значень ключів", () => {
  const r = resolveConfig({ WORKER_PROVIDER: "openrouter", OPENROUTER_API_KEY: "test-secret-value" });
  assert.ok(r.ok);
  if (r.ok) assert.doesNotMatch(JSON.stringify(describeConfig(r.config)), /test-secret-value/);
});

test("options: лише Write + MCP, dontAsk, без налаштувань з диска, env = копія + доповнення", () => {
  const r = resolveConfig({ WORKER_PROVIDER: "openrouter", OPENROUTER_API_KEY: "k" });
  assert.ok(r.ok);
  if (!r.ok) return;
  const o = buildOptions(r.config, { cwd: process.cwd(), inboxPath: "data/inbox.csv", log: () => {}, baseEnv: { PATH: "/bin" } });
  assert.deepEqual(o.tools, ["Write"]);
  assert.deepEqual(o.allowedTools, [INBOX_TOOL, "Write"]);
  assert.equal(o.permissionMode, "dontAsk");
  assert.deepEqual(o.settingSources, []);
  assert.equal(o.env?.PATH, "/bin");
  assert.equal(o.env?.ANTHROPIC_API_KEY, "");
  assert.deepEqual(o.thinking, { type: "disabled" });
  assert.equal(o.outputFormat?.type, "json_schema");
  assert.ok(o.hooks?.PreToolUse?.[0]?.matcher?.includes("Write"));
});
