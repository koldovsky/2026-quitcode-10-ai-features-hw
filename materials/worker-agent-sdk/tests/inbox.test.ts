import { test } from "node:test";
import assert from "node:assert/strict";
import { inboxToolResult, parseCsvLine, parseInbox, readInbox } from "../src/inbox.ts";

test("CSV: лапки, коми й подвоєні лапки всередині комірки", () => {
  assert.deepEqual(parseCsvLine('a,"b, c","d ""e"""'), ["a", "b, c", 'd "e"']);
});

test("CSV: незакрита лапка — помилка", () => {
  assert.throws(() => parseCsvLine('a,"b'), /незакрита лапка/);
});

test("синтетичний inbox: 6 заявок REQ-01..REQ-06", async () => {
  const rows = await readInbox("data/inbox.csv");
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.map((r) => r.id), ["REQ-01", "REQ-02", "REQ-03", "REQ-04", "REQ-05", "REQ-06"]);
  assert.match(rows[0].body, /до п'ятниці/);
});

test("зламаний CSV: неправильний заголовок, кількість колонок, дубль id", () => {
  assert.throws(() => parseInbox("x,y\n1,2"), /очікувано заголовок/);
  const head = "id,received,from,subject,body\n";
  assert.throws(() => parseInbox(head + "REQ-01,2026-11-01,a@b,c"), /рядок 2: 4 колонок/);
  assert.throws(() => parseInbox(head + "REQ-01,d,f,s,b\nREQ-01,d,f,s,b"), /рядок 3: id REQ-01 повторюється/);
  assert.throws(() => parseInbox(head + "R1,d,f,s,b"), /не у форматі REQ-NN/);
});

test("інструмент read_inbox: заявки в тегу <inbox>, помилка — isError", async () => {
  const ok = await inboxToolResult("data/inbox.csv");
  assert.equal("isError" in ok, false);
  assert.match(ok.content[0].text, /^<inbox count="6">/);
  const bad = await inboxToolResult("data/немає.csv");
  assert.equal("isError" in bad && bad.isError, true);
});
