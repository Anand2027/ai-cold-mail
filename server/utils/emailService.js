const nodemailer = require("nodemailer");

const getSmtpConfig = () => {
    const host = process.env.EMAIL_HOST || "smtp-relay.brevo.com";
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure = process.env.EMAIL_SECURE
        ? process.env.EMAIL_SECURE === "true"
        : port === 465;

    const required = {
        EMAIL_HOST: host,
        EMAIL_PORT: port,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS,
    };

    const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(`Missing email environment variables: ${missing.join(", ")}`);
    }

    return {
        host,
        port,
        secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        requireTLS: !secure,
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        tls: {
            servername: host,
        },
    };
};

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport(getSmtpConfig());

        // SMTP Connection Test
        await transporter.verify();
        console.log("Email SMTP connected successfully");

        const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

        const mailOptions = {
            from: {
                name: "AI Cold Mail",
                address: fromAddress,
            },
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.message.replace(/\n/g, "<br>"),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent:", info.messageId);

        return {
            success: true,
            message: "Email sent successfully",
            messageId: info.messageId,
        };
    } catch (error) {
        console.error("Email Error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = sendEmail;
