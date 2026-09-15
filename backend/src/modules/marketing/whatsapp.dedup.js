import mongoose from 'mongoose';

const processedMessageSchema = new mongoose.Schema(
  {
    platformMessageId: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24-hour TTL
  }
);

const ProcessedMessage = mongoose.models.ProcessedMessage || mongoose.model('ProcessedMessage', processedMessageSchema);

export class MongoDedupStore {
  async markProcessed(platformMessageId) {
    if (!platformMessageId) return false;
    try {
      await ProcessedMessage.create({ platformMessageId });
      return true;
    } catch (err) {
      if (err.code === 11000) return false; // Duplicate key error
      console.warn('[MongoDedupStore] Dedup check error:', err.message);
      return false;
    }
  }
}
