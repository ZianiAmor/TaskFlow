import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../services/api";
import "./Tasks.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { isOutdoorActivity } from "../../utils/taskUtils"; 
export default function Tasks() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    deadline: "",
    duration: "",
    isProject: false,
  });
  const [tasks, setTasks] = useState([]);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskName, setEditTaskName] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // Explicitly request only incomplete tasks
      const response = await axiosInstance.get("/api/tasks?completed=false");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      const durationNum = Number(formData.duration);
      // Promote as project if duration > 10 or manually checked
      const isProject = durationNum > 10 || formData.isProject;
      const data = {
        ...formData,
        duration: durationNum,
        isProject,
        priority: 1,
      };
      await axiosInstance.post("/api/tasks", data);
      await fetchTasks();
      setStep(1);
      setFormData({ name: "", deadline: "", duration: "", isProject: false });
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleComplete = async (taskId) => {
  try {
    // Mark the task as complete (if needed for stats)
    await axiosInstance.patch(`/api/tasks/${taskId}`, { completed: true });
    // Delete the task from the database
    // Update local state
    setTasks(tasks.filter(task => task._id !== taskId));
    toast.success("Task completed and removed successfully!");
  } catch (error) {
    console.error("Error completing task:", error);
    toast.error("Error completing task");
  }
};


  const handleDelete = async (taskId) => {
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const startEditing = (task) => {
    setEditTaskId(task._id);
    setEditTaskName(task.name);
  };

  const cancelEditing = () => {
    setEditTaskId(null);
    setEditTaskName("");
  };

  const saveEdit = async (taskId) => {
    try {
      const res = await axiosInstance.patch(`/api/tasks/${taskId}`, { name: editTaskName });
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
      cancelEditing();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  const checkDeadlineStatus = (deadline) => {
    const today = new Date();
    const taskDate = new Date(deadline);
    
    // Reset time components to compare dates only
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
  
    if (taskDate < today) return 'passed';
    if (taskDate.getTime() === today.getTime()) return 'today';
    return null;
  };
  return (
    <div className="tasks-container">
      <div className="task-creation-flow">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              className="step-container"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="input-group">
                <input
                  className="input-field"
                  type="text"
                  placeholder=" "
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <label className="input-label">Task name</label>
              </div>
              <div className="action-buttons">
                <button className="edit" onClick={handleNextStep}>
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <label className="input-label-deadline">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
              <div className="action-buttons">
                <button className="edit" onClick={handleNextStep}>
                  Next
                </button>
                <button className="prev" onClick={() => setStep(step - 1)}>
                  Previous
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <input
                type="number"
                placeholder="Duration (hours)"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
              <div className="action-buttons">
                <button className="edit" onClick={handleNextStep}>
                  Next
                </button>
                <button className="prev" onClick={() => setStep(step - 1)}>
                  Previous
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isProject}
                  onChange={(e) =>
                    setFormData({ ...formData, isProject: e.target.checked })
                  }
                />
                <span className="custom-checkbox"></span>
                <span>Is this a project?</span>
              </label>
              <div className="action-buttons">
                <button className="edit" onClick={handleSubmit}>
                  Create task
                </button>
                <button className="prev" onClick={() => setStep(step - 1)}>
                  Previous
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="tasks-list">
        {Array.isArray(tasks) &&
          tasks.map((task) => (
            <motion.div
              key={task._id}
              className="task-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
            >
              {task.isProject && <span className="project-tag">Project</span>}
              {isOutdoorActivity(task.name) && <span className="project-tag-2">Outdoor</span>}
              {editTaskId === task._id ? (
                <div className="editMode">
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                  />
                  <div className="action-buttons">
                    <button className="edit" onClick={() => saveEdit(task._id)}>
                      Save
                    </button>
                    <button className="delete" onClick={cancelEditing}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="task-header">
                    <h3 className="task-title">{task.name}</h3>
                    <button
                      className={`complete-btn ${task.completed ? "completed" : ""}`}
                      onClick={() => handleComplete(task._id)}
                    >
                      {task.completed ? "✓" : ""}
                    </button>
                  </div>

                  <div className="task-meta">
                    <div className="task-meta-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>

                    <div className="task-meta-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {task.duration} hours
                    </div>
                    {checkDeadlineStatus(task.deadline) === 'today' && (
                      <div className="task-meta-item deadline-warning">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="orange"
                          width="24"
                          height="24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3M12 2a10 10 0 110 20 10 10 0 010-20z"
                          />
                        </svg>
                        <span>Deadline is today!</span>
                      </div>
                    )}

                    {checkDeadlineStatus(task.deadline) === 'passed' && (
                      <div className="task-meta-item deadline-passed">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="red"
                          width="24"
                          height="24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Deadline passed!</span>
                      </div>
                    )}
                  </div>

                  <div className="action-buttons">
                    <button className="edit" onClick={() => startEditing(task)}>
                      Edit
                    </button>
                    <button className="delete" onClick={() => handleDelete(task._id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
      </div>
    </div>
  );
}
