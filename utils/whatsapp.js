const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let client = null;
let isReady = false;

// Enable WhatsApp ONLY when env variable true
if (process.env.ENABLE_WHATSAPP === "true") {

    console.log("✅ WhatsApp Enabled");

    client = new Client({
        authStrategy: new LocalAuth(),

        puppeteer: {
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ],
            headless: true
        }
    });

    // QR LOGIN
    client.on("qr", (qr) => {

        console.log("=====================================");
        console.log("📱 SCAN THIS QR WITH WHATSAPP");
        console.log("=====================================");

        qrcode.generate(qr, { small: true });

    });

    client.on("ready", () => {

        console.log("✅ WhatsApp Client Ready");
        isReady = true;

    });

    client.on("auth_failure", () => {

        console.error("❌ WhatsApp Authentication Failed");

    });

    client.initialize();

} else {

    console.log("🚫 WhatsApp Disabled (Production Mode)");

}


// SEND OTP FUNCTION

async function sendWhatsAppOTP(toPhone, otpCode) {

    // Disabled OR not ready → mock message
    if (!client || !isReady) {

        console.log("⚠️ WhatsApp Disabled / Not Ready");

        console.log(
            `💬 MOCK OTP to ${toPhone}: ${otpCode}`
        );

        return { mock: true };

    }

    try {

        if (!toPhone) {

            console.log("⚠️ No phone number provided");
            return;

        }

        let formattedPhone =
            toPhone.toString().replace(/\D/g, "");

        if (formattedPhone.length === 10) {

            formattedPhone = `91${formattedPhone}`;

        }

        const chatId =
            `${formattedPhone}@c.us`;

        const message =
            await client.sendMessage(

                chatId,

                `Your Clothing Store OTP is ${otpCode}. It is valid for 10 minutes.`

            );

        console.log(`✅ WhatsApp OTP sent to ${toPhone}`);

        return message;

    } catch (err) {

        console.error("❌ WhatsApp OTP Failed:", err);

    }

}

module.exports = {

    sendWhatsAppOTP

};