// server/models/ChatMessage.js
import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true ,      index: true 
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    project: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
      name: { type: String },
      totalTime: { type: Number },
      notes: [
        {
          header: { type: String, required: true },
          comments: [
            {
              text: { type: String, required: true },
              attachments: [String],
            },
          ],
        },
      ],
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
export default ChatMessage;
