import express from 'express';
import {
  getEvents,
  getEventById,
  getRelatedEvents,
  getEventCategories,
  createEvent,
  updateEvent,
  deleteEvent,
  duplicateEvent,
  bulkUpdateEvents,
  registerForEvent,
  unregisterFromEvent,
  joinWaitlist,
  getEventRegistrations,
  exportRegistrations,
  checkIn,
  getCheckInCode,
  getCertificate,
} from '../controllers/eventController.js';
import { verifyToken, optionalAuth, isAdmin, isStudent } from '../middleware/auth.js';

const router = express.Router();

router.get('/categories', getEventCategories);
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);
router.get('/:id/related', getRelatedEvents);

router.post('/', verifyToken, isAdmin, createEvent);
router.post('/bulk', verifyToken, isAdmin, bulkUpdateEvents);
router.put('/:id', verifyToken, isAdmin, updateEvent);
router.delete('/:id', verifyToken, isAdmin, deleteEvent);
router.post('/:id/duplicate', verifyToken, isAdmin, duplicateEvent);

router.post('/:id/register', verifyToken, isStudent, registerForEvent);
router.delete('/:id/register', verifyToken, isStudent, unregisterFromEvent);
router.post('/:id/waitlist', verifyToken, isStudent, joinWaitlist);

router.get('/:id/registrations', verifyToken, isAdmin, getEventRegistrations);
router.get('/:id/registrations/export', verifyToken, isAdmin, exportRegistrations);
router.post('/:id/check-in', verifyToken, isAdmin, checkIn);

router.get('/:id/check-in-code', verifyToken, isStudent, getCheckInCode);
router.get('/:id/certificate', verifyToken, isStudent, getCertificate);

export default router;
