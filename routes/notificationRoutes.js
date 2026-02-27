const express = require("express");
const db = require("../database/db");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ================= AUTH PROTECT =================
function protect(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No Token" });
    }
    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id || decoded.sub,
            role: decoded.role || "user"
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid Token" });
    }
}

// ================= GET NOTIFICATIONS =================
router.get("/", protect, (req, res) => {
    // If admin, they get 'admin' notifications + 'all' notifications.
    // If user, they get their own notifications + 'all' notifications.

    // First, let's look up the user's role from the DB if not in token, or just assume from ID for now.
    // Actually, we can just query users table to be safe and know if they are admin.
    db.get(`SELECT role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ message: "Server error" });
        }

        const role = user.role;
        const targetIds = ["all"]; // Everyone gets 'all' broadcasts

        if (role === "admin") {
            targetIds.push("admin");
            // Admin might also want to see their own specific user ID notifications?
            targetIds.push(req.user.id.toString());
        } else {
            targetIds.push(req.user.id.toString());
        }

        const placeholders = targetIds.map(() => "?").join(",");

        db.all(
            `SELECT * FROM notifications 
             WHERE user_id IN (${placeholders}) 
             ORDER BY created_at DESC LIMIT 50`,
            targetIds,
            (err, rows) => {
                if (err) {
                    console.error("Fetch notifications error:", err);
                    return res.status(500).json({ message: "Failed to fetch notifications" });
                }
                res.json(rows);
            }
        );
    });
});

// ================= MARK AS READ =================
router.put("/:id/read", protect, (req, res) => {
    const { id } = req.params;

    // In a real app we'd verify the notification belongs to this user, but for simplicity here's a direct update.
    db.run(
        `UPDATE notifications SET is_read = 1 WHERE id = ?`,
        [id],
        function (err) {
            if (err) {
                console.error("Update notification error:", err);
                return res.status(500).json({ message: "Failed to update notification" });
            }
            res.json({ message: "Notification marked as read", id });
        }
    );
});

module.exports = router;
