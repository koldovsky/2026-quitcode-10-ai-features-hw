// Детермінована частина працівника: читання вхідних заявок з CSV.
// Модель не парсить CSV сама — вона викликає інструмент read_inbox і отримує готові рядки.
import { readFile } from "node:fs/promises";

export type InboxRow = {
  id: string;
  received: string;
  from: string;
  subject: string;
  body: string;
};

const COLUMNS = ["id", "received", "from", "subject", "body"] as const;

/** Розбирає один рядок CSV з лапками ("…", "" всередині — це одна лапка). */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new Error("незакрита лапка");
  cells.push(cell);
  return cells;
}

/** Чиста функція: текст CSV → рядки заявок. Кидає помилку з номером рядка, якщо формат зламано. */
export function parseInbox(text: string): InboxRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("порожній файл");
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  if (header.join(",") !== COLUMNS.join(",")) {
    throw new Error(`очікувано заголовок ${COLUMNS.join(",")}, отримано ${header.join(",")}`);
  }
  const seen = new Set<string>();
  return lines.slice(1).map((line, i) => {
    const lineNo = i + 2;
    let cells: string[];
    try {
      cells = parseCsvLine(line);
    } catch (e) {
      throw new Error(`рядок ${lineNo}: ${(e as Error).message}`);
    }
    if (cells.length !== COLUMNS.length) {
      throw new Error(`рядок ${lineNo}: ${cells.length} колонок замість ${COLUMNS.length}`);
    }
    const [id, received, from, subject, body] = cells.map((c) => c.trim());
    if (!/^REQ-\d{2,}$/.test(id)) throw new Error(`рядок ${lineNo}: id «${id}» не у форматі REQ-NN`);
    if (seen.has(id)) throw new Error(`рядок ${lineNo}: id ${id} повторюється`);
    seen.add(id);
    return { id, received, from, subject, body };
  });
}

export async function readInbox(path: string): Promise<InboxRow[]> {
  return parseInbox(await readFile(path, "utf8"));
}

/**
 * Відповідь інструмента read_inbox у форматі MCP (CallToolResult).
 * Текст заявок — ДАНІ, не інструкції: обгортаємо їх у <inbox>, щоб модель бачила межу.
 */
export async function inboxToolResult(path: string) {
  try {
    const rows = await readInbox(path);
    return {
      content: [
        {
          type: "text" as const,
          text: `<inbox count="${rows.length}">\n${JSON.stringify(rows, null, 2)}\n</inbox>`,
        },
      ],
    };
  } catch (e) {
    return {
      content: [{ type: "text" as const, text: `Не вдалося прочитати заявки: ${(e as Error).message}` }],
      isError: true,
    };
  }
}
