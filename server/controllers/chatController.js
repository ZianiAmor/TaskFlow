// server/controllers/chatController.js
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";

export const createRoom = async (req, res) => {
  try {
    const { name, inviteUsernames } = req.body;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: "Room name must be at least 3 characters" });
    }
    
    // Filter out empty strings
    const filteredInvites = inviteUsernames?.filter(u => u.trim()) || [];

    // Find the invited users by username
    const invitedUsers = await Promise.all(
      filteredInvites.map(username => User.findOne({ username }))
    );
    const validInvitedUserIds = invitedUsers.filter(u => u).map(u => u._id);

    // Create room and add both the creator and invited users as participants
    const room = new ChatRoom({
      name: name.trim(),
      participants: [req.user._id, ...validInvitedUserIds],
      invitedUsernames: filteredInvites
    });

    await room.save();
    const populatedRoom = await ChatRoom.findById(room._id).populate('participants', 'username');
    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({ error: error.message });
  }
};
// server/controllers/chatController.js
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findById(roomId);
    
    if (!room.participants.some(p => p.equals(req.user._id))) {
      return res.status(403).json({ error: "Not authorized to delete this room" });
    }

    await ChatMessage.deleteMany({ room: roomId });
    await ChatRoom.findByIdAndDelete(roomId);
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoomParticipants = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId)
      .populate('participants', 'username');
    res.status(200).json(room.participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.params.userId })
      .populate('participants', 'username');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username } = req.body;
    const userToAdd = await User.findOne({ username });
    if (!userToAdd) return res.status(404).json({ error: "User not found" });

    const room = await ChatRoom.findByIdAndUpdate(
      roomId,
      { $addToSet: { participants: userToAdd._id } },
      { new: true }
    );
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username } = req.body;
    const userToRemove = await User.findOne({ username });
    if (!userToRemove) return res.status(404).json({ error: "User not found" });

    const room = await ChatRoom.findByIdAndUpdate(
      roomId,
      { $pull: { participants: userToRemove._id } },
      { new: true }
    );
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Modify saveMessage to store full project details
export const saveMessage = async (data) => {
  try {
    const message = new ChatMessage({
      room: data.roomId,
      sender: data.senderId,
      text: data.message,
      project: data.project ? {
        id: data.project._id,
        name: data.project.name,
        totalTime: data.project.totalTime,
        notes: data.project.notes,
        progress: data.project.progress
      } : null
    });
    
    await message.save();
    return await message.populate('sender', 'username');
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ room: req.params.roomId })
      .populate("sender", "username _id")
      .sort({ createdAt: 1 })
      .lean();

    console.log("SENDING MESSAGES:", messages.slice(0, 1)); // Log first message
    res.status(200).json(messages);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
};
