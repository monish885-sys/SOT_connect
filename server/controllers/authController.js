import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set. Add it to server/.env (see .env.example).');
  return secret;
};

const generateToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), { expiresIn: '7d' });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', studentId, department, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId: role === 'student' ? studentId : undefined,
      department,
      phone,
    });
    const token = generateToken(user._id);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.cookie('token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: 'Logged out' });
};

export const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};
