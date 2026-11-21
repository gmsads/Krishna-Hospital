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
import labInventoryRoutes from './modules/lab-inventory/lab-inventory.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';
import settingRoutes from './modules/settings/setting.routes.js';

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

// Privacy Policy Route for Meta Developer Console App Verification
app.get('/privacy-policy', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - Krishna Hospitals</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1e293b; }
        h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        h2 { color: #1e293b; margin-top: 24px; }
        p { color: #475569; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy - Krishna Hospitals</h1>
      <p>Last updated: October 2, 2026</p>
      
      <h2>1. Introduction</h2>
      <p>Krishna Hospitals ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or interact with our official WhatsApp communication channel.</p>
      
      <h2>2. Information We Collect</h2>
      <p>We may collect personal information such as your name, phone number, appointment details, and health query history strictly for medical consultation, OPD appointment booking, and customer support purposes.</p>
      
      <h2>3. How We Use Your Information</h2>
      <p>Your information is used solely to facilitate hospital appointments, provide medical information, send appointment reminders, and respond to your healthcare inquiries.</p>
      
      <h2>4. Data Protection & Privacy</h2>
      <p>We do not sell, trade, or share your personal data with third parties for marketing purposes. All medical data is handled in strict compliance with healthcare privacy regulations.</p>
      
      <h2>5. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at Krishna Hospitals, Guntur.</p>
    </body>
    </html>
  `);
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
app.use('/api/v1/lab-inventory', labInventoryRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/settings', settingRoutes);
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
