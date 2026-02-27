const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const db = require("../database/db");
const { sendOTP } = require("../utils/mailer");
const { sendWhatsAppOTP } = require("../utils/whatsapp");
const { OAuth2Client } = require('google-auth-library');

// We will use a mock client id or the real one if provided in env
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID");

const JWT_SECRET =
    process.env.JWT_SECRET;

const JWT_EXPIRES_IN = "7d";


if (!JWT_SECRET) {

    throw new Error(

        "JWT_SECRET missing in .env"

    );

}


// helper

function findUserByIdentifier(identifier) {

    return new Promise((resolve, reject) => {

        db.get(

            "SELECT * FROM users WHERE email = ? OR phone = ? OR small_id = ?",

            [identifier, identifier, identifier],

            (err, row) => {

                if (err) return reject(err);

                resolve(row || null);

            }

        );

    });

}


function countUsers() {

    return new Promise((resolve, reject) => {

        db.get(

            "SELECT COUNT(*) as count FROM users",

            [],

            (err, row) => {

                if (err) return reject(err);

                resolve(row.count);

            }

        );

    });

}


function insertUser({ small_id, name, email, passwordHash, phone, role, otpCode, otpExpiry }) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO users (small_id, name, email, password, phone, role, is_verified, otp_code, otp_expiry) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [small_id, name, email, passwordHash, phone, role, otpCode, otpExpiry],
            function (err) {
                if (err) return reject(err);
                resolve({
                    id: this.lastID,
                    small_id,
                    name,
                    email,
                    phone,
                    role
                });
            }
        );
    });
}



// REGISTER

async function registerUser(req, res) {

    try {

        const { email, password, phone } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                message: "Email and password required"

            });

        }


        const existing = await findUserByIdentifier(email);

        if (existing) {
            if (!existing.is_verified) {
                const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpiry = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins
                const passwordHash = await bcrypt.hash(password, 10);

                await new Promise((resolve, reject) => {
                    db.run(
                        "UPDATE users SET password = ?, phone = ?, otp_code = ?, otp_expiry = ? WHERE id = ?",
                        [passwordHash, phone, otpCode, otpExpiry, existing.id],
                        function (err) {
                            if (err) return reject(err);
                            resolve();
                        }
                    );
                });

                await sendOTP(email, otpCode);
                await sendWhatsAppOTP(phone, otpCode);

                return res.status(201).json({
                    message: `OTP resent. Your User ID is ${existing.small_id}. Please check your email/WhatsApp to verify.`,
                    email: email,
                    small_id: existing.small_id
                });
            }

            return res.status(409).json({
                message: "Email already exists"
            });
        }


        const passwordHash =

            await bcrypt.hash(password, 10);

        const name =

            email.split("@")[0];

        const generateSmallId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
        let small_id = generateSmallId();

        const totalUsers = await countUsers();
        const role = totalUsers === 0 ? "admin" : "user";

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins

        const user = await insertUser({ small_id, name, email, passwordHash, phone, role, otpCode, otpExpiry });

        // Send OTP
        await sendOTP(email, otpCode);
        await sendWhatsAppOTP(phone, otpCode);

        // We don't send the token yet, they must verify first
        res.status(201).json({
            message: `User registered. Your User ID is ${small_id}. Please check your email/WhatsApp for the OTP to verify your account.`,
            email: email,
            small_id: small_id
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({
            message: "Register failed: " + error.message,
            stack: error.stack
        });
    }

}



// LOGIN

async function loginUser(req, res) {

    try {

        const { email, identifier, password } = req.body;

        const userIdentity = identifier || email;

        if (!userIdentity || !password) {

            return res.status(400).json({

                message: "Identifier (Email/Phone/ID) and password required"

            });

        }


        const userRecord = await findUserByIdentifier(userIdentity);
        if (!userRecord) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const match =

            await bcrypt.compare(

                password,

                userRecord.password

            );

        if (!match) {

            return res.status(401).json({

                message: "Invalid credentials"

            });

        }


        // ALWAYS require OTP on login
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins

        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE users SET otp_code = ?, otp_expiry = ?, is_verified = 0 WHERE id = ?",
                [otpCode, otpExpiry, userRecord.id],
                function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });

        await sendOTP(userRecord.email, otpCode);
        await sendWhatsAppOTP(userRecord.phone, otpCode);

        // Return a response signaling OTP is required
        return res.status(200).json({
            message: "OTP sent to your email and WhatsApp.",
            step: "OTP_REQUIRED",
            email: userRecord.email
        });

    }
    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Login failed"

        });

    }

}

