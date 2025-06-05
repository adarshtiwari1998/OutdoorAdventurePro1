
import { storage } from '../storage';
import { YouTubeService } from '../services/youtubeService';

const youtubeService = new YouTubeService();

async function updateAllVideoStatistics() {
  try {
    console.log('🔄 Starting video statistics update...');
    
    // Get all videos that need stats update (or all videos)
    const videosToUpdate = await storage.getVideosForStatsUpdate(1000); // Get up to 1000 videos
    
    if (videosToUpdate.length === 0) {
      console.log('✅ All videos are up to date');
      return;
    }
    
    console.log(`📊 Found ${videosToUpdate.length} videos to update`);
    
    // Process videos in batches of 50 (YouTube API limit)
    const batchSize = 50;
    let totalUpdated = 0;
    
    for (let i = 0; i < videosToUpdate.length; i += batchSize) {
      const batch = videosToUpdate.slice(i, i + batchSize);
      const videoIds = batch.map(v => v.videoId);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videosToUpdate.length / batchSize)}: ${videoIds.length} videos`);
      
      try {
        // Fetch statistics from YouTube API
        const statsMap = await youtubeService.batchUpdateVideoStatistics(videoIds);
        
        // Prepare updates for database
        const updates = batch
          .map(video => {
            const stats = statsMap.get(video.videoId);
            if (stats) {
              return {
                id: video.id,
                viewCount: stats.viewCount,
                likeCount: stats.likeCount,
                commentCount: stats.commentCount
              };
            }
            return null;
          })
          .filter(Boolean);
        
        if (updates.length > 0) {
          await storage.batchUpdateVideoStatistics(updates);
          totalUpdated += updates.length;
          console.log(`✅ Updated ${updates.length} videos in this batch`);
        }
        
        // Add delay between batches to respect API rate limits
        if (i + batchSize < videosToUpdate.length) {
          console.log('⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing batch starting at index ${i}:`, error);
        // Continue with next batch even if this one fails
      }
    }
    
    console.log(`🎉 Statistics update complete! Updated ${totalUpdated} out of ${videosToUpdate.length} videos`);
    
  } catch (error) {
    console.error('❌ Error in updateAllVideoStatistics:', error);
    throw error;
  }
}

// Export for use in other scripts
export { updateAllVideoStatistics };

// Run directly if this file is executed
if (require.main === module) {
  updateAllVideoStatistics()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
