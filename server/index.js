const express = require("express");
const port = process.env.PORT || 5000;
const connectToMongo = require("./db");
const cors = require("cors");

// creating a webRTC connection for real time updates and one for normal connection to the server
const http = require("http");
const socketIo = require("socket.io");
const { userSockets } = require("./common");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(cors());
// connecting database
connectToMongo();


// Handle HTTP requests
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/auth", require("./routes/user/auth"));
app.use("/api/task", require("./routes/task/index"));
app.use("/api/sub-task", require("./routes/subtask/index"));

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle events
  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Remove the socket ID from the userSockets object when a user disconnects
    const userId = userSockets[socket.id];
    if (userId) {
      delete userSockets[socket.id];
      console.log(`Socket disconnected for user ${userId}`);
    }
  });

  socket.on("userId", (userId) => {
    userSockets[socket.id] = userId;
    console.log(`Socket connected for user ${userId}`);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


module.exports = io ;
