import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./Chat.css";
import { useNavigate } from "react-router-dom";

const Chat = ({ user }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [roomParticipants, setRoomParticipants] = useState([]);
  const navigate = useNavigate();


  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    
    try {
      await axiosInstance.delete(`/api/chat/${roomId}`);
      setRooms(prev => prev.filter(r => r._id !== roomId));
      if (selectedRoom?._id === roomId) setSelectedRoom(null);
    } catch (error) {
      console.error("Room deletion error:", error);
    }
  };


  const API_URL = "http://localhost:5000";
  const isConnected = connectionStatus === "connected";

  // Create an axios instance with authentication
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${user?.token}`
    }
  });

  // Store selected room persistently (default to first room if available)
  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms, selectedRoom]);

  // Fetch rooms for the user
  useEffect(() => {
    if (!user?._id) return;
    const fetchRooms = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/chat/rooms/${user._id}`);
        setRooms(data);
      } catch (error) {
        console.error("Room fetch error:", error);
      }
    };
    fetchRooms();
  }, [user?._id, user?.token]);

  // Fetch room participants when a room is selected
  useEffect(() => {
    if (!selectedRoom) return;
    const fetchParticipants = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/api/chat/${selectedRoom._id}/participants`
        );
        setRoomParticipants(data);
      } catch (error) {
        console.error("Participants fetch error:", error);
      }
    };
    fetchParticipants();
  }, [selectedRoom, user?.token]);

  // Socket initialization (only once per user)
  useEffect(() => {
    if (!user?.token) return;

    const socket = io(API_URL, {
      auth: { token: user.token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      withCredentials: true,
      secure: process.env.NODE_ENV === "production",
      rejectUnauthorized: false,
      timeout: 10000
    });

    socketRef.current = socket;

    const handleError = (err) => {
      console.error("Socket error:", err);
      setConnectionStatus("error");
    };

    const handleConnect = () => {
      console.log("Socket connected");
      setConnectionStatus("connected");
      // When reconnecting, if a room is selected, rejoin and re-fetch messages
      if (selectedRoom) {
        socket.emit("joinRoom", selectedRoom._id);
        axiosInstance
          .get(`/api/chat/messages/${selectedRoom._id}`)
          .then((res) => setMessages(res.data))
          .catch((err) => console.error("Reconnect fetch error:", err));
      }
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
      setConnectionStatus("disconnected");
      if (reason === "io server disconnect") {
        socket.connect();
      }
    };

    const handleConnectError = (err) => {
      setConnectionStatus(`error: ${err.message}`);
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus("reconnecting");
    };

    socket.on("connect_error", handleError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect_attempt", handleReconnectAttempt);

    // Listen for new messages (add only if not already in state)
    socket.on("newMessage", (message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        return exists ? prev : [...prev, message];
      });
    });

    return () => {
      socket.disconnect();
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("newMessage");
    };
  }, [user?.token]); // Note: selectedRoom is not included here to keep the socket persistent

  // Fetch messages for the selected room
  useEffect(() => {
    if (!selectedRoom?._id) return;

    const controller = new AbortController();
    const loadMessages = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/api/chat/messages/${selectedRoom._id}`,
          { signal: controller.signal, params: { _: new Date().getTime() } } // cache buster
        );
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("LOAD ERROR:", error);
        }
      }
    };

    // Always join the room (even if socket isn't connected yet)
    if (socketRef.current) {
      socketRef.current.emit("joinRoom", selectedRoom._id);
    }
    loadMessages();

    return () => {
      controller.abort();
    };
  }, [selectedRoom?._id, user?.token]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch projects
  useEffect(() => {
    if (!user?._id) return;
    const fetchProjects = async () => {
      try {
        const { data } = await axiosInstance.get("/api/tasks", {
          params: { userId: user._id ,completed:false }
        });
        // Filter projects on the frontend
        const projectsOnly = data.filter(task => task.isProject);
        setProjects(projectsOnly);
      } catch (error) {
        console.error("Project fetch error:", error);
      }
    };
    fetchProjects();
  }, [user]);

  // Check authentication on mount
  useEffect(() => {
    if (!user?.token) navigate("/login");
  }, [user, navigate]);

  // Window reload handler to disconnect the socket
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Updated function to handle comma-separated usernames
  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      // Parse comma-separated usernames into an array and trim whitespace
      const usernameList = inviteUsername.split(',')
        .map(username => username.trim())
        .filter(username => username.length > 0);
      
      const { data } = await axiosInstance.post("/api/chat/room", {
        name: roomName.trim(),
        inviteUsernames: usernameList
      });
      
      setRooms((prev) => [...prev, data]);
      setRoomName("");
      setInviteUsername("");
    } catch (error) {
      console.error("Room creation error:", error);
      alert(`Failed to create room: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSendMessage = () => {
    if (!isConnected || !selectedRoom || !newMessage.trim()) return;
  
    const selectedProj = projects.find((p) => p._id === selectedProject);
    
    // Calculate total time from progress array
    const totalTime = selectedProj?.progress?.reduce((sum, day) => sum + day.hours, 0) || 0;
  
    const payload = {
      roomId: selectedRoom._id,
      message: newMessage.trim(),
      ...(selectedProj && {
        project: {
          ...selectedProj,
          totalTime,
          // Include nested notes and progress
          notes: selectedProj.notes || [],
          progress: selectedProj.progress || []
        }
      })
    };
  
    socketRef.current.emit("chatMessage", payload, (error) => {
      if (!error) {
        setNewMessage("");
        setSelectedProject("");
      } else {
        console.error("Message send error:", error);
      }
    });
  };
  
  return (
    <div className="chat-container">
      <div className="connection-status" data-status={connectionStatus}>
        Status: {{
          connected: "🟢 Connected",
          disconnected: "🔴 Disconnected",
          reconnecting: "🟠 Reconnecting...",
          error: "🔴 Error"
        }[connectionStatus.split(":")[0]] || "⚪ Connecting..."}
      </div>

      <div className="room-creation">
        <h3>Create Chat Room</h3>
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          disabled={!isConnected}
        />
        <input
          type="text"
          placeholder="Invite Friends (comma-separated: adam,ayman,yahia)"
          value={inviteUsername}
          onChange={(e) => setInviteUsername(e.target.value)}
          disabled={!isConnected}
        />
        <button onClick={handleCreateRoom} disabled={!isConnected || !roomName.trim()}>
          Create Room
        </button>
      </div>

      <div className="chat-main">
        <div className="rooms-list">
          <h3>Your Rooms</h3>
          {rooms.map((room) => (
            <div
              key={room._id}
              className={`room-item ${selectedRoom?._id === room._id ? "active" : ""}`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="room-header">
                <span>{room.name}</span>
                <button
                  className="delete-room-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoom(room._id);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="participants-list">
                Participants: {room.participants?.map((p) => p.username).join(", ")}
              </div>
            </div>
          ))}
        </div>
        <div className="chat-area">
          {selectedRoom ? (
            <>
              <div className="chat-header">
                <h3>{selectedRoom.name}</h3>
                <div className="current-participants">
                  Online: {roomParticipants.map((p) => p.username).join(", ")}
                </div>
              </div>
              <div className="messages">
              {messages.map((msg) => {
  const isOwnMessage = msg.sender?._id === user?._id;
  const senderName = msg.sender?.username || "Unknown User";
  const messageText = msg.text || "[Message not available]";
  return (
    <div key={msg._id} className={`message ${isOwnMessage ? "own" : ""}`}>
      <div className="message-header">
        <span className="sender">{senderName}:</span>
        {msg.createdAt && (
          <span className="timestamp">
            {new Date(msg.createdAt).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="message-body">
        <span className="text">{messageText}</span>
        {msg.project && (
          <div className="project-details">
            <div className="project-summary">
              <h4>{msg.project.name || "Unnamed Project"}</h4>
              <p className="total-time">
                Total Time: <span>{msg.project.totalTime}h</span>
              </p>
            </div>
            
            {msg.project.notes?.length > 0 && (
              <div className="notes-section">
                <h5 className="notes-txt">Notes</h5>
                {msg.project.notes.map((note, noteIndex) => (
                  <div key={noteIndex} className="note">
                    <div className="note-header">{note.header}</div>
                    {note.comments?.map((comment, commentIndex) => (
                      <div key={commentIndex} className="comment">
                        <p className="comment-txt">{comment.text}</p>
                        {comment.attachments?.length > 0 && (
                          <div className="attachments">
                            {comment.attachments.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment"
                              >
                                Attachment {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {msg.project.progress?.length > 0 && (
              <div className="progress-section">
                <h5>Daily Progress</h5>
                {msg.project.progress.map((day, index) => (
                  <div key={index} className="progress-day">
                    <span className="date">
                      {new Date(day.day).toLocaleDateString()}:
                    </span>
                    <span className="hours">{day.hours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
})}
                <div ref={messagesEndRef} />
              </div>
              <div className="message-input">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={!isConnected}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={!isConnected}
                >
                  <option value="">Attach Project</option>
                  {projects.map((proj) => (
                    <option key={proj._id} value={proj._id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                <button onClick={handleSendMessage} disabled={!isConnected || !selectedRoom || !newMessage.trim()}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-room">Select a room to start chatting</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;