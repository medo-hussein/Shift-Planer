import nodemailer from "nodemailer";
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};


// Send reset password email
export const sendResetPasswordEmail = async (email, resetUrl) => {
    try {
        const transporter = createTransporter();
        const logoPath = path.join(__dirname, '..', 'assets', 'logo.png')
        const logoExists = fs.existsSync(logoPath)

        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: "Password Reset Request - Tadber Shift Planner",
            attachments: logoExists ? [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'tadber-logo'
                }
            ] : [],
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F9F7F7;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DBE2EF; border-radius: 10px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #19283a; padding: 20px; text-align: center;">
            <img src="${logoExists ? 'cid:tadber-logo' : ''}" alt="Tadber Logo" style="max-width: 150px; height: auto;" />
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <h1 style="color: #112D4E; font-size: 24px; margin-bottom: 15px; text-align: center; font-weight: bold;">
                Password Reset Request
            </h1>

            <p style="color: #3F72AF; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
                We received a request to reset your password for your <strong>Tadber Shift Planner</strong> account.
            </p>

            <p style="color: #112D4E; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                If you made this request, click the button below to reset your password:
            </p>

            <!-- Reset Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #19283a; color: #ffffff; padding: 12px 30px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 5px; display: inline-block; transition: background-color 0.3s;">
                    Reset Password
                </a>
            </div>

            <p style="color: #112D4E; font-size: 14px; line-height: 1.6;">
                This link will expire in <strong>10 minutes</strong> for security reasons. If you didn't request this reset, please ignore this email.
            </p>

            <p style="color: #3F72AF; font-size: 14px; margin-top: 30px; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #3F72AF; word-break: break-all;">${resetUrl}</a>
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9F7F7; padding: 20px; text-align: center; border-top: 1px solid #DBE2EF;">
            <p style="color: #112D4E; font-size: 14px; margin: 0;">
                © 2025 Tadber Shift Planner. All rights reserved.
            </p>
            <p style="color: #3F72AF; font-size: 12px; margin: 5px 0 0 0;">
                This is an automated email, please do not reply.
            </p>
        </div>
    </div>
</body>
</html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        // console.log("Reset email sent to:", email);
        return info;
    } catch (err) {
        console.error("emailService error:", err);
        throw err;
    }
};

// Send OTP verification email
export const sendOTPEmail = async (email, otpCode, type = "email_verification") => {
    try {
        const transporter = createTransporter();
        const logoPath = path.join(__dirname, '..', 'assets', 'logo.png')
        const logoExists = fs.existsSync(logoPath)

        const subjectMap = {
            email_verification: "Email Verification - Tadber Shift Planner",
            password_reset: "Password Reset OTP - Tadber Shift Planner",
            phone_verification: "Phone Verification - Tadber Shift Planner"
        };

        const titleMap = {
            email_verification: "Verify Your Email Address",
            password_reset: "Password Reset Verification",
            phone_verification: "Verify Your Phone Number"
        };

        const messageMap = {
            email_verification: "To complete your registration, please use the following verification code:",
            password_reset: "To reset your password, please use the following verification code:",
            phone_verification: "To verify your phone number, please use the following verification code:"
        };

        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: subjectMap[type] || "Verification Code - Tadber Shift Planner",
            attachments: logoExists ? [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'tadber-logo'
                }
            ] : [],
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F9F7F7;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DBE2EF; border-radius: 10px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #19283a; padding: 20px; text-align: center;">
            <img src="${logoExists ? 'cid:tadber-logo' : ''}" alt="Tadber Logo" style="max-width: 150px; height: auto;" />
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <h1 style="color: #112D4E; font-size: 24px; margin-bottom: 15px; text-align: center; font-weight: bold;">
                ${titleMap[type] || "Verification Code"}
            </h1>

            <p style="color: #3F72AF; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
                ${messageMap[type] || "Please use the following verification code:"}
            </p>

            <!-- OTP Code Display -->
            <div style="background-color: #F0F4F8; border: 2px dashed #3F72AF; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #112D4E; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${otpCode}
                </div>
            </div>

            <p style="color: #112D4E; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>10 minutes</strong> for security reasons.
            </p>

            <p style="color: #3F72AF; font-size: 14px; margin-top: 30px; text-align: center;">
                If you didn't request this verification, please ignore this email.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9F7F7; padding: 20px; text-align: center; border-top: 1px solid #DBE2EF;">
            <p style="color: #112D4E; font-size: 14px; margin: 0;">
                © 2025 Tadber Shift Planner. All rights reserved.
            </p>
            <p style="color: #3F72AF; font-size: 12px; margin: 5px 0 0 0;">
                This is an automated email, please do not reply.
            </p>
        </div>
    </div>
</body>
</html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("OTP email sent to:", email);
        return info;
    } catch (err) {
        console.error("sendOTPEmail error:", err);
        throw err;
    }
};

