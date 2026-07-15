// index.js — a minimal Express server backed by PostgreSQL.

require("dotenv").config();
const express = require("express");
const db = require("./db");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Create the table if it doesn't exist yet, so the app runs on a fresh DB.
async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("Database ready: 'users' table is present.");
}

// --- Routes ---

// Health check: also confirms the DB connection works.
app.get("/health", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW() AS time");
    res.json({ status: "ok", dbTime: result.rows[0].time });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// List all users.
app.get("/users", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, created_at FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a user. Note the parameterized query ($1, $2) — this prevents
// SQL injection. Never string-concatenate user input into SQL.
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }
  try {
    const result = await db.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // 23505 is Postgres' unique_violation error code.
    if (err.code === "23505") {
      return res.status(409).json({ error: "email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Start the server only after the DB is initialized.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
    process.exit(1);
  });
