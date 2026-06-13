import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/email-logs.local.json");

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, "[]", "utf8");
  }
}

async function readLogs() {
  await ensureStore();
  return JSON.parse(await readFile(storePath, "utf8"));
}

async function writeLogs(logs) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(logs, null, 2), "utf8");
}

export async function createEmailLog(payload) {
  const logs = await readLogs();
  const log = {
    id: randomUUID(),
    ...payload,
    createdAt: new Date().toISOString()
  };

  logs.push(log);
  await writeLogs(logs);
  return log;
}

export async function listEmailLogs(userId) {
  const logs = await readLogs();
  return logs.filter((log) => log.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
