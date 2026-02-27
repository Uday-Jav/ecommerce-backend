const nodemailer = require("nodemailer");

let transporter = null;

// Initialize mailer
async function initMailer() {
    try {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER || "mka341270@gmail.com",
                pass: process.env.EMAIL_PASS,
            },
        });

        console.log("✅ Mailer initialized with Gmail: mka341270@gmail.com");
    } catch (err) {
        console.error("❌ Failed to initialize mailer:", err);
        throw err;
    }
}

// Send OTP email
async function sendOTP(toEmail, otpCode) {
    if (!process.env.EMAIL_PASS) {
        console.log("⚠️ No EMAIL_PASS provided. Mocking Email OTP:");
        console.log(`💬 MOCK to ${toEmail}: Your OTP code is ${otpCode}.`);
        return { mock: true, otpCode };
    }

    try {
        // Ensure mailer initialized
        if (!transporter) {
            await initMailer();
        }

        const info = await transporter.sendMail({
            from: '"Clothing Store App" <mka341270@gmail.com>',
            to: toEmail,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otpCode}. It is valid for 10 minutes.`,
            html: `<b>Your OTP code is ${otpCode}.</b><br/>It is valid for 10 minutes.`,
        });

        console.log("✅ Message sent:", info.messageId);

        // Ethereal preview link
        console.log(
            "📬 Preview URL:",
            nodemailer.getTestMessageUrl(info)
        );

        return info;

    } catch (err) {
        console.error("❌ Error sending OTP email:", err);
        throw err;
    }
}

module.exports = {
    initMailer,
    sendOTP,
};