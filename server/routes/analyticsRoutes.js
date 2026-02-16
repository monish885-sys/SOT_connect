import express from 'express';
import { getDashboardStats, exportReport } from '../controllers/analyticsController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken, isAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/export', exportReport);

export default router;
