const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        const emailUser = process.env.EMAIL_USER?.trim();
        const emailPass = process.env.EMAIL_PASS?.trim();

        if (!emailUser || !emailPass) {
            throw new Error('Email credentials not configured in environment variables');
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        const mailOptions = {
            from: `"AI Cold Mail Generator" <${emailUser}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">${options.message
                .split('\n')
                .map((line) => `<p style="margin:0 0 10px">${line}</p>`)
                .join('')}</div>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return { success: true, message: 'Email sent successfully', messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = sendEmail;
