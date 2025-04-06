import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipe';
import productRoutes from './routes/product';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Recipe routes
app.use('/api/recipe', recipeRoutes);

// Product routes
app.use('/api/products', productRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 