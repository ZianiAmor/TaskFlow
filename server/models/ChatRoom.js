// server/models/ChatRoom.js
import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    // Optional field to track invited usernames
    invitedUsernames: [String],
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);
export default ChatRoom;
