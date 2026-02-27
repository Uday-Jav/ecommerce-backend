const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log("=================================================");
    console.log("📱 SCAN THIS QR CODE WITH YOUR WHATSAPP (8004304007)!");
    console.log("=================================================");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready! Connected to your number.');
    isReady = true;
});

client.on('auth_failure', () => {
    console.error('❌ WhatsApp Authentication Failed!');
});

// Start the client
client.initialize();

async function sendWhatsAppOTP(toPhone, otpCode) {
    if (!toPhone) {
        console.log("⚠️ No phone number provided for WhatsApp OTP.");
        return;
    }

    if (!isReady) {
        console.log("⚠️ WhatsApp not linked yet. Mocking OTP message:");
        console.log(`💬 MOCK to ${toPhone}: Your Clothing Store OTP is ${otpCode}.`);
        return { mock: true, otpCode };
    }

    try {
        // WhatsApp-web.js requires the number format: CountryCode + Number + @c.us
        // For India (+91), a 10-digit number becomes 91xxxxxxxxxx@c.us
        let formattedPhone = toPhone.toString().replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.length === 10) {
            formattedPhone = `91${formattedPhone}`;
        }

        const chatId = `${formattedPhone}@c.us`;

        const message = await client.sendMessage(chatId, `Your Clothing Store OTP is ${otpCode}. It is valid for 10 minutes.`);
        console.log(`✅ Real WhatsApp OTP sent to ${toPhone}`);
        return message;
    } catch (err) {
        console.error("❌ Failed to send WhatsApp OTP:", err);
    }
}

module.exports = {
    sendWhatsAppOTP
};
