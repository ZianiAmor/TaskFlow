import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ClipboardList, MessageSquare, Compass, User, LogOut, Menu, X } from "lucide-react";
import "./styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

// Import components


import Tasks from "./Tabs/Tasks";
import Projects from "./Tabs/Projects";
import Chat from "./Tabs/Chat";
import Discover from "./Tabs/Discover";
import Me from "./Tabs/Me";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    document.body.classList.toggle('sidebar-open', !sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
      document.body.classList.remove('sidebar-open');
    }
  };

  useEffect(() => {
    setLoading(true);
    const savedUser = localStorage.getItem("user");
    
    if (!savedUser) {
      navigate("/login");
      return;
    }
    
    setUser(JSON.parse(savedUser));
    setLoading(false);
  }, [navigate]);

  const tabs = [
    { id: "tasks", label: "Tasks", icon: <ClipboardList size={20} /> },
    { id: "projects", label: "Projects", icon: <Home size={20} /> },
    { id: "chat", label: "Chat", icon: <MessageSquare size={20} /> },
    { id: "discover", label: "Discover", icon: <Compass size={20} /> },
    { id: "me", label: "Me", icon: <User size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (!user) return null;
    
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
      <button 
        className="menuToggle" 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => {
          setSidebarOpen(false);
          document.body.classList.remove('sidebar-open');
        }}
      ></div>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h1 className="sidebarTitle">
          <span role="img" aria-label="logo">✓</span>
          <span>TaskFlow</span>
        </h1>
        
        <div className="sidebar-tabs">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`sidebarButton ${activeTab === tab.id ? "sidebarButtonActive" : ""}`}
            >
              {tab.icon}
              <span className="sidebarButtonText">{tab.label}</span>
            </motion.button>
          ))}
        </div>
        
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="sidebarButton"
          style={{ marginTop: "2rem" }}
        >
          <LogOut size={20} />
          <span className="sidebarButtonText">Logout</span>
        </motion.button>
      </div>

      <div className="mainContent">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="card"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading your workspace...</p>
  </div>
);