import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeProfile } from "./profileService.js";
import { readJsonArray, writeJsonAtomic } from "../utils/atomicJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/profiles.local.json");

const readProfiles = () => readJsonArray(storePath);
const writeProfiles = (profiles) => writeJsonAtomic(storePath, profiles);

export async function getLocalProfile(userId) {
  const profiles = await readProfiles();
  return profiles.find((profile) => profile.userId === userId) || null;
}

// Shallow-merge a few explicit fields into an existing profile WITHOUT running
// normalizeProfile (which fills every unset field with a blank default and would
// therefore wipe the rest of the profile). Use for targeted updates such as the
// UDID card upload.
export async function patchLocalProfile(userId, partial) {
  const profiles = await readProfiles();
  const now = new Date().toISOString();
  const index = profiles.findIndex((profile) => profile.userId === userId);

  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...partial, updatedAt: now };
    await writeProfiles(profiles);
    return profiles[index];
  }

  const profile = { id: randomUUID(), userId, ...partial, createdAt: now, updatedAt: now };
  profiles.push(profile);
  await writeProfiles(profiles);
  return profile;
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
