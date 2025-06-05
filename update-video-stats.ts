
import dotenv from 'dotenv';
dotenv.config();

import { updateAllVideoStatistics } from './server/scripts/updateVideoStats';

console.log('🚀 Starting video statistics update script...');

updateAllVideoStatistics()
  .then(() => {
    console.log('✅ Video statistics update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Video statistics update failed:', error);
    process.exit(1);
  });
