// db.js — sets up a single shared PostgreSQL connection pool.
// A pool reuses connections instead of opening a new one per query,
// which is what you want for any real app.

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  // Optional pool tuning:
  max: 10, // max simultaneous clients
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 5000, // fail a connection attempt after 5s
});

// Log unexpected errors on idle clients instead of crashing.
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

// A thin helper so the rest of the app doesn't import Pool directly.
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
