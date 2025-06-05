
#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config();

import { updateAllVideoStatistics } from './updateVideoStats.js';

console.log(`🕐 Scheduled video statistics update started at ${new Date().toISOString()}`);

async function scheduledUpdate() {
  try {
    await updateAllVideoStatistics();
    console.log(`✅ Scheduled update completed successfully at ${new Date().toISOString()}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Scheduled update failed at ${new Date().toISOString()}:`, error);
    process.exit(1);
  }
}

scheduledUpdate();
