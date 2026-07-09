const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.verify();
        console.log("✅ Brevo SMTP Connected");

        const info = await transporter.sendMail({
            from: `"AI Cold Mail Generator" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.message.replace(/\n/g, "<br>"),
        });

        console.log("✅ Email Sent:", info.response);

        return {
            success: true,
            message: "Email sent successfully",
        };
    } catch (error) {
        console.error("❌ Email Error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = sendEmail;