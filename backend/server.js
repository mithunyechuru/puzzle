const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;

// Enable CORS for HTTP routes
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json());

// Diagnostic endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io with CORS configured
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Bind Socket.io logic
const registerSocketHandlers = require("./src/socketHandler");
registerSocketHandlers(io);

// Start server listening
server.listen(port, () => {
  console.log(`=========================================`);
  console.log(`Puzzle Quest Backend Running on Port ${port}`);
  console.log(`=========================================`);
});
