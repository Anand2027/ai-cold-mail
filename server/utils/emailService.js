const nodemailer = require("nodemailer");
const axios = require("axios");

const getFromAddress = () => process.env.EMAIL_FROM || process.env.EMAIL_USER;

const getFromName = () => process.env.EMAIL_FROM_NAME || "AI Cold Mail";

const getHtmlMessage = (message) => message.replace(/\n/g, "<br>");

const sendBrevoEmail = async (options) => {
    if (!process.env.BREVO_API_KEY) {
        throw new Error("Missing BREVO_API_KEY");
    }

    const fromAddress = getFromAddress();
    if (!fromAddress) {
        throw new Error("Missing EMAIL_FROM. Use a sender email verified in Brevo.");
    }

    const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
            sender: {
                name: getFromName(),
                email: fromAddress,
            },
            to: [{ email: options.email }],
            subject: options.subject,
            textContent: options.message,
            htmlContent: getHtmlMessage(options.message),
        },
        {
            headers: {
                accept: "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json",
            },
            timeout: 30000,
        }
    );

    console.log("Brevo API email sent:", response.data?.messageId || response.status);

    return {
        success: true,
        message: "Email sent successfully",
        messageId: response.data?.messageId,
        provider: "brevo-api",
    };
};

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

const sendSmtpEmail = async (options) => {
    const transporter = nodemailer.createTransport(getSmtpConfig());

    // SMTP Connection Test
    await transporter.verify();
    console.log("Email SMTP connected successfully");

    const fromAddress = getFromAddress();

    const mailOptions = {
        from: {
            name: getFromName(),
            address: fromAddress,
        },
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: getHtmlMessage(options.message),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("SMTP email sent:", info.messageId);

    return {
        success: true,
        message: "Email sent successfully",
        messageId: info.messageId,
        provider: "smtp",
    };
};

const sendEmail = async (options) => {
    try {
        if (process.env.BREVO_API_KEY) {
            return await sendBrevoEmail(options);
        }

        return await sendSmtpEmail(options);
    } catch (error) {
        const providerError = error.response?.data
            ? JSON.stringify(error.response.data)
            : error.message;

        console.error("Email Error:", providerError);
        throw new Error(`Failed to send email: ${providerError}`);
    }
};

module.exports = sendEmail;
