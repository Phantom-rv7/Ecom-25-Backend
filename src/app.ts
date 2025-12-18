import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './utils/feautures.js';
import { errorMiddleware } from './middlewares/error.js';
import { v2 as cloudinary } from 'cloudinary';
import NodeCache from 'node-cache';
import path from 'path';

dotenv.config();

// ✅ Constants
const PORT = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || '';

// ✅ Connect to MongoDB
connectDB(mongoURI);

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const myCache = new NodeCache();

// ✅ Initialize Express
const app = express();

// ✅ CORS Configuration — allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev
  'http://localhost:4173',   // Vite preview
  'https://ecom-25-frontend.onrender.com' // deployed frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// ✅ Routes
import userRoutes from './routes/user.js';
import productRoute from './routes/products.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payment.js';
import dashboardRoute from './routes/stats.js';
import favoriteRoute from './routes/favorites.js';

app.get('/', (_req, res) => {
  res.send('API working with /api/v1');
});

// Uses
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/dashboard', dashboardRoute);
app.use('/api/v1/favorite', favoriteRoute);

// ✅ Static Files
app.use('/uploads', express.static('upload'));

// ✅ Error Handler
app.use(errorMiddleware);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Express is running on http://localhost:${PORT}`);
});
