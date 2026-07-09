const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.verify();
        console.log("✅ SMTP Connected Successfully");

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.message.replace(/\n/g, "<br>")
        });

        console.log("✅ Email Sent:", info.response);

        return info;

    } catch (err) {
        console.error("❌ SMTP Error:", err);
        throw err;
    }
};

module.exports = sendEmail;