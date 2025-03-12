import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Landing.css';

const LandingPage = () => {
  const navigate = useNavigate();

  // Parallax effect for background elements
  useEffect(() => {
    const handleMouseMove = (e) => {
      const parallaxElements = document.querySelectorAll('.parallax');
      const mouseX = e.clientX / window.innerWidth - 0.5;
      const mouseY = e.clientY / window.innerHeight - 0.5;

      parallaxElements.forEach(el => {
        const speed = el.getAttribute('data-speed');
        const x = mouseX * speed;
        const y = mouseY * speed;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      title: "Smart Task Management",
      content: "Organize your workflow with our intuitive drag-and-drop interface. Create, prioritize, and track tasks with minimal effort.",
      icon: "📋",
      color: "#3b82f6"
    },
    {
      title: "Real-time Project Tracking",
      content: "Monitor project progress with live stopwatch tracking, interactive Gantt charts, and customizable progress dashboards.",
      icon: "📊",
      color: "#10b981"
    },
    {
      title: "Team Collaboration",
      content: "Share projects, assign tasks, and communicate in real-time with integrated chat and file sharing capabilities.",
      icon: "👥",
      color: "#8b5cf6"
    },
    {
      title: "Insightful Analytics",
      content: "Gain valuable insights with comprehensive reports and visualizations on productivity, team performance, and project status.",
      icon: "📈",
      color: "#f59e0b"
    }
  ];

  const testimonials = [
    {
      quote: "TaskFlow revolutionized how our team collaborates. We've increased productivity by 35% since implementation.",
      name: "Sarah Johnson",
      title: "Project Manager, TechCorp"
    },
    {
      quote: "The intuitive interface and powerful features make TaskFlow the perfect solution for our remote team.",
      name: "Michael Chen",
      title: "Team Lead, InnovateCo"
    }
  ];

  return (
    <div className="landing-container">
      {/* Animated background elements */}
      <div className="background-wrapper">
        <div className="gradient-background"></div>
        <div className="shape shape-1 parallax" data-speed="30"></div>
        <div className="shape shape-2 parallax" data-speed="20"></div>
        <div className="shape shape-3 parallax" data-speed="40"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Elevate Your Productivity with <span className="gradient-text">TaskFlow</span>
          </motion.h1>
          
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            The intelligent workspace that transforms how teams collaborate, track progress, and achieve goals
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <motion.button
              className="cta-button primary"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.98 }}
            >
              Start Free Trial
              <motion.span
                className="arrow"
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </motion.button>
            
            <motion.button
              className="cta-button secondary"
              onClick={() => navigate('/demo')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="stat">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Teams</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">30%</span>
              <span className="stat-label">Efficiency Boost</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-image-container"
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="dashboard-preview">
            <div className="dashboard-header">
              <div className="dashboard-controls">
                <span className="control red"></span>
                <span className="control yellow"></span>
                <span className="control green"></span>
              </div>
              <div className="dashboard-title">TaskFlow Dashboard</div>
            </div>
            <div className="dashboard-content">
              <div className="dashboard-sidebar">
                <div className="sidebar-item active"></div>
                <div className="sidebar-item"></div>
                <div className="sidebar-item"></div>
                <div className="sidebar-item"></div>
                <div className="sidebar-item"></div>
              </div>
              <div className="dashboard-main">
                <div className="dashboard-card-large"></div>
                <div className="dashboard-row">
                  <div className="dashboard-card-small"></div>
                  <div className="dashboard-card-small"></div>
                </div>
                <div className="dashboard-card-medium"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Powerful Features for Modern Teams
        </motion.h2>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                {feature.icon}
              </div>
              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.content}</p>
              </div>
              <div className="feature-accent" style={{ background: feature.color }}></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Trusted by Leading Teams
        </motion.h2>

        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="testimonial-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
            >
              <div className="quote-mark">"</div>
              <p className="testimonial-quote">{testimonial.quote}</p>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-title">{testimonial.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Ready to Transform Your Workflow?</h2>
          <p>Start your 14-day free trial. No credit card required.</p>
          
          <motion.button
            className="cta-button primary large"
            onClick={() => navigate('/register')}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started Today
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
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">TaskFlow</div>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/pricing">Pricing</a>
            <a href="/blog">Blog</a>
            <a href="/support">Support</a>
          </div>
          <div className="footer-social">
            <a href="#" className="social-icon">
              <span className="sr-only">Twitter</span>
              <i className="icon-twitter"></i>
            </a>
            <a href="#" className="social-icon">
              <span className="sr-only">LinkedIn</span>
              <i className="icon-linkedin"></i>
            </a>
            <a href="#" className="social-icon">
              <span className="sr-only">GitHub</span>
              <i className="icon-github"></i>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;