import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { corsOptions } from './config/cors.js';
import { notFound, getFrontendDistPath } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Feature Routes Imports
import authRoutes from './modules/auth/auth.routes.js';
import branchRoutes from './modules/branches/branch.routes.js';
import staffRoutes from './modules/staff/staff.routes.js';
import doctorRoutes from './modules/doctors/doctor.routes.js';
import opRecordRoutes from './modules/op-records/op-record.routes.js';
import laboratoryRoutes from './modules/laboratory/laboratory.routes.js';
import labServiceRoutes from './modules/lab-services/lab-service.routes.js';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes.js';
import expenseRoutes from './modules/expenses/expense.routes.js';
import marketingRoutes from './modules/marketing/whatsapp.routes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors(corsOptions));
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static assets dynamically if frontend dist folder exists
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  const activeDist = getFrontendDistPath();
  if (activeDist) {
    return express.static(activeDist)(req, res, next);
  }
  next();
});

// Root Route: Serve index.html if frontend dist exists, otherwise return API Online Status JSON
app.get('/', (req, res, next) => {
  const activeDist = getFrontendDistPath();
  if (activeDist) {
    const indexPath = path.join(activeDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  return res.status(200).json({
    success: true,
    message: 'Krishna Hospital Backend API is running',
    data: {
      service: 'Krishna Hospital & Diagnostics Management System API',
      status: 'online',
      healthCheck: '/api/v1/health',
      timestamp: new Date().toISOString(),
    },
  });
});

// Health Check Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Krishna Hospital Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Feature Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/op-records', opRecordRoutes);
app.use('/api/v1/laboratory', laboratoryRoutes);
app.use('/api/v1/lab-services', labServiceRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1', marketingRoutes);

// SPA Client-side Route Fallback: For non-API browser routes like /dashboard or /login, serve index.html
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  const activeDist = getFrontendDistPath();
  if (activeDist) {
    const indexPath = path.join(activeDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
