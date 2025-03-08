// server/controllers/taskController.js
import Task from '../models/Task.js';

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
    
    // Compute priority using the given formula:
    // (Duration in hrs * 4 + time until deadline in hrs) / 5 , it can be changed later , maybe
    const computedPriority = (durationNum * 4 + timeUntilDeadline) / 5;
    
    // Promote as a project if duration > 10 or if manually marked.
    const promoteAsProject = durationNum > 10 || isProject;
    
    const newTask = new Task({
      user: req.user._id,
      name,
      deadline: parsedDeadline,
      duration: durationNum,
      isProject: promoteAsProject,
      priority: computedPriority,
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
    // Sort tasks in ascending order by priority (lowest priority first) , show ew can show it on list
    const tasks = await Task.find({ user: req.user._id }).sort({ priority: 1 });
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
    const projects = await Task.find({ user: req.user._id, isProject: true }).sort({ priority: 1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// saveProgress updates the task's timer and accumulates progress for today.
const saveProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { timer } = req.body; // current stopwatch time in seconds
    const additionalHours = timer / 3600; // convert seconds to hours
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
    task.timer = timer;
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export { createTask, getTasks, getProjectTasks, updateTask, deleteTask, saveProgress };