import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB Connection Error: ${error.message}`);

    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.warn(`[Database] ⚠️ Atlas Authentication Failed: Please check your database username, password, or IP Whitelist in MongoDB Atlas.`);
      console.warn(`[Database] 💡 Quick Fix: Update MONGODB_URI in backend/.env with your valid MongoDB Atlas credentials or use local: mongodb://127.0.0.1:27017/krishna_hospital`);
    } else {
      console.warn(`[Database] ⚠️ Note: Ensure MongoDB service is running on ${config.mongoUri}`);
    }
  }
};
