
import { Client } from 'pg';

async function addCategoryColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the column already exists
    const checkColumnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youtube_channels' 
      AND column_name = 'category_id'
    `);

    if (checkColumnResult.rows.length === 0) {
      console.log('Adding category_id column to youtube_channels table...');
      
      // Add the category_id column
      await client.query(`
        ALTER TABLE youtube_channels 
        ADD COLUMN category_id INTEGER REFERENCES categories(id)
      `);
      
      console.log('✅ Successfully added category_id column');
    } else {
      console.log('✅ category_id column already exists');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

addCategoryColumn();
