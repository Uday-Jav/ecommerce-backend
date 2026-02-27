const db = require("../database/db");

// Create Orders Table
const createOrderTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      payment_status TEXT DEFAULT 'Unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error("Error creating orders table:", err.message);
    } else {
      console.log("Orders table ready");
    }
  });
};

module.exports = {
  createOrderTable,
};
