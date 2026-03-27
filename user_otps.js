// user_otps.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sendWelcomeEmail = require("./sendEmail");

const User = require("./User");

// ✅ OTP Schema
const OTPUser = mongoose.models.OTPUser || mongoose.model(
  'OTPUser',
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: String,
    otpExpires: Date,
    createdFrom: String,
    registeredApps: [String]
  }),
  'otp_users'
);
/* ========================
   LOGIN - SEND OTP
======================== */
router.post('/login-send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // ✅ For login, user MUST exist
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!existingUser) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    let otpUser = await OTPUser.findOne({ email });
    if (!otpUser) {
      otpUser = new OTPUser({ email, createdFrom: 'DanceKatta', registeredApps: ['DanceKatta'], otp, otpExpires: expires });
    } else {
      otpUser.otp = otp;
      otpUser.otpExpires = expires;
    }

    await otpUser.save();
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent!' });
  } catch (err) {
    console.error('❌ Login OTP error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ========================
   LOGIN - VERIFY OTP
======================== */
router.post('/login-verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const otpRecord = await OTPUser.findOne({ email: email.toLowerCase().trim() });

    if (!otpRecord) return res.status(401).json({ message: 'No OTP request found' });
    if (otpRecord.otp !== otp) return res.status(401).json({ message: 'Invalid OTP' });
    if (new Date() > otpRecord.otpExpires) return res.status(401).json({ message: 'OTP expired' });

    // ✅ Clear OTP
    otpRecord.otp = null;
    otpRecord.otpExpires = null;
    await otpRecord.save();

    // ✅ Return user object for login session
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Disabled check
    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Account disabled. Contact support.' });
    }

    return res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('❌ Login verify error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ========================
   SEND OTP
======================== */
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    let otpUser = await OTPUser.findOne({ email });
    if (!otpUser) {
      otpUser = new OTPUser({
        email,
        createdFrom: 'DanceKatta',
        registeredApps: ['DanceKatta'],
        otp,
        otpExpires: expires
      });
    } else {
      otpUser.otp = otp;
      otpUser.otpExpires = expires;
      if (!otpUser.registeredApps.includes('DanceKatta')) {
        otpUser.registeredApps.push('DanceKatta');
      }
    }

    await otpUser.save();
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent!' });
  } catch (err) {
    console.error('❌ Error sending OTP:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ========================
   VERIFY OTP
======================== */
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const otpRecord = await OTPUser.findOne({ email: email.toLowerCase().trim() });

    if (!otpRecord) {
      return res.status(401).json({ message: 'No OTP request found for this email' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    if (new Date() > otpRecord.otpExpires) {
      return res.status(401).json({ message: 'OTP has expired, please request a new one' });
    }

    // ✅ Clear OTP after successful verification
    otpRecord.otp = null;
    otpRecord.otpExpires = null;
    await otpRecord.save();

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('❌ Error verifying OTP:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ========================
   REGISTER USER
======================== */
router.post('/register', async (req, res) => {
  const { email, firstName = '', lastName = '' } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = new User({
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      mobile: '', altMobile: '',
      guardianName: '', guardianMobile: '', guardianEmail: '',
      address: '', city: '', state: '', country: '', pincode: '',
      isProfessional: '', experience: '', skills: [], profilePhoto: ''
    });

    await user.save();

    // ✅ Fire-and-forget welcome email
    sendWelcomeEmail(user)
      .then(() => console.log(`✅ Welcome email sent to ${email}`))
      .catch(err => console.error('❌ Welcome email error:', err));

    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error('❌ Error registering user:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// /* ========================
//    MANUAL SEND WELCOME EMAIL
// ======================== */
// router.post('/send-welcome-email', async (req, res) => {
//   const { email } = req.body;
//   if (!email || !email.includes('@')) {
//     return res.status(400).json({ message: 'Valid email is required' });
//   }

//   try {
//     const user = await User.findOne({ email: email.toLowerCase().trim() });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const emailSent = await sendWelcomeEmail(user);
//     if (emailSent) {
//       return res.status(200).json({ message: `Welcome email sent to ${email}` });
//     }
//     return res.status(500).json({ message: 'Failed to send email' });
//   } catch (err) {
//     console.error('❌ Error sending welcome email:', err);
//     return res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });

module.exports = router;