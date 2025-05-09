const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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

// GET: Show register page
router.get('/register', (req, res) => {
    res.render('register');
});

// POST: Handle user registration
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, password } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : '/images/default-profile.png';

    if (password.length < 8) {
        return res.send('Password must be at least 8 characters.');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.send('Username already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
        username,
        password: hashedPassword,
        profilePicture
    });

    await newUser.save();

    res.send('Registration successful! You can now log in.');
});

// GET: Show login page
router.get('/login', (req, res) => {
    res.render('login');
});

// POST: Handle login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.send('No user found with that username.');
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
