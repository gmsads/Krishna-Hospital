import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();
  } catch (err) {
    console.warn(`[Server] Continuing HTTP server boot despite DB warning: ${err.message}`);
  }

  const server = app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Krishna Hospital Backend API running on port ${config.port}`);
    console.log(`🌐 Environment: ${config.nodeEnv}`);
    console.log(`🔐 Auth API Endpoint: http://localhost:${config.port}/api/v1/auth`);
    console.log(`=======================================================`);
  });

  // Process error handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', reason);
  });
};

startServer();
