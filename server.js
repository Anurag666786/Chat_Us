require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat'); // ✅ Added chat route

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false
}));

// View engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => res.redirect('/login'));
app.use('/', authRoutes);
app.use('/user', userRoutes);
app.use('/chat', chatRoutes); // ✅ Mount /chat route

// Socket.IO
const users = {};

io.on('connection', socket => {
    console.log('User connected');

    socket.on('joinRoom', ({ username = 'Guest', room }) => {
        socket.join(room);
        users[socket.id] = { username, room };

        socket.to(room).emit('chatMessage', {
            username: 'System',
            message: `${username} joined the chat`,
            time: new Date()
        });
    });

    socket.on('chatMessage', ({ message, media }) => {
        const user = users[socket.id];
        if (user) {
            const msgData = {
                username: user.username,
                message,
                media: media ? { url: media.data, type: media.type } : null,
                time: new Date()
            };
            io.to(user.room).emit('chatMessage', msgData);
        }
    });

    socket.on('typing', () => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.room).emit('typing', { username: user.username });
        }
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('chatMessage', {
                username: 'System',
                message: `${user.username} left the chat`,
                time: new Date()
            });
            delete users[socket.id];
        }
    });
});

// Port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
