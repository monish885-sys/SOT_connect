import express from 'express';
import { getProfile, updateProfile, getMyRegistrations } from '../controllers/userController.js';
import { verifyToken, isStudent } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/registrations', isStudent, getMyRegistrations);

export default router;
