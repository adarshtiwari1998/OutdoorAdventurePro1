
import('./server/scripts/updateVideoStats.js')
  .then(({ updateAllVideoStatistics }) => {
    console.log('🚀 Starting video statistics update script...');
    
    return updateAllVideoStatistics();
  })
  .then(() => {
    console.log('✅ Video statistics update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Video statistics update failed:', error);
    process.exit(1);
  });
