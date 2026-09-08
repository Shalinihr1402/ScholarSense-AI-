import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { readJsonArray, writeJsonAtomic } from "../utils/atomicJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/users.local.json");

const readUsers = () => readJsonArray(storePath);
const writeUsers = (users) => writeJsonAtomic(storePath, users);

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

export async function findLocalUserById(id) {
  const users = await readUsers();
  return users.find((user) => user.id === id) || null;
}

export async function updateLocalUser(id, updates) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === id);
  
  if (index === -1) {
    throw new Error("User not found");
  }

  users[index] = { ...users[index], ...updates };
  await writeUsers(users);
  return sanitizeUser(users[index]);
}
