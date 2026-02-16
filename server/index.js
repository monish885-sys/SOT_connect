import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { verifyToken, isAdmin } from './middleware/auth.js';
import { bulkUpdateEvents } from './controllers/eventController.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
// Explicit route so POST /api/events/bulk is never treated as /api/events/:id
app.post('/api/events/bulk', verifyToken, isAdmin, bulkUpdateEvents);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
