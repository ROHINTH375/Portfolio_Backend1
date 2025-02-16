const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Message = require("./models/Message");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

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
app.listen(5000, () => console.log("Server running on port 5000"));
