import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const getFrontendDistPath = () => {
  const possibleDirs = [
    process.env.FRONTEND_DIST_PATH,
    path.join(__dirname, '../../../frontend/dist'),
    path.join(__dirname, '../../frontend/dist'),
    path.join(__dirname, '../frontend/dist'),
    path.join(__dirname, '../../../frontend/build'),
    path.join(__dirname, '../../frontend/build'),
    path.join(__dirname, '../../../dist'),
    path.join(__dirname, '../../dist'),
    path.join(__dirname, '../dist'),
    path.join(process.cwd(), 'frontend/dist'),
    path.join(process.cwd(), '../frontend/dist'),
    path.join(process.cwd(), 'frontend/build'),
    path.join(process.cwd(), '../frontend/build'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), '../dist'),
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), '../public'),
  ].filter(Boolean);

  for (const d of possibleDirs) {
    if (fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html'))) {
      return d;
    }
  }
  return null;
};

export const notFound = (req, res) => {
  if (!req.originalUrl.startsWith('/api')) {
    const distPath = getFrontendDistPath();
    if (distPath) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }

    if (req.originalUrl === '/' || req.path === '/') {
      return ApiResponse.success(
        res,
        {
          service: 'Krishna Hospital & Diagnostics Management System API',
          status: 'online',
          healthCheck: '/api/v1/health',
          timestamp: new Date().toISOString(),
        },
        'Krishna Hospital Backend API is running'
      );
    }

    return ApiResponse.error(
      res,
      `Frontend static files not found on server for route '${req.originalUrl}'. Ensure frontend build step (npm run build) has completed.`,
      404
    );
  }
  return ApiResponse.error(res, `Route Not Found - ${req.originalUrl}`, 404);
};
