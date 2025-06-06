
import { Client } from 'pg';

async function addCategoryIdsColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add the categoryIds column
    await client.query(`
      ALTER TABLE youtube_channels 
      ADD COLUMN IF NOT EXISTS category_ids TEXT;
    `);

    console.log('✅ Added category_ids column to youtube_channels table');

    // Update existing channels with their categories
    const channels = await client.query('SELECT id FROM youtube_channels');
    console.log(`Found ${channels.rows.length} channels to update`);

    for (const channel of channels.rows) {
      // Get unique category IDs for this channel
      const categoryResult = await client.query(`
        SELECT DISTINCT category_id 
        FROM youtube_videos 
        WHERE channel_id = $1 AND category_id IS NOT NULL
        ORDER BY category_id
      `, [channel.id]);

      const categoryIds = categoryResult.rows.map(row => row.category_id);
      const categoryIdsString = categoryIds.length > 0 ? categoryIds.join(',') : null;

      // Update the channel
      await client.query(`
        UPDATE youtube_channels 
        SET category_ids = $1, updated_at = NOW()
        WHERE id = $2
      `, [categoryIdsString, channel.id]);

      console.log(`Updated channel ${channel.id} with categories: ${categoryIdsString || 'none'}`);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

addCategoryIdsColumn();
