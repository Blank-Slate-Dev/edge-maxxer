// src/lib/models/ScanRotation.ts
import mongoose, { Schema, Model } from 'mongoose';

export interface IScanRotation {
  _id: string;
  counter: number;
  lastRotatedAt: Date;
}

interface ScanRotationModel extends Model<IScanRotation> {
  getAndIncrement(): Promise<number>;
}

const ScanRotationSchema = new Schema<IScanRotation, ScanRotationModel>(
  {
    _id: {
      type: String,
      required: true,
    },
    counter: {
      type: Number,
      default: 0,
    },
    lastRotatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    _id: false,
  }
);

/**
 * Atomically get the current counter value and increment it.
 * Uses findOneAndUpdate with upsert to handle first-run automatically.
 * Returns the counter value BEFORE incrementing (so the caller uses the current value).
 */
ScanRotationSchema.statics.getAndIncrement = async function (): Promise<number> {
  const doc = await this.findOneAndUpdate(
    { _id: 'scan-rotation' },
    {
      $inc: { counter: 1 },
      $set: { lastRotatedAt: new Date() },
    },
    {
      upsert: true,
      returnDocument: 'before', // Return the document BEFORE the update
    }
  ).lean();

  // On first run, doc will be null (upsert created it), so counter starts at 0
  return doc?.counter ?? 0;
};

const ScanRotation: ScanRotationModel =
  (mongoose.models.ScanRotation as unknown as ScanRotationModel) ||
  mongoose.model<IScanRotation, ScanRotationModel>('ScanRotation', ScanRotationSchema);

export default ScanRotation;