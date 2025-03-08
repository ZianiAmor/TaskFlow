// NotificationContext.js
import React, { createContext, useState } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // Holds the count of new tasks (or outdoor tasks) that haven't been seen
  const [notificationCount, setNotificationCount] = useState(0);

  // Provide a function to increment the count
  const incrementNotification = (count = 1) => {
    setNotificationCount(prev => prev + count);
  };

  // Provide a function to reset the count (e.g., when Discover tab is visited)
  const resetNotification = () => {
    setNotificationCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notificationCount, incrementNotification, resetNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
