const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const shouldBypassOtp = process.env.SKIP_EMAIL_OTP === 'true';

const sendOtpEmail = async (user, otp) => {
  const message = [
    `Your OTP for AI Cold Mail Generator is: ${otp}`,
    '',
    'This OTP is valid for 10 minutes.',
    'If you did not request this, please ignore this email.'
  ].join('\n');

  await sendEmail({
    email: user.email,
    subject: 'Your OTP - AI Cold Mail Generator',
    message
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (userExists?.isVerified) {
      return res.status(400).json({ message: 'Email already registered. Please try logging in.' });
    }

    let user = userExists;
    if (user) {
      user.name = name.trim();
      user.password = password;
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.isVerified = false;
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        otp,
        otpExpiry,
        isVerified: false
      });
    }

    if (shouldBypassOtp) {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        message: 'Account created and verified successfully.'
      });
    }

    try {
      await sendOtpEmail(user, otp);
    } catch (error) {
      console.error('OTP email sending error:', error.message);
      return res.status(500).json({
        message: 'Could not send OTP email. Please check email configuration and try again.',
        error: error.message
      });
    }

    res.status(201).json({
      message: userExists ? 'OTP resent. Please verify your email.' : 'User registered successfully. Please verify OTP sent to your email.',
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified. Please login.' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please register again.' });
    }

    if (Date.now() > user.otpExpiry.getTime()) {
      return res.status(400).json({ message: 'OTP has expired. Please register again.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = Date.now() + 10 * 60 * 1000;
      await user.save();

      if (!shouldBypassOtp) {
        try {
          await sendOtpEmail(user, otp);
        } catch (error) {
          console.error('Login OTP email sending error:', error.message);
          return res.status(500).json({
            message: 'Could not send OTP email. Please check email configuration and try again.',
            error: error.message
          });
        }
      }

      return res.status(401).json({ 
        message: 'Please verify your email first. A new OTP has been sent.',
        userId: user._id
      });
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: 'Login successful!'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ message: 'User ID or email is required' });
    }

    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified. Please login.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (!shouldBypassOtp) {
      await sendOtpEmail(user, otp);
    }

    res.status(200).json({
      message: 'OTP sent successfully. Please check your email.',
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};
