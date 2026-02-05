// src/lib/mongodb.ts
import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached.conn) {
    // Verify the connection is still alive before reusing
    if (cached.conn.connection.readyState === 1) {
      return cached.conn;
    }
    // Connection dropped — reset and reconnect
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      // Serverless-optimized connection settings:
      // Smaller pool since each Vercel function is short-lived
      maxPoolSize: 5,
      minPoolSize: 1,
      // Faster timeouts for cold starts — fail fast rather than hang
      serverSelectionTimeoutMS: 5000,  // Max 5s to find a server (default 30s)
      connectTimeoutMS: 5000,          // Max 5s to establish connection (default 30s)
      socketTimeoutMS: 30000,          // 30s for operations (default 360s)
      // Heartbeat and idle settings for serverless
      heartbeatFrequencyMS: 15000,
      maxIdleTimeMS: 30000,            // Close idle connections after 30s
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
