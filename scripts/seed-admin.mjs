// Seed admin — jalankan: node scripts/seed-admin.mjs
import { createRequire } from "node:module";
import { loadEnvFile } from "node:process";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

loadEnvFile();

const require = createRequire(import.meta.url);
const pg = require("pg");
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL tidak ditemukan di .env");

const pool = new Pool({ connectionString });

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

const ADMIN_EMAIL = "admin@aquarium.local";
const ADMIN_NAME = "Administrator";
const ADMIN_PASSWORD = "admin123";

async function main() {
  const client = await pool.connect();
  try {
    // Cek apakah admin sudah ada
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`✓ Akun admin '${ADMIN_EMAIL}' sudah ada di database.`);
      return;
    }

    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await client.query(
      `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'ADMIN', $5, $5)`,
      [id, ADMIN_NAME, ADMIN_EMAIL, hashedPassword, now]
    );

    console.log("✓ Akun admin berhasil dibuat!");
    console.log(`  Email   : ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("  ⚠️  Segera ganti password setelah login pertama!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
