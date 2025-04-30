const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // <-- CHANGE THIS
        pass: 'your-email-password'   // <-- CHANGE THIS
    }
});

// GET: Show register page
router.get('/register', (req, res) => {
    res.render('register');
});

// POST: Handle user registration
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, email, password } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : '/images/default-profile.png';

    if (password.length < 8) {
        return res.send('Password must be at least 8 characters.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.send('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const emailToken = crypto.randomBytes(64).toString('hex');

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        profilePicture,
        emailToken,
        isVerified: false
    });

    await newUser.save();

    const verificationUrl = `http://localhost:3000/verify-email?token=${emailToken}`;

    await transporter.sendMail({
        to: email,
        subject: 'Verify your email',
        html: `<h2>Hello ${username}</h2><p>Please verify your email by clicking the following link: <a href="${verificationUrl}">Verify Email</a></p>`
    });

    res.send('Registration successful! Please check your email to verify your account.');
});

// GET: Verify email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    const user = await User.findOne({ emailToken: token });
    if (!user) {
        return res.send('Invalid or expired token.');
    }

    user.emailToken = null;
    user.isVerified = true;
    await user.save();

    res.send('Email verified! You can now log in.');
});

// GET: Show login page
router.get('/login', (req, res) => {
    res.render('login');
});

// POST: Handle login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.send('No user found with that email.');
    }

    if (!user.isVerified) {
        return res.send('Please verify your email first.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.send('Incorrect password.');
    }

    req.session.userId = user._id;
    res.redirect('/chat');
});

// GET: Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
