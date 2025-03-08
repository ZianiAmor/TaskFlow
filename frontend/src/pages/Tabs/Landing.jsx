import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, stagger, useAnimate } from 'framer-motion';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [scope, animate] = useAnimate();

  const features = [
    {
      title: "Easy Task Management",
      content: "Create and manage your tasks effortlessly with a multi-step intuitive process.",
      color: "#3b82f6"
    },
    {
      title: "Project Tracking",
      content: "Promote tasks to projects, track progress with live stopwatch, and visualize work with charts.",
      color: "#10b981"
    },
    {
      title: "Collaborative Chat",
      content: "Engage in real-time discussions, share project updates, and attach files all in one place.",
      color: "#8b5cf6"
    }
  ];

  return (
    <div className="landing-container" ref={scope}>
      <div className="gradient-background" />
      
      <motion.div
        className="landing-header"
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        <h1 className="gradient-text">Streamline Your Workflow with TaskFlow</h1>
        <p>Transform your productivity with intelligent task management and seamless team collaboration</p>
      </motion.div>

      <div className="features-container">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 + 0.4, duration: 0.6 }}
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div 
              className="feature-accent" 
              style={{ background: feature.color }}
            />
            <h3>{feature.title}</h3>
            <p>{feature.content}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="cta-section"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.button
          className="cta-button primary"
          onClick={() => navigate('/register')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Now
          <span className="arrow">→</span>
        </motion.button>
        <div className="secondary-cta">
          <span>Already have an account?</span>
          <button 
            className="text-button"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;