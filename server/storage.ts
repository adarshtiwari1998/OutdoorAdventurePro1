import { db } from '@db';
import { 
  users, 
  categories, 
  activities, 
  blogPosts, 
  products,
  youtubeChannels,
  youtubeVideos,
  testimonials,
  newsletterSubscribers,
  orders,
  orderItems,
  carts,
  cartItems,
  adminStats,
  InsertBlogPost,
  sliders,
  InsertSlider,
  wordpressCredentials,
  dashboardAssets
} from '@shared/schema';
import * as schema from '@shared/schema';
import { eq, and, like, desc, sql, asc, not, isNull, inArray, or, lt } from 'drizzle-orm';
import { format, subDays } from 'date-fns';
import { createSlug } from './utils/slugify';
import videoService from './services/videoService';

// Create session store for authentication
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { Pool } from 'pg';
import { pool } from '@db';
// Prepare data for insertion
      import { decode } from 'html-entities';

const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ 
  pool, 
  createTableIfMissing: true 
});

export const storage = {
  // User related operations
  async getUser(id: number) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.id, id),
      });
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      throw error;
    }
  },

  async getUserByUsername(username: string) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.username, username),
      });
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      throw error;
    }
  },

  async getUserByEmail(email: string) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.email, email),
      });
    } catch (error) {
      console.error(`Error getting user by email ${email}:`, error);
      throw error;
    }
  },

  async createUser(userData: any) {
    try {
      const [user] = await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        isAdmin: false, // Default role
      }).returning();

      return user;
    } catch (error) {
      console.error(`Error creating user:`, error);
      throw error;
    }
  },

  async updateUserPassword(userId: number, newPassword: string) {
    try {
      await db.update(users)
        .set({ 
          password: newPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error(`Error updating password for user ${userId}:`, error);
      throw error;
    }
  },

  // Expose the session store for passport
  sessionStore,

  // Activities
  async getFeaturedActivities() {
    try {
      return await db.query.activities.findMany({
        where: eq(activities.featured, true),
        limit: 3,
        with: {
          category: true,
        },
      });
    } catch (error) {
      console.error('Error getting featured activities:', error);
      throw error;
    }
  },

  async getActivitiesByCategory(categorySlug: string) {
    try {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
      });

      if (!category) {
        return [];
      }

      return await db.query.activities.findMany({
        where: eq(activities.categoryId, category.id),
        limit: 6,
        with: {
          category: true,
        },
      });
    } catch (error) {
      console.error(`Error getting activities for category ${categorySlug}:`, error);
      throw error;
    }
  },

  // YouTube Channels
  async getYoutubeChannels() {
    try {
      const channels = await db.query.youtubeChannels.findMany({
        limit: 5,
      });

      return channels.map(channel => ({
        id: channel.id.toString(),
        title: channel.name,
        image: channel.image || 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        subscribers: channel.subscribers,
        youtubeUrl: `https://youtube.com/channel/${channel.channelId}`,
      }));
    } catch (error) {
      console.error('Error getting YouTube channels:', error);
      throw error;
    }
  },

  async getAdminYoutubeChannels() {
    try {
      return await db.query.youtubeChannels.findMany({
        with: {
          category: true,
        },
        orderBy: [desc(schema.youtubeChannels.createdAt)]
      });
    } catch (error) {
      console.error('Error getting admin YouTube channels:', error);
      throw error;
    }
  },

  async getYoutubeChannelById(id: number) {
    try {
      return await db.query.youtubeChannels.findFirst({
        where: eq(youtubeChannels.id, id),
      });
    } catch (error) {
      console.error(`Error getting YouTube channel by ID ${id}:`, error);
      throw error;
    }
  },

  async createYoutubeChannel(channelData: any) {
    try {
      const [channel] = await db.insert(youtubeChannels).values({
        channelId: channelData.channelId,
        name: channelData.name,
        description: channelData.description,
        image: channelData.image,
        subscribers: channelData.subscribers,
        videoCount: channelData.videoCount,
      }).returning();

      return channel;
    } catch (error) {
      console.error('Error creating YouTube channel:', error);
      throw error;
    }
  },

  async updateYoutubeChannelLastImport(channelId: number): Promise<void> {
    await db.update(schema.youtubeChannels)
      .set({ lastImport: new Date() })
      .where(eq(schema.youtubeChannels.id, channelId));
  },

  async autoAssignChannelCategories(): Promise<{ channelsUpdated: number, results: Array<{ channelId: number, channelName: string, assignedCategoryId: number, assignedCategoryName: string, videoCount: number }> }> {
    console.log('🔄 Starting auto-assignment of channel categories based on video categories...');
    
    const results = [];
    let channelsUpdated = 0;

    // Get all channels
    const channels = await db.query.youtubeChannels.findMany({
      columns: { id: true, name: true }
    });

    for (const channel of channels) {
      try {
        // Get all videos for this channel with their categories
        const videos = await db.query.youtubeVideos.findMany({
          where: eq(schema.youtubeVideos.channelId, channel.id),
          columns: { categoryId: true },
          with: {
            category: {
              columns: { name: true }
            }
          }
        });

        if (videos.length === 0) {
          console.log(`⏭️ Channel "${channel.name}" has no videos, skipping...`);
          continue;
        }

        // Count videos by category
        const categoryCounts = new Map<number, { count: number, name: string }>();
        
        videos.forEach(video => {
          if (video.categoryId && video.category) {
            const existing = categoryCounts.get(video.categoryId) || { count: 0, name: video.category.name };
            categoryCounts.set(video.categoryId, { 
              count: existing.count + 1, 
              name: video.category.name 
            });
          }
        });

        if (categoryCounts.size === 0) {
          console.log(`⏭️ Channel "${channel.name}" has no videos with categories, skipping...`);
          continue;
        }

        // Find the most common category
        let mostCommonCategoryId = 0;
        let mostCommonCategoryName = '';
        let maxCount = 0;

        categoryCounts.forEach((data, categoryId) => {
          if (data.count > maxCount) {
            maxCount = data.count;
            mostCommonCategoryId = categoryId;
            mostCommonCategoryName = data.name;
          }
        });

        // Update the channel with the most common category
        await db.update(schema.youtubeChannels)
          .set({ 
            categoryId: mostCommonCategoryId,
            updatedAt: new Date()
          })
          .where(eq(schema.youtubeChannels.id, channel.id));

        console.log(`✅ Updated channel "${channel.name}" with category "${mostCommonCategoryName}" (${maxCount}/${videos.length} videos)`);
        
        results.push({
          channelId: channel.id,
          channelName: channel.name,
          assignedCategoryId: mostCommonCategoryId,
          assignedCategoryName: mostCommonCategoryName,
          videoCount: maxCount
        });
        
        channelsUpdated++;

      } catch (error) {
        console.error(`❌ Error processing channel "${channel.name}":`, error);
      }
    }

    console.log(`📊 Auto-assignment complete: ${channelsUpdated} channels updated`);
    return { channelsUpdated, results };
  },

  async updateYoutubeChannelImportedCount(channelId: number, additionalCount: number) {
    try {
      // Get current count and add the new imports
      const currentChannel = await db.query.youtubeChannels.findFirst({
        where: eq(youtubeChannels.id, channelId),
      });

      if (!currentChannel) {
        throw new Error(`Channel with ID ${channelId} not found`);
      }

      const newCount = (currentChannel.importedVideoCount || 0) + additionalCount;

      return await db.update(youtubeChannels)
        .set({ 
          importedVideoCount: newCount,
          updatedAt: new Date() 
        })
        .where(eq(youtubeChannels.id, channelId))
        .returning();
    } catch (error) {
      console.error(`Error updating YouTube channel imported count for ${channelId}:`, error);
      throw error;
    }
  },

  async setYoutubeChannelImportedCount(channelId: number, actualCount: number) {
    try {
      return await db.update(youtubeChannels)
        .set({ 
          importedVideoCount: actualCount,
          updatedAt: new Date() 
        })
        .where(eq(youtubeChannels.id, channelId))
        .returning();
    } catch (error) {
      console.error(`Error setting YouTube channel imported count for ${channelId}:`, error);
      throw error;
    }
  },

  async deleteYoutubeChannel(id: number) {
    try {
      // First, delete all videos associated with this channel
      await db.delete(youtubeVideos).where(eq(youtubeVideos.channelId, id));

      // Then delete the channel
      await db.delete(youtubeChannels).where(eq(youtubeChannels.id, id));
    } catch (error) {
      console.error(`Error deleting YouTube channel ${id}:`, error);
      throw error;
    }
  },

  // YouTube Videos
  async getYoutubeVideosByChannel(channelId: string, limit?: number) {
    try {
      const query = {
        where: eq(schema.youtubeVideos.channelId, parseInt(channelId)),
        with: {
          channel: {
            columns: { name: true, channelId: true }
          },
          category: {
            columns: { name: true }
          }
        },
        orderBy: [desc(schema.youtubeVideos.publishedAt)],
        ...(limit && { limit })
      };

      const videos = await db.query.youtubeVideos.findMany(query);

      return videos.map(video => ({
        ...video,
        channelName: video.channel?.name || 'Unknown Channel'
      }));
    } catch (error) {
      console.error("Error fetching YouTube videos by channel:", error);
      throw error;
    }
  },

  async getAdminYoutubeVideos(limit?: number) {
    try {
      const query = {
        with: {
          channel: {
            columns: { name: true, channelId: true }
          },
          category: {
            columns: { name: true }
          }
        },
        orderBy: [desc(schema.youtubeVideos.publishedAt)],
        ...(limit && { limit })
      };

      const videos = await db.query.youtubeVideos.findMany(query);

      return videos.map(video => ({
        ...video,
        channelName: video.channel?.name || 'Unknown Channel'
      }));
    } catch (error) {
      console.error("Error fetching admin YouTube videos:", error);
      throw error;
    }
  },

  async getYoutubeVideoById(id: number) {
    try {
      return await db.query.youtubeVideos.findFirst({
        where: eq(youtubeVideos.id, id),
      });
    } catch (error) {
      console.error(`Error getting YouTube video by ID ${id}:`, error);
      throw error;
    }
  },

  async createYoutubeVideo(videoData: {
    videoId: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string | Date;
    channelId: number;
    categoryId?: number | null;
    transcript?: string | null;
    importStatus?: string;
    videoType?: string;
    duration?: number;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  }) {
    try {
      const publishedDate = typeof videoData.publishedAt === 'string' 
        ? new Date(videoData.publishedAt) 
        : videoData.publishedAt;

      const [video] = await db.insert(youtubeVideos).values({
        videoId: videoData.videoId,
        title: videoData.title,
        description: videoData.description,
        thumbnail: videoData.thumbnail,
        publishedAt: publishedDate,
        channelId: videoData.channelId,
        categoryId: videoData.categoryId,
        transcript: videoData.transcript,
        importStatus: videoData.importStatus || 'pending',
        videoType: videoData.videoType || 'video',
        duration: videoData.duration,
        viewCount: videoData.viewCount || 0,
        likeCount: videoData.likeCount || 0,
        commentCount: videoData.commentCount || 0,
        lastStatsUpdate: videoData.viewCount ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Auto-fetch statistics for newly imported videos if not already provided
      if (!videoData.viewCount && process.env.AUTO_FETCH_STATS === 'true') {
        console.log(`📊 Auto-fetching statistics for new video: ${videoData.videoId}`);
        try {
          const { YouTubeService } = await import('./services/youtubeService');
          const youtubeService = new YouTubeService();
          const stats = await youtubeService.updateVideoStatistics(videoData.videoId);

          if (stats) {
            await this.updateYoutubeVideoStatistics(video.id, stats);
            console.log(`✅ Auto-updated stats for ${videoData.videoId}: ${stats.viewCount} views`);
          }
        } catch (statsError) {
          console.warn(`⚠️ Failed to auto-fetch stats for ${videoData.videoId}:`, statsError);
        }
      }

      return video;
    } catch (error) {
      console.error('Error creating YouTube video:', error);
      throw error;
    }
  },

  // Advanced title similarity calculation using multiple algorithms
  calculateAdvancedTitleSimilarity(videoTitle: string, blogTitle: string): number {
    // Normalize titles for comparison
    const normalizeTitle = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
    };

    const videoNormalized = normalizeTitle(videoTitle);
    const blogNormalized = normalizeTitle(blogTitle);

    // 1. Exact match (highest score)
    if (videoNormalized === blogNormalized) {
      return 1.0;
    }

    // 2. One title contains the other (high score)
    if (videoNormalized.includes(blogNormalized) || blogNormalized.includes(videoNormalized)) {
      return 0.9;
    }

    // 3. Calculate multiple similarity scores
    const levenshteinScore = this.calculateLevenshteinSimilarity(videoNormalized, blogNormalized);
    const jaccardScore = this.calculateJaccardSimilarity(videoNormalized, blogNormalized);
    const keywordScore = this.calculateKeywordSimilarity(videoNormalized, blogNormalized);
    const semanticScore = this.calculateSemanticSimilarity(videoNormalized, blogNormalized);

    // Weighted average of different similarity measures
    const finalScore = (
      levenshteinScore * 0.3 +
      jaccardScore * 0.3 +
      keywordScore * 0.25 +
      semanticScore * 0.15
    );

    return Math.min(finalScore, 0.95); // Cap at 0.95 to reserve 1.0 for exact matches
  },

  // Levenshtein distance-based similarity
  calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  },

  levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  },

  // Jaccard similarity based on word sets
  calculateJaccardSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' ').filter(word => word.length > 2));
    const words2 = new Set(str2.split(' ').filter(word => word.length > 2));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  },

  // Keyword-based similarity (important words carry more weight)
  calculateKeywordSimilarity(str1: string, str2: string): number {
    // Common stop words to ignore
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);

    const getKeywords = (str: string): string[] => {
      return str
        .split(' ')
        .filter(word => word.length > 2 && !stopWords.has(word))
        .map(word => word.toLowerCase());
    };

    const keywords1 = getKeywords(str1);
    const keywords2 = getKeywords(str2);

    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    let matches = 0;
    const totalKeywords = Math.max(keywords1.length, keywords2.length);

    // Check for exact keyword matches
    for (const keyword1 of keywords1) {
      for (const keyword2 of keywords2) {
        if (keyword1 === keyword2) {
          matches++;
          break;
        }
        // Also check for partial matches on longer words
        if (keyword1.length > 4 && keyword2.length > 4) {
          if (keyword1.includes(keyword2) || keyword2.includes(keyword1)) {
            matches += 0.7; // Partial match worth less
            break;
          }
        }
      }
    }

    return matches / totalKeywords;
  },

  // Semantic similarity based on context and meaning
  calculateSemanticSimilarity(str1: string, str2: string): number {
    // Common outdoor/adventure related synonyms and related terms
    const semanticGroups = [
      ['camping', 'camp', 'campsite', 'outdoor', 'outdoors'],
      ['hiking', 'hike', 'trail', 'walk', 'trek', 'trekking'],
      ['fishing', 'fish', 'angling', 'catch'],
      ['travel', 'trip', 'journey', 'adventure', 'vacation'],
      ['gear', 'equipment', 'tools', 'supplies'],
      ['tips', 'advice', 'guide', 'how', 'tutorial'],
      ['best', 'top', 'essential', 'must', 'need', 'important'],
      ['things', 'items', 'stuff', 'essentials'],
      ['fun', 'enjoy', 'experience', 'amazing', 'awesome']
    ];

    const words1 = str1.split(' ').filter(word => word.length > 2);
    const words2 = str2.split(' ').filter(word => word.length > 2);

    let semanticMatches = 0;
    let totalComparisons = 0;

    for (const word1 of words1) {
      for (const word2 of words2) {
        totalComparisons++;

        // Direct match
        if (word1 === word2) {
          semanticMatches += 1;
          continue;
        }

        // Check semantic groups
        for (const group of semanticGroups) {
          if (group.includes(word1) && group.includes(word2)) {
            semanticMatches += 0.8; // Semantic matches worth slightly less
            break;
          }
        }
      }
    }

    return totalComparisons === 0 ? 0 : semanticMatches / totalComparisons;
  },

  // Helper function for backward compatibility
  calculateSimilarity(str1: string, str2: string): number {
    return this.calculateAdvancedTitleSimilarity(str1, str2);
  },

  async updateYoutubeVideosCategory(videoIds: number[], categoryId: number) {
    try {
      await db.update(youtubeVideos)
        .set({ categoryId })
        .where(inArray(youtubeVideos.id, videoIds));
    } catch (error) {
      console.error('Error updating YouTube videos category:', error);
      throw error;
    }
  },

  async updateYoutubeVideoTranscript(videoId: number, transcript: string) {
    try {
      return await db.update(youtubeVideos)
        .set({ 
          transcript,
          updatedAt: new Date() 
        })
        .where(eq(youtubeVideos.id, videoId))
        .returning();
    } catch (error) {
      console.error(`Error updating YouTube video transcript for ${videoId}:`, error);
      throw error;
    }
  },

  async updateYoutubeVideoStatistics(videoId: number, stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }) {
    try {
      return await db.update(youtubeVideos)
        .set({ 
          viewCount: stats.viewCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
          lastStatsUpdate: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(youtubeVideos.id, videoId))
        .returning();
    } catch (error) {
      console.error(`Error updating YouTube video statistics for ${videoId}:`, error);
      throw error;
    }
  },

  async batchUpdateVideoStatistics(updates: Array<{
    id: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }>) {
    try {
      const promises = updates.map(update => 
        db.update(youtubeVideos)
          .set({
            viewCount: update.viewCount,
            likeCount: update.likeCount,
            commentCount: update.commentCount,
            lastStatsUpdate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(youtubeVideos.id, update.id))
      );

      await Promise.all(promises);
      console.log(`✅ Updated statistics for ${updates.length} videos`);
    } catch (error) {
      console.error('Error batch updating video statistics:', error);
      throw error;
    }
  },

  async getVideosForStatsUpdate(limit = 100): Promise<Array<{
    id: number;
    videoId: string;
    lastStatsUpdate: Date | null;
  }>> {
    try {
      // Get videos that haven't been updated in the last 24 hours or never updated
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      return await db.query.youtubeVideos.findMany({
        columns: {
          id: true,
          videoId: true,
          lastStatsUpdate: true
        },
        where: or(
          isNull(schema.youtubeVideos.lastStatsUpdate),
          lt(schema.youtubeVideos.lastStatsUpdate, oneDayAgo)
        ),
        orderBy: asc(schema.youtubeVideos.lastStatsUpdate),
        limit
      });
    } catch (error) {
      console.error('Error getting videos for stats update:', error);
      throw error;
    }
  },

  async getYoutubeVideoByVideoId(videoId: string) {
    try {
      return await db.query.youtubeVideos.findFirst({
        where: eq(youtubeVideos.videoId, videoId)
      });
    } catch (error) {
      console.error(`Error checking for existing YouTube video ${videoId}:`, error);
      throw error;
    }
  },

  async linkYoutubeVideoToBlogPost(videoId: number, blogPostId: number): Promise<void> {
    await db.update(schema.youtubeVideos)
      .set({
        blogPostId: blogPostId,
        importStatus: 'imported',
        updatedAt: new Date()
      })
      .where(eq(schema.youtubeVideos.id, videoId));
  },

  async deleteYoutubeVideo(id: number) {
    try {
      await db.delete(youtubeVideos).where(eq(youtubeVideos.id, id));
    } catch (error) {
      console.error(`Error deleting YouTube video ${id}:`, error);
      throw error;
    }
  },

  // Products
  async getFeaturedProducts() {
    try {
      const featuredProducts = await db.query.products.findMany({
        where: eq(products.featured, true),
        limit: 4,
        with: {
          category: true,
        },
      });

      return featuredProducts.map(product => ({
        id: product.id.toString(),
        title: product.title,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isNew: product.isNew,
        isSale: product.isSale,
        slug: product.slug,
      }));
    } catch (error) {
      console.error('Error getting featured products:', error);
      throw error;
    }
  },

  async getProducts({ category, searchQuery, page, pageSize, sortBy }: any) {
    try {
      let query = db.select().from(products);

      // Apply category filter
      if (category && category !== 'all') {
        const categoryObj = await db.query.categories.findFirst({
          where: eq(categories.slug, category),
        });

        if (categoryObj) {
          query = query.where(eq(products.categoryId, categoryObj.id));
        }
      }

      // Apply search filter
      if (searchQuery) {
        query = query.where(
          sql`(${products.title} ILIKE ${`%${searchQuery}%`} OR ${products.description} ILIKE ${`%${searchQuery}%`})`
        );
      }

      // Apply sorting
      if (sortBy === 'price-low') {
        query = query.orderBy(asc(products.price));
      } else if (sortBy === 'price-high') {
        query = query.orderBy(desc(products.price));
      } else if (sortBy === 'popularity') {
        query = query.orderBy(desc(products.rating));
      } else {
        // Default to newest
        query = query.orderBy(desc(products.createdAt));
      }

      // Count total results for pagination
      const countQuery = db.select({
        count: sql<number>`count(*)`,
      }).from(products);

      // Apply the same filters to count query
      if (category && category !== 'all') {
        const categoryObj = await db.query.categories.findFirst({
          where: eq(categories.slug, category),
        });

        if (categoryObj) {
          countQuery.where(eq(products.categoryId, categoryObj.id));
        }
      }

      if (searchQuery) {
        countQuery.where(
          sql`(${products.title} ILIKE ${`%${searchQuery}%`} OR ${products.description} ILIKE ${`%${searchQuery}%`})`
        );
      }

      const [{ count }] = await countQuery;
      const totalPages = Math.ceil(count / pageSize);

      // Apply pagination
      query = query.limit(pageSize).offset((page - 1) * pageSize);

      // Execute query
      const result = await query;

      return {
        products: result.map(product => ({
          id: product.id.toString(),
          title: product.title,
          image: product.image,
          price: product.price,
          originalPrice: product.originalPrice,
          rating: product.rating,
          reviewCount: product.reviewCount,
          isNew: product.isNew,
          isSale: product.isSale,
          slug: product.slug,
        })),
        totalPages,
      };
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  },

  async getProductCategories() {
    try {
      return await db.query.categories.findMany({
        where: eq(categories.type, 'product'),
      });
    } catch (error) {
      console.error('Error getting product categories:', error);
      throw error;
    }
  },

  // Blog Posts
  async getFeaturedBlogPost() {
    try {
      const featuredPost = await db.query.blogPosts.findFirst({
        where: and(
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.id} = (
            SELECT id FROM ${blogPosts}
            WHERE status = 'published'
            ORDER BY published_at DESC
            LIMIT 1
          )`
        ),
        with: {
          category: true,
          author: true,
        },
      });

      if (!featuredPost) {
        throw new Error('No featured blog post found');
      }

      return {
        id: featuredPost.id.toString(),
        title: featuredPost.title,
        excerpt: featuredPost.excerpt,
        featuredImage: featuredPost.featuredImage,
        category: {
          name: featuredPost.category?.name || 'Uncategorized',
          slug: featuredPost.category?.slug || 'uncategorized',
        },
        author: {
          name: featuredPost.author?.fullName || featuredPost.author?.username || 'Unknown',
          avatar: featuredPost.author?.fullName 
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredPost.author.fullName)}&background=random`
            : `https://ui-avatars.com/api/?name=Unknown&background=random`,
        },
        publishedAt: featuredPost.publishedAt || new Date().toISOString(),
        slug: featuredPost.slug,
      };
    } catch (error) {
      console.error('Error getting featured blog post:', error);
      throw error;
    }
  },

  async getRegularBlogPosts(limit = 2) {
    try {
      const posts = await db.query.blogPosts.findMany({
        where: and(
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.id} NOT IN (
            SELECT id FROM ${blogPosts}
            WHERE status = 'published'
            ORDER BY published_at DESC
            LIMIT 1
          )`
        ),
        limit,
        orderBy: desc(blogPosts.publishedAt),
        with: {
          category: true,
          author: true,
        },
      });

      // If we don't have enough posts from the database, add some fishing-specific mock posts
      let resultPosts = posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        category: {
          name: post.category?.name || 'Uncategorized',
          slug: post.category?.slug || 'uncategorized',
        },
        author: {
          name: post.author?.fullName || post.author?.username || 'Unknown',
          avatar: post.author?.fullName 
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.fullName)}&background=random`
            : `https://ui-avatars.com/api/?name=Unknown&background=random`,
        },
        publishedAt: post.publishedAt || new Date().toISOString(),
        slug: post.slug,
      }));

      // Add fishing-specific posts if we need more posts
      if (resultPosts.length < limit) {
        const fishingPosts = [
          {
            id: "101",
            title: "Essential Fishing Gear for Different Species",
            excerpt: "Discover the specialized equipment you need to target different fish species, from bass to trout to deep-sea fishing.",
            featuredImage: "https://images.unsplash.com/photo-1511554153372-99d5d2ffd256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: {
              name: "Fishing",
              slug: "fishing",
            },
            author: {
              name: "Michael Rivers",
              avatar: "https://ui-avatars.com/api/?name=Michael+Rivers&background=random",
            },
            publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            slug: "essential-fishing-gear-different-species",
          },
          {
            id: "102",
            title: "Seasonal Fishing Spots in North America",
            excerpt: "A comprehensive guide to the best fishing locations throughout the year, organized by season and target species.",
            featuredImage: "https://images.unsplash.com/photo-1499242611767-cf8b9e9d4b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: {
              name: "Fishing",
              slug: "fishing",
            },
            author: {
              name: "Sarah Lakes",
              avatar: "https://ui-avatars.com/api/?name=Sarah+Lakes&background=random",
            },
            publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            slug: "seasonal-fishing-spots-north-america",
          },
          {
            id: "103",
            title: "Fish Conservation: Catch and Release Tips",
            excerpt: "Learn proper techniques to safely release fish back into the water while minimizing stress and injury for sustainable fishing.",
            featuredImage: "https://images.unsplash.com/photo-1564689510742-4e9c7584181d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: {
              name: "Fishing",
              slug: "fishing",
            },
            author: {
              name: "RobertStreams",
              avatar: "https://ui-avatars.com/api/?name=Robert+Streams&background=random",
            },
            publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            slug: "fish-conservation-catch-release",
          },
          {
            id: "104",
            title: "Fly Tying Fundamentals for Beginners",
            excerpt: "Step by step instructions to create your own effective fly patterns, from basic materials to advanced techniques.",
            featuredImage: "https://images.unsplash.com/photo-1508246325515-244e02aab338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: {
              name: "Fishing",
              slug: "fishing",
            },
            author: {
              name: "Anna Fisher",
              avatar: "https://ui-avatars.com/api/?name=Anna+Fisher&background=random",
            },
            publishedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
            slug: "fly-tying-fundamentals-beginners",
          },
        ];

        // Add fishing posts until we reach the limit
        for (let i = 0; i < limit - resultPosts.length; i++) {
          if (fishingPosts[i]) {
            resultPosts.push(fishingPosts[i]);
          }
        }
      }

      return resultPosts;
    } catch (error) {
      console.error('Error getting regular blog posts:', error);
      throw error;
    }
  },

  async getBlogPosts({ category, searchQuery, page, pageSize }: any) {
    try {
      // Featured post query (always first one in results)
      const featuredPost = await this.getFeaturedBlogPost().catch(() => null);

      // Regular posts query
      let query = db.select().from(blogPosts)
        .where(eq(blogPosts.status, 'published'));

      // Apply category filter
      if (category && category !== 'all') {
        const categoryObj = await db.query.categories.findFirst({
          where: eq(categories.slug, category),
        });

        if (categoryObj) {
          query = query.where(eq(blogPosts.categoryId, categoryObj.id));
        }
      }

      // Apply search filter
      if (searchQuery) {
        query = query.where(
          sql`(${blogPosts.title} ILIKE ${`%${searchQuery}%`} OR ${blogPosts.content} ILIKE ${`%${searchQuery}%`})`
        );
      }

      // Exclude featured post from regular results
      if (featuredPost) {
        query = query.where(not(eq(blogPosts.id, parseInt(featuredPost.id))));
      }

      // Count total results for pagination
      const countQuery = db.select({
        count: sql<number>`count(*)`,
      }).from(blogPosts).where(eq(blogPosts.status, 'published'));

      // Apply the same filters to count query
      if (category && category !== 'all') {
        const categoryObj = await db.query.categories.findFirst({
          where: eq(categories.slug, category),
        });

        if (categoryObj) {
          countQuery.where(eq(blogPosts.categoryId, categoryObj.id));
        }
      }

      if (searchQuery) {
        countQuery.where(
          sql`(${blogPosts.title} ILIKE ${`%${searchQuery}%`} OR ${blogPosts.content} ILIKE ${`%${searchQuery}%`})`
        );
      }

      const [{ count }] = await countQuery;
      const totalPages = Math.ceil(count / pageSize);

      // Apply sorting and pagination
      query = query.orderBy(desc(blogPosts.publishedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Execute query with joins
      const regularPosts = await db.query.blogPosts.findMany({
        where: query.where as any,
        limit: query.limit as any,
        offset: query.offset as any,
        orderBy: desc(blogPosts.publishedAt),
        with: {
          category: true,
          author: true,
        },
      });

      // Format posts
      const formattedRegularPosts = regularPosts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        category: {
          name: post.category?.name || 'Uncategorized',
          slug: post.category?.slug || 'uncategorized',
        },
        author: {
          name: post.author?.fullName || post.author?.username || 'Unknown',
          avatar: featuredPost.author?.fullName 
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredPost.author.fullName)}&background=random`
            : `https://ui-avatars.com/api/?name=Unknown&background=random`,
        },
        publishedAt: post.publishedAt || new Date().toISOString(),
        slug: post.slug,
      }));

      return {
        featured: featuredPost,
        posts: formattedRegularPosts,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting blog posts:', error);
      throw error;
    }
  },

  async getBlogCategories() {
    try {
      return await db.query.categories.findMany({
        where: eq(categories.type, 'blog'),
        orderBy: asc(categories.name),
      });
    } catch (error) {
      console.error('Error getting blog categories:', error);
      throw error;
    }
  },

  async createBlogCategory(categoryData: {
    name: string;
    slug: string;
    description?: string | null;
    type: string;
  }) {
    try {
      const [newCategory] = await db.insert(categories)
        .values({
          ...categoryData,
          createdAt: new Date()
        })
        .returning();
      return newCategory;
    } catch (error) {
      console.error('Error creating blog category:', error);
      throw error;
    }
  },

  async ensureBlogCategoryFromHeader(headerCategory: string) {
    // Check if blog category already exists for this header category
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.slug, headerCategory)
    });

    if (!existingCategory) {
      // Create blog category for this header category
      const categoryName = headerCategory.charAt(0).toUpperCase() + headerCategory.slice(1);
      return await this.createBlogCategory({
        name: categoryName,
        slug: headerCategory,
        description: `Blog posts for ${categoryName} category`,
        type: 'blog'
      });
    }

    return existingCategory;
  },

  async deleteBlogCategory(categoryId: number) {
    try {
      await db.delete(categories)
        .where(eq(categories.id, categoryId));
    } catch (error) {
      console.error('Error deleting blog category:', error);
      throw error;
    }
  },

  async getBlogPostsCountByCategory(categoryId: number): Promise<number> {
    try {
      const count = await db.select({ count: sql<number>`count(*)` })
        .from(blogPosts)
        .where(eq(blogPosts.categoryId, categoryId));
      return count[0]?.count || 0;
    } catch (error) {
      console.error(`Error counting blog posts for category ${categoryId}:`, error);
      throw error;
    }
  },

  async getBlogAnalytics() {
    try {
      // Get total posts count
      const totalPostsResult = await db.select({ count: sql<number>`count(*)` })
        .from(blogPosts);
      const totalPosts = totalPostsResult[0]?.count || 0;

      // Get published posts count
      const publishedPostsResult = await db.select({ count: sql<number>`count(*)` })
        .from(blogPosts)
        .where(eq(blogPosts.status, 'published'));
      const publishedPosts = publishedPostsResult[0]?.count || 0;

      // Get draft posts count
      const draftPostsResult = await db.select({ count: sql<number>`count(*)` })
        .from(blogPosts)
        .where(eq(blogPosts.status, 'draft'));
      const draftPosts = draftPostsResult[0]?.count || 0;

      // Get categories with post counts
      const categoriesData = await db.select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        postCount: sql<number>`count(${blogPosts.id})`,
        publishedCount: sql<number>`count(case when ${blogPosts.status} = 'published' then 1 end)`,
        draftCount: sql<number>`count(case when ${blogPosts.status} = 'draft' then 1 end)`
      })
        .from(categories)
        .leftJoin(blogPosts, eq(categories.id, blogPosts.categoryId))
        .groupBy(categories.id, categories.name, categories.type);

      // Get detailed posts for each category
      const categoriesWithPosts = await Promise.all(
        categoriesData.map(async (category) => {
          const posts = await db.select({
            id: blogPosts.id,
            title: blogPosts.title,
            status: blogPosts.status,
            publishedAt: blogPosts.publishedAt,
            createdAt: blogPosts.createdAt
          })
            .from(blogPosts)
            .where(eq(blogPosts.categoryId, category.id))
            .orderBy(desc(blogPosts.createdAt))
            .limit(10);

          return {
            ...category,
            posts
          };
        })
      );

      return {
        totalPosts,
        publishedPosts,
        draftPosts,
        categoriesData: categoriesWithPosts
      };
    } catch (error) {
      console.error("Error fetching blog analytics:", error);
      throw error;
    }
  },

  async getAdminBlogPosts({ page, pageSize, status, categoryId, searchQuery, includeContent = false }: any) {
    try {
      const offset = (page - 1) * pageSize;

      let whereConditions: any[] = [];

      // Status filter
      if (status && status !== 'all') {
        whereConditions.push(eq(blogPosts.status, status));
      }

      // Category filter - handle both numeric IDs and category names
      if (categoryId && categoryId !== 'all') {
        if (isNaN(parseInt(categoryId))) {
          // It's a category name, find the category ID
          const category = await db.query.categories.findFirst({
            where: eq(categories.name, categoryId)
                    });
          if (category) {
            whereConditions.push(eq(blogPosts.categoryId, category.id));
          }
        } else {
          // It's a numeric category ID
          whereConditions.push(eq(blogPosts.categoryId, parseInt(categoryId)));
        }
      }

      // Search filter
      if (searchQuery) {
        whereConditions.push(
          sql`(${blogPosts.title} ILIKE ${`%${searchQuery}%`} OR ${blogPosts.content} ILIKE ${`%${searchQuery}%`})`
        );
      }

      // Combine all conditions
      const combinedWhere = whereConditions.length > 0 
        ? whereConditions.reduce((acc, condition) => and(acc, condition))
        : undefined;

      // Get total count for pagination
      const countQuery = db.select({
        count: sql<number>`count(*)`,
      }).from(blogPosts)
        .leftJoin(categories, eq(blogPosts.categoryId, categories.id));

      if (combinedWhere) {
        countQuery.where(combinedWhere);
      }

      const [{ count }] = await countQuery;
      const totalPages = Math.ceil(count / pageSize);

      // Build the main query
      let query = db.select({
        id: blogPosts.id,
        title: blogPosts.title,
        content: includeContent ? blogPosts.content : sql<string>`NULL`,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        tags: blogPosts.tags,
        slug: blogPosts.slug,
        categoryId: blogPosts.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorId: blogPosts.authorId
      })
        .from(blogPosts)
        .leftJoin(categories, eq(blogPosts.categoryId, categories.id))
        .leftJoin(users, eq(blogPosts.authorId, users.id));

      if (combinedWhere) {
        query = query.where(combinedWhere);
      }

      // Apply limit and offset only if pageSize is reasonable (not trying to fetch all)
      const finalQuery = pageSize < 1000 
        ? query.orderBy(desc(blogPosts.createdAt)).limit(pageSize).offset(offset)
        : query.orderBy(desc(blogPosts.createdAt));

      const posts = await finalQuery;

      // Format the results
      const formattedPosts = posts.map(post => ({
        id: post.id.toString(),
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        category: {
          id: post.categoryId?.toString() || '',
          name: post.categoryName || 'Uncategorized'
        },
        status: post.status,
        publishedAt: post.publishedAt,
        author: {
          name: 'Admin User', // Default author since we don't have detailed author info
          avatar: 'https://ui-avatars.com/api/?name=Admin%20User&background=random'
        },
        tags: (() => {
          if (!post.tags) return [];
          if (Array.isArray(post.tags)) return post.tags;
          if (typeof post.tags === 'string') return post.tags.split(',').map(tag => tag.trim());
          return [];
        })(),
        slug: post.slug,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));

      return {
        posts: formattedPosts,
        totalPages,
        totalCount: count
      };
    } catch (error) {
      console.error('Error getting admin blog posts:', error);
      throw error;
    }
  },

  async createBlogPost(postData: any) {
    try {
      // Generate slug from title
      const slug = createSlug(postData.title);

      // Convert tags from string or array
      let tags = postData.tags;
      if (typeof tags === 'string') {
        tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }

      // Set publication date if status is published
      const publishedAt = postData.status === 'published' ? new Date() : null;

      // If there's a date from WordPress, use it instead of current date
      const finalPublishedAt = postData.date ? new Date(postData.date) : publishedAt;


      // Parse and validate categoryId
      let categoryId = 1; // Default category
      if (postData.categoryId) {
        const parsedCategoryId = parseInt(postData.categoryId);
        if (!isNaN(parsedCategoryId)) {
          categoryId = parsedCategoryId;
        }
      }

      const blogPostData: any = {
        title: decode(postData.title || ''),
        slug,
        content: decode(postData.content || ''),
        excerpt: decode(postData.excerpt || ''),
        featuredImage: postData.featuredImage,
        categoryId: categoryId,
        authorId: 1, // Default to first user, would be replaced with actual user ID in real app
        status: postData.status,
        publishedAt: finalPublishedAt,
        tags,
      };

      // Add scheduled date if provided
      if (postData.status === 'scheduled' && postData.scheduledDate) {
        blogPostData.scheduledAt = new Date(postData.scheduledDate).toISOString();
      }

      const [newPost] = await db.insert(blogPosts).values(blogPostData).returning();

      return newPost;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  },

  async updateBlogPost(id: number, postData: any) {
    try {
      // Prepare update data
      const updateData: any = {};

      if (postData.title) {
        updateData.title = postData.title;
        updateData.slug = createSlug(postData.title);
      }

      if (postData.content) updateData.content = postData.content;
      if (postData.excerpt) updateData.excerpt = postData.excerpt;
      if (postData.featuredImage) updateData.featuredImage = postData.featuredImage;
      if (postData.categoryId) updateData.categoryId = parseInt(postData.categoryId);
      if (postData.status) updateData.status = postData.status;

      // Handle tags
      if (postData.tags) {
        let tags = postData.tags;
        if (typeof tags === 'string') {
          tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        updateData.tags = tags;
      }

      // Update published date if status changes to published
      if (postData.status === 'published') {
        const currentPost = await db.query.blogPosts.findFirst({
          where: eq(blogPosts.id, id),
        });

        if (currentPost && currentPost.status !== 'published') {
          updateData.publishedAt = new Date().toISOString();
        }
      }

      // Handle scheduled date
      if (postData.status === 'scheduled' && postData.scheduledDate) {
        updateData.scheduledAt = new Date(postData.scheduledDate).toISOString();
      } else if (postData.status !== 'scheduled') {
        updateData.scheduledAt = null;
      }

      const [updatedPost] = await db.update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, id))
        .returning();

      return updatedPost;
    } catch (error) {
      console.error(`Error updating blog post ${id}:`, error);
      throw error;
    }
  },

  async deleteBlogPosts(ids: string[]) {
    const numericIds = ids.map(id => parseInt(id));
    await db.delete(blogPosts)
      .where(inArray(blogPosts.id, numericIds));
  },

  async updateBlogPostsCategory(ids: string[], categoryId: number) {
    const numericIds = ids.map(id => parseInt(id));
    await db.update(blogPosts)
      .set({ 
        categoryId,
        updatedAt: new Date()
      })
      .where(inArray(blogPosts.id, numericIds));
  },

  // Testimonials
  async getTestimonials() {
    try {
      const allTestimonials = await db.query.testimonials.findMany({
        where: eq(testimonials.isActive, true),
        orderBy: desc(testimonials.createdAt),      });

      // Return only 3 testimonials for the home page
      return allTestimonials.slice(0, 3).map(testimonial => ({
        id: testimonial.id.toString(),
        content: testimonial.content,
        author: {
          name: testimonial.authorName,
          title: testimonial.authorTitle,
          avatar: testimonial.authorAvatar,
        },
        rating: testimonial.rating,
      }));
    } catch (error) {
      console.error('Error getting testimonials:', error);
      throw error;
    }
  },

  // Sliders management
  async getHomeSliders() {
    try {
      const activeSliders = await db.query.sliders.findMany({
        where: eq(sliders.isActive, true),
        orderBy: [asc(sliders.order), desc(sliders.createdAt)],
      });

      return activeSliders;
    } catch (error) {
      console.error('Error getting home sliders:', error);
      throw error;
    }
  },

  async getAllSliders() {
    try {
      return await db.query.sliders.findMany({
        orderBy: [asc(sliders.order), desc(sliders.createdAt)],
      });
    } catch (error) {
      console.error('Error getting all sliders:', error);
      throw error;
    }
  },

  // Cart operations
  async getCartItemCount(sessionId: string) {
    try {
      // First, get or create cart for this session
      let cart = await db.query.carts.findFirst({
        where: eq(carts.sessionId, sessionId),
      });

      if (!cart) {
        return 0;
      }

      // Get count of items in cart
      const result = await db.select({
        count: sql<number>`sum(${cartItems.quantity})`,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting cart item count:', error);
      throw error;
    }
  },

  async addToCart(sessionId: string, productId: string, quantity: number) {
    try {
      // First, get or create cart for this session
      let cart = await db.query.carts.findFirst({
        where: eq(carts.sessionId, sessionId),
      });

      if (!cart) {
        [cart] = await db.insert(carts).values({
          sessionId,
        }).returning();
      }

      // Check if item already exists in cart
      const existingItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, parseInt(productId))
        ),
      });

      if (existingItem) {
        // Update quantity
        await db.update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        // Add new item
        await db.insert(cartItems).values({
          cartId: cart.id,
          productId: parseInt(productId),
          quantity,
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  async addNewsletterSubscriber(fullName: string, email: string, interests: string[]) {
    try {
      await db.insert(newsletterSubscribers).values({
        fullName,
        email,
        interests,
      });
    } catch (error) {
      console.error('Error adding newsletter subscriber:', error);
      throw error;
    }
  },

  async getAdminStats(period: string) {
    try {
      // Mock implementation - replace with actual database queries
      return {
        totalUsers: 1250,
        totalPosts: 45,
        totalProducts: 128,
        totalOrders: 89,
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  },

  async getAdminCharts(period: string) {
    try {
      // Mock implementation - replace with actual database queries
      return {
        userGrowth: [
          { date: '2024-01', users: 100 },
          { date: '2024-02', users: 150 },
          { date: '2024-03', users: 200 },
        ],
        orderTrends: [
          { date: '2024-01', orders: 20 },
          { date: '2024-02', orders: 35 },
          { date: '2024-03', orders: 45 },
        ],
      };
    } catch (error) {
      console.error('Error getting admin charts:', error);
      throw error;
    }
  },

  async getSliderById(id: number) {
    try {
      return await db.query.sliders.findFirst({
        where: eq(sliders.id, id),
      });
    } catch (error) {
      console.error(`Error getting slider by ID ${id}:`, error);
      throw error;
    }
  },

  async createSlider(sliderData: any) {
    try {
      const [slider] = await db.insert(sliders).values({
        title: sliderData.title,
        description: sliderData.description,
        backgroundImage: sliderData.backgroundImage,
        videoUrl: sliderData.videoUrl,
        youtubeUrl: sliderData.youtubeUrl,
        ctaText: sliderData.ctaText,
        ctaLink: sliderData.ctaLink,
        isActive: sliderData.isActive,
        order: sliderData.order,
      }).returning();

      return slider;
    } catch (error) {
      console.error('Error creating slider:', error);
      throw error;
    }
  },

  async updateSlider(id: number, sliderData: any) {
    try {
      const [updatedSlider] = await db.update(sliders)
        .set({
          ...sliderData,
          updatedAt: new Date()
        })
        .where(eq(sliders.id, id))
        .returning();

      return updatedSlider;
    } catch (error) {
      console.error(`Error updating slider ${id}:`, error);
      throw error;
    }
  },

  async deleteSlider(id: number) {
    try {
      await db.delete(sliders).where(eq(sliders.id, id));
    } catch (error) {
      console.error(`Error deleting slider ${id}:`, error);
      throw error;
    }
  },

  async updateSliderOrder(id: number, order: number) {
    try {
      await db.update(sliders)
        .set({ order })
        .where(eq(sliders.id, id));
    } catch (error) {
      console.error(`Error updating slider order ${id}:`, error);
      throw error;
    }
  },

  // WordPress credentials management
  async saveWordPressCredentials(credentials: { url: string; username: string; password: string }) {
    try {
      const existingCredentials = await db.query.wordpressCredentials.findFirst();

      if (existingCredentials) {
        await db.update(wordpressCredentials)
          .set({
            url: credentials.url,
            username: credentials.username,
            password: credentials.password,
            updatedAt: new Date()
          })
          .where(eq(wordpressCredentials.id, existingCredentials.id));
      } else {
        await db.insert(wordpressCredentials).values({
          url: credentials.url,
          username: credentials.username,
          password: credentials.password
        });
      }
    } catch (error) {
      console.error('Error saving WordPress credentials:', error);
      throw error;
    }
  },

  async getWordPressCredentials() {
    try {
      const credentials = await db.query.wordpressCredentials.findFirst();
      return credentials || null;
    } catch (error) {
      console.error('Error getting WordPress credentials:', error);
      throw error;
    }
  },

  async deleteWordPressCredentials() {
    try {
      const existingCredentials = await db.query.wordpressCredentials.findFirst();
      if (existingCredentials) {
        await db.delete(wordpressCredentials).where(eq(wordpressCredentials.id, existingCredentials.id));
      }
    } catch (error) {
      console.error('Error deleting WordPress credentials:', error);
      throw error;
    }
  },

  // Dashboard Assets
  async getDashboardAssets() {
    try {
      return await db.query.dashboardAssets.findMany({
        orderBy: [asc(schema.dashboardAssets.type), desc(schema.dashboardAssets.createdAt)],
      });
    } catch (error) {
      console.error('Error getting dashboard assets:', error);
      throw error;
    }
  },

  async getDashboardAssetById(id: number) {
    try {
      return await db.query.dashboardAssets.findFirst({
        where: eq(schema.dashboardAssets.id, id),
      });
    } catch (error) {
      console.error(`Error getting dashboard asset by ID ${id}:`, error);
      throw error;
    }
  },

  async createDashboardAsset(assetData: any) {
    try {
      const [asset] = await db.insert(schema.dashboardAssets).values({
        type: assetData.type,
        name: assetData.name,
        url: assetData.url,
        cloudinaryPublicId: assetData.cloudinaryPublicId,
        isActive: assetData.isActive,
      }).returning();

      return asset;
    } catch (error) {
      console.error('Error creating dashboard asset:', error);
      throw error;
    }
  },

  async updateDashboardAsset(id: number, assetData: any) {
    try {
      const [updatedAsset] = await db.update(schema.dashboardAssets)
        .set({
          ...assetData,
          updatedAt: new Date()
        })
        .where(eq(schema.dashboardAssets.id, id))
        .returning();

      return updatedAsset;
    } catch (error) {
      console.error(`Error updating dashboard asset ${id}:`, error);
      throw error;
    }
  },

  async deleteDashboardAsset(id: number) {
    try {
      // First get the asset to retrieve Cloudinary public ID
      const asset = await db.query.dashboardAssets.findFirst({
        where: eq(schema.dashboardAssets.id, id),
      });

      if (!asset) {
        throw new Error(`Dashboard asset with ID ${id} not found`);
      }

      // Delete from Cloudinary if we have a public ID
      if (asset.cloudinaryPublicId) {
        try {
          // Import cloudinary service properly
          const cloudinaryService = await import('./services/cloudinaryService');
          const service = cloudinaryService.default;

          // Construct the full public ID path for Cloudinary deletion
          const fullPublicId = `HTHFO_Assets/AdminDashboard_Assets/${asset.type}s/${asset.cloudinaryPublicId}`;
          console.log(`Attempting to delete from Cloudinary with public ID: ${fullPublicId}`);

          const deleteResult = await service.deleteAsset(fullPublicId);

          if (deleteResult) {
            console.log(`Successfully deleted asset from Cloudinary: ${fullPublicId}`);
          } else {
            console.warn(`Cloudinary deletion returned false for: ${fullPublicId}`);
          }
        } catch (cloudinaryError) {
          console.error(`Failed to delete asset from Cloudinary (${asset.cloudinaryPublicId}):`, cloudinaryError);
          // Continue with database deletion even if Cloudinary deletion fails
        }
      } else {
        console.warn(`No Cloudinary public ID found for asset ${id}, skipping Cloudinary deletion`);
      }

      // Delete from database
      await db.delete(schema.dashboardAssets).where(eq(schema.dashboardAssets.id, id));

      console.log(`Successfully deleted dashboard asset ${id} from database`);
    } catch (error) {
      console.error(`Error deleting dashboard asset ${id}:`, error);
      throw error;
    }
  },

  async getActiveDashboardAssetsByType(type: string) {
    try {
      return await db.query.dashboardAssets.findMany({
        where: and(
          eq(schema.dashboardAssets.type, type),
          eq(schema.dashboardAssets.isActive, true)
        ),
        orderBy: desc(schema.dashboardAssets.createdAt),
      });
    } catch (error) {
      console.error(`Error getting active dashboard assets by type ${type}:`, error);
      throw error;
    }
  },

  // Home Video Slider Management
  async getHomeVideoSettings() {
    try {
      const settings = await db.query.homeVideoSettings.findFirst();
      return settings || {
        categoryId: null,
        videoCount: 8,
        isActive: false,
        title: "Latest Videos",
        description: "Check out our latest outdoor adventure videos"
      };
    } catch (error) {
      console.error('Error getting home video settings:', error);
      throw error;    }
  },

  async saveHomeVideoSettings(settingsData: any) {
    try {
      const existingSettings = await db.query.homeVideoSettings.findFirst();

      if (existingSettings) {
        const [updated] = await db.update(schema.homeVideoSettings)
          .set({
            ...settingsData,
            updatedAt: new Date()
          })
          .where(eq(schema.homeVideoSettings.id, existingSettings.id))
          .returning();
        return updated;
      } else {
        const [created] = await db.insert(schema.homeVideoSettings)
          .values({
            ...settingsData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error saving home video settings:', error);
      throw error;
    }
  },

  async getVideosByCategory(categoryId: number, limit = 8, videoType = 'all') {
    try {
      console.log(`Getting videos for category ${categoryId} with limit ${limit} and videoType ${videoType}`);

      // Build where condition based on video type
      let whereCondition;
      if (videoType === 'all') {
        whereCondition = eq(schema.youtubeVideos.categoryId, categoryId);
      } else {
        whereCondition = and(
          eq(schema.youtubeVideos.categoryId, categoryId),
          eq(schema.youtubeVideos.videoType, videoType)
        );
      }

      // First check how many videos exist for this category and type
      const allVideosInCategory = await db.query.youtubeVideos.findMany({
        where: whereCondition,
        columns: { id: true, title: true, categoryId: true, videoType: true }
      });

      console.log(`Sample of available videos:`, await db.query.youtubeVideos.findMany({
        columns: { 
          id: true,
          title: true, 
          categoryId: true,
          videoType: true
        },
        with: {
          category: {
            columns: { name: true }
          }
        },
        limit: 10
      }).then(videos => videos.map(v => ({
        id: v.id,
        title: v.title.substring(0, 50),
        categoryId: v.categoryId,
        categoryName: v.category?.name,
        videoType: v.videoType
      }))));

      console.log(`Found ${allVideosInCategory.length} videos for category ${categoryId} with type ${videoType}`);

      const videos = await db.query.youtubeVideos.findMany({
        where: whereCondition,
        orderBy: desc(schema.youtubeVideos.publishedAt),
        limit,
        with: {
          category: true,
          channel: true
        }
      });

      console.log(`Final result: ${videos.length} videos for category ${categoryId} with type ${videoType}`);

      return videos.map(video => ({
        id: video.id.toString(),
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        publishedAt: video.publishedAt,
        channelId: video.channelId,
        categoryId: video.categoryId,
        category: video.category,
        channel: video.channel,
        videoType: video.videoType,
        duration: video.duration,
        viewCount: video.viewCount || 0,
        likeCount: video.likeCount || 0,
        commentCount: video.commentCount || 0
      }));
    } catch (error) {
      console.error('Error getting videos by category:', error);
      throw error;
    }
  },

  // Favorite Destinations Management
  async getFavoriteDestinations() {
    try {
      return await db.query.favoriteDestinations.findMany({
        orderBy: asc(schema.favoriteDestinations.order),
      });
    } catch (error) {
      console.error('Error getting favorite destinations:', error);
      throw error;
    }
  },

  async getFavoriteDestinationById(id: number) {
    try {
      return await db.query.favoriteDestinations.findFirst({
        where: eq(schema.favoriteDestinations.id, id),
      });
    } catch (error) {
      console.error(`Error getting favorite destination by ID ${id}:`, error);
      throw error;
    }
  },

  async createFavoriteDestination(destinationData: any) {
    try {
      const [destination] = await db.insert(schema.favoriteDestinations).values({
        title: destinationData.title,
        image: destinationData.image,
        slug: destinationData.slug,
        description: destinationData.description,
        country: destinationData.country,
        order: destinationData.order || 0,
      }).returning();

      return destination;
    } catch (error) {
      console.error('Error creating favorite destination:', error);
      throw error;
    }
  },

  async updateFavoriteDestination(id: number, destinationData: any) {
    try {
      const [updatedDestination] = await db.update(schema.favoriteDestinations)
        .set({
          ...destinationData,
          updatedAt: new Date()
        })
        .where(eq(schema.favoriteDestinations.id, id))
        .returning();

      return updatedDestination;
    } catch (error) {
      console.error(`Error updating favorite destination ${id}:`, error);
      throw error;
    }
  },

  async deleteFavoriteDestination(id: number) {
    try {
      await db.delete(schema.favoriteDestinations).where(eq(schema.favoriteDestinations.id, id));
    } catch (error) {
      console.error(`Error deleting favorite destination ${id}:`, error);
      throw error;
    }
  },
  async getYoutubeVideos(channelId?: string): Promise<any[]> {
    try {
      let whereCondition: any = {};

      if (channelId) {
        whereCondition = eq(schema.youtubeVideos.channelId, parseInt(channelId));
      }

      const videos = await db.query.youtubeVideos.findMany({
        where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
        with: {
          channel: {
            columns: {
              name: true,
              channelId: true
            }
          },
          category: {
            columns: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: [desc(schema.youtubeVideos.publishedAt)],
      });

      return videos.map(video => ({
        ...video,
        channelName: video.channel?.name,
        categoryName: video.category?.name
      }));
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      throw error;
    }
  }
};