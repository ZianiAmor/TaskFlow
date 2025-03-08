// server/routes/taskRoutes.js
import express from 'express';
import { createTask, getTasks, getProjectTasks, updateTask, deleteTask, saveProgress } from '../controllers/taskController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createTask);
router.get('/', authMiddleware, getTasks);
router.get('/projects', authMiddleware, getProjectTasks); // This is the new route
router.patch('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.patch('/:id/saveProgress', authMiddleware, saveProgress);

export default router;
