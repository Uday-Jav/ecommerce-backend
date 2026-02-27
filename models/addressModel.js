const db = require("../database/db");

// Create Address Table
const createAddressTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT NOT NULL,
      country TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error("Error creating addresses table:", err.message);
    } else {
      console.log("Addresses table ready");
    }
  });
};

module.exports = {
  createAddressTable,
};
