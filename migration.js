
const { Client } = require('pg');

async function fixImportedVideoCounts() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all channels
    const channelsResult = await client.query('SELECT id, name FROM youtube_channels');
    console.log(`Found ${channelsResult.rows.length} channels`);

    for (const channel of channelsResult.rows) {
      // Count videos for this channel
      const videosResult = await client.query(
        'SELECT COUNT(*) as count FROM youtube_videos WHERE channel_id = $1',
        [channel.id]
      );
      
      const videoCount = parseInt(videosResult.rows[0].count);
      
      // Update the channel's imported_video_count
      await client.query(
        'UPDATE youtube_channels SET imported_video_count = $1 WHERE id = $2',
        [videoCount, channel.id]
      );
      
      console.log(`Updated channel "${channel.name}" with ${videoCount} imported videos`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

fixImportedVideoCounts();
