import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "@db";
import * as schema from "@shared/schema";
import { blogPosts } from "@shared/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { z } from "zod";
import { setupAuth } from "./auth";

// Import services
import { ShopifyService } from "./services/shopifyService";
import { WordPressService } from "./services/wordpressService";
import { YouTubeService } from "./services/youtubeService";
import { GeminiService } from "./services/geminiService";
import videoService from "./services/videoService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  const apiPrefix = "/api";

  // Category Styles Routes
  app.get(`${apiPrefix}/category-styles`, async (req, res) => {
    try {
      const styles = await db.query.categoryStyles.findMany();
      return res.json(styles);
    } catch (error) {
      console.error("Error fetching category styles:", error);
      return res.status(500).json({ error: "Failed to fetch category styles" });
    }
  });

  app.get(`${apiPrefix}/category-styles/:category`, async (req, res) => {
    try {
      const { category } = req.params;
      const style = await db.query.categoryStyles.findFirst({
        where: eq(schema.categoryStyles.category, category)
      });

      if (!style) {
        return res.status(404).json({ error: "Category style not found" });
      }

      return res.json(style);
    } catch (error) {
      console.error(`Error fetching style for category ${req.params.category}:`, error);
      return res.status(500).json({ error: "Failed to fetch category style" });
    }
  });

  app.post(`${apiPrefix}/category-styles`, async (req, res) => {
    try {
      const { 
        category, 
        primaryColor, 
        headingFont, 
        bodyFont, 
        navigationFont, 
        buttonFont, 
        displayFont 
      } = req.body;

      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }

      // Calculate HSL value from hex color if provided
      let primaryColorHSL = null;
      if (primaryColor) {
        primaryColorHSL = hexToHSL(primaryColor);
      }

      // Check if this category already has a style
      const existingStyle = await db.query.categoryStyles.findFirst({
        where: eq(schema.categoryStyles.category, category)
      });

      if (existingStyle) {
        // Build update object with only provided values
        const updateObject: any = { updatedAt: new Date() };

        if (primaryColor) {
          updateObject.primaryColor = primaryColor;
          updateObject.primaryColorHSL = primaryColorHSL;
        }

        // Add font fields if provided
        if (headingFont !== undefined) updateObject.headingFont = headingFont;
        if (bodyFont !== undefined) updateObject.bodyFont = bodyFont;
        if (navigationFont !== undefined) updateObject.navigationFont = navigationFont;
        if (buttonFont !== undefined) updateObject.buttonFont = buttonFont;
        if (displayFont !== undefined) updateObject.displayFont = displayFont;

        // Update existing style
        await db.update(schema.categoryStyles)
          .set(updateObject)
          .where(eq(schema.categoryStyles.id, existingStyle.id));

        const updatedStyle = await db.query.categoryStyles.findFirst({
          where: eq(schema.categoryStyles.id, existingStyle.id)
        });

        return res.json(updatedStyle);
      } else {
        // Create new style with all fields
        const insertObject: any = {
          category,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add color fields if provided
        if (primaryColor) {
          insertObject.primaryColor = primaryColor;
          insertObject.primaryColorHSL = primaryColorHSL;
        }

        // Add font fields if provided
        if (headingFont !== undefined) insertObject.headingFont = headingFont;
        if (bodyFont !== undefined) insertObject.bodyFont = bodyFont;
        if (navigationFont !== undefined) insertObject.navigationFont = navigationFont;
        if (buttonFont !== undefined) insertObject.buttonFont = buttonFont;
        if (displayFont !== undefined) insertObject.displayFont = displayFont;

        const [newStyle] = await db.insert(schema.categoryStyles)
          .values(insertObject)
          .returning();

        return res.status(201).json(newStyle);
      }
    } catch (error) {
      console.error("Error creating/updating category style:", error);
      return res.status(500).json({ error: "Failed to save category style" });
    }
  });

  // Helper function to convert hex to HSL
  function hexToHSL(hex: string): string {
    // Remove the # if present
    hex = hex.replace('#', '');

    // Convert to RGB first
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    // Normalize RGB values
    r /= 255;
    g /= 255;
    b /= 255;

    // Find min and max values to calculate hue and saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else if (max === b) {
        h = (r - g) / d + 4;
      }

      h /= 6;
    }

    // Convert to HSL format
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  }
  const httpServer = createServer(app);

  // Initialize services
  const shopifyService = new ShopifyService();
  const wordpressService = new WordPressService();
  const youtubeService = new YouTubeService();
  const geminiService = new GeminiService();

  // Home page API routes
  app.get(`${apiPrefix}/activities/featured`, async (req, res) => {
    try {
      const activities = await storage.getFeaturedActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching featured activities:", error);
      res.status(500).json({ message: "Failed to fetch featured activities" });
    }
  });

  app.get(`${apiPrefix}/youtube/channels`, async (req, res) => {
    try {
      const channels = await storage.getYoutubeChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching YouTube channels:", error);
      res.status(500).json({ message: "Failed to fetch YouTube channels" });
    }
  });

  app.get(`${apiPrefix}/products/featured`, async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get(`${apiPrefix}/blog/featured`, async (req, res) => {
    try {
      const featured = await storage.getFeaturedBlogPost();
      const regular = await storage.getRegularBlogPosts(3); // Increased to 3 posts
      res.json({ featured, regular });
    } catch (error) {
      console.error("Error fetching featured blog posts:", error);
      res.status(500).json({ message: "Failed to fetch featured blog posts" });
    }
  });

  app.get(`${apiPrefix}/testimonials`, async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Sliders API routes for homepage
  app.get(`${apiPrefix}/sliders`, async (req, res) => {
    try {
      const sliders = await storage.getHomeSliders();
      res.json(sliders);
    } catch (error) {
      console.error("Error fetching home sliders:", error);
      res.status(500).json({ message: "Failed to fetch home sliders" });
    }
  });

  // Activity pages API routes
  app.get(`${apiPrefix}/activities/category/:category`, async (req, res) => {
    try {
      const { category } = req.params;
      const activities = await storage.getActivitiesByCategory(category);
      res.json(activities);
    } catch (error) {
      console.error(`Error fetching activities for category ${req.params.category}:`, error);
      res.status(500).json({ message: `Failed to fetch activities for ${req.params.category}` });
    }
  });

  // Blog API routes
  app.get(`${apiPrefix}/blog`, async (req, res) => {
    try {
      const { category, searchQuery, page = 1 } = req.query;
      const pageSize = 6;

      const result = await storage.getBlogPosts({
        category: category as string,
        searchQuery: searchQuery as string,
        page: Number(page),
        pageSize
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get(`${apiPrefix}/blog/categories`, async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  // Shop API routes
  app.get(`${apiPrefix}/products`, async (req, res) => {
    try {
      const { category, searchQuery, page = 1, sortBy = 'newest' } = req.query;
      const pageSize = 8;

      const result = await storage.getProducts({
        category: category as string,
        searchQuery: searchQuery as string,
        page: Number(page),
        pageSize,
        sortBy: sortBy as string
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get(`${apiPrefix}/products/categories`, async (req, res) => {
    try {
      const categories = await storage.getProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Cart API routes
  app.get(`${apiPrefix}/cart/count`, async (req, res) => {
    try {
      const sessionId = req.sessionID || 'anonymous';
      const count = await storage.getCartItemCount(sessionId);
      res.json(count);
    } catch (error) {
      console.error("Error fetching cart count:", error);
      res.status(500).json({ message: "Failed to fetch cart count" });
    }
  });

  app.post(`${apiPrefix}/cart/add`, async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const sessionId = req.sessionID || 'anonymous';

      await storage.addToCart(sessionId, productId, quantity);
      const count = await storage.getCartItemCount(sessionId);

      res.json({ success: true, cartCount: count });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Newsletter subscription
  app.post(`${apiPrefix}/newsletter/subscribe`, async (req, res) => {
    try {
      const { fullName, email, interests } = req.body;

      if (!fullName || !email) {
        return res.status(400).json({ message: "Full name and email are required" });
      }

      await storage.addNewsletterSubscriber(fullName, email, interests);
      res.json({ success: true });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Admin API routes
  app.get(`${apiPrefix}/admin/stats`, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const stats = await storage.getAdminStats(period as string);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get(`${apiPrefix}/admin/charts`, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const charts = await storage.getAdminCharts(period as string);
      res.json(charts);
    } catch (error) {
      console.error("Error fetching admin charts:", error);
      res.status(500).json({ message: "Failed to fetch admin charts" });
    }
  });

  // Admin Sliders Management
  app.get(`${apiPrefix}/admin/sliders`, async (req, res) => {
    try {
      const sliders = await storage.getAllSliders();
      res.json(sliders);
    } catch (error) {
      console.error("Error fetching sliders:", error);
      res.status(500).json({ message: "Failed to fetch sliders" });
    }
  });

  app.get(`${apiPrefix}/admin/sliders/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const slider = await storage.getSliderById(parseInt(id));

      if (!slider) {
        return res.status(404).json({ message: "Slider not found" });
      }

      res.json(slider);
    } catch (error) {
      console.error(`Error fetching slider ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch slider" });
    }
  });

  app.post(`${apiPrefix}/admin/sliders`, async (req, res) => {
    try {
      const { title, description, backgroundImage, videoUrl, youtubeUrl, ctaText, ctaLink, isActive } = req.body;

      const slider = await storage.createSlider({
        title,
        description,
        backgroundImage,
        videoUrl,
        youtubeUrl,
        ctaText,
        ctaLink,
        isActive: isActive !== undefined ? isActive : true,
        order: 999, // Default to end of list
      });

      res.status(201).json(slider);
    } catch (error) {
      console.error("Error creating slider:", error);
      res.status(500).json({ message: "Failed to create slider" });
    }
  });

  app.patch(`${apiPrefix}/admin/sliders/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const sliderData = req.body;

      const updatedSlider = await storage.updateSlider(parseInt(id), sliderData);
      res.json(updatedSlider);
    } catch (error) {
      console.error(`Error updating slider ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update slider" });
    }
  });

  app.delete(`${apiPrefix}/admin/sliders/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSlider(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting slider ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete slider" });
    }
  });

  // Process YouTube URL for slider videos
  app.post(`${apiPrefix}/admin/process-youtube-url`, async (req, res) => {
    try {
      const { youtubeUrl, sliderId } = req.body;

      if (!youtubeUrl) {
        return res.status(400).json({ message: "YouTube URL is required" });
      }

      console.log("Processing YouTube URL:", youtubeUrl);
      const videoInfo = await videoService.processYoutubeUrl(youtubeUrl);
      console.log("Video info result:", videoInfo);

      if (!videoInfo) {
        return res.status(400).json({ message: "Invalid YouTube URL or could not extract video ID" });
      }

      // Extract video ID to potentially download it
      const videoId = videoInfo.videoId;

      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('YouTube download timed out after 10 seconds')), 10000);
      });

      try {
        // Try to download and process the video with timeout - using our new direct approach
        const downloadPromise = videoService.downloadYouTubeVideoDirectly(videoId, sliderId ? parseInt(sliderId) : undefined);

        try {
          // Race the download against the timeout
          const mp4Url = await Promise.race([downloadPromise, timeoutPromise]) as string;
          console.log(`Video download and upload complete: ${mp4Url}`);

          // Update the videoInfo with the direct mp4 URL before sending the response
          videoInfo.directVideoUrl = mp4Url;
        } catch (timeoutErr) {
          console.error("Video processing timed out:", timeoutErr);
          // If timeout happens, still return a response but keep processing in the background

          // Continue the download in the background without blocking the response
          downloadPromise
            .then(mp4Url => {
              console.log(`Background video download complete: ${mp4Url}`);
              // Update the slider with the new URL when it's eventually ready
              if (sliderId) {
                videoService.updateSliderWithVideoUrl(parseInt(sliderId), mp4Url)
                  .catch(err => console.error(`Failed to update slider ${sliderId} with video URL:`, err));
              }
            })
            .catch(err => console.error(`Background video download failed: ${err.message}`));
        }
      } catch (err) {
        console.error("Failed to process video:", err);
        // We continue anyway since we have the video info
      }

      // Return the response immediately, even if video is still processing
      // The client can poll for updates or update when the user refreshes
      res.json(videoInfo);
    } catch (error) {
      console.error("Error processing YouTube URL:", error);
      console.error(error);
      res.status(500).json({ message: "Failed to process YouTube URL" });
    }
  });

  app.patch(`${apiPrefix}/admin/sliders/:id/order`, async (req, res) => {
    try {
      const { id } = req.params;
      const { order } = req.body;

      if (order === undefined) {
        return res.status(400).json({ message: "Order is required" });
      }

      await storage.updateSliderOrder(parseInt(id), parseInt(order));
      res.json({ success: true });
    } catch (error) {
      console.error(`Error updating slider order ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update slider order" });
    }
  });

  // Blog management
  app.get(`${apiPrefix}/admin/blog/posts`, async (req, res) => {
    try {
      const { page = 1, status, category, search } = req.query;
      const pageSize = 10;

      const result = await storage.getAdminBlogPosts({
        page: Number(page),
        pageSize,
        status: status as string,
        categoryId: category as string,
        searchQuery: search as string,
        includeContent: true
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch admin blog posts" });
    }
  });

  app.get(`${apiPrefix}/admin/blog/categories`, async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  app.post(`${apiPrefix}/admin/blog/posts`, async (req, res) => {
    try {
      const postData = req.body;
      const newPost = await storage.createBlogPost(postData);
      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.patch(`${apiPrefix}/admin/blog/posts/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const postData = req.body;
      const updatedPost = await storage.updateBlogPost(parseInt(id), postData);
      res.json(updatedPost);
    } catch (error) {
      console.error(`Error updating blog post ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete(`${apiPrefix}/admin/blog/posts`, async (req, res) => {
    try {
      const { ids } = req.body;
      await storage.deleteBlogPosts(ids);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog posts:", error);
      res.status(500).json({ message: "Failed to delete blog posts" });
    }
  });

app.post(`${apiPrefix}/admin/blog/import/wordpress`, async (req, res) => {
  try {
    const { wordpressUrl, username, password, postsCount } = req.body;

    const posts = await wordpressService.importPosts({
      url: wordpressUrl,
      username,
      applicationPassword: password,
      count: postsCount
    });

    let importedCount = 0;
    for (const post of posts) {
      // First check if post with same slug exists
      const existingPost = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, post.slug),
      });

      if (!existingPost) {
        // Only import if slug doesn't exist
        await storage.createBlogPost({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          categoryId: post.categoryId || '1', // Default category
          status: 'published',
          tags: post.tags,
          slug: post.slug // Use the post's slug directly
        });
        importedCount++; // Increment here to count the imported posts
      }
    }

    res.json({ success: true, count: importedCount });
  } catch (error) {
    console.error("Error importing WordPress posts:", error);
    res.status(500).json({ message: "Failed to import WordPress posts" });
  }
});

  // YouTube management
  app.get(`${apiPrefix}/admin/youtube/channels`, async (req, res) => {
    try {
      const channels = await storage.getAdminYoutubeChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching admin YouTube channels:", error);
      res.status(500).json({ message: "Failed to fetch YouTube channels" });
    }
  });

  app.get(`${apiPrefix}/admin/youtube/videos`, async (req, res) => {
    try {
      const { channelId } = req.query;

      if (!channelId) {
        return res.status(400).json({ message: "Channel ID is required" });
      }

      const videos = await storage.getYoutubeVideosByChannel(channelId as string);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      res.status(500).json({ message: "Failed to fetch YouTube videos" });
    }
  });

  app.post(`${apiPrefix}/admin/youtube/channels`, async (req, res) => {
    try {
      const { channelId, channelName } = req.body;

      if (!channelId || !channelName) {
        return res.status(400).json({ message: "Channel ID and name are required" });
      }

      // Get channel details from YouTube API
      const channelDetails = await youtubeService.getChannelDetails(channelId);

      // Save to database
      const newChannel = await storage.createYoutubeChannel({
        channelId,
        name: channelName,
        description: channelDetails.description,
        image: channelDetails.thumbnailUrl,
        subscribers: channelDetails.subscriberCount,
        videoCount: channelDetails.videoCount
      });

      res.status(201).json(newChannel);
    } catch (error) {
      console.error("Error adding YouTube channel:", error);
      res.status(500).json({ message: "Failed to add YouTube channel" });
    }
  });

  app.post(`${apiPrefix}/admin/youtube/videos`, async (req, res) => {
    try {
      const { videoId, title, description } = req.body;

      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }

      // Get video details from YouTube API
      const videoDetails = await youtubeService.getVideoDetails(videoId);

      // Save to database
      const newVideo = await storage.createYoutubeVideo({
        videoId,
        title: title || videoDetails.title,
        description: description || videoDetails.description,
        thumbnail: videoDetails.thumbnailUrl,
        publishedAt: videoDetails.publishedAt,
        channelId: videoDetails.channelId
      });

      res.status(201).json(newVideo);
    } catch (error) {
      console.error("Error adding YouTube video:", error);
      res.status(500).json({ message: "Failed to add YouTube video" });
    }
  });

  app.post(`${apiPrefix}/admin/youtube/channels/:id/import`, async (req, res) => {
    try {
      const { id } = req.params;
      const channel = await storage.getYoutubeChannelById(parseInt(id));

      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Get latest videos from YouTube API
      const videos = await youtubeService.getChannelVideos(channel.channelId, 10);

      // Save videos to database
      for (const video of videos) {
        try {
          await storage.createYoutubeVideo({
            videoId: video.id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnailUrl,
            publishedAt: video.publishedAt,
            channelId: channel.id
          });
        } catch (error) {
          console.error(`Error saving video ${video.id}:`, error);
        }
      }

      // Update channel's lastImport date
      await storage.updateYoutubeChannelLastImport(parseInt(id));

      res.json({ success: true, count: videos.length });
    } catch (error) {
      console.error(`Error importing videos for channel ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to import videos from channel" });
    }
  });

  app.delete(`${apiPrefix}/admin/youtube/channels/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteYoutubeChannel(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting YouTube channel ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete YouTube channel" });
    }
  });

  app.delete(`${apiPrefix}/admin/youtube/videos/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteYoutubeVideo(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting YouTube video ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete YouTube video" });
    }
  });

  // Header Configuration API Routes
  app.get(`${apiPrefix}/admin/header-configs`, async (req, res) => {
    try {
      const headerConfigs = await db.query.headerConfigs.findMany({
        with: {
          menuItems: {
            orderBy: (menuItems) => [asc(menuItems.order)],
            with: {
              megaMenuCategories: {
                orderBy: (categories) => [asc(categories.order)],
                with: {
                  items: {
                    orderBy: (items) => [asc(items.order)]
                  }
                }
              }
            }
          }
        },
      });
      return res.json(headerConfigs);
    } catch (error) {
      console.error("Error fetching header configs:", error);
      return res.status(500).json({ message: "Failed to fetch header configurations" });
    }
  });

  app.get(`${apiPrefix}/admin/header-configs/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const headerConfig = await db.query.headerConfigs.findFirst({
        where: eq(schema.headerConfigs.id, parseInt(id, 10)),
        with: {
          menuItems: {
            orderBy: (menuItems) => [asc(menuItems.order)],
            with: {
              megaMenuCategories: {
                orderBy: (categories) => [asc(categories.order)],
                with: {
                  items: {
                    orderBy: (items) => [asc(items.order)]
                  }
                }
              }
            }
          }
        },
      });

      if (!headerConfig) {
        return res.status(404).json({ message: "Header configuration not found" });
      }

      // Log for debugging
      console.log(`Fetched header config ${id} with ${headerConfig.menuItems?.length || 0} menu items`);
      if (headerConfig.menuItems) {
        headerConfig.menuItems.forEach((item, i) => {
          const categoriesCount = item.megaMenuCategories?.length || 0;
          console.log(`  Menu item ${i+1}: ${item.label} (${categoriesCount} categories)`);

          if (item.megaMenuCategories) {
            item.megaMenuCategories.forEach((cat, j) => {
              const itemsCount = cat.items?.length || 0;
              console.log(`    Category ${j+1}: ${cat.title} (${itemsCount} items)`);
            });
          }
        });
      }

      return res.json(headerConfig);
    } catch (error) {
      console.error("Error fetching header config:", error);      return res.status(500).json({ message: "Failed to fetch header configuration" });
    }
  });

  app.get(`${apiPrefix}/header-configs/category/:category`, async (req, res) => {
    try {
      const { category } = req.params;
      const headerConfig = await db.query.headerConfigs.findFirst({
        where: eq(schema.headerConfigs.category, category),
        with: {
          menuItems: {
            orderBy: (menuItems) => [asc(menuItems.order)],
            with: {
              megaMenuCategories: {
                orderBy: (categories) => [asc(categories.order)],
                with: {
                  items: {
                    orderBy: (items) => [asc(items.order)]
                  }
                }
              }
            }
          }
        },
      });

      if (!headerConfig) {
        return res.status(404).json({ message: "Header configuration not found for this category" });
      }

      return res.json(headerConfig);
    } catch (error) {
      console.error(`Error fetching header config for category ${req.params.category}:`, error);
      return res.status(500).json({ message: "Failed to fetch header configuration" });
    }
  });

  app.post(`${apiPrefix}/admin/header-configs`, async (req, res) => {
    try {
      const validatedData = schema.insertHeaderConfigSchema.parse(req.body);

      const [newConfig] = await db.insert(schema.headerConfigs)
        .values({
          ...validatedData,
          updatedAt: new Date()
        })
        .returning();

      if (req.body.menuItems && Array.isArray(req.body.menuItems)) {
        const menuItems = req.body.menuItems.map((item: any, index: number) => ({
          headerConfigId: newConfig.id,
          label: item.label,
          path: item.path,
          order: index
        }));

        await db.insert(schema.headerMenuItems).values(menuItems);
      }

      const createdConfig = await db.query.headerConfigs.findFirst({
        where: eq(schema.headerConfigs.id, newConfig.id),
        with: {
          menuItems: {
            orderBy: (menuItems) => [asc(menuItems.order)]
          }
        },
      });

      return res.status(201).json(createdConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating header config:", error);
      return res.status(500).json({ message: "Failed to create header configuration" });
    }
  });

  app.patch(`${apiPrefix}/admin/header-configs/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const headerConfigId = parseInt(id, 10);

      console.log(`Processing update for header config ${headerConfigId}`);
      console.log("Request body:", req.body);

      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("Empty request body received");
        return res.status(400).json({ message: "Empty request body" });
      }

      // Create a clean copy of the data without problematic fields
      const {
        createdAt, updatedAt, menuItems, megaMenuCategories, ...cleanData
      } = req.body;

      console.log("Clean data to update:", JSON.stringify(cleanData));

      // Update header config with clean data
      await db.update(schema.headerConfigs)
        .set({
          ...cleanData,
          updatedAt: new Date()
        })
        .where(eq(schema.headerConfigs.id, headerConfigId));

      // Handle menu items update if provided
      if (menuItems && Array.isArray(menuItems)) {
        try {
          console.log("Updating menu items for header config:", headerConfigId);

          // First, find all existing mega menu categories and items to preserve IDs
          const existingMenuItems = await db.query.headerMenuItems.findMany({
            where: eq(schema.headerMenuItems.headerConfigId, headerConfigId),
            with: {
              megaMenuCategories: {
                with: {
                  items: true
                }
              }
            }
          });

          // Store existing items ID mapping
          const existingItemMapping = new Map();
          const existingCategoryMapping = new Map();

          // Create mappings for existing items
          existingMenuItems.forEach(menuItem => {
            existingItemMapping.set(menuItem.id, menuItem);

            if (menuItem.megaMenuCategories) {
              menuItem.megaMenuCategories.forEach(category => {
                existingCategoryMapping.set(category.id, category);
              });
            }
          });

          // Process each menu item to preserve IDs and relationships
          for (const menuItem of menuItems) {
            // Clean the menu item by removing createdAt and updatedAt
            const { id, createdAt, updatedAt, megaMenuCategories, ...cleanMenuItem } = menuItem;

            const menuItemId = Number(id);
            const isNewMenuItem = isNaN(menuItemId) || !existingItemMapping.has(menuItemId);

            if (isNewMenuItem) {
              // Insert new menu item
              const insertResult = await db.insert(schema.headerMenuItems).values({
                headerConfigId,
                label: cleanMenuItem.label,
                path: cleanMenuItem.path,
                order: cleanMenuItem.order || 0,
                hasMegaMenu: cleanMenuItem.hasMegaMenu || false
              }).returning();

              // Process mega menu categories for the new item
              if (megaMenuCategories && megaMenuCategories.length > 0 && insertResult.length > 0) {
                const newMenuItemId = insertResult[0].id;

                // Insert categories
                for (const category of megaMenuCategories) {
                  const { id: categoryId, createdAt, updatedAt, items, ...cleanCategory } = category;

                  const categoryInsertResult = await db.insert(schema.megaMenuCategories).values({
                    menuItemId: newMenuItemId,
                    title: cleanCategory.title,
                    order: cleanCategory.order || 0
                  }).returning();

                  // Process items
                  if (items && items.length > 0 && categoryInsertResult.length > 0) {
                    const newCategoryId = categoryInsertResult[0].id;

                    // Insert items
                    for (const item of items) {
                      const { id, createdAt, updatedAt, ...cleanItem } = item;

                      await db.insert(schema.megaMenuItems).values({
                        categoryId: newCategoryId,
                        label: cleanItem.label,
                        path: cleanItem.path,
                        order: cleanItem.order || 0,
                        featuredItem: cleanItem.featuredItem || false
                      });
                    }
                  }
                }
              }
            } else {
              // Update existing menu item
              await db.update(schema.headerMenuItems)
                .set({
                  label: cleanMenuItem.label,
                  path: cleanMenuItem.path,
                  order: cleanMenuItem.order || 0,
                  hasMegaMenu: cleanMenuItem.hasMegaMenu || false
                })
                .where(eq(schema.headerMenuItems.id, menuItemId));

              // Process mega menu categories
              if (megaMenuCategories) {
                // Handle each category
                for (const category of megaMenuCategories) {
                  const { id: categoryId, createdAt, updatedAt, items, ...cleanCategory } = category;

                  const categoryIdNum = Number(categoryId);
                  const isNewCategory = isNaN(categoryIdNum) || !existingCategoryMapping.has(categoryIdNum);

                  if (isNewCategory) {
                    // Insert new category
                    const categoryInsertResult = await db.insert(schema.megaMenuCategories).values({
                      menuItemId: menuItemId,
                      title: cleanCategory.title,
                      order: cleanCategory.order || 0
                    }).returning();

                    // Process items
                    if (items && items.length > 0 && categoryInsertResult.length > 0) {
                      const newCategoryId = categoryInsertResult[0].id;

                      // Insert items
                      for (const item of items) {
                        const { id, createdAt, updatedAt, ...cleanItem } = item;

                        await db.insert(schema.megaMenuItems).values({
                          categoryId: newCategoryId,
                          label: cleanItem.label,
                          path: cleanItem.path,
                          order: cleanItem.order || 0,
                          featuredItem: cleanItem.featuredItem || false
                        });
                      }
                    }
                  } else {
                    // Update existing category
                    await db.update(schema.megaMenuCategories)
                      .set({
                        title: cleanCategory.title,
                        order: cleanCategory.order || 0
                      })
                      .where(eq(schema.megaMenuCategories.id, categoryIdNum));

                    // Process items
                    if (items) {
                      // First delete existing items
                      await db.delete(schema.megaMenuItems)
                        .where(eq(schema.megaMenuItems.categoryId, categoryIdNum));

                      // Then insert new items
                      for (const item of items) {
                        const { id, createdAt, updatedAt, ...cleanItem } = item;

                        await db.insert(schema.megaMenuItems).values({
                          categoryId: categoryIdNum,
                          label: cleanItem.label,
                          path: cleanItem.path,
                          order: cleanItem.order || 0,
                          featuredItem: cleanItem.featuredItem || false
                        });
                      }
                    }
                  }
                }
              }
            }
          }

          console.log("Menu items updated successfully");
        } catch (error) {
          console.error("Error updating menu items:", error);
          throw error;
        }
      }

      // Fetch the updated config with full menu structure
      const updatedConfig = await db.query.headerConfigs.findFirst({
        where: eq(schema.headerConfigs.id, headerConfigId),
        with: {
          menuItems: {
            orderBy: (menuItems) => [asc(menuItems.order)],
            with: {
              megaMenuCategories: {
                orderBy: (categories) => [asc(categories.order)],
                with: {
                  items: {
                    orderBy: (items) => [asc(items.order)]
                  }
                }
              }
            }
          }
        },
      });

      return res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating header config:", error);
      return res.status(500).json({ message: "Failed to update header configuration" });
    }
  });

  app.delete(`${apiPrefix}/admin/header-configs/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const headerConfigId = parseInt(id, 10);

      // Check if config exists
      const existingConfig = await db.query.headerConfigs.findFirst({
        where: eq(schema.headerConfigs.id, headerConfigId)
      });

      if (!existingConfig) {
        return res.status(404).json({ message: "Header configuration not found" });
      }

      // Delete config (will cascade delete menu items)
      await db.delete(schema.headerConfigs)
        .where(eq(schema.headerConfigs.id, headerConfigId));

      return res.json({ message: "Header configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting header config:", error);
      return res.status(500).json({ message: "Failed to delete header configuration" });
    }
  });

  // Sidebar Config API Routes
  app.get(`${apiPrefix}/sidebar-configs/:category`, async (req, res) => {
    try {
      const { category } = req.params;

      const sidebarConfig = await db.query.sidebarConfigs.findFirst({
        where: eq(schema.sidebarConfigs.category, category),
        with: {
          items: {
            orderBy: (items) => [asc(items.order)]
          }
        },
      });

      if (!sidebarConfig) {
        return res.status(404).json({ message: "Sidebar configuration not found for this category" });
      }

      return res.json(sidebarConfig);
    } catch (error) {
      console.error(`Error fetching sidebar config for category ${req.params.category}:`, error);
      return res.status(500).json({ message: "Failed to fetch sidebar configuration" });
    }
  });

  app.get(`${apiPrefix}/admin/sidebar-configs`, async (req, res) => {
    try {
      const sidebarConfigs = await db.query.sidebarConfigs.findMany({
        with: {
          items: {
            orderBy: (items) => [asc(items.order)]
          }
        },
      });

      return res.json(sidebarConfigs);
    } catch (error) {
      console.error("Error fetching sidebar configs:", error);
      return res.status(500).json({ message: "Failed to fetch sidebar configurations" });
    }
  });

  app.get(`${apiPrefix}/admin/sidebar-configs/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const sidebarConfig = await db.query.sidebarConfigs.findFirst({
        where: eq(schema.sidebarConfigs.id, parseInt(id, 10)),
        with: {
          items: {
            orderBy: (items) => [asc(items.order)]
          }
        },
      });

      if (!sidebarConfig) {
        return res.status(404).json({ message: "Sidebar configuration not found" });
      }

      return res.json(sidebarConfig);
    } catch (error) {
      console.error("Error fetching sidebar config:", error);
      return res.status(500).json({ message: "Failed to fetch sidebar configuration" });
    }
  });

  app.post(`${apiPrefix}/admin/sidebar-configs`, async (req, res) => {
    try {
      const validatedData = schema.insertSidebarConfigSchema.parse(req.body);

      const [newConfig] = await db.insert(schema.sidebarConfigs)
        .values({
          ...validatedData,
          updatedAt: new Date()
        })
        .returning();

      if (req.body.items && Array.isArray(req.body.items)) {
        const sidebarItems = req.body.items.map((item: any, index: number) => ({
          sidebarId: newConfig.id,
          title: item.title,
          content: item.content,
          imageUrl: item.imageUrl,
          linkUrl: item.linkUrl,
          linkText: item.linkText,
          order: index
        }));

        await db.insert(schema.sidebarItems).values(sidebarItems);
      }

      const createdConfig = await db.query.sidebarConfigs.findFirst({
        where: eq(schema.sidebarConfigs.id, newConfig.id),
        with: {
          items: {
            orderBy: (items) => [asc(items.order)]
          }
        },
      });

      return res.status(201).json(createdConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating sidebar config:", error);
      return res.status(500).json({ message: "Failed to create sidebar configuration" });
    }
  });

  app.patch(`${apiPrefix}/admin/sidebar-configs/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const sidebarConfigId = parseInt(id, 10);

      // Create a clean copy of the data without problematic fields
      const {
        createdAt, updatedAt, items, ...cleanData
      } = req.body;

      // Update sidebar config with clean data
      await db.update(schema.sidebarConfigs)
        .set({
          ...cleanData,
          updatedAt: new Date()
        })
        .where(eq(schema.sidebarConfigs.id, sidebarConfigId));

      // Handle items update if provided
      if (items && Array.isArray(items)) {
        // Get existing items to determine which ones to delete
        const existingItems = await db.query.sidebarItems.findMany({
          where: eq(schema.sidebarItems.sidebarId, sidebarConfigId),
        });

        const existingItemIds = existingItems.map(item => item.id);
        const newItemIds = items.filter(item => item.id).map(item => item.id);

        // Delete items that are no longer in the list
        const itemsToDelete = existingItemIds.filter(id => !newItemIds.includes(id));
        if (itemsToDelete.length > 0) {
          await db.delete(schema.sidebarItems)
            .where(inArray(schema.sidebarItems.id, itemsToDelete));
        }

        // Update or insert items
        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          if (item.id) {
            // Update existing item
            await db.update(schema.sidebarItems)
              .set({
                title: item.title,
                content: item.content,
                imageUrl: item.imageUrl,
                linkUrl: item.linkUrl,
                linkText: item.linkText,
                order: index
              })
              .where(eq(schema.sidebarItems.id, item.id));
          } else {
            // Insert new item
            await db.insert(schema.sidebarItems)
              .values({
                sidebarId: sidebarConfigId,
                title: item.title,
                content: item.content,
                imageUrl: item.imageUrl,
                linkUrl: item.linkUrl,
                linkText: item.linkText,
                order: index
              });
          }
        }
      }

      // Fetch the updated config
      const updatedConfig = await db.query.sidebarConfigs.findFirst({
        where: eq(schema.sidebarConfigs.id, sidebarConfigId),
        with: {
          items: {
            orderBy: (items) => [asc(items.order)]
          }
        },
      });

      return res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating sidebar config:", error);
      return res.status(500).json({ message: "Failed to update sidebar configuration" });
    }
  });

  app.delete(`${apiPrefix}/admin/sidebar-configs/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const sidebarConfigId = parseInt(id, 10);

      // Check if config exists
      const existingConfig = await db.query.sidebarConfigs.findFirst({
        where: eq(schema.sidebarConfigs.id, sidebarConfigId)
      });

      if (!existingConfig) {
        return res.status(404).json({ message: "Sidebar configuration not found" });
      }

      // Delete config (will cascade delete items)
      await db.delete(schema.sidebarConfigs)
        .where(eq(schema.sidebarConfigs.id, sidebarConfigId));

      return res.json({ message: "Sidebar configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting sidebar config:", error);
      return res.status(500).json({ message: "Failed to delete sidebar configuration" });
    }
  });

  // Category Styles API routes
  app.get(`${apiPrefix}/admin/category-styles`, async (req, res) => {
    try {
      const categoryStyles = await db.select().from(schema.categoryStyles);
      res.json(categoryStyles);
    } catch (error) {
      console.error("Error fetching category styles:", error);
      res.status(500).json({ message: "Failed to fetch category styles" });
    }
  });

  app.get(`${apiPrefix}/admin/category-styles/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const categoryStyle = await db.query.categoryStyles.findFirst({
        where: eq(schema.categoryStyles.id, Number(id))
      });

      if (!categoryStyle) {
        return res.status(404).json({ message: "Category style not found" });
      }

      res.json(categoryStyle);
    } catch (error) {
      console.error("Error fetching category style:", error);
      res.status(500).json({ message: "Failed to fetch category style" });
    }
  });

  app.post(`${apiPrefix}/admin/category-styles`, async (req, res) => {
    try {
      const validated = schema.insertCategoryStyleSchema.parse(req.body);

      const newCategoryStyle = await db.insert(schema.categoryStyles)
        .values({
          ...validated,
          primaryColorHSL: req.body.primaryColorHSL || '',
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(newCategoryStyle[0]);
    } catch (error) {
      console.error("Error creating category style:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category style" });
    }
  });

  app.patch(`${apiPrefix}/admin/category-styles/:id`, async (req, res) => {
    try {
      const { id } = req.params;

      const existingStyle = await db.query.categoryStyles.findFirst({
        where: eq(schema.categoryStyles.id, Number(id))
      });

      if (!existingStyle) {
        return res.status(404).json({ message: "Category style not found" });
      }

      const updatedCategoryStyle = await db.update(schema.categoryStyles)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(schema.categoryStyles.id, Number(id)))
        .returning();

      res.json(updatedCategoryStyle[0]);
    } catch (error) {
      console.error("Error updating category style:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category style" });
    }
  });

  app.post(`${apiPrefix}/admin/youtube/videos/convert`, async (req, res) => {
    try {
      const { videoId, categoryId, title, summary, tags } = req.body;

      // Get video details
      const video = await storage.getYoutubeVideoById(parseInt(videoId));

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Get transcript from YouTube
      const transcript = await youtubeService.getVideoTranscript(video.videoId);

      // Save transcript to video
      await storage.updateYoutubeVideoTranscript(parseInt(videoId), transcript);

      // Convert to blog post using Gemini AI
      const blogContent = await geminiService.convertTranscriptToBlogPost({
        title: title || video.title,
        transcript,
        includeSummary: summary,
        generateTags: tags
      });

      // Create blog post
      const blogPost = await storage.createBlogPost({
        title: title || video.title,
        content: blogContent.content,
        excerpt: blogContent.summary,
        featuredImage: video.thumbnail,
        categoryId: categoryId,
        status: 'published',
        tags: blogContent.tags
      });

      // Link blog post to video
      await storage.linkYoutubeVideoToBlogPost(parseInt(videoId), blogPost.id);

      res.json({
        success: true,
        blogPostId: blogPost.id
      });
    } catch (error) {
      console.error(`Error converting video ${req.body.videoId} to blog post:`, error);
      res.status(500).json({ message: "Failed to convert video to blog post" });
    }
  });

  // Get all favorite destinations for admin
  app.get(`${apiPrefix}/admin/favorite-destinations`, async (req, res) => {
    try {
      const destinations = await db.query.favoriteDestinations.findMany({
        orderBy: (destinations) => [asc(destinations.order)]
      });
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching favorite destinations:", error);
      res.status(500).json({ message: "Failed to fetch favorite destinations" });
    }
  });

  // Get single favorite destination by ID
  app.get(`${apiPrefix}/admin/favorite-destinations/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const destination = await db.query.favoriteDestinations.findFirst({
        where: eq(schema.favoriteDestinations.id, parseInt(id))
      });
      if (!destination) {
        return res.status(404).json({ message: "Favorite destination not found" });
      }
      res.json(destination);
    } catch (error) {
      console.error("Error fetching favorite destination:", error);
      res.status(500).json({ message: "Failed to fetch favorite destination" });
    }
  });

  // Create new favorite destination
  app.post(`${apiPrefix}/admin/favorite-destinations`, async (req, res) => {
    try {
      const [destination] = await db.insert(schema.favoriteDestinations)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      res.status(201).json(destination);
    } catch (error) {
      console.error("Error creating favorite destination:", error);
      res.status(500).json({ message: "Failed to create favorite destination" });
    }
  });

  // Get favorite destinations for public view
  app.get(`${apiPrefix}/favorite-destinations`, async (req, res) => {
    try {
      const destinations = await db.query.favoriteDestinations.findMany({
        orderBy: (destinations) => [asc(destinations.order)]
      });
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching favorite destinations:", error);
      res.status(500).json({ message: "Failed to fetch favorite destinations" });
    }
  });

  // Travelers Choice API routes
  app.get(`${apiPrefix}/travelers-choice`, async (req, res) => {
    try {
      const choices = await db.query.travelersChoice.findMany({
        orderBy: (choices) => [asc(choices.order)]
      });
      res.json(choices);
    } catch (error) {
      console.error("Error fetching travelers choice:", error);
      res.status(500).json({ message: "Failed to fetch travelers choice" });
    }
  });

// Tips API routes
app.get(`${apiPrefix}/admin/tips`, async (req, res) => {
  try {
    const tips = await db.query.tipsAndIdeas.findMany({
      orderBy: (ideas) => [asc(ideas.title)]
    });
    res.json(tips);
  } catch (error) {
    console.error("Error fetching tips:", error);
    res.status(500).json({ message: "Failed to fetch tips" });
  }
});

app.get(`${apiPrefix}/admin/tips/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const tip = await db.query.tipsAndIdeas.findFirst({
      where: eq(schema.tipsAndIdeas.id, parseInt(id))
    });
    if (!tip) {
      return res.status(404).json({ message: "Tip not found" });
    }
    res.json(tip);
  } catch (error) {
    console.error("Error fetching tip:", error);
    res.status(500).json({ message: "Failed to fetch tip" });
  }
});

  // Tips and Ideas 
export const tipsAndIdeas = pgTable("tips_and_ideas", {