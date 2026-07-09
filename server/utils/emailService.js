const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false, // Port 587 ke liye false
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
        });

        // SMTP Connection Test
        await transporter.verify();
        console.log("✅ Brevo SMTP Connected Successfully");

        const mailOptions = {
            from: {
                name: "AI Cold Mail",
                address: "anandswaroopgupta455@gmail.com", // Verified Sender Email
            },
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.message.replace(/\n/g, "<br>"),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Email Sent:", info.messageId);

        return {
            success: true,
            message: "Email sent successfully",
            messageId: info.messageId,
        };
    } catch (error) {
        console.error("❌ Email Error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = sendEmail;