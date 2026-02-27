const db = require("./db");

db.serialize(() => {
  db.run("ALTER TABLE users ADD COLUMN profile_image TEXT");
  db.run("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0");
  db.run("ALTER TABLE users ADD COLUMN last_login DATETIME");
});

console.log("User table upgraded");
