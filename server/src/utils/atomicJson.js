/**
 * Crash- and race-safe helpers for the local JSON "database" files.
 *
 * Why this exists: every local*Store did `writeFile(path, JSON.stringify(...))`
 * directly. Two overlapping writes to the same file (a profile save fires an
 * audit log + a notification + an eligibility snapshot at once, or any write
 * racing a nodemon restart) could interleave and leave a torn file — valid JSON
 * followed by leftover bytes — which then throws "Unexpected non-whitespace
 * character after JSON".
 *
 *  - withJsonLock: serialize every read-modify-write for one path so concurrent
 *    callers can't drop each other's changes or race the rename below.
 *  - writeJsonAtomic: write a unique temp file, then rename() over the target.
 *    rename is atomic, so a reader never sees a half-written file. On Windows a
 *    rename can transiently fail (EPERM/EBUSY) if an AV scanner / indexer / the
 *    editor holds the target open — retry a few times, then fall back to a plain
 *    write (safe here because the lock guarantees we're the only writer).
 *  - readJsonArray: on a parse error, recover the leading valid JSON value
 *    instead of throwing, so one bad file doesn't wedge an endpoint forever.
 */
import { mkdir, readFile, writeFile, rename } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const locks = new Map(); // filePath -> tail of its promise chain

export function withJsonLock(filePath, fn) {
  const prev = locks.get(filePath) || Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(filePath, next.then(() => {}, () => {}));
  return next;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function recoverLeadingJson(raw) {
  let depth = 0, inStr = false, esc = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return JSON.parse(raw.slice(0, i + 1));
    }
  }
  throw new Error("no complete JSON value found");
}

// Raw write — NO lock. Only call from inside withJsonLock (or writeJsonAtomic).
async function writeJsonRaw(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const json = JSON.stringify(data, null, 2);
  const tmp = `${filePath}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;
  await writeFile(tmp, json, "utf8");
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(tmp, filePath);
      return;
    } catch (err) {
      if (attempt < 5 && (err.code === "EPERM" || err.code === "EBUSY" || err.code === "EACCES")) {
        await sleep(20 * (attempt + 1));
        continue;
      }
      // Give up on the atomic path — the lock means no one else is writing,
      // so a direct overwrite is still safe from tearing.
      try {
        await writeFile(filePath, json, "utf8");
      } finally {
        await rename(tmp, `${tmp}.orphan`).catch(() => {});
        const { unlink } = await import("fs/promises");
        await unlink(tmp).catch(() => {});
        await unlink(`${tmp}.orphan`).catch(() => {});
      }
      return;
    }
  }
}

export function writeJsonAtomic(filePath, data) {
  return withJsonLock(filePath, () => writeJsonRaw(filePath, data));
}

export async function readJsonArray(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    try {
      const recovered = recoverLeadingJson(raw);
      const arr = Array.isArray(recovered) ? recovered : [];
      await writeJsonAtomic(filePath, arr); // self-heal
      return arr;
    } catch {
      return [];
    }
  }
}

// Atomic, serialized array mutation: read -> mutate in place -> write, all under
// one lock so nothing else touches the file in between.
export function updateJsonArray(filePath, mutator) {
  return withJsonLock(filePath, async () => {
    let arr;
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      if (err.code === "ENOENT") arr = [];
      else {
        try {
          const raw = await readFile(filePath, "utf8");
          const recovered = recoverLeadingJson(raw);
          arr = Array.isArray(recovered) ? recovered : [];
        } catch {
          arr = [];
        }
      }
    }
    const result = await mutator(arr);
    await writeJsonRaw(filePath, arr);
    return result;
  });
}
