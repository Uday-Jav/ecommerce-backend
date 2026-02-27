const db = require("../database/db");

// Create Users Table
const createUserTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      small_id TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      profile_image TEXT,
      role TEXT DEFAULT 'user',
      is_verified INTEGER DEFAULT 0,
      otp_code TEXT,
      otp_expiry DATETIME,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error("Error creating users table:", err.message);
    } else {
      console.log("Users table ready with advanced fields");
    }
  });
};

module.exports = {
  createUserTable,
};
