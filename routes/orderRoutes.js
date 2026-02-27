const express = require("express");
const db = require("../database/db");
const jwt = require("jsonwebtoken");

const router = express.Router();


// Protect middleware
function protect(req, res, next) {

    const header =
        req.headers.authorization;

    if (!header)
        return res.status(401).json();

    const token =
        header.split(" ")[1];

    const decoded =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

    req.user = {

        id: decoded.sub

    };

    next();

}


// CREATE ORDER

router.post(

    "/",

    protect,

    (req, res) => {

        const {

            address_id,
            cart_items,
            total_amount,
            payment_proof

        } = req.body;



        db.run(

            `INSERT INTO orders

(user_id,
address_id,
items,
payment_proof,
total_amount,
status)

VALUES (?,?,?,?,?,?)`,

            [

                req.user.id,

                address_id,

                JSON.stringify(cart_items),

                payment_proof,

                total_amount,

                "pending"

            ],

            function (err) {

                if (err) {

                    return res.status(500).json({

                        message: "Order Failed"

                    });

                }

                res.json({

                    message: "Order Created",

                    orderId: this.lastID

                });

            }

        );

    }

);


// GET ALL ORDERS FOR ADMIN
router.get("/admin", protect, (req, res) => {
    // Basic authorization check: Ensure user is admin. 
    // If our `protect` middleware added role, we could check `req.user.role === 'admin'`.
    // Alternatively, just query users to check role here for safety.
    db.get(`SELECT role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user || user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden" });
        }

        db.all(
            `SELECT orders.*, users.name as user_name, users.email as user_email
             FROM orders 
             JOIN users ON orders.user_id = users.id 
             ORDER BY orders.created_at DESC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error("Fetch orders error:", err);
                    return res.status(500).json({ message: "Failed to fetch orders." });
                }
                res.json(rows);
            }
        );
    });
});

// UPDATE ORDER STATUS (APPROVE/DISAPPROVE)
router.put("/admin/:id/status", protect, (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // should be 'Approved' or 'Disapproved'

    db.get(`SELECT role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user || user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden" });
        }

        db.get(`SELECT user_id FROM orders WHERE id = ?`, [id], (err, orderRow) => {
            if (err || !orderRow) return res.status(404).json({ message: "Order not found" });

            db.run(
                `UPDATE orders SET status = ? WHERE id = ?`,
                [status, id],
                function (err) {
                    if (err) {
                        console.error("Status update error:", err);
                        return res.status(500).json({ message: "Failed to update order status." });
                    }

                    // GENERATE NOTIFICATION FOR USER
                    db.run(
                        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
                        [orderRow.user_id, `Your order #${id} has been ${status}.`, `order_${status.toLowerCase()}`]
                    );

                    res.json({ message: `Order marked as ${status}`, status });
                }
            );
        });
    });
});


module.exports = router;
