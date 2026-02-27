const db = require("./db");

db.serialize(() => {
    // Add small_id column without UNIQUE, then add an index
    db.run("ALTER TABLE users ADD COLUMN small_id TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column small_id already exists.");
            } else {
                console.error("Error adding small_id column:", err.message);
            }
        } else {
            console.log("Added small_id column to users table");
            db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_small_id ON users(small_id)");
        }
    });

    // Ensure phone column exists (it's in the schema but might need adding for older DBs if it wasn't there initially)
    db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column phone already exists.");
            } else {
                console.error("Error adding phone column:", err.message);
            }
        } else {
            console.log("Added phone column to users table");
        }
    });
});

console.log("User table upgraded for OTP support");
