import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeProfile } from "./profileService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/profiles.local.json");

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, "[]", "utf8");
  }
}

async function readProfiles() {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw);
}

async function writeProfiles(profiles) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(profiles, null, 2), "utf8");
}

export async function getLocalProfile(userId) {
  const profiles = await readProfiles();
  return profiles.find((profile) => profile.userId === userId) || null;
}

export async function upsertLocalProfile(userId, payload) {
  const profiles = await readProfiles();
  const now = new Date().toISOString();
  const index = profiles.findIndex((profile) => profile.userId === userId);
  const normalized = normalizeProfile(payload);

  if (index >= 0) {
    profiles[index] = {
      ...profiles[index],
      ...normalized,
      updatedAt: now
    };
    await writeProfiles(profiles);
    return profiles[index];
  }

  const profile = {
    id: randomUUID(),
    userId,
    ...normalized,
    createdAt: now,
    updatedAt: now
  };

  profiles.push(profile);
  await writeProfiles(profiles);
  return profile;
}
