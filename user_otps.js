const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// ✅ User Model
const User = require('../models/User');

// ✅ OTP User Schema
const OTPUser = mongoose.models.OTPUser || mongoose.model('OTPUser', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: String,
  otpExpires: Date,
  createdFrom: String,
  registeredApps: [String]
}), 'otp_users');

// ✅ Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

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

    // ✅ Send OTP via Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false  // ✅ Fix for self-signed certificate
      }
    });

    await transporter.sendMail({
      from: `"DanceKatta" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for DanceKatta',
      text: `Your OTP is: ${otp}`
    });

    console.log(`✅ OTP sent to ${email}: ${otp}`);
    return res.status(200).json({ message: 'OTP sent!' });
  } catch (err) {
    console.error('❌ Error sending OTP:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Verify OTP and Create User if Needed
router.post('/verify-otp', async (req, res) => {
  const { email, otp, firstName = '', lastName = '' } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const otpRecord = await OTPUser.findOne({ email });

    if (!otpRecord || otpRecord.otp !== otp || new Date() > otpRecord.otpExpires) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    otpRecord.otp = null;
    otpRecord.otpExpires = null;
    await otpRecord.save();

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        firstName,
        lastName,
        mobile: '',
        altMobile: '',
        guardianName: '',
        guardianMobile: '',
        guardianEmail: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        isProfessional: '',
        experience: '',
        skills: [],
        profilePhoto: '',
      });

      await user.save();
    }

    return res.status(200).json({
      message: 'OTP verified successfully',
      user
    });

  } catch (err) {
    console.error('❌ Error verifying OTP:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;