
import { db } from "./db/index.js";
import { favoriteDestinations } from "./shared/schema.js";
import { sql } from "drizzle-orm";

async function cleanupDuplicates() {
  try {
    console.log("Cleaning up duplicate favorite destinations...");
    
    // Delete duplicates, keeping only the one with the lowest ID for each slug
    await db.execute(sql`
      DELETE FROM favorite_destinations 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM favorite_destinations 
        GROUP BY slug
      )
    `);
    
    console.log("Cleanup completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupDuplicates();
