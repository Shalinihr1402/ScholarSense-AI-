import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/users.local.json");

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, "[]", "utf8");
  }
}

async function readUsers() {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw);
}

async function writeUsers(users) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(users, null, 2), "utf8");
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function createLocalUser({ name, email, password, role = "student" }) {
  const users = await readUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = users.find((user) => user.email === normalizedEmail);

  if (existing) {
    const error = new Error("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  const user = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    role,
    isEmailVerified: false,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await writeUsers(users);
  return sanitizeUser(user);
}

export async function findLocalUserByEmail(email) {
  const users = await readUsers();
  const normalizedEmail = email.toLowerCase().trim();
  return users.find((user) => user.email === normalizedEmail) || null;
}

export function safeLocalUser(user) {
  return sanitizeUser(user);
}
