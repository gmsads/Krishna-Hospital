import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const getFrontendDistPath = () => {
  const rawEnvPath = process.env.FRONTEND_DIST_PATH;
  if (rawEnvPath) {
    const cleanEnvPath = rawEnvPath.trim().replace(/^["']|["']$/g, '');
    if (fs.existsSync(cleanEnvPath) && fs.existsSync(path.join(cleanEnvPath, 'index.html'))) {
      return cleanEnvPath;
    }
  }

  const explicitCandidates = [
    '/home/u594140720/domains/krishnahospitalsguntur.in/public_html',
    '/home/u594140720/domains/krishnahospitalsguntur.in/public_html/dist',
    '/home/u594140720/domains/krishnahospitalsguntur.in/hbuilds/current/nodejs/frontend/dist',
    '/home/u594140720/domains/krishnahospitalsguntur.in/hbuilds/current/nodejs/dist',
    '/home/u594140720/public_html',
  ];

  for (const cand of explicitCandidates) {
    if (fs.existsSync(cand) && fs.existsSync(path.join(cand, 'index.html'))) {
      return cand;
    }
  }

  const bases = [
    __dirname,
    process.cwd(),
    process.env.PASSENGER_APP_ROOT,
    process.env.PWD,
    process.env.INIT_CWD,
    '/home/u594140720/domains/krishnahospitalsguntur.in/hbuilds/current/nodejs',
    '/home/u594140720/domains/krishnahospitalsguntur.in/public_html',
    '/home/u594140720/public_html',
  ].filter(Boolean);

  const targets = [
    'frontend/dist',
    'frontend/build',
    'dist',
    'build',
    'public_html',
    'public',
    'public_html/dist',
    'public_html/frontend/dist',
    'hbuilds/current/nodejs/frontend/dist',
    'hbuilds/current/nodejs/dist',
  ];

  for (const base of bases) {
    let curr = base;
    for (let depth = 0; depth < 6; depth++) {
      for (const target of targets) {
        const candidate = path.join(curr, target);
        if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
          return candidate;
        }
      }
      if (fs.existsSync(path.join(curr, 'index.html'))) {
        return curr;
      }
      const parent = path.dirname(curr);
      if (parent === curr) break;
      curr = parent;
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

    const envClean = process.env.FRONTEND_DIST_PATH ? process.env.FRONTEND_DIST_PATH.trim().replace(/^["']|["']$/g, '') : null;

    return ApiResponse.error(
      res,
      `Frontend static files not found on server for route '${req.originalUrl}'. Ensure frontend build step (npm run build) has completed.`,
      404,
      {
        envPathRaw: process.env.FRONTEND_DIST_PATH || null,
        envPathClean: envClean,
        envPathExists: envClean ? fs.existsSync(envClean) : false,
        publicHtmlExists: fs.existsSync('/home/u594140720/domains/krishnahospitalsguntur.in/public_html'),
        publicHtmlIndexExists: fs.existsSync('/home/u594140720/domains/krishnahospitalsguntur.in/public_html/index.html'),
        cwd: process.cwd(),
        passengerAppRoot: process.env.PASSENGER_APP_ROOT || null,
      }
    );
  }
  return ApiResponse.error(res, `Route Not Found - ${req.originalUrl}`, 404);
};
