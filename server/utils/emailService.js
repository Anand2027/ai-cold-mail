const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    try {
        const emailUser = process.env.EMAIL_USER?.trim();
        const emailPass = process.env.EMAIL_PASS?.trim();

        if (!emailUser || !emailPass) {
            throw new Error("Email credentials not configured");
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: emailUser,
                pass: emailPass,
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
        });

        // SMTP connection verify
        await transporter.verify();
        console.log("✅ SMTP Connected Successfully");

        const mailOptions = {
            from: `"AI Cold Mail Generator" <${emailUser}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    ${options.message
                        .split("\n")
                        .map(line => `<p>${line}</p>`)
                        .join("")}
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Email Sent:", info.response);

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