import db from "./db.js";

db.run(
  "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'",
  (err) => {
    if (err) {
      console.error("Error adding role column:", err.message);
    } else {
      console.log("Role column added successfully");
    }
  }
);