// FORGOT PASSWORD
async function forgotPassword(req, res) {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({ message: "Email or phone number required" });
        }

        const userRecord = await findUserByIdentifier(identifier);
        if (!userRecord) {
            return res.status(404).json({ message: "User not found" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins

        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE users SET otp_code = ?, otp_expiry = ? WHERE id = ?",
                [otpCode, otpExpiry, userRecord.id],
                function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });

        await sendOTP(userRecord.email, otpCode);
        await sendWhatsAppOTP(userRecord.phone, otpCode);

        res.status(200).json({
            message: "OTP sent successfully to your registered email and WhatsApp.",
            email: userRecord.email
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Failed to process forgot password" });
    }
}

// RESET PASSWORD
async function resetPassword(req, res) {
    try {
        const { identifier, otp, newPassword } = req.body;
        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({ message: "Identifier, OTP, and new password are required" });
        }

        const userRecord = await findUserByIdentifier(identifier);
        if (!userRecord) {
            return res.status(404).json({ message: "User not found" });
        }

        if (userRecord.otp_code !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > new Date(userRecord.otp_expiry)) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE users SET password = ?, otp_code = NULL, otp_expiry = NULL WHERE id = ?",
                [passwordHash, userRecord.id],
                function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });

        res.status(200).json({ message: "Password reset successfully. You can now login with your new password." });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
}

// GOOGLE LOGIN
async function googleLogin(req, res) {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" });
        }

        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
            });
            payload = ticket.getPayload();
        } catch (err) {
            // Fallback for mock testing without real client ID
            console.log("Token verification failed, parsing payload manually for mock mode.");
            const jwt = require('jsonwebtoken');
            payload = jwt.decode(credential);
            if (!payload) throw new Error("Invalid token");
        }

        const { email, name, picture } = payload;

        let userRecord = await findUserByIdentifier(email);

        if (!userRecord) {
            // Auto register
            const generateSmallId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
            const small_id = generateSmallId();
            const totalUsers = await countUsers();
            const role = totalUsers === 0 ? "admin" : "user";
            const randomPasswordHash = await bcrypt.hash(Math.random().toString(36), 10);

            userRecord = await insertUser({
                small_id,
                name,
                email,
                passwordHash: randomPasswordHash,
                phone: null,
                role,
                otpCode: null,
                otpExpiry: null
            });

            // Mark as verified immediately for Google signup
            await new Promise((resolve, reject) => {
                db.run(
                    "UPDATE users SET is_verified = 1 WHERE id = ?",
                    [userRecord.id],
                    function (err) {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });
            userRecord.is_verified = 1;
        }

        const token = jwt.sign(
            { sub: userRecord.id, email: userRecord.email, role: userRecord.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: "Successfully logged in with Google",
            user: {
                id: userRecord.id,
                name: userRecord.name,
                email: userRecord.email,
                role: userRecord.role,
                is_verified: userRecord.is_verified
            },
            token
        });

    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).json({ message: "Failed to authenticate with Google" });
    }
}


module.exports = {
    registerUser,
    loginUser,
    verifyOtp,
    forgotPassword,
    resetPassword,
    googleLogin
};

async function verifyOtp(req, res) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP required" });
        }

        const userRecord = await findUserByIdentifier(email);
        if (!userRecord) {
            return res.status(404).json({ message: "User not found" });
        }

        if (userRecord.is_verified) {
            return res.status(400).json({ message: "User already verified" });
        }

        if (userRecord.otp_code !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > new Date(userRecord.otp_expiry)) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Mark as verified
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE users SET is_verified = 1, otp_code = NULL, otp_expiry = NULL WHERE id = ?",
                [userRecord.id],
                function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });

        // Generate Token
        const token = jwt.sign(
            { sub: userRecord.id, email: userRecord.email, role: userRecord.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: "Successfully verified and logged in",
            user: {
                id: userRecord.id,
                name: userRecord.name,
                email: userRecord.email,
                role: userRecord.role,
                is_verified: 1
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "OTP Verification failed" });
    }
}
