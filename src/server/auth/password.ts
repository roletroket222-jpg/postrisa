import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const PASSWORD_HASH_PREFIX = "scrypt";
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function assertPasswordLength(password: string) {
  if (password.length < 8) {
    throw new Error("Password minimal 8 karakter.");
  }

  if (password.length > 72) {
    throw new Error("Password maksimal 72 karakter.");
  }
}

export async function hashPassword(password: string) {
  assertPasswordLength(password);

  const salt = randomBytes(SALT_LENGTH).toString("base64url");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${PASSWORD_HASH_PREFIX}$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, storedDerivedKey] = storedHash.split("$");

  if (algorithm !== PASSWORD_HASH_PREFIX || !salt || !storedDerivedKey) {
    return false;
  }

  const candidateDerivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedDerivedKeyBuffer = Buffer.from(storedDerivedKey, "base64url");

  if (candidateDerivedKey.length !== storedDerivedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateDerivedKey, storedDerivedKeyBuffer);
}
