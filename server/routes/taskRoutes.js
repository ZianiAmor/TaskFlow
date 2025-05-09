import express from 'express';
import { 
  createTask, 
  getTasks, 
  getProjectTasks, 
  updateTask, 
  deleteTask, 
  saveProgress,
  getLatestTask,
  deleteNote,
  deleteComment
} from '../controllers/taskController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createTask);
router.get('/', authMiddleware, getTasks);
router.get('/projects', authMiddleware, getProjectTasks);
router.get('/stats', authMiddleware, getLatestTask); 
router.patch('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.patch('/:id/saveProgress', authMiddleware, saveProgress);

router.delete('/:id/notes/:noteIndex', authMiddleware, deleteNote);
router.delete('/:id/notes/:noteIndex/comments/:commentIndex', authMiddleware, deleteComment);

export default router;