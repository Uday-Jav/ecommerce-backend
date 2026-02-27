const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const db = require("../database/db");

const router = express.Router();


// ================= AUTH PROTECT =================

function protect(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({

            message: "No Token"

        });

    }

    try {

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(

            token,

            process.env.JWT_SECRET

        );

        // support id OR sub

        req.user = {

            id: decoded.id || decoded.sub

        };

        next();

    }
    catch (error) {

        console.log("JWT ERROR:", error);

        return res.status(401).json({

            message: "Invalid Token"

        });

    }

}



// ================= UPLOAD FOLDER =================

const uploadDir = path.join(

    __dirname,

    "..",

    "uploads"

);


// auto create folder

if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(uploadDir, { recursive: true });

    console.log("Uploads folder created");

}



// ================= MULTER =================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadDir);

    },

    filename: (req, file, cb) => {

        cb(

            null,

            Date.now() + "-" + file.originalname

        );

    }

});


const upload = multer({

    storage,

    limits: {

        fileSize: 5 * 1024 * 1024

    }

});



// ================= PAYMENT UPLOAD =================

router.post(

    "/upload-proof",

    protect,

    upload.single("image"),

    (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({

                    message: "No screenshot uploaded"

                });

            }

            console.log("USER:", req.user);

            console.log("FILE:", req.file.filename);


            // ================= CREATE ORDER =================

            db.run(

                `

INSERT INTO orders

(user_id,items,total_amount,status,payment_proof)

VALUES(?,?,?,?,?)

`,

                [

                    req.user.id,

                    JSON.stringify([]),

                    0,

                    "Pending",

                    req.file.filename

                ],

                function (err) {

                    if (err) {

                        console.log("ORDER ERROR:", err);

                        return res.status(500).json({

                            message: "Order failed"

                        });

                    }


                    console.log("ORDER CREATED:", this.lastID);

                    const newOrderId = this.lastID;

                    // GENERATE NOTIFICATION FOR ADMIN
                    db.run(
                        `INSERT INTO notifications (user_id, message, type) VALUES ('admin', 'New order #${newOrderId} requires payment approval.', 'order_pending')`,
                        [],
                        (notifErr) => {
                            if (notifErr) {
                                console.error("Failed to insert admin notification:", notifErr);
                            }

                            res.json({
                                message: "Payment Uploaded Successfully",
                                orderId: newOrderId,
                                file: req.file.filename
                            });
                        }
                    );

                }

            );

        }
        catch (error) {

            console.log("UPLOAD ERROR:", error);

            res.status(500).json({

                message: "Upload Failed"

            });

        }

    }

);

module.exports = router;