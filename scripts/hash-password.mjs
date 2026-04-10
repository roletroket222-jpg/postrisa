import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run auth:hash -- "password-anda"');
  process.exit(1);
}

if (password.length < 8 || password.length > 72) {
  console.error("Password harus 8-72 karakter.");
  process.exit(1);
}

const salt = randomBytes(16).toString("base64url");
const hash = scryptSync(password, salt, 64).toString("base64url");

console.log(`scrypt$${salt}$${hash}`);
