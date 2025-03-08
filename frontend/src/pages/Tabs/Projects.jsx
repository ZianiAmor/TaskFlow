import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import axiosInstance from "../../services/api";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "./Project.css";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Stopwatch = forwardRef(({ initialTime = 0 }, ref) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useImperativeHandle(ref, () => ({
    getTime: () => time,
  }), [time]);

  const start = () => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  };

  const pause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    document.getElementById('session').innerHTML = 'Session duration : ';
    setTime(0);
  };

  return (
    <div className="stopwatch">
      <p>{formatTime(time)}</p>
      <div className="stopwatch-buttons">
        <button className="btn btn-primary" onClick={start} disabled={isRunning}>
          Start
        </button>
        <button className="btn btn-secondary" onClick={pause} disabled={!isRunning}>
          Pause
        </button>
        <button className="btn btn-secondary" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
});

const Project = () => {
  const [projects, setProjects] = useState([]);
  const [noteInputs, setNoteInputs] = useState({});
  const stopwatchRefs = useRef({});

  useEffect(() => {
    const fetchProjectTasks = async () => {
      try {
        const response = await axiosInstance.get("/api/tasks/projects");
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching project tasks:", error);
      }
    };
    fetchProjectTasks();
  }, []);

  const getChartData = (progress = []) => {
    const labels = progress.map((_, idx) => `Day ${idx + 1}`);
    const data = progress.map((record) => record.hours);
    return {
      labels,
      datasets: [
        {
          label: "Hours Worked",
          data,
          borderColor: "rgba(75,192,192,1)",
          backgroundColor: "rgba(75,192,192,0.2)",
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    scales: {
      y: { min: 0, max: 10 },
    },
  };

  const handleSaveProgress = async (projectId) => {
    try {
      const currentTime = stopwatchRefs.current[projectId]?.current?.getTime() || 0;
      const response = await axiosInstance.patch(`/api/tasks/${projectId}/saveProgress`, { timer: currentTime });
      setProjects((prev) =>
        prev.map((project) => (project._id === projectId ? response.data : project))
      );
      alert("Progress saved!");
      document.getElementById('session').innerHTML = 'Last Session Duration : ';
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Error saving progress");
    }
  };

  const updateNoteInput = (projectId, field, value, noteIndex = null) => {
    setNoteInputs((prev) => {
      const projectInputs = prev[projectId] || { newNoteHeader: "", newComment: {} };
      if (field === "newNoteHeader") {
        return { ...prev, [projectId]: { ...projectInputs, newNoteHeader: value } };
      } else if (field === "newComment") {
        const updatedComments = { ...projectInputs.newComment, [noteIndex]: value };
        return { ...prev, [projectId]: { ...projectInputs, newComment: updatedComments } };
      }
      return prev;
    });
  };

  const handleAddNote = (projectId) => {
    const header = noteInputs[projectId]?.newNoteHeader?.trim();
    if (!header) return;
    setProjects((prev) =>
      prev.map((project) => {
        if (project._id === projectId) {
          const updatedNotes = project.notes ? [...project.notes, { header, comments: [] }] : [{ header, comments: [] }];
          return { ...project, notes: updatedNotes };
        }
        return project;
      })
    );
    updateNoteInput(projectId, "newNoteHeader", "");
  };

  const handleAddComment = (projectId, noteIndex) => {
    const commentText = noteInputs[projectId]?.newComment?.[noteIndex]?.trim();
    if (!commentText) return;
    setProjects((prev) =>
      prev.map((project) => {
        if (project._id === projectId && project.notes && project.notes[noteIndex]) {
          const updatedNotes = project.notes.map((note, idx) => {
            if (idx === noteIndex) {
              const updatedComments = note.comments ? [...note.comments, { text: commentText, attachments: [] }] : [{ text: commentText, attachments: [] }];
              return { ...note, comments: updatedComments };
            }
            return note;
          });
          return { ...project, notes: updatedNotes };
        }
        return project;
      })
    );
    updateNoteInput(projectId, "newComment", "", noteIndex);
  };

  const handleFileUpload = (projectId, noteIndex, commentIndex, file) => {
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setProjects((prev) =>
      prev.map((project) => {
        if (project._id === projectId && project.notes && project.notes[noteIndex]) {
          const updatedNotes = project.notes.map((note, idx) => {
            if (idx === noteIndex) {
              const updatedComments = note.comments.map((comment, cIdx) => {
                if (cIdx === commentIndex) {
                  const updatedAttachments = comment.attachments ? [...comment.attachments, fileUrl] : [fileUrl];
                  return { ...comment, attachments: updatedAttachments };
                }
                return comment;
              });
              return { ...note, comments: updatedComments };
            }
            return note;
          });
          return { ...project, notes: updatedNotes };
        }
        return project;
      })
    );
  };

  const handleSaveNotes = async (projectId) => {
    try {
      const project = projects.find((p) => p._id === projectId);
      const response = await axiosInstance.patch(`/api/tasks/${projectId}`, { notes: project.notes });
      setProjects((prev) => prev.map((p) => (p._id === projectId ? response.data : p)));
      alert("Notes saved!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Error saving notes");
    }
  };

  return (
    <div className="project-container">
      {projects.length === 0 ? (
        <p className="loading-state">No projects found.</p>
      ) : (
        projects.map((project) => {
          if (!stopwatchRefs.current[project._id]) {
            stopwatchRefs.current[project._id] = React.createRef();
          }
          return (
            <motion.div
              key={project._id}
              className="project-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="project-info">
                <h2>{project.name}</h2>
                <p>Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
                <p>Duration: {project.duration} hours</p>
              </div>
              <div className="chart-section">
                <h3>Progress (Last 7 Days)</h3>
                {project.progress && project.progress.length > 0 ? (
                  <Line data={getChartData(project.progress)} options={chartOptions} />
                ) : (
                  <p>No progress data available.</p>
                )}
              </div>
              <div className="stopwatch-section">
                <h3 id="session">Session Duration :</h3>
                <Stopwatch ref={stopwatchRefs.current[project._id]} initialTime={project.timer || 0} />
                <button className="btn btn-primary save-progress-btn" onClick={() => handleSaveProgress(project._id)}>
                  Save Progress
                </button>
              </div>
              <div className="notes-section">
                <h3>Notes & Comments</h3>
                <div className="add-note">
                  <input
                    type="text"
                    placeholder="Enter note header"
                    value={noteInputs[project._id]?.newNoteHeader || ""}
                    onChange={(e) => updateNoteInput(project._id, "newNoteHeader", e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={() => handleAddNote(project._id)}>
                    Add Note
                  </button>
                </div>
                {project.notes &&
                  project.notes.map((note, noteIndex) => (
                    <div key={noteIndex} className="note">
                      <h4>{note.header}</h4>
                      {note.comments &&
                        note.comments.map((comment, commentIndex) => (
                          <div key={commentIndex} className="comment">
                            <p>{comment.text}</p>
                            <div className="attachments">
                              {comment.attachments &&
                                comment.attachments.map((att, idx) => (
                                  <a key={idx} href={att} target="_blank" rel="noopener noreferrer">
                                    View Attachment
                                  </a>
                                ))}
                            </div>
                          </div>
                        ))}
                      <div className="add-comment">
                        <input
                          type="text"
                          placeholder="Enter comment"
                          value={noteInputs[project._id]?.newComment?.[noteIndex] || ""}
                          onChange={(e) =>
                            updateNoteInput(project._id, "newComment", e.target.value, noteIndex)
                          }
                        />
                        <button className="btn btn-primary" onClick={() => handleAddComment(project._id, noteIndex)}>
                          Add Comment
                        </button>
                        {note.comments && note.comments.length > 0 && (
                          <div className="input-file-wrapper">
                            <label className="custom-file-label">
                              Attach File
                              <input
                                type="file"
                                id={`file-upload-${project._id}-${noteIndex}`}
                                onChange={(e) =>
                                  handleFileUpload(project._id, noteIndex, note.comments.length - 1, e.target.files[0])
                                }
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                <button className="btn btn-secondary save-notes-btn" onClick={() => handleSaveNotes(project._id)}>
                  Save Notes
                </button>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default Project;
