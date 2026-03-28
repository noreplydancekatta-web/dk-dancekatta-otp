const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const sendWelcomeEmail = require('./sendEmail');

const User = require('./User');

const OTPUser = mongoose.models.OTPUser || mongoose.model('OTPUser', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: String,
  otpExpires: Date,
  createdFrom: String,
  registeredApps: [String]
}), 'otp_users');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

// ✅ Send OTP — /api/signup/send-otp
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@'))
    return res.status(400).json({ message: 'Invalid email format' });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    let otpUser = await OTPUser.findOne({ email });

    if (!otpUser) {
      otpUser = new OTPUser({
        email,
        createdFrom: 'DanceKatta',
        registeredApps: ['DanceKatta'],
        otp,
        otpExpires: expires,
      });
    } else {
      otpUser.otp = otp;
      otpUser.otpExpires = expires;
      if (!otpUser.registeredApps.includes('DanceKatta'))
        otpUser.registeredApps.push('DanceKatta');
    }

    await otpUser.save();

    await createTransporter().sendMail({
      from: `"DanceKatta" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for DanceKatta',
      text: `Your OTP is: ${otp}`,
    });

    console.log(`✅ OTP sent to ${email}: ${otp}`);
    return res.status(200).json({ message: 'OTP sent!' });
  } catch (err) {
    console.error('❌ Error sending OTP:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Verify OTP — /api/signup/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const otpRecord = await OTPUser.findOne({ email });

    if (!otpRecord || otpRecord.otp !== otp || new Date() > otpRecord.otpExpires)
      return res.status(401).json({ message: 'Invalid or expired OTP' });

    otpRecord.otp = null;
    otpRecord.otpExpires = null;
    await otpRecord.save();

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('❌ Error verifying OTP:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Register Full User — /api/signup/register-full
router.post('/register-full', async (req, res) => {
  const {
    firstName, lastName, email, mobile, altMobile, dateOfBirth,
    guardianName, guardianMobile, guardianEmail,
    address, city, state, country, pincode,
    youtubeLink, facebookLink, instagramLink,
    isProfessional, experience, skills, profilePhoto,
  } = req.body;

  if (!email || !firstName || !lastName)
    return res.status(400).json({ message: 'firstName, lastName, and email are required' });

  try {
    let user = await User.findOne({ email });

    if (user) {
      Object.assign(user, {
        firstName, lastName, mobile, altMobile, dateOfBirth,
        guardianName, guardianMobile, guardianEmail,
        address, city, state, country, pincode,
        youtubeLink, facebookLink, instagramLink,
        isProfessional, experience, skills,
        ...(profilePhoto && { profilePhoto }),
      });
    } else {
      user = new User({
        firstName, lastName, email, mobile, altMobile, dateOfBirth,
        guardianName, guardianMobile, guardianEmail,
        address, city, state, country, pincode,
        youtubeLink, facebookLink, instagramLink,
        isProfessional, experience, skills,
        profilePhoto: profilePhoto || '',
      });
    }

    await user.save();

    // ✅ Use your existing sendWelcomeEmail from sendEmail.js
    await sendWelcomeEmail({ email: user.email, firstName: user.firstName });

    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error('❌ Error registering user:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;