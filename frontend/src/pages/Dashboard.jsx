import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ClipboardList, MessageSquare, Compass, User } from "lucide-react";
import "./styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

// Import components
import Tasks from "./Tabs/Tasks.jsx";
import Projects from "./Tabs/Projects.jsx";
import Chat from "./Tabs/Chat.jsx";
import Discover from "./Tabs/Discover.jsx";
import Me from "./Tabs/Me.jsx";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  const tabs = [
    { id: "tasks", label: "Tasks", icon: <ClipboardList /> },
    { id: "projects", label: "Projects", icon: <Home /> },
    { id: "chat", label: "Chat", icon: <MessageSquare /> },
    { id: "discover", label: "Discover More", icon: <Compass /> },
    { id: "me", label: "Me", icon: <User /> },
  ];

  const renderContent = () => {
    if (!user) return null; // Wait for user load
    
    switch (activeTab) {
      case 'tasks': return <Tasks user={user} />;
      case 'projects': return <Projects user={user} />;
      case 'chat': return <Chat user={user} />;
      case 'discover': return <Discover user={user} />;
      case 'me': return <Me user={user} />;
      default: return <Tasks user={user} />;
    }
  };
  

  return (
    <div className="dashboardContainer">
      
      <div className="sidebar">
        <h1 className="sidebarTitle">TaskFlow</h1>
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            className={`sidebarButton ${
              activeTab === tab.id ? "sidebarButtonActive" : ""
            }`}
          >
            {tab.icon}
            <span className="sidebarButtonText">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="mainContent">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="card"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}
