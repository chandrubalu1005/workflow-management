import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    useTemplate
} from '../controllers/templateController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', requireAdmin, createTemplate);
router.put('/:id', requireAdmin, updateTemplate);
router.delete('/:id', requireAdmin, deleteTemplate);
router.post('/:id/duplicate', requireAdmin, duplicateTemplate);
router.post('/:id/use', useTemplate);

export default router;
