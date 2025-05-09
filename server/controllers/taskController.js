// server/controllers/taskController.js
import Task from '../models/Task.js';

// First, let's add the deleteNote controller function to taskController.js

// Add this to taskController.js
const deleteNote = async (req, res) => {
  try {
    const { id, noteIndex } = req.params;
    
    // Find the task by ID
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Check if the task belongs to the current user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this task' });
    }
    
    // Check if the note exists
    if (!task.notes || !task.notes[noteIndex]) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    
    // Remove the note at the specified index
    task.notes.splice(noteIndex, 1);
    
    // Save the updated task
    await task.save();
    
    res.status(200).json({ success: true, message: 'Note deleted successfully', task });
  } catch (error) {
    console.error('Error in deleteNote:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Add this to taskController.js
const deleteComment = async (req, res) => {
  try {
    const { id, noteIndex, commentIndex } = req.params;
    
    // Find the task by ID
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Check if the task belongs to the current user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this task' });
    }
    
    // Check if the note exists
    if (!task.notes || !task.notes[noteIndex]) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    
    // Check if the comment exists
    if (!task.notes[noteIndex].comments || !task.notes[noteIndex].comments[commentIndex]) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    
    // Remove the comment at the specified index
    task.notes[noteIndex].comments.splice(commentIndex, 1);
    
    // Save the updated task
    await task.save();
    
    res.status(200).json({ success: true, message: 'Comment deleted successfully', task });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Export the new functions (add these to the existing export statement)

const createTask = async (req, res) => {
  try {
    const { name, deadline, duration, isProject } = req.body;
    
    if (!name || !deadline || !duration) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, deadline, and duration are required.' 
      });
    }
    
    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid deadline format.' 
      });
    }
    
    const durationNum = Number(duration);
    const now = new Date();
    // Calculate time until deadline in hours
    const timeUntilDeadline = (parsedDeadline - now) / (1000 * 3600);
    
    // Compute priority using the given formula
    const computedPriority = (durationNum * 4 + timeUntilDeadline) / 5;
    
    // Promote as a project if duration > 10 or if manually marked
    const promoteAsProject = durationNum > 10 || isProject;
    
    // Get the most up-to-date statistics
    const latestStats = await Task.findOne(
      { user: req.user._id }, 
      { totalNumOfTasks: 1, tasksCompleted: 1, projectsCompleted: 1 },
      { sort: { 'createdAt': -1 } }
    );
    
    let statsToSet = {
      totalNumOfTasks: (latestStats?.totalNumOfTasks || 0) + 1,
      tasksCompleted: latestStats?.tasksCompleted || 0,
      projectsCompleted: latestStats?.projectsCompleted || 0
    };
    
    // Update ALL existing task documents with new totalNumOfTasks
    if (latestStats) {
      await Task.updateMany(
        { user: req.user._id },
        { totalNumOfTasks: statsToSet.totalNumOfTasks }
      );
    }
    
    // Create new task with updated stats
    const newTask = new Task({
      user: req.user._id,
      name,
      deadline: parsedDeadline,
      duration: durationNum,
      isProject: promoteAsProject,
      priority: computedPriority,
      ...statsToSet
    });
    
    await newTask.save();
    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    console.error('Error in createTask:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
const getTasks = async (req, res) => {
  try {
    const { completed } = req.query;
    const query = { user: req.user._id };
    
    if (completed) {
      query.completed = completed === 'true';
    }

    const tasks = await Task.find(query).sort({ priority: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// New function: getProjectTasks returns tasks where isProject is true.
const getProjectTasks = async (req, res) => {
  try {
    // Also sort project tasks by priority (lowest first)
    const projects = await Task.find({ user: req.user._id, isProject: true ,completed : false }).sort({ priority: 1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // If we're marking the task as completed
    if (req.body.completed === true && !task.completed) {
      // Get the most up-to-date statistics
      const latestStats = await Task.findOne(
        { user: req.user._id }, 
        { totalNumOfTasks: 1, tasksCompleted: 1, projectsCompleted: 1 },
        { sort: { 'createdAt': -1 } }
      );
      
      let updatedStats = {
        totalNumOfTasks: latestStats?.totalNumOfTasks || 0,
        tasksCompleted: latestStats?.tasksCompleted || 0,
        projectsCompleted: latestStats?.projectsCompleted || 0
      };
      
      // Update completion counts based on task type
      if (task.isProject) {
        updatedStats.projectsCompleted += 1;
      } else {
        updatedStats.tasksCompleted += 1;
      }
      
      // Update ALL task documents for this user with the new statistics
      await Task.updateMany(
        { user: req.user._id },
        { 
          totalNumOfTasks: updatedStats.totalNumOfTasks,
          tasksCompleted: updatedStats.tasksCompleted,
          projectsCompleted: updatedStats.projectsCompleted
        }
      );
    }
    
    // Now update the specific task with the changes from req.body
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getLatestTask = async (req, res) => {
  try {
    // Get the latest task for this user to get current stats
    const latestTask = await Task.findOne(
      { user: req.user._id },
      { totalNumOfTasks: 1, tasksCompleted: 1, projectsCompleted: 1 },
      { sort: { 'createdAt': -1 } }
    );
    
    if (!latestTask) {
      return res.status(200).json({
        totalNumOfTasks: 0,
        tasksCompleted: 0,
        projectsCompleted: 0
      });
    }
    
    res.status(200).json(latestTask);
  } catch (error) {
    console.error('Error in getLatestTask:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the task before deleting it
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Get the most up-to-date statistics
    const latestStats = await Task.findOne(
      { user: req.user._id }, 
      { totalNumOfTasks: 1, tasksCompleted: 1, projectsCompleted: 1 },
      { sort: { 'createdAt': -1 } }
    );
    
    let updatedStats = {
      totalNumOfTasks: Math.max(0, (latestStats?.totalNumOfTasks || 0) - 1),
      tasksCompleted: latestStats?.tasksCompleted || 0,
      projectsCompleted: latestStats?.projectsCompleted || 0
    };
    
    // If the task was completed, also decrement the completion counter
    if (task.completed) {
      if (task.isProject) {
        updatedStats.projectsCompleted = Math.max(0, updatedStats.projectsCompleted - 1);
      } else {
        updatedStats.tasksCompleted = Math.max(0, updatedStats.tasksCompleted - 1);
      }
    }
    
    // Update ALL task documents for this user with the new statistics
    await Task.updateMany(
      { user: req.user._id },
      updatedStats
    );
    
    await Task.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const saveProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { timer } = req.body; 
    const additionalHours = timer / 3600;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    const today = new Date().toLocaleDateString();
    let foundToday = false;
    task.progress = task.progress.map((record) => {
      if (new Date(record.day).toLocaleDateString() === today) {
        record.hours += additionalHours;
        foundToday = true;
      }
      return record;
    });
    if (!foundToday) {
      task.progress.push({ day: new Date(), hours: additionalHours });
    }
    if (task.progress.length > 7) {
      task.progress = task.progress.slice(-7);
    }
    task.timer = 0;
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export { 
  getLatestTask,
  createTask, 
  getTasks, 
  getProjectTasks, 
  updateTask, 
  deleteTask, 
  saveProgress,
  deleteNote,
  deleteComment 
};