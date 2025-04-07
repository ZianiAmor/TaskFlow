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
    const filteredInvites = Array.isArray(inviteUsernames) 
      ? inviteUsernames.filter(u => u && u.trim()) 
      : [];

    // Find the invited users by username
    const invitedUsers = await Promise.all(
      filteredInvites.map(username => User.findOne({ username }))
    );
    
    // Filter out null results (usernames that don't exist)
    const validInvitedUserIds = invitedUsers
      .filter(u => u)
      .map(u => u._id);
    
    // Keep track of which usernames were found/not found
    const foundUsernames = invitedUsers
      .filter(u => u)
      .map(u => u.username);
    
    const notFoundUsernames = filteredInvites.filter(username => 
      !foundUsernames.includes(username)
    );

    // Create room and add both the creator and invited users as participants
    const room = new ChatRoom({
      name: name.trim(),
      participants: [req.user._id, ...validInvitedUserIds],
      invitedUsernames: filteredInvites
    });

    await room.save();
    const populatedRoom = await ChatRoom.findById(room._id).populate('participants', 'username');
    
    // If some usernames weren't found, include that in the response
    const response = {
      ...populatedRoom.toObject(),
      notFoundUsernames: notFoundUsernames.length > 0 ? notFoundUsernames : undefined
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({ error: error.message });
  }
};

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
    
    // Handle comma-separated usernames
    const usernames = username.split(',').map(u => u.trim()).filter(u => u);
    
    const results = {
      added: [],
      notFound: []
    };
    
    for (const name of usernames) {
      const userToAdd = await User.findOne({ username: name });
      
      if (!userToAdd) {
        results.notFound.push(name);
        continue;
      }
      
      await ChatRoom.findByIdAndUpdate(
        roomId,
        { $addToSet: { participants: userToAdd._id } },
        { new: true }
      );
      
      results.added.push(name);
    }
    
    const updatedRoom = await ChatRoom.findById(roomId).populate('participants', 'username');
    
    res.status(200).json({
      room: updatedRoom,
      results
    });
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

    res.status(200).json(messages);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
};