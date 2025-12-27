import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import departmentRoutes from './routes/departments';
import reviewRoutes from './routes/reviews';
import goalRoutes from './routes/goals';
import goalTemplateRoutes from './routes/goal-templates';
import oneOnOneRoutes from './routes/one-on-ones';
import developmentPlanRoutes from './routes/development-plans';
import managerRoutes from './routes/manager';
import googleCalendarRoutes from './routes/google-calendar';
import profileRoutes from './routes/profile';
import adminRoutes from './routes/admin';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files (with authentication)
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Beacon API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/goal-templates', goalTemplateRoutes);
app.use('/api/one-on-ones', oneOnOneRoutes);
app.use('/api/development-plans', developmentPlanRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/calendar', googleCalendarRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
