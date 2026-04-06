import express from 'express';
import { getNotes, saveNote, deleteNote } from '../controllers/noteController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotes);
router.post('/', saveNote); // Handles create and update
router.delete('/:id', deleteNote);

export default router;
