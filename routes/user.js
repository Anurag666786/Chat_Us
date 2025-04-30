const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET: User Profile Page
router.get('/profile', isAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/login');
        }
        res.render('profile', { user });
    } catch (err) {
        console.log(err);
        res.redirect('/login');
    }
});

module.exports = router;