// Send Contact Form Email to Admin
export const sendContactFormEmail = async ({ name, email, phone, message }) => {
    try {
        const transporter = createTransporter();
        const logoPath = path.join(__dirname, '..', 'assets', 'logo.png')
        const logoExists = fs.existsSync(logoPath)

        const mailOptions = {
            to: process.env.EMAIL_USER, // Send to Admin (System Email)
            from: process.env.EMAIL_USER,
            replyTo: email, // Allow replying directly to the user
            subject: `New Contact Message from ${name} - Tadber Shift Planner`,
            attachments: logoExists ? [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'tadber-logo'
                }
            ] : [],
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F9F7F7;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DBE2EF; border-radius: 10px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #19283a; padding: 20px; text-align: center;">
            <img src="${logoExists ? 'cid:tadber-logo' : ''}" alt="Tadber Logo" style="max-width: 150px; height: auto;" />
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <h1 style="color: #112D4E; font-size: 24px; margin-bottom: 15px; text-align: center; font-weight: bold;">
                New Contact Message
            </h1>

            <div style="background-color: #F0F4F8; border-left: 4px solid #3F72AF; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 5px 0; color: #112D4E;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 5px 0; color: #112D4E;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0; color: #112D4E;"><strong>Phone:</strong> ${phone || 'N/A'}</p>
            </div>

            <h3 style="color: #112D4E; margin-bottom: 10px;">Message:</h3>
            <div style="background-color: #ffffff; border: 1px solid #DBE2EF; border-radius: 5px; padding: 15px; color: #333; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
            </div>

            <p style="color: #3F72AF; font-size: 14px; margin-top: 30px; text-align: center;">
                You can reply directly to this email to contact the user.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9F7F7; padding: 20px; text-align: center; border-top: 1px solid #DBE2EF;">
            <p style="color: #112D4E; font-size: 14px; margin: 0;">
                © 2025 Tadber Shift Planner. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Contact form email sent from:", email);
        return info;
    } catch (err) {
        console.error("sendContactFormEmail error:", err);
        // Don't throw error to likely allow the DB save to succeed even if email fails
        // But for now let's just log it. 
        // In controller we can decide if we want to block response or not.
    }
};

// Send Reply Email to User
export const sendContactReplyEmail = async ({ to, subject, replyMessage, originalMessage }) => {
    try {
        const transporter = createTransporter();
        const logoPath = path.join(__dirname, '..', 'assets', 'logo.png')
        const logoExists = fs.existsSync(logoPath)

        const mailOptions = {
            to: to,
            from: process.env.EMAIL_USER,
            subject: subject || "Reply to your message - Tadber Shift Planner",
            attachments: logoExists ? [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'tadber-logo'
                }
            ] : [],
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reply from Tadber Team</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F9F7F7;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DBE2EF; border-radius: 10px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #19283a; padding: 20px; text-align: center;">
            <img src="${logoExists ? 'cid:tadber-logo' : ''}" alt="Tadber Logo" style="max-width: 150px; height: auto;" />
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <h1 style="color: #112D4E; font-size: 24px; margin-bottom: 15px; text-align: center; font-weight: bold;">
                Reply to your inquiry
            </h1>

            <p style="color: #112D4E; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hello,
            </p>

            <div style="background-color: #ffffff; border: 1px solid #DBE2EF; border-radius: 5px; padding: 15px; color: #333; line-height: 1.6; margin-bottom: 30px;">
                ${replyMessage.replace(/\n/g, '<br>')}
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                <p style="color: #888; font-size: 14px; margin-bottom: 10px;">Original Message:</p>
                <div style="background-color: #F8F9FA; padding: 15px; border-radius: 5px; color: #666; font-size: 14px; font-style: italic;">
                    "${originalMessage}"
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9F7F7; padding: 20px; text-align: center; border-top: 1px solid #DBE2EF;">
            <p style="color: #112D4E; font-size: 14px; margin: 0;">
                © 2025 Tadber Shift Planner. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Reply email sent to:", to);
        return info;
    } catch (err) {
        console.error("sendContactReplyEmail error:", err);
        throw err;
    }
};
