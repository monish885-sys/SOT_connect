import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getJwtSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
};

export const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/** Sets req.user if valid token present; does not 401 if missing. */
export const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch (_) {}
  next();
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const isStudent = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};
