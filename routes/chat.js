// routes/chat.js
const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/authMiddleware');

// GET: Chatroom page
router.get('/', isAuth, (req, res) => {
    res.render('chat', { username: req.session.username });
});

// Optionally handle media uploads here if needed

module.exports = router;
