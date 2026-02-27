const db = require("./db");

console.log("Running database setup...");

// ================= USERS =================

db.run(`

CREATE TABLE IF NOT EXISTS users (

 id INTEGER PRIMARY KEY AUTOINCREMENT,

 small_id TEXT UNIQUE,

 name TEXT NOT NULL,

 email TEXT NOT NULL UNIQUE,

 password TEXT NOT NULL,

 phone TEXT,

 role TEXT DEFAULT 'user',

 is_verified INTEGER DEFAULT 0,

 otp_code TEXT,

 otp_expiry DATETIME,

 profile_image TEXT,

 last_login DATETIME,

 created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)

`);


// ================= PRODUCTS =================

db.run(`

CREATE TABLE IF NOT EXISTS products (

 id INTEGER PRIMARY KEY AUTOINCREMENT,

 name TEXT NOT NULL,

 price REAL NOT NULL,

 description TEXT,

 image TEXT,

 category TEXT

)

`);


// ================= ORDERS =================

db.run(`

CREATE TABLE IF NOT EXISTS orders (

 id INTEGER PRIMARY KEY AUTOINCREMENT,

 user_id INTEGER NOT NULL,

 address_id INTEGER,

 items TEXT,

 payment_proof TEXT,

 total_amount REAL DEFAULT 0,

 status TEXT DEFAULT 'Pending',

 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

 FOREIGN KEY(user_id)

 REFERENCES users(id)

 ON DELETE CASCADE

)

`);


// ================= CART =================

db.run(`

CREATE TABLE IF NOT EXISTS cart_items (

 id INTEGER PRIMARY KEY AUTOINCREMENT,

 user_id INTEGER NOT NULL,

 product_id INTEGER NOT NULL,

 quantity INTEGER DEFAULT 1,

 FOREIGN KEY(user_id)

 REFERENCES users(id)

 ON DELETE CASCADE,

 FOREIGN KEY(product_id)

 REFERENCES products(id)

 ON DELETE CASCADE

)

`);

// ================= ADDRESSES =================

db.run(`

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

 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE

)

`);

// ================= NOTIFICATIONS =================

db.run(`

CREATE TABLE IF NOT EXISTS notifications (

 id INTEGER PRIMARY KEY AUTOINCREMENT,

 user_id TEXT NOT NULL, -- can be a user id integer, or 'admin', or 'all'

 message TEXT NOT NULL,

 type TEXT,

 is_read INTEGER DEFAULT 0,

 created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)

`);