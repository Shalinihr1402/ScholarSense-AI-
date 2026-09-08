import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { readJsonArray, writeJsonAtomic } from "../utils/atomicJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/email-logs.local.json");

const readLogs = () => readJsonArray(storePath);
const writeLogs = (logs) => writeJsonAtomic(storePath, logs);

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
