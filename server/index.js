import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/taskRoutes.js";
import { verifyTokenSocket } from "./middleware/auth.js";
import ChatMessage from "./models/ChatMessage.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

const createRedisClient = async () => {
  try {
    const redisUrl = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    const client = createClient({ url: redisUrl });
    client.on("error", (err) => console.error("Redis Error:", err));
    await client.connect();
    return client;
  } catch (err) {
    console.error("Redis connection failed:", err);
    process.exit(1);
  }
};

const initializeSocketIO = async (pubClient, subClient) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: No token"));
    try {
      const user = await verifyTokenSocket(token);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    // In Socket.IO handler:
socket.on("chatMessage", async (data, callback) => {
  try {
    // Validate required fields
    if (!data.roomId || !data.message?.trim()) {
      return callback({ error: "Missing room ID or message" });
    }

    // Save to MongoDB
    const message = new ChatMessage({
      room: data.roomId,
      sender: socket.user._id,
      text: data.message.trim(),
      project: data.project || null,
    });

    const savedMessage = await message.save();
    
    // Populate sender details
    const fullMessage = await ChatMessage.findById(savedMessage._id)
    .populate({
      path: "sender",
      select: "username _id",
    })
    .populate({
      path: "room",
      select: "_id",
    })
    .lean();

  // Add historical flag
  fullMessage.isHistorical = false;
  
  io.to(data.roomId).emit("newMessage", fullMessage);
  callback();

  } catch (error) {
    console.error("SAVE ERROR:", error);
    callback({ error: "Failed to save message" });
  }
});

    socket.on("disconnect", () => {});
  });
};

const startServer = async () => {
  await connectMongoDB();
  const pubClient = await createRedisClient();
  const subClient = pubClient.duplicate();
  await subClient.connect();
  await initializeSocketIO(pubClient, subClient);
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

startServer();