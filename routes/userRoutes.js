const express = require('express');
const db = require('../database/db');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const multer =
  require("multer");

const path =
  require("path");

const fs =
  require("fs");

// 🔐 Middleware: Protect Route
function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
// ======================
// PROFILE IMAGE UPLOAD
// ======================

const uploadDir = path.join(

  process.cwd(),

  "uploads"

);


if (!fs.existsSync(uploadDir)) {

  fs.mkdirSync(uploadDir);

}


const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, uploadDir);

  },

  filename: (req, file, cb) => {

    cb(

      null,

      "profile-"

      + Date.now()

      + "-"

      + file.originalname

    );

  }

});


const upload = multer({

  storage

});



// =========================
// GET USER PROFILE
// =========================
router.get('/profile', protect, (req, res) => {
  db.get(
    `SELECT id, name, email, phone, profile_image, role, is_verified, last_login, created_at
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch profile' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    }
  );
});


// =========================
// UPDATE USER PROFILE
// =========================
router.put('/profile', protect, (req, res) => {
  const { name, phone, profile_image } = req.body;

  db.run(
    `UPDATE users
     SET name = ?, phone = ?, profile_image = ?
     WHERE id = ?`,
    [name, phone, profile_image, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to update profile' });
      }

      res.json({ message: 'Profile updated successfully' });
    }
  );
});
// ======================
// UPLOAD PROFILE IMAGE
// ======================

router.post(

  "/upload-profile-image",

  protect,

  upload.single("image"),

  (req, res) => {

    if (!req.file) {

      return res.status(400).json({

        message: "No file"

      });

    }


    const imagePath =

      "http://localhost:5001/uploads/"

      + req.file.filename;


    // save database

    db.run(

      "UPDATE users SET profile_image=? WHERE id=?",

      [imagePath, req.user.id],

      (err) => {

        if (err) {

          return res.status(500).json({

            message: "DB error"

          });

        }

        res.json({

          message: "Uploaded",

          profile_image: imagePath

        });

      }

    );

  }

);

// =========================
// GET USER ORDERS
// =========================

router.get(

  "/orders",

  protect,

  (req, res) => {

    db.all(

      `SELECT *
FROM orders
WHERE user_id = ?
ORDER BY created_at DESC`,

      [req.user.id],

      (err, orders) => {

        if (err) {

          console.log(err);

          return res.status(500).json({

            message: "Failed to fetch orders"

          });

        }


        // safe parse

        const formattedOrders =

          (orders || []).map(order => ({

            ...order,

            items:

              order.items ?

                JSON.parse(order.items)

                :

                []

          }));


        console.log(

          "Orders Found:",

          formattedOrders

        );

        res.json(formattedOrders);

      }

    );

  }

);


// =========================
// GET USER ADDRESSES
// =========================
router.get('/addresses', protect, (req, res) => {
  db.all(
    `SELECT * FROM addresses WHERE user_id = ?`,
    [req.user.id],
    (err, addresses) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch addresses' });
      }

      res.json(addresses);
    }
  );
});


// =========================
// ADD NEW ADDRESS
// =========================
router.post('/addresses', protect, (req, res) => {
  const { full_name, phone, street, city, state, zip, country } = req.body;

  db.run(
    `INSERT INTO addresses
     (user_id, full_name, phone, street, city, state, zip, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, full_name, phone, street, city, state, zip, country],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to add address' });
      }

      res.status(201).json({
        message: 'Address added successfully',
        addressId: this.lastID,
      });
    }
  );
});


// =========================
// DELETE ADDRESS
// =========================
router.delete('/addresses/:id', protect, (req, res) => {
  db.run(
    `DELETE FROM addresses WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete address' });
      }

      res.json({ message: 'Address deleted successfully' });
    }
  );
});

module.exports = router;
