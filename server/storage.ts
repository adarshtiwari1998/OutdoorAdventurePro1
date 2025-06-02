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
  InsertSlider
} from '@shared/schema';
import { eq, and, like, desc, sql, asc, not, isNull, inArray } from 'drizzle-orm';
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
        orderBy: desc(youtubeChannels.createdAt),
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

  async updateYoutubeChannelLastImport(id: number) {
    try {
      await db.update(youtubeChannels)
        .set({ lastImport: new Date().toISOString() })
        .where(eq(youtubeChannels.id, id));
    } catch (error) {
      console.error(`Error updating YouTube channel last import for ID ${id}:`, error);
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
  async getYoutubeVideosByChannel(channelId: string) {
    try {
      return await db.query.youtubeVideos.findMany({
        where: eq(youtubeVideos.channelId, parseInt(channelId)),
        orderBy: desc(youtubeVideos.publishedAt),
      });
    } catch (error) {
      console.error(`Error getting YouTube videos for channel ${channelId}:`, error);
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

  async createYoutubeVideo(videoData: any) {
    try {
      const [video] = await db.insert(youtubeVideos).values({
        videoId: videoData.videoId,
        title: videoData.title,
        description: videoData.description,
        thumbnail: videoData.thumbnail,
        publishedAt: videoData.publishedAt,
        channelId: videoData.channelId,
        importStatus: 'pending',
      }).returning();

      return video;
    } catch (error) {
      console.error('Error creating YouTube video:', error);
      throw error;
    }
  },

  async updateYoutubeVideoTranscript(id: number, transcript: string) {
    try {
      await db.update(youtubeVideos)
        .set({ transcript })
        .where(eq(youtubeVideos.id, id));
    } catch (error) {
      console.error(`Error updating YouTube video transcript for ID ${id}:`, error);
      throw error;
    }
  },

  async linkYoutubeVideoToBlogPost(videoId: number, blogPostId: number) {
    try {
      await db.update(youtubeVideos)
        .set({ 
          blogPostId, 
          importStatus: 'imported' 
        })
        .where(eq(youtubeVideos.id, videoId));
    } catch (error) {
      console.error(`Error linking YouTube video ${videoId} to blog post ${blogPostId}:`, error);
      throw error;
    }
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
              name: "Robert Streams",
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
          avatar: post.author?.fullName 
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.fullName)}&background=random`
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
      return await db.query.categories.findMany();
    } catch (error) {
      console.error('Error getting blog categories:', error);
      throw error;
    }
  },

  async getAdminBlogPosts({ page, pageSize, status, categoryId, searchQuery, includeContent = false }: any) {
    try {
      // Build where conditions separately
      const whereConditions = [];

      // Apply status filter
      if (status && status !== 'all') {
        whereConditions.push(eq(blogPosts.status, status));
      }

      // Apply category filter
      if (categoryId && categoryId !== 'all') {
        whereConditions.push(eq(categories.name, categoryId));
      }

      // Apply search filter
      if (searchQuery) {
        whereConditions.push(
          sql`(${blogPosts.title} ILIKE ${`%${searchQuery}%`} OR ${blogPosts.content} ILIKE ${`%${searchQuery}%`})`
        );
      }

      // Combine conditions with AND
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;

      // Count total results for pagination
      const countResult = await db.select({
        count: sql<number>`count(*)`,
      })
      .from(blogPosts)
      .where(whereClause)
      .execute();

      const count = countResult[0]?.count || 0;
      const totalPages = Math.ceil(count / pageSize);

      // Execute query with joins directly with all conditions
      const posts = await db.query.blogPosts.findMany({
        where: whereClause,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(blogPosts.createdAt),
        with: {
          category: true,
          author: true,
        },
      });

      return {
        posts: posts.map(post => ({
          id: post.id.toString(),
          title: post.title,
          content: post.content || '',
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          category: {
            id: post.category?.id.toString() || '',
            name: post.category?.name || 'Uncategorized',
          },
          status: post.status,
          publishedAt: post.publishedAt,
          author: {
            name: post.author?.fullName || post.author?.username || 'Unknown',
            avatar: post.author?.fullName 
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.fullName)}&background=random`
              : `https://ui-avatars.com/api/?name=Unknown&background=random`,
          },
          tags: post.tags as string[] || [],
        })),
        totalPages,
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


      const blogPostData: any = {
        title: decode(postData.title || ''),
        slug,
        content: decode(postData.content || ''),
        excerpt: decode(postData.excerpt || ''),
        featuredImage: postData.featuredImage,
        categoryId: parseInt(postData.categoryId),
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
        orderBy: desc(testimonials.createdAt),
      });

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
  }
};