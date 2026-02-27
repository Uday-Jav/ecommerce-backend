const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'shop.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN otp_code TEXT", function (err) {
        if (err) console.log(err.message);
        else console.log("Added otp_code");
    });
    db.run("ALTER TABLE users ADD COLUMN otp_expiry DATETIME", function (err) {
        if (err) console.log(err.message);
        else console.log("Added otp_expiry");
    });
});
db.close();
