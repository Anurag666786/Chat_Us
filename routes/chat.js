const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/authMiddleware');

// GET: Chatroom page
router.get('/', isAuth, (req, res) => {
    res.render('chat', { username: req.session.username });
});

module.exports = router;
