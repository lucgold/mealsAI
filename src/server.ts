// Load environment variables before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';

// Configure dotenv with absolute path to the .env file
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipe';
import productRoutes from './routes/product';

// Verify environment variables are loaded
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('KROGER_CLIENT_ID:', process.env.KROGER_CLIENT_ID ? 'Set' : 'Not set');
console.log('KROGER_CLIENT_SECRET:', process.env.KROGER_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('REDIRECT_URI:', process.env.REDIRECT_URI);

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