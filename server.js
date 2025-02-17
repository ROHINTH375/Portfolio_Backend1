const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Message = require("./models/Message");
const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",  // Allow frontend origin
  methods: ["GET", "POST"],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],  // Ensure WebSocket support
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
app.use(bodyParser.json());

const mongoURI = process.env.MONGO_URI; // ✅ Read from .env

if (!mongoURI) {
  console.error("❌ MONGO_URI is missing! Check your .env file.");
  process.exit(1); // Stop the server if the URI is missing
}

// ✅ Connect to MongoDB
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

  
// API to send and save messages
app.post("/send-message", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();
    res.status(201).json({ success: true, message: "Message saved!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to get all messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Chat Schema
const ChatSchema = new mongoose.Schema(
  {
    name: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "chats" }
);

const Chat = mongoose.model("Chat", new mongoose.Schema({ name: String, message: String }));
Chat.find().then(console.log);
// API to Get Previous Messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Chat.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io Real-time Messaging
io.on("connection", (socket) => {
  console.log("A recruiter connected!");

  socket.on("sendMessage", async (data) => {
    const { name, message } = data;
    const newMessage = new Chat({ name, message });
    await newMessage.save();

    io.emit("receiveMessage", newMessage);
  });

  socket.on("sendMessage", async (data) => {
    console.log("Received Message:", data); // ✅ Debugging
    const { name, message } = data;
    const newMessage = new Chat({ name, message });
    await newMessage.save();
    io.emit("receiveMessage", newMessage);
  });
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Check if data is coming properly
    console.log("Received Data:", req.body);

    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    console.log("Message saved successfully in database");

    res.status(201).json({ success: true, message: "Message saved successfully" });
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ success: false, error: "Failed to save message" });
  }
});
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
