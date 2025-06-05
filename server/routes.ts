
import express, { type Express } from "express";
import { db } from "@db";
import * as schema from "@db/schema";
import { eq, and, desc, asc, sql, like, ilike, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

export function registerRoutes(app: Express) {
  // Delete favorite destination
  app.delete('/api/admin/favorite-destinations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id);

      if (isNaN(parsedId)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid destination ID' 
        });
      }

      // Check if destination exists
      const destination = await db.query.favoriteDestinations.findFirst({
        where: eq(schema.favoriteDestinations.id, parsedId)
      });

      if (!destination) {
        return res.status(404).json({ 
          success: false, 
          error: 'Destination not found' 
        });
      }

      // Delete the destination and return the deleted row
      const deletedRows = await db.delete(schema.favoriteDestinations)
        .where(eq(schema.favoriteDestinations.id, parsedId))
        .returning();

      if (deletedRows.length === 0) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to delete destination from database' 
        });
      }

      console.log(`Successfully deleted favorite destination ${parsedId}:`, deletedRows[0]);

      res.json({ 
        success: true, 
        message: 'Destination deleted successfully',
        deletedDestination: deletedRows[0]
      });
    } catch (error) {
      console.error('Error deleting favorite destination:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete destination' 
      });
    }
  });

  return { close: () => {} };
}
