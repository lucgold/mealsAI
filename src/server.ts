import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipe';

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('KROGER_CLIENT_ID:', process.env.KROGER_CLIENT_ID ? 'Set' : 'Not set');
console.log('KROGER_CLIENT_SECRET:', process.env.KROGER_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('REDIRECT_URI:', process.env.REDIRECT_URI);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Recipe routes
app.use('/api/recipe', recipeRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 