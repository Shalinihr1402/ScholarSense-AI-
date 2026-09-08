import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { seedScholarships } from "../data/seedScholarships.js";
import { readJsonArray, writeJsonAtomic } from "../utils/atomicJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/scholarships.local.json");

function withIds(records) {
  return records.map((record) => ({
    id: record.id || randomUUID(),
    ...record
  }));
}

async function ensureStore() {
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeJsonAtomic(storePath, withIds(seedScholarships));
  }
}

async function readScholarships() {
  await ensureStore();
  return readJsonArray(storePath);
}

export async function getAllLocalScholarships() {
  return readScholarships();
}

async function writeScholarships(records) {
  await writeJsonAtomic(storePath, records);
}

export async function listLocalScholarships(filters = {}) {
  const records = await readScholarships();
  const search = filters.search?.toLowerCase();
  const state = filters.state?.toLowerCase();
  const category = filters.category?.toLowerCase();

  return records.filter((record) => {
    const matchesSearch = !search || [record.name, record.provider, record.description].some((value) =>
      value?.toLowerCase().includes(search)
    );
    const matchesState = !state || record.state.toLowerCase() === "all india" || record.state.toLowerCase() === state;
    const matchesCategory =
      !category || record.categories.some((item) => item.toLowerCase() === category);

    return matchesSearch && matchesState && matchesCategory;
  });
}

export async function createLocalScholarship(payload) {
  const records = await readScholarships();
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    ...payload,
    createdAt: now,
    updatedAt: now
  };

  records.push(record);
  await writeScholarships(records);
  return record;
}

export async function updateLocalScholarship(id, payload) {
  const records = await readScholarships();
  const index = records.findIndex((record) => record.id === id);

  if (index < 0) {
    const error = new Error("Scholarship record not found.");
    error.status = 404;
    throw error;
  }

  records[index] = {
    ...records[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  await writeScholarships(records);
  return records[index];
}

export async function deleteLocalScholarship(id) {
  const records = await readScholarships();
  const nextRecords = records.filter((record) => record.id !== id);

  if (nextRecords.length === records.length) {
    const error = new Error("Scholarship record not found.");
    error.status = 404;
    throw error;
  }

  await writeScholarships(nextRecords);
}
