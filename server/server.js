const express = require('express');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect('mongodb://localhost:27017/happyplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const MessageSchema = new mongoose.Schema({
    user: String,
    text: String,
    type: String,
    fileUrl: String,
    fileName: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.post('/api/messages', async (req, res) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).send(message);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    res.json({
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname
    });
});

app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort('timestamp');
        res.send(messages);
    } catch (error) {
        res.status(500).send(error);
    }
});

const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('sendMessage', async (message) => {
        try {
            const newMessage = new Message(message);
            await newMessage.save();
            io.emit('newMessage', newMessage);
        } catch (error) {
            console.error(error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
