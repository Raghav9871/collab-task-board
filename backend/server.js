const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const logRoutes = require('./routes/logRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://collab-task-board.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  },
});

app.use(cors({
  origin: "https://collab-task-board-mraon82j7-raghav-s-projects-2a0c20b2.vercel.app",
  credentials: true
}));
app.use(express.json());
app.use('/api/logs', logRoutes);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('MongoDB connected');
  server.listen(process.env.PORT || 5000, () => {
    console.log('Server running on port', process.env.PORT || 5000);
  });
})
.catch(err => console.error(err));

module.exports = io;

require('./socket');
