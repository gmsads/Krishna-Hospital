import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scanForIndex = (dirPath, maxDepth = 4, currentDepth = 0) => {
  if (!dirPath || currentDepth > maxDepth || !fs.existsSync(dirPath)) return null;
  try {
    const indexPath = path.join(dirPath, 'index.html');
    if (fs.existsSync(indexPath)) return dirPath;

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      if (item.isFile() && item.name.toLowerCase() === 'index.html') {
        return dirPath;
      }
    }

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const found = scanForIndex(path.join(dirPath, item.name), maxDepth, currentDepth + 1);
        if (found) return found;
      }
    }
  } catch (_e) {
    // Ignore file permission errors
  }
  return null;
};

export const getFrontendDistPath = () => {
  const rawEnvPath = process.env.FRONTEND_DIST_PATH;
  if (rawEnvPath) {
    const cleanEnvPath = rawEnvPath.trim().replace(/^["']|["']$/g, '');
    const envFound = scanForIndex(cleanEnvPath, 2);
    if (envFound) return envFound;
  }

  const rootCandidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
    path.resolve(process.cwd(), '../../..'),
    path.resolve(process.cwd(), '../../../..'),
    '/home/u594140720/domains/krishnahospitalsguntur.in/public_html',
    '/home/u594140720/domains/krishnahospitalsguntur.in',
    '/home/u594140720/public_html',
    process.env.PASSENGER_APP_ROOT,
    __dirname,
  ].filter(Boolean);

  for (const root of rootCandidates) {
    const found = scanForIndex(root, 4);
    if (found) return found;
  }

  return null;
};

export const notFound = (req, res) => {
  if (!req.originalUrl.startsWith('/api')) {
    const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json)$/i.test(req.path);
    if (isAsset) {
      return ApiResponse.error(res, `Static asset file not found on server: ${req.originalUrl}`, 404);
    }

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

    const envClean = process.env.FRONTEND_DIST_PATH ? process.env.FRONTEND_DIST_PATH.trim().replace(/^["']|["']$/g, '') : null;

    return ApiResponse.error(
      res,
      `Frontend static files not found on server for route '${req.originalUrl}'. Ensure frontend build step (npm run build) has completed.`,
      404,
      {
        envPathRaw: process.env.FRONTEND_DIST_PATH || null,
        envPathClean: envClean,
        publicHtmlExists: fs.existsSync('/home/u594140720/domains/krishnahospitalsguntur.in/public_html'),
        publicHtmlIndexExists: fs.existsSync('/home/u594140720/domains/krishnahospitalsguntur.in/public_html/index.html'),
        cwd: process.cwd(),
        passengerAppRoot: process.env.PASSENGER_APP_ROOT || null,
      }
    );
  }
  return ApiResponse.error(res, `Route Not Found - ${req.originalUrl}`, 404);
};
