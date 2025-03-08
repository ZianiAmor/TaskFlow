//server/routes/chat.js
import express from "express";
import {
  createRoom,
  getRooms,
  addParticipant,
  removeParticipant,
  deleteRoom,
  getRoomParticipants,
  getRoomMessages,
} from "../controllers/chatController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Room endpoints
router.post("/room", auth, createRoom);
router.get("/rooms/:userId", auth, getRooms);
router.delete("/:roomId", auth, deleteRoom);

// Participant endpoints
router.get("/:roomId/participants", auth, getRoomParticipants);
router.post("/:roomId/invite", auth, addParticipant);
router.post("/:roomId/remove", auth, removeParticipant);

// Message endpoints
router.get("/messages/:roomId", auth, getRoomMessages);

export default router;