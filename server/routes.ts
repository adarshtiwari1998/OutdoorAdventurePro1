import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "@db";
import * as schema from "@shared/schema";
import { blogPosts } from "@shared/schema";
import { eq, asc, inArray, desc, and } from "drizzle-orm";
import { z } from "zod";
import { setupAuth } from "./auth";

// Import services
import { ShopifyService } from "./services/shopifyService";
import { WordPressService } from "./services/wordpressService";
import { YouTubeService } from "./services/youtubeService";
import { GeminiService } from "./services/geminiService";
import videoService from "./services/videoService";

export async function registerRoutes(app: Express): Promise {
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

  // Home Video Slider routes
  app.get(`${apiPrefix}/home-video-settings`, async (req, res) => {
    try {
      const settings = await storage.getHomeVideoSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching home video settings:", error);
      res.status(500).json({ message: "Failed to fetch home video settings" });
    }
  });

  app.get(`${apiPrefix}/admin/home-video-settings`, async (req, res) => {
    try {
      const settings = await storage.getHomeVideoSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching home video settings:", error);
      res.status(500).json({ message: "Failed to fetch home video settings" });
    }
  });

  app.post(`${apiPrefix}/admin/home-video-settings`, async (req, res) => {
    try {
      const { categoryId, videoCount, isActive, title, description, videoType } = req.body;

      console.log('Received home video settings:', { categoryId, videoCount, isActive, title, description, videoType });

      // Handle both regular category IDs and header category IDs
      let parsedCategoryId = null;
      if (categoryId !== null && categoryId !== undefined && categoryId !== "" && categoryId !== "NaN") {
        if (typeof categoryId === 'number') {
          parsedCategoryId = categoryId;
        } else if (typeof categoryId === 'string') {
          // Check if it's a header category (format: "header_X")
          if (categoryId.startsWith('header_')) {
            console.log(`⚠️ WARNING: Received header category ID "${categoryId}" - this should use regular category IDs`);
            const headerIdStr = categoryId.replace('header_', '');
            const headerConfigId = parseInt(headerIdStr);

            if (!isNaN(headerConfigId)) {
              // Get the header config to find or create corresponding blog category
              const headerConfig = await db.query.headerConfigs.findFirst({
                where: eq(schema.headerConfigs.id, headerConfigId)
              });

              if (headerConfig) {
                // Ensure there's a corresponding blog category
                const blogCategory = await storage.ensureBlogCategoryFromHeader(headerConfig.category);
                parsedCategoryId = blogCategory.id;
                console.log(`🔄 Mapped header category "${categoryId}" to blog category ID: ${parsedCategoryId}`);
              }
            }
          } else {
            // Regular numeric string
            const parsed = parseInt(categoryId);
            if (!isNaN(parsed)) {
              parsedCategoryId = parsed;
              console.log(`✅ Using regular category ID: ${parsedCategoryId}`);
            }
          }
        }
      }

      console.log('Parsed categoryId:', parsedCategoryId);

      const settings = await storage.saveHomeVideoSettings({
        categoryId: parsedCategoryId,
        videoCount,
        isActive,
        title,
        description,
        videoType: videoType || 'all'
      });

      console.log('Saved settings:', settings);
      res.json(settings);
    } catch (error) {
      console.error("Error saving home video settings:", error);
      res.status(500).json({ message: "Failed to save home video settings" });
    }
  });

  app.get(`${apiPrefix}/admin/home-video-preview`, async (req, res) => {
    try {
      const { categoryId, videoCount, videoType } = req.query;

      console.log('Preview request - categoryId:', categoryId, 'videoCount:', videoCount, 'videoType:', videoType);

      if (!categoryId || categoryId === "undefined" || categoryId === "null" || categoryId === "" || categoryId === undefined) {
        console.log('No valid categoryId provided, returning empty array');
        return res.json([]);
      }

      // Handle both regular category IDs and header category IDs
      let parsedCategoryId = null;
      if (typeof categoryId === 'string') {
        // Check if it's a header category (format: "header_X")
        if (categoryId.startsWith('header_')) {
          const headerIdStr = categoryId.replace('header_', '');
          const headerConfigId = parseInt(headerIdStr);

          if (!isNaN(headerConfigId)) {
            // Get the header config to find or create corresponding blog category
            const headerConfig = await db.query.headerConfigs.findFirst({
              where: eq(schema.headerConfigs.id, headerConfigId)
            });

            if (headerConfig) {
              // Ensure there's a corresponding blog category
              const blogCategory = await storage.ensureBlogCategoryFromHeader(headerConfig.category);
              parsedCategoryId = blogCategory.id;
              console.log(`Mapped header category "${categoryId}" to blog category ID: ${parsedCategoryId}`);
            }
          }
        } else {
          // Regular numeric string
          parsedCategoryId = parseInt(categoryId);
        }
      } else if (typeof categoryId === 'number') {
        parsedCategoryId = categoryId;
      }

      if (isNaN(parsedCategoryId) || parsedCategoryId === null) {
        console.log('Failed to parse categoryId, returning empty array');
        return res.json([]);
      }

      console.log(`Looking for videos with category_id: ${parsedCategoryId}`);

      // First check how many videos exist with this category ID
      const allVideosInCategory = await db.query.youtubeVideos.findMany({
        where: eq(schema.youtubeVideos.categoryId, parsedCategoryId),
        columns: { id: true, title: true, categoryId: true }
      });

      console.log(`Database check: Found ${allVideosInCategory.length} videos with categoryId ${parsedCategoryId}`);
      if (allVideosInCategory.length > 0) {
        console.log(`Sample videos:`, allVideosInCategory.slice(0, 3).map(v => ({
          id: v.id,
          title: v.title.substring(0, 50),
          categoryId: v.categoryId
        })));
      }

      const videos = await storage.getVideosByCategory(
        parsedCategoryId, 
        parseInt(videoCount as string) || 8,
        videoType as string || 'all'
      );

      console.log(`Final result: ${videos.length} videos for category ${parsedCategoryId}`);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching home video preview:", error);
      res.status(500).json({ message: "Failed to fetch home video preview" });
    }
  });

  app.get(`${apiPrefix}/home-videos`, async (req, res) => {
    try {
      // Get settings from database if no query params provided
      let { categoryId, videoCount, videoType } = req.query;

      if (!categoryId || !videoCount || !videoType) {
        const settings = await storage.getHomeVideoSettings();
        if (!settings || !settings.isActive) {
          return res.json([]);
        }

        categoryId = categoryId || settings.categoryId?.toString();
        videoCount = videoCount || settings.videoCount?.toString() || '8';
        videoType = videoType || settings.videoType || 'all';
      }

      if (!categoryId || categoryId === 'null' || categoryId === 'undefined') {
        return res.json([]);
      }

      console.log(`Fetching home videos: categoryId=${categoryId}, videoCount=${videoCount}, videoType=${videoType}`);

      const videos = await storage.getVideosByCategory(
        parseInt(categoryId as string), 
        parseInt(videoCount as string) || 8,
        videoType as string || 'all'
      );

      console.log(`Found ${videos.length} videos for home page`);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching home videos:", error);
      res.status(500).json({ message: "Failed to fetch home videos" });
    }
  });

  // Dashboard Assets routes
  app.get(`${apiPrefix}/admin/dashboard-assets`, async (req, res) => {
    try {
      const assets = await storage.getDashboardAssets();
      res.json(assets);
    } catch (error) {
      console.error("Error fetching dashboard assets:", error);
      res.status(500).json({ message: "Failed to fetch dashboard assets" });
    }
  });

  // Cleanup broken dashboard assets
  app.post(`${apiPrefix}/admin/dashboard-assets/cleanup`, async (req, res) => {
    try {
      const assets = await storage.getDashboardAssets();
      const brokenAssets = [];

      for (const asset of assets) {
        try {
          // Check if the Cloudinary URL is accessible
          const response = await fetch(asset.url, { method: 'HEAD' });
          if (!response.ok) {
            brokenAssets.push({
              id: asset.id,
              name: asset.name,
              url: asset.url,
              reason: `HTTP ${response.status}`
            });
          }
        } catch (error) {
          brokenAssets.push({
            id: asset.id,
            name: asset.name,
            url: asset.url,
            reason: 'Network error or not found'
          });
        }
      }

      res.json({
        totalAssets: assets.length,
        brokenAssets: brokenAssets.length,
        brokenAssetsList: brokenAssets
      });
    } catch (error) {
      console.error('Error cleaning up dashboard assets:', error);
      res.status(500).json({ message: 'Failed to cleanup dashboard assets' });
    }
  });

  app.post(`${apiPrefix}/admin/dashboard-assets`, async (req, res) => {
    try {
      const contentType = req.headers['content-type'] || '';

      // Handle multipart form data for file uploads
      if (contentType.includes('multipart/form-data')) {
        // Use multer or similar to handle file uploads
        const { default: multer } = await import('multer');
        const { default: cloudinaryService } = await import('./services/cloudinaryService.js');

        const upload = multer({ 
          storage: multer.memoryStorage(),
          limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
        });

        // Parse the multipart form data
        upload.single('file')(req, res, async (err) => {
          if (err) {
            return res.status(400).json({ message: "File upload error: " + err.message });
          }

          const { type, name, uploadMethod } = req.body;

          if (!type || !name) {
            return res.status(400).json({ 
              message: "Type and name are required" 
            });
          }

          // Handle both file and URL uploads in multipart form
          let finalUrl, cloudinaryPublicId;

          if (req.file) {
            // File upload
            try {
              const assetId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              finalUrl = await cloudinaryService.uploadAdminAsset(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                type === 'logo' ? 'logos' : 'favicons',
                assetId
              );
              cloudinaryPublicId = assetId;
            } catch (uploadError) {
              console.error("Error uploading file to Cloudinary:", uploadError);
              return res.status(500).json({ message: "Failed to upload file to cloud storage" });
            }
          } else if (req.body.url) {
            // URL upload from multipart form
            try {
              const assetId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              finalUrl = await cloudinaryService.uploadAdminAsset(
                req.body.url,
                type === 'logo' ? 'logos' : 'favicons',
                assetId
              );
              cloudinaryPublicId = assetId;
            } catch (uploadError) {
              console.error("Error uploading URL to Cloudinary:", uploadError);
              // Use original URL as fallback
              finalUrl = req.body.url;
            }
          } else {
            return res.status(400).json({ 
              message: "Either file or URL is required" 
            });
          }

          const assetData = {
            type,
            name,
            url: finalUrl,
            cloudinaryPublicId,
            isActive: false
          };

          const asset = await storage.createDashboardAsset(assetData);
          res.status(201).json(asset);
        });

        return; // Exit early since we're handling the response in the callback
      }

      // Handle regular JSON data for URL uploads
      const { type, name, url, uploadMethod } = req.body;

      if (!type || !name) {
        return res.status(400).json({ 
          message: "Type and name are required" 
        });
      }

      if (!url) {
        return res.status(400).json({ 
          message: "URL is required" 
        });
      }

      // For URL uploads, upload to Cloudinary for consistency
      let finalUrl = url;
      let cloudinaryPublicId = null;

      try {
        const { default: cloudinaryService } = await import('./services/cloudinaryService.js');
        const assetId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        finalUrl = await cloudinaryService.uploadAdminAsset(
          url,
          type === 'logo' ? 'logos' : 'favicons',
          assetId
        );
        cloudinaryPublicId = assetId;
      } catch (cloudinaryError) {
        console.error("Error uploading URL to Cloudinary:", cloudinaryError);
        // Continue with original URL if Cloudinary fails
      }

      const assetData = {
        type,
        name,
        url: finalUrl,
        cloudinaryPublicId,
        isActive: false
      };

      const asset = await storage.createDashboardAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      console.error("Error creating dashboard asset:", error);
      res.status(500).json({ message: "Failed to create dashboard asset" });
    }
  });

  app.patch(`${apiPrefix}/admin/dashboard-assets/:id/activate`, async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;

      // First deactivate all assets of this type
      const existingAssets = await storage.getDashboardAssets();
      for (const asset of existingAssets) {
        if (asset.type === type && asset.id !== parseInt(id)) {
          await storage.updateDashboardAsset(asset.id, { isActive: false });
        }
      }

      // Then activate the selected asset
      const asset = await storage.updateDashboardAsset(parseInt(id), { isActive: true });
      res.json(asset);
    } catch (error) {
      console.error("Error activating dashboard asset:", error);
      res.status(500).json({ message: "Failed to activate dashboard asset" });
    }
  });

  app.delete(`${apiPrefix}/admin/dashboard-assets/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDashboardAsset(parseInt(id));
      res.json({ message: "Asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting dashboard asset:", error);
      res.status(500).json({ message: "Failed to delete dashboard asset" });
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
      res.status(500).json({message: "Failed to delete slider" });
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

  // Categories routes
  app.get("/api/admin/categories", async (req: Request, res: Response) => {
    try {
      const categories = await db.query.categories.findMany({
        orderBy: [schema.categories.type, schema.categories.name]
      });

      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Public categories endpoint for frontend use
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await db.query.categories.findMany({
        orderBy: [schema.categories.type, schema.categories.name]
      });

      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", async (req: Request, res: Response) => {
    try {
      const { name, slug, description } = req.body;

      const category = await db.insert(schema.categories).values({
        name,
        slug,
        description: description || `${name} category`,
        type: 'blog' // Default to blog type for new categories created from blog management
      }).returning();

      res.json(category[0]);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.delete("/api/admin/categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);

      await db.delete(schema.categories)
        .where(eq(schema.categories.id, categoryId));

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Blog routes
  app.get(`${apiPrefix}/admin/blog/posts`, async (req, res) => {
    try {
      const { page = 1, status, category, search, pageSize } = req.query;

      // For category details, use a large page size or no limit
      const effectivePageSize = pageSize && parseInt(pageSize as string) > 100 
        ? parseInt(pageSize as string) 
        : 10;

      console.log(`Fetching blog posts - Page: ${page}, Status: ${status}, Category: ${category}, Search: ${search}, PageSize: ${effectivePageSize}`);

      const result = await storage.getAdminBlogPosts({
        page: Number(page),
        pageSize: effectivePageSize,
        status: status as string,
        categoryId: category as string,
        searchQuery: search as string,
        includeContent: true
      });

      console.log(`Returned ${result.posts.length} posts, Total pages: ${result.totalPages}`);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch admin blog posts" });
    }
  });

  app.get(`${apiPrefix}/admin/blog/categories`, async (req, res) => {
    try {
      // Get blog categories
      const blogCategories = await storage.getBlogCategories();

      // Get header categories (these can also be used for blog posts)
      const headerConfigs = await db.query.headerConfigs.findMany();

      // Convert header configs to category format
      const headerCategories = headerConfigs.map(config => ({
        id: `header_${config.id}`,
        name: config.category.charAt(0).toUpperCase() + config.category.slice(1),
        slug: config.category,
        type: 'header'
      }));

      // Combine both types of categories
      const allCategories = [...blogCategories, ...headerCategories];

      res.json(allCategories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  app.post(`${apiPrefix}/admin/blog/categories`, async (req, res) => {
    try {
      const { name, slug, description } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      const newCategory = await storage.createBlogCategory({
        name,
        slug,
        description: description || null,
        type: 'blog'
      });

      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating blog category:", error);
      res.status(500).json({ message: "Failed to create blog category" });
    }
  });

  app.delete(`${apiPrefix}/admin/blog/categories/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id);

      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      // Check if category has posts
      const postsInCategory = await storage.getBlogPostsCountByCategory(categoryId);
      if (postsInCategory > 0) {
        return res.status(400).json({ 
          message: `Cannot delete category. It contains ${postsInCategory} blog posts. Please move or delete these posts first.` 
        });
      }

      await storage.deleteBlogCategory(categoryId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog category:", error);
      res.status(500).json({ message: "Failed to delete blog category" });
    }
  });

  app.get(`${apiPrefix}/admin/blog/analytics`, async (req, res) => {
    try {
      const analytics = await storage.getBlogAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching blog analytics:", error);
      res.status(500).json({ message: "Failed to fetch blog analytics" });
    }
  });

  app.post(`${apiPrefix}/admin/blog/sync-header-categories`, async (req, res) => {
    try {
      // Get all header configs
      const headerConfigs = await db.query.headerConfigs.findMany();

      let syncedCount = 0;

      // Ensure each header category has a corresponding blog category
      for (const config of headerConfigs) {
        try {
          await storage.ensureBlogCategoryFromHeader(config.category);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync header category ${config.category}:`, error);
        }
      }

      res.json({ success: true, syncedCount });
    } catch (error) {
      console.error("Error syncing header categories:", error);
      res.status(500).json({ message: "Failed to sync header categories" });
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

  app.patch(`${apiPrefix}/admin/blog/posts/bulk-category`, async (req, res) => {
    try {
      const { ids, categoryId } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Post IDs are required" });
      }

      if (!categoryId || isNaN(parseInt(categoryId))) {
        return res.status(400).json({ message: "Valid category ID is required" });
      }

      await storage.updateBlogPostsCategory(ids, parseInt(categoryId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating blog posts category:", error);
      res.status(500).json({ message: "Failed to update blog posts category" });
    }
  });

  app.patch(`${apiPrefix}/admin/blog/posts/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const postData = req.body;
      const postId = parseInt(id);

      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const updatedPost = await storage.updateBlogPost(postId, postData);
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
    let { wordpressUrl, username, password, postsCount, categoryId } = req.body;

    // If password is masked (***) or empty, get the real password from saved credentials
    if (password === "***" || !password) {
      const savedCredentials = await storage.getWordPressCredentials();
      if (savedCredentials) {
        password = savedCredentials.password;
        wordpressUrl = savedCredentials.url;
        username = savedCredentials.username;
      } else {
        return res.status(400).json({ message: "No saved credentials found" });
      }
    }

    // Validate that we have all required credentials
    if (!wordpressUrl || !username || !password) {
      return res.status(400).json({ message: "WordPress URL, username, and password are required" });
    }

    // Validate and parse categoryId
    if (!categoryId || categoryId === "" || categoryId === "NaN") {
      return res.status(400).json({ message: "Valid category ID is required" });
    }

    const parsedCategoryId = parseInt(categoryId);
    if (isNaN(parsedCategoryId)) {
      return res.status(400).json({ message: "Category ID must be a valid number" });
    }

    // Get all existing blog posts to check against
    const existingPosts = await db.query.blogPosts.findMany({
      columns: {
        slug: true,
        title: true
      }
    });

    const existingSlugs = new Set(existingPosts.map(post => post.slug.toLowerCase()));
    const existingTitles = new Set(existingPosts.map(post => post.title.toLowerCase().trim()));

    console.log(`📚 Found ${existingPosts.length} existing blog posts in database`);
    console.log(`🔍 Starting WordPress import - requesting ${postsCount} posts...`);

    let importedCount = 0;
    let skippedCount = 0;
    let fetchedCount = 0;
    let currentPage = 1;
    const maxPages = 10; // Safety limit to prevent infinite loops
    const importedPosts = []; // Track imported posts for frontend feedback

    while (importedCount < postsCount && currentPage <= maxPages) {
      console.log(`📄 Fetching page ${currentPage} from WordPress...`);

      // Fetch posts with pagination
      const posts = await wordpressService.importPosts({
        url: wordpressUrl,
        username,
        applicationPassword: password,
        count: Math.min(20, postsCount * 2), // Fetch more posts to account for duplicates
        page: currentPage
      });

      if (!posts || posts.length === 0) {
        console.log(`📄 No more posts found on page ${currentPage}. Ending import.`);
        break;
      }

      fetchedCount += posts.length;
      console.log(`📦 Fetched ${posts.length} posts from page ${currentPage}`);

      for (const post of posts) {
        // Check if we already have enough imported posts
        if (importedCount >= postsCount) {
          break;
        }

        const postSlug = post.slug.toLowerCase();
        const postTitle = post.title.toLowerCase().trim();

        // Check if post already exists by slug or title
        if (existingSlugs.has(postSlug)) {
          console.log(`⏭️  Same post found (slug: "${post.slug}") - skipping import, checking another`);
          skippedCount++;
          continue;
        }

        if (existingTitles.has(postTitle)) {
          console.log(`⏭️  Same post found (title: "${post.title}") - skipping import, checking another`);
          skippedCount++;
          continue;
        }

        try {
          // Import the new post
          await storage.createBlogPost({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            featuredImage: post.featuredImage,
            categoryId: parsedCategoryId.toString(),
            status: 'published',
            tags: post.tags,
            slug: post.slug
          });

          // Add to our tracking sets to avoid duplicates in the same import
          existingSlugs.add(postSlug);
          existingTitles.add(postTitle);

          // Track imported post for frontend feedback
          importedPosts.push({
            title: post.title,
            status: 'published'
          });

          importedCount++;
          console.log(`✅ Imported post ${importedCount}/${postsCount}: "${post.title}"`);
        } catch (error) {
          console.error(`❌ Failed to import post "${post.title}":`, error);
          skippedCount++;
        }
      }

      currentPage++;
    }

    // Save credentials for future use
    await storage.saveWordPressCredentials({
      url: wordpressUrl,
      username,
      password
    });

    console.log(`📊 Import Summary:`);
    console.log(`   - Total fetched: ${fetchedCount} posts`);
    console.log(`   - Successfully imported: ${importedCount} posts`);
    console.log(`   - Skipped (duplicates/errors): ${skippedCount} posts`);
    console.log(`   - Pages checked: ${currentPage - 1}`);

    res.json({ 
      success: true, 
      count: importedCount,
      skipped: skippedCount,
      fetched: fetchedCount,
      importedPosts: importedPosts,
      message: `Successfully imported ${importedCount} new posts. Skipped ${skippedCount} existing posts.`
    });
  } catch (error) {
    console.error("Error importing WordPress posts:", error);
    res.status(500).json({ message: "Failed to import WordPress posts" });
  }
});

// WordPress credentials endpoints
app.get(`${apiPrefix}/admin/wordpress/credentials`, async (req, res) => {
  try {
    const credentials = await storage.getWordPressCredentials();
    if (credentials) {
      // Don't send the password in the response for security
      res.json({
        url: credentials.url,
        username: credentials.username,
        hasCredentials: true
      });
    } else {
      res.json({ hasCredentials: false });
    }
  } catch (error) {
    console.error("Error fetching WordPress credentials:", error);
    res.status(500).json({ message: "Failed to fetch WordPress credentials" });
  }
});

app.delete(`${apiPrefix}/admin/wordpress/credentials`, async (req, res) => {
  try {
    await storage.deleteWordPressCredentials();
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting WordPress credentials:", error);
    res.status(500).json({ message: "Failed to delete WordPress credentials" });
  }
});

  // Video statistics update routes
  app.post(`${apiPrefix}/admin/youtube/videos/update-stats`, async (req, res) => {
    try {
      const { videoIds, forceUpdate = false } = req.body;

      if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
        // Update specific videos
        const videos = await Promise.all(
          videoIds.map(id => storage.getYoutubeVideoById(parseInt(id)))
        );

        const validVideos = videos.filter(v => v !== null);
        const youtubeVideoIds = validVideos.map(v => v.videoId);

        const statsMap = await youtubeService.batchUpdateVideoStatistics(youtubeVideoIds);

        const updates = validVideos
          .map(video => {
            const stats = statsMap.get(video.videoId);
            return stats ? { id: video.id, ...stats } : null;
          })
          .filter(Boolean);

        if (updates.length > 0) {
          await storage.batchUpdateVideoStatistics(updates);
        }

        res.json({ 
          success: true, 
          updated: updates.length,
          message: `Updated statistics for ${updates.length} videos` 
        });
      } else {
        // Update videos that need refreshing
        const videosToUpdate = await storage.getVideosForStatsUpdate(50);

        if (videosToUpdate.length === 0) {
          return res.json({ 
            success: true, 
            updated: 0,
            message: 'All videos are up to date' 
          });
        }

        const youtubeVideoIds = videosToUpdate.map(v => v.videoId);
        const statsMap = await youtubeService.batchUpdateVideoStatistics(youtubeVideoIds);

        const updates = videosToUpdate
          .map(video => {
            const stats = statsMap.get(video.videoId);
            return stats ? { id: video.id, ...stats } : null;
          })
          .filter(Boolean);

        if (updates.length > 0) {
          await storage.batchUpdateVideoStatistics(updates);
        }

        res.json({ 
          success: true, 
          updated: updates.length,
          message: `Updated statistics for ${updates.length} videos` 
        });
      }
    } catch (error) {
      console.error("Error updating video statistics:", error);
      res.status(500).json({ message: "Failed to update video statistics" });
    }
  });

  // Update all video statistics
  app.post(`${apiPrefix}/admin/youtube/videos/update-all-stats`, async (req, res) => {
    try {
      const { force = false, maxVideos = 1000 } = req.body;
      const { updateAllVideoStatistics } = await import('./scripts/updateVideoStats');

      console.log(`🔄 Starting ${force ? 'forced' : 'smart'} video statistics update for up to ${maxVideos} videos`);

      // Run the update in the background and return immediately
      updateAllVideoStatistics()
        .then(() => {
          console.log('✅ All video statistics updated successfully');
        })
        .catch((error) => {
          console.error('❌ Error updating video statistics:', error);
        });

      res.json({ 
        success: true, 
        message: `Video statistics update started (${force ? 'forced' : 'smart'} mode). Check console for progress.`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error starting video statistics update:", error);
      res.status(500).json({ message: "Failed to start video statistics update" });
    }
  });

  app.get(`${apiPrefix}/admin/youtube/stats-status`, async (req, res) => {
    try {
      const videosToUpdate = await storage.getVideosForStatsUpdate(1000);
      const totalVideos = await db.query.youtubeVideos.findMany({
        columns: { id: true }
      });

      res.json({
        totalVideos: totalVideos.length,
        videosNeedingUpdate: videosToUpdate.length,
        lastUpdate: videosToUpdate.length > 0 ? videosToUpdate[0].lastStatsUpdate : null
      });
    } catch (error) {
      console.error("Error getting stats status:", error);
      res.status(500).json({ message: "Failed to get stats status" });
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
// Get videos for a specific channel or all videos
  app.get(`${apiPrefix}/admin/youtube/videos`, async (req, res) => {
    try {
      const { channelId } = req.query;

      let videos;
      if (channelId) {
        videos = await storage.getYoutubeVideosByChannel(channelId as string);
        
        // For channel-specific requests, we need to enrich manually
        const enrichedVideos = await Promise.all(
          videos.map(async (video) => {
            const channel = await storage.getYoutubeChannelById(video.channelId);
            const category = video.categoryId ? await storage.getBlogCategories().then(cats => 
              cats.find(cat => cat.id === video.categoryId)
            ) : null;

            return {
              ...video,
              channel: channel ? {
                id: channel.id,
                name: channel.name,
                channelId: channel.channelId
              } : null,
              category: category ? {
                id: category.id,
                name: category.name,
                slug: category.slug
              } : null,
              channelName: channel?.name || 'Unknown Channel'
            };
          })
        );
        
        res.json(enrichedVideos);
      } else {
        // Fetch all videos from all channels - already enriched by getAllYoutubeVideos
        videos = await storage.getAllYoutubeVideos();
        res.json(videos);
      }
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

      // Check if channel already exists
      const existingChannel = await db.query.youtubeChannels.findFirst({
        where: eq(schema.youtubeChannels.channelId, channelId)
      });

      if (existingChannel) {
        return res.status(409).json({ 
          message: "This YouTube channel has already been added to your account",
          type: "duplicate_channel",
          existingChannel: {
            id: existingChannel.id,
            name: existingChannel.name,
            channelId: existingChannel.channelId
          }
        });
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

      // Handle database constraint errors
      if (error.code === '23505' && error.constraint === 'youtube_channels_channel_id_unique') {
        return res.status(409).json({ 
          message: "This YouTube channel has already been added to your account",
          type: "duplicate_channel"
        });
      }

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
        channelId: videoDetails.channelId,
        videoType: videoDetails.videoType,
        duration: videoDetails.duration
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
      const { limit = 10, categoryId } = req.body;
      console.log(`🎬 Starting video import for channel ID: ${id} (limit: ${limit})`);

      const channel = await storage.getYoutubeChannelById(parseInt(id));

      if (!channel) {
        console.error(`❌ Channel not found for ID: ${id}`);
        return res.status(404).json({ message: "Channel not found" });
      }

      console.log(`📺 Found channel: ${channel.name} (YouTube ID: ${channel.channelId})`);

      // Check if YouTube API key is configured
      if (!process.env.YOUTUBE_API_KEY) {
        console.error("❌ YouTube API key not configured");
        return res.status(500).json({ 
          message: "YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable." 
        });
      }

      // Validate limit - ensure exact count
      const desiredNewVideos = Math.min(Math.max(1, parseInt(limit) || 10), 50);
      console.log(`📊 Target: EXACTLY ${desiredNewVideos} NEW videos to import`);

      // Get ALL existing video IDs for this channel from database
      const existingVideos = await storage.getYoutubeVideosByChannel(channel.id.toString());
      const existingVideoIds = new Set(existingVideos.map((v: any) => v.videoId));
      console.log(`📊 Found ${existingVideoIds.size} existing videos in database for this channel`);

      // Fetch new videos from YouTube with higher buffer to ensure we get enough
      console.log(`🔍 Fetching NEW videos from YouTube API (buffer: ${desiredNewVideos * 2})...`);
      const videos = await youtubeService.getChannelVideos(
        channel.channelId, 
        desiredNewVideos * 2, // Fetch more to account for filtering
        existingVideoIds
      );

      // Take exactly the requested number of videos
      const videosToImport = videos.slice(0, desiredNewVideos);
      console.log(`📋 Selected EXACTLY ${videosToImport.length} videos to import from ${videos.length} available`);

      let importedCount = 0;
      let transcriptSuccessCount = 0;
      let transcriptErrorCount = 0;
      const transcriptErrors: string[] = [];

      // Process videos one by one with improved rate limiting
      for (let i = 0; i < videosToImport.length; i++) {
        const video = videosToImport[i];

        try {
          console.log(`\n🔄 Processing video ${i + 1}/${videosToImport.length}: ${video.title}`);

          // Parse category ID properly
          let parsedCategoryId = null;
          if (categoryId) {
            if (typeof categoryId === 'string') {
              // Check if it's a header category (format: "header_X")
              if (categoryId.startsWith('header_')) {
                const headerIdStr = categoryId.replace('header_', '');
                const headerConfigId = parseInt(headerIdStr);

                if (!isNaN(headerConfigId)) {
                  // Get the header config to find or create corresponding blog category
                  const headerConfig = await db.query.headerConfigs.findFirst({
                    where: eq(schema.headerConfigs.id, headerConfigId)
                  });

                  if (headerConfig) {
                    // Ensure there's a corresponding blog category
                    const blogCategory = await storage.ensureBlogCategoryFromHeader(headerConfig.category);
                    parsedCategoryId = blogCategory.id;
                    console.log(`📁 Mapped header category "${categoryId}" to blog category ID: ${parsedCategoryId}`);
                  }
                }
              } else {
                // Regular numeric string
                const parsed = parseInt(categoryId);
                if (!isNaN(parsed)) {
                  parsedCategoryId = parsed;
                }
              }
            } else if (typeof categoryId === 'number' && !isNaN(categoryId)) {
              parsedCategoryId = categoryId;
            }
          }

          console.log(`📁 Final category ID for video "${video.title}": ${parsedCategoryId}`);

          // Save video to database with initial statistics
          const savedVideo = await storage.createYoutubeVideo({
            videoId: video.id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnailUrl,
            publishedAt: video.publishedAt,
            channelId: channel.id, // This is already a number from the channel object
            categoryId: parsedCategoryId,
            transcript: null,
            importStatus: 'processing',
            videoType: video.videoType,
            duration: video.duration,
            viewCount: video.viewCount || 0,
            likeCount: video.likeCount || 0,
            commentCount: video.commentCount || 0
          });

          importedCount++;
          console.log(`✅ Step 1/2: Video metadata imported (${i + 1}/${videosToImport.length})`);

          // Step 2: Fetch transcript (simple approach)
          try {
            console.log(`📄 Step 2/2: Fetching transcript for: ${video.title} (${video.id})`);

            const transcriptResult = await youtubeService.getVideoTranscript(video.id);

            // Handle the result object properly
            let transcript = '';
            let isRealTranscript = false;

            if (
transcriptResult && typeof transcriptResult === 'object') {
              if (transcriptResult.success && transcriptResult.transcript) {
                transcript = transcriptResult.transcript;
                isRealTranscript = transcriptResult.extractionMethod !== 'Content Extract';
              } else {
                throw new Error(transcriptResult.error || 'Transcript extraction failed');
              }
            } else if (typeof transcriptResult === 'string') {
              transcript = transcriptResult;
              isRealTranscript = transcript.includes('[REAL TRANSCRIPT') || 
                               transcript.includes('[TRANSCRIPT for') || 
                               transcript.includes('[CAPTIONS DETECTED');
            } else {
              throw new Error('Invalid transcript result format');
            }

            // Update video with transcript
            await storage.updateYoutubeVideoTranscript(savedVideo.id, transcript);

            const finalStatus = isRealTranscript ? 'completed' : 'completed_content_only';
            await db.update(schema.youtubeVideos)
              .set({ importStatus: finalStatus })
              .where(eq(schema.youtubeVideos.id, savedVideo.id));

            if (isRealTranscript) {
              transcriptSuccessCount++;
              console.log(`✅ Step 2/2: Real transcript fetched for: ${video.title}`);
            } else {
              transcriptErrorCount++;
              console.log(`⚠️ Step 2/2: Content extract created for: ${video.title}`);
            }

          } catch (transcriptError) {
            console.error(`❌ Step 2/2: Error fetching transcript for ${video.title}:`, transcriptError);

            // Create enhanced fallback transcript
            const fallbackTranscript = `[TRANSCRIPT UNAVAILABLE - IMPORT ERROR]

Video: ${video.title}
Channel: ${channel.name}
Duration: ${Math.floor(video.duration / 60)} minutes ${video.duration % 60} seconds
Published: ${new Date(video.publishedAt).toLocaleDateString()}
Video ID: ${video.id}

Description:
${video.description}

Error Details:
${transcriptError.message}

Status: Transcript extraction failed during import. Video may have captions that can be accessed manually.

[End of error transcript]`;

            await storage.updateYoutubeVideoTranscript(savedVideo.id, fallbackTranscript);
            await db.update(schema.youtubeVideos)
              .set({ 
                importStatus: 'completed_with_errors',
                errorMessage: `Transcript error: ${transcriptError.message}`
              })
              .where(eq(schema.youtubeVideos.id, savedVideo.id));

            transcriptErrorCount++;
            transcriptErrors.push(`${video.title}: ${transcriptError.message}`);
          }

          // Enhanced circuit breaker with captcha detection
          if (i < videosToImport.length - 1) {
            const baseDelay = 15000; // Reduced to 15 seconds minimum
            let errorMultiplier = 1;

            if (transcriptErrorCount > 0) {
              errorMultiplier = Math.min(transcriptErrorCount + 1, 3); // Max 3x delay
            }

            const finalDelay = baseDelay * errorMultiplier;
            console.log(`⏳ Waiting ${finalDelay/1000} seconds before next video (error count: ${transcriptErrorCount})...`);
            await new Promise(resolve => setTimeout(resolve, finalDelay));
          }

        } catch (videoError) {
          console.error(`❌ Error processing video ${video.id}:`, videoError);
          transcriptErrors.push(`${video.title}: Failed to import - ${videoError.message}`);

          // Still increment error count for rate limiting logic
          transcriptErrorCount++;
        }
      }

      // Update channel statistics
      await storage.updateYoutubeChannelLastImport(parseInt(id));
      const actualVideoCount = await storage.getYoutubeVideosByChannel(channel.id.toString());
      await storage.setYoutubeChannelImportedCount(parseInt(id), actualVideoCount.length);

      console.log(`\n📊 IMPORT COMPLETE:`);
      console.log(`   - Videos imported: ${importedCount}/${desiredNewVideos}`);
      console.log(`   - Transcripts successful: ${transcriptSuccessCount}`);
      console.log(`   - Transcript failures: ${transcriptErrorCount}`);
      console.log(`   - Total videos in channel: ${actualVideoCount.length}`);

      const message = importedCount === desiredNewVideos 
        ? `✅ Successfully imported exactly ${importedCount} videos with ${transcriptSuccessCount} transcripts.`
        : `⚠️ Imported ${importedCount} of ${desiredNewVideos} requested videos with ${transcriptSuccessCount} transcripts.`;

      res.json({ 
        success: true, 
        count: importedCount,
        requested: desiredNewVideos,
        transcriptSuccessCount,
        transcriptErrorCount,
        transcriptErrors,
        actualCount: actualVideoCount.length,
        message
      });

    } catch (error) {
      console.error(`❌ Error importing videos for channel ${req.params.id}:`, error);

      let errorMessage = "Failed to import videos from channel";
      if (error.message.includes("YouTube API error")) {
        errorMessage = "YouTube API error: " + error.message;
      } else if (error.message.includes("Channel not found")) {
        errorMessage = "YouTube channel not found or invalid channel ID";
      } else if (error.message.includes("quota")) {
        errorMessage = "YouTube API quota exceeded. Please try again later.";
      }

      res.status(500).json({ message: errorMessage, error: error.message });
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

  app.patch(`${apiPrefix}/admin/youtube/videos/bulk-category`, async (req, res) => {
    try {
      const { videoIds, categoryId } = req.body;

      console.log('Bulk category update request:', { videoIds, categoryId, categoryIdType: typeof categoryId });

      if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ message: "Video IDs are required" });
      }

      if (!categoryId || categoryId === "" || categoryId === "NaN" || categoryId === "undefined") {
        return res.status(400).json({ message: "Valid category ID is required" });
      }

      // Handle both string and numeric category IDs, including header categories
      let parsedCategoryId: number | null = null;

      if (typeof categoryId === 'string') {
        // Check if it's a header category (format: "header_X")
        if (categoryId.startsWith('header_')) {
          const headerIdStr = categoryId.replace('header_', '');
          const headerConfigId = parseInt(headerIdStr);

          if (isNaN(headerConfigId)) {
            console.error(`Failed to parse header category ID "${categoryId}"`);
            return res.status(400).json({ message: "Valid category ID is required" });
          }

          // Get the header config to find or create corresponding blog category
          const headerConfig = await db.query.headerConfigs.findFirst({
            where: eq(schema.headerConfigs.id, headerConfigId)
          });

          if (!headerConfig) {
            console.error(`Header config not found for ID: ${headerConfigId}`);
            return res.status(400).json({ message: "Header category not found" });
          }

          // Ensure there's a corresponding blog category
          const blogCategory = await storage.ensureBlogCategoryFromHeader(headerConfig.category);
          parsedCategoryId = blogCategory.id;

          console.log(`Mapped header category "${categoryId}" to blog category ID: ${parsedCategoryId}`);
        } else {
          // Regular numeric string
          parsedCategoryId = parseInt(categoryId);
          if (isNaN(parsedCategoryId)) {
            console.error(`Failed to parse categoryId "${categoryId}" as number`);
            return res.status(400).json({ message: "Valid category ID is required" });
          }
        }
      } else if (typeof categoryId === 'number') {
        if (isNaN(categoryId)) {
          console.error(`CategoryId is NaN: ${categoryId}`);
          return res.status(400).json({ message: "Valid category ID is required" });
        }
        parsedCategoryId = categoryId;
      } else {
        console.error(`Invalid categoryId type: ${typeof categoryId}, value: ${categoryId}`);
        return res.status(400).json({ message: "Valid category ID is required" });
      }

      if (parsedCategoryId === null) {
        return res.status(400).json({ message: "Valid category ID is required" });
      }

      console.log(`Updating ${videoIds.length} videos to category ID: ${parsedCategoryId}`);

      await storage.updateYoutubeVideosCategory(videoIds, parsedCategoryId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating YouTube videos category:", error);
      res.status(500).json({ message: "Failed to update YouTube videos category" });
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

      // Automatically create a corresponding blog category for this header category
      try {
        await storage.ensureBlogCategoryFromHeader(validatedData.category);
      } catch (error) {
        console.error(`Failed to create blog category for header ${validatedDataData.category}:`, error);
        // Don't fail the header creation if blog category creation fails
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
        returnres.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category style" });
    }
  });

  app.patch(`${apiPrefix}/admin/category-styles/:id`, async (req, res) => {
    try {
      const { id } = req.params;

      const existingStyle = await db.query.categoryStyles.findFirst({        where: eq(schema.categoryStyles.id, Number(id))
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

  // Fetch transcripts for existing videos
  app.post(`${apiPrefix}/admin/youtube/videos/fetch-transcripts`, async (req, res) => {
    try {
      const { videoIds } = req.body;

      if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ message: "Video IDs are required" });
      }

      console.log(`🎯 Fetching transcripts for ${videoIds.length} videos`);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const videoId of videoIds) {
        try {
          // Get video from database
          const video = await storage.getYoutubeVideoById(parseInt(videoId));
          if (!video) {
            errors.push(`Video with ID ${videoId} not found`);
            errorCount++;
            continue;
          }

          // Fetch transcript
          const transcript = await youtubeService.getVideoTranscript(video.videoId);

          // Update video with transcript
          await storage.updateYoutubeVideoTranscript(parseInt(videoId), transcript);

          console.log(`✅ Transcript fetched for: ${video.title}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Error fetching transcript for video ${videoId}:`, error);
          errors.push(`Failed to fetch transcript for video ${videoId}: ${error.message}`);
          errorCount++;
        }
      }

      res.json({
        success: true,
        successCount,
        errorCount,
        errors,
        message: `Successfully fetched ${successCount} transcripts. ${errorCount} errors occurred.`
      });
    } catch (error) {
      console.error("Error fetching transcripts:", error);
      res.status(500).json({ message: "Failed to fetch transcripts" });
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

  // Update favorite destination
  app.patch(`${apiPrefix}/admin/favorite-destinations/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const [destination] = await db.update(schema.favoriteDestinations)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(schema.favoriteDestinations.id, parseInt(id)))
        .returning();
      res.json(destination);
    } catch (error) {
      console.error("Error updating favorite destination:", error);
      res.status(500).json({ message: "Failed to update favorite destination" });
    }
  });

  // Delete favorite destination
  app.delete(`${apiPrefix}/admin/favorite-destinations/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.favoriteDestinations)
        .where(eq(schema.favoriteDestinations.id, parseInt(id)));
      res.json({ message: "Favorite destination deleted successfully" });
    } catch (error) {
      console.error("Error deleting favorite destination:", error);
      res.status(500).json({ message: "Failed to delete favorite destination" });
    }
  });

  // Reorder favorite destination
  app.patch(`${apiPrefix}/admin/favorite-destinations/:id/reorder`, async (req, res) => {
    try {
      const { id } = req.params;
      const { direction } = req.body;

      const destination = await db.query.favoriteDestinations.findFirst({
        where: eq(schema.favoriteDestinations.id, parseInt(id))
      });

      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }

      const allDestinations = await db.query.favoriteDestinations.findMany({
        orderBy: asc(schema.favoriteDestinations.order)
      });

      const currentIndex = allDestinations.findIndex(d => d.id === destination.id);

      if (direction === 'up' && currentIndex > 0) {
        const prevDestination = allDestinations[currentIndex - 1];
        await db.update(schema.favoriteDestinations)
          .set({ order: prevDestination.order })
          .where(eq(schema.favoriteDestinations.id, destination.id));
        await db.update(schema.favoriteDestinations)
          .set({ order: destination.order })
          .where(eq(schema.favoriteDestinations.id, prevDestination.id));
      } else if (direction === 'down' && currentIndex < allDestinations.length - 1) {
        const nextDestination = allDestinations[currentIndex + 1];
        await db.update(schema.favoriteDestinations)
          .set({ order: nextDestination.order })
          .where(eq(schema.favoriteDestinations.id, destination.id));
        await db.update(schema.favoriteDestinations)
          .set({ order: destination.order })
          .where(eq(schema.favoriteDestinations.id, nextDestination.id));
      }

      res.json({ message: "Destination reordered successfully" });
    } catch (error) {
      console.error("Error reordering favorite destination:", error);
      res.status(500).json({ message: "Failed to reorder favorite destination" });
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

  // WordPress credentials routes
  app.post(`${apiPrefix}/admin/wordpress-credentials`, async (req, res) => {
    try {
      const { url, username, password } = req.body;
      await storage.saveWordPressCredentials({ url, username, password });
      res.json({ message: "WordPress credentials saved successfully" });
    } catch (error) {
      console.error("Error saving WordPress credentials:", error);
      res.status(500).json({ error: "Failed to save WordPress credentials" });
    }
  });

  app.get(`${apiPrefix}/admin/wordpress/credentials`, async (req, res) => {
    try {
      const credentials = await storage.getWordPressCredentials();
      res.json({
        url: credentials.url,
        username: credentials.username,
        hasCredentials: true
      });
    } catch (error) {
      console.error("Error fetching WordPress credentials:", error);
      res.status(500).json({ message: "Failed to fetch WordPress credentials" });
    }
  });

  app.delete(`${apiPrefix}/admin/wordpress/credentials`, async (req, res) => {
    try {
      await storage.deleteWordPressCredentials();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting WordPress credentials:", error);
      res.status(500).json({ message: "Failed to delete WordPress credentials" });
    }
  });

  // Dashboard Assets routes
  app.get(`${apiPrefix}/admin/dashboard-assets`, async (req, res) => {
    try {
      const assets = await storage.getDashboardAssets();
      res.json(assets);
    } catch (error) {
      console.error("Error getting dashboard assets:", error);
      res.status(500).json({ error: "Failed to get dashboard assets" });
    }
  });

  app.get(`${apiPrefix}/admin/dashboard-assets/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await storage.getDashboardAssetById(parseInt(id));
      if (!asset) {
        return res.status(404).json({ error: "Dashboard asset not found" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Error getting dashboard asset:", error);
      res.status(500).json({ error: "Failed to get dashboard asset" });
    }
  });

  app.post(`${apiPrefix}/admin/dashboard-assets`, async (req, res) => {
    try {
      const assetData = req.body;
      const asset = await storage.createDashboardAsset(assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating dashboard asset:", error);
      res.status(500).json({ error: "Failed to create dashboard asset" });
    }
  });

  app.put(`${apiPrefix}/admin/dashboard-assets/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const assetData = req.body;
      const asset = await storage.updateDashboardAsset(parseInt(id), assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error updating dashboard asset:", error);
      res.status(500).json({ error: "Failed to update dashboard asset" });
    }
  });

  app.delete(`${apiPrefix}/admin/dashboard-assets/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDashboardAsset(parseInt(id));
      res.json({ message: "Dashboard asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting dashboard asset:", error);
      res.status(500).json({ error: "Failed to delete dashboard asset" });
    }
  });

  app.get(`${apiPrefix}/dashboard-assets/:type`, async (req, res) => {
    try {
      const { type } = req.params;
      const assets = await storage.getActiveDashboardAssetsByType(type);
      res.json(assets);
    } catch (error) {
      console.error("Error getting dashboard assets by type:", error);
      res.status(500).json({ error: "Failed to get dashboard assets" });
    }
  });

  app.post(`${apiPrefix}/admin/youtube/videos/bulk-fetch-transcripts`, async (req, res) => {
    try {
      const { videoIds } = req.body;

      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ message: "Video IDs array is required" });
      }

      const youtubeService = new YouTubeService();
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      console.log(`🎯 Starting bulk transcript fetch for ${videoIds.length} videos`);

      for (const videoId of videoIds) {
        try {
          // Get video from database
          const video = await storage.getYoutubeVideoById(parseInt(videoId));
          if (!video) {
            errors.push(`Video with ID ${videoId} not found`);
            errorCount++;
            continue;
          }

          console.log(`📝 Fetching transcript for: ${video.title} (${video.videoId})`);

          // Fetch real transcript
          const transcript = await youtubeService.getVideoTranscript(video.videoId);

          // Update video with transcript
          await storage.updateYoutubeVideoTranscript(parseInt(videoId), transcript);

          console.log(`✅ Transcript updated for: ${video.title}`);
          successCount++;

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error fetching transcript for video ${videoId}:`, error);
          errors.push(`Failed to fetch transcript for video ${videoId}: ${error.message}`);
          errorCount++;
        }
      }

      console.log(`📊 Bulk transcript fetch complete: ${successCount} successful, ${errorCount} errors`);

      res.json({
        success: true,
        successCount,
        errorCount,
        errors,
        message: `Successfully fetched ${successCount} real transcripts. ${errorCount} errors occurred.`
      });
    } catch (error) {
      console.error("Error in bulk transcript fetch:", error);
      res.status(500).json({ message: "Failed to fetch transcripts" });
    }
  });

  app.post(`${apiPrefix}/admin/youtube/channels/sync-counts`, async (req, res) => {
    try {
      console.log(`🔄 Starting sync of imported video counts for all channels`);

      const channels = await storage.getAdminYoutubeChannels();
      let syncedCount = 0;

      for (const channel of channels) {
        try {
          // Get actual video count for this channel
          const videos = await storage.getYoutubeVideosByChannel(channel.id.toString());
          const actualCount = videos.length;

          // Update the channel's imported count to match actual count
          await storage.setYoutubeChannelImportedCount(channel.id, actualCount);

          console.log(`✅ Synced channel "${channel.name}": ${actualCount} videos`);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Error syncing channel ${channel.name}:`, error);
        }
      }

      console.log(`📊 Sync complete: ${syncedCount} channels synced`);

      res.json({
        success: true,
        syncedCount,
        totalChannels: channels.length,
        message: `Successfully synced ${syncedCount} channel counts.`
      });
    } catch (error) {
      console.error("Error syncing channel counts:", error);
      res.status(500).json({ message: "Failed to sync channel counts" });
    }
  });

  // Intelligent retry system with circuit breaker pattern for YouTube transcript fetching.
  app.post(`${apiPrefix}/admin/youtube/videos/retry-transcripts`, async (req, res) => {
    try {
      const { videoIds, mode = 'failed_only', batchSize = 3 } = req.body;

      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ message: "Video IDs array is required" });
      }

      console.log(`🔄 Starting intelligent transcript retry for ${videoIds.length} videos (mode: ${mode}, batch: ${batchSize})`);

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      const results = [];

      // Circuit breaker pattern
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5;
      let circuitOpen = false;

      // Process in small batches to avoid overwhelming the API
      for (let batchIndex = 0; batchIndex < videoIds.length; batchIndex += batchSize) {
        const batch = videoIds.slice(batchIndex, batchIndex + batchSize);

        console.log(`📦 Processing batch ${Math.floor(batchIndex / batchSize) + 1}/${Math.ceil(videoIds.length / batchSize)} (${batch.length} videos)`);

        // Circuit breaker check
        if (circuitOpen) {
          console.log(`🚫 Circuit breaker open - waiting 60s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          circuitOpen = false;
          consecutiveFailures = 0;
        }

        for (let i = 0; i < batch.length; i++) {
          const videoId = parseInt(batch[i]);
          const globalIndex = batchIndex + i;

          try {
            // Get video from database
            const video = await storage.getYoutubeVideoById(videoId);
            if (!video) {
              errors.push(`Video with ID ${videoId} not found`);
              errorCount++;
              continue;
            }

            // Check if we should retry this video based on mode
            if (mode === 'failed_only') {
              const hasRealTranscript = video.transcript && (
                video.transcript.includes('[REAL TRANSCRIPT') && 
                !video.transcript.includes('[CAPTIONS DETECTED') &&
                !video.transcript.includes('[TRANSCRIPT EXTRACTION FAILED')
              );

              if (hasRealTranscript) {
                console.log(`⏭️ Skipping ${video.title} - already has real transcript`);
                skippedCount++;
                continue;
              }
            }

            console.log(`🔄 Retry ${globalIndex + 1}/${videoIds.length}: ${video.title} (${video.videoId})`);

            // Smart delay calculation
            const baseDelay = 25000; // 25 seconds base
            const batchDelay = batchIndex * 5000; // Additional 5s per batch
            const positionDelay = i * 8000; // 8s between videos in batch
            const errorPenalty = consecutiveFailures * 10000; // 10s per consecutive failure

            const totalDelay = baseDelay + batchDelay + positionDelay + errorPenalty;
            const maxDelay = 180000; // Max 3 minutes
            const finalDelay = Math.min(totalDelay, maxDelay);

            if (globalIndex > 0) {
              console.log(`⏳ Smart delay: ${finalDelay/1000}s (failures: ${consecutiveFailures})...`);
              await new Promise(resolve => setTimeout(resolve, finalDelay));
            }

            // Retry transcript fetch with timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Transcript fetch timeout')), 120000); // 2 minute timeout
            });

            const transcriptPromise = youtubeService.getVideoTranscript(video.videoId);
            const transcriptResult = await Promise.race([transcriptPromise, timeoutPromise]);

            // Enhanced transcript analysis
            let transcript = '';
            let isRealTranscript = false;

            if (transcriptResult && typeof transcriptResult === 'object') {
              if (transcriptResult.success && transcriptResult.transcript) {
                transcript = transcriptResult.transcript;
                isRealTranscript = transcriptResult.extractionMethod !== 'Content Extract';
              } else {
                throw new Error(transcriptResult.error || 'Transcript extraction failed');
              }
            } else if (typeof transcriptResult === 'string') {
              transcript = transcriptResult;
              isRealTranscript = transcript.includes('[REAL TRANSCRIPT') || 
                               transcript.includes('[TRANSCRIPT for') || 
                               transcript.includes('[CAPTIONS DETECTED');
            } else {
              throw new Error('Invalid transcript result format');
            }

            const isContentExtract = transcript.includes('[CAPTIONS DETECTED');
            const isFailed = transcript.includes('[TRANSCRIPT EXTRACTION FAILED');
            const isRateLimit = transcript.includes('captcha') || transcript.includes('too many requests');

            // Update video with transcript
            await storage.updateYoutubeVideoTranscript(videoId, transcript);

            let newStatus = 'completed_with_errors';
            let resultType = 'error';

            if (isRealTranscript) {
              newStatus = 'completed';
              resultType = 'real_transcript';
              successCount++;
              consecutiveFailures = 0; // Reset failure counter
              console.log(`✅ Success: Real transcript extracted for ${video.title}`);
            } else if (isContentExtract) {
              newStatus = 'completed_content_only';
              resultType = 'content_extract';
              consecutiveFailures = 0; // Reset failure counter
              console.log(`⚠️ Partial: Content extract created for ${video.title}`);
            } else {
              consecutiveFailures++;
              if (isRateLimit) {
                console.log(`🚫 Rate limited for ${video.title} - activating circuit breaker`);
                if (consecutiveFailures >= maxConsecutiveFailures) {
                  circuitOpen = true;
                }
              }
              errorCount++;
              console.log(`❌ Failed: Transcript extraction failed for ${video.title}`);
            }

            await db.update(schema.youtubeVideos)
              .set({ 
                importStatus: newStatus,
                errorMessage: isFailed ? 'Retry extraction failed' : null
              })
              .where(eq(schema.youtubeVideos.id, videoId));

            results.push({ 
              videoId: video.videoId, 
              title: video.title, 
              status: isRealTranscript ? 'success' : isContentExtract ? 'partial' : 'failed',
              type: resultType,
              retryAttempt: globalIndex + 1
            });

          } catch (error) {
            console.error(`❌ Error retrying transcript for video ${videoId}:`, error);
            errors.push(`Video ${videoId}: ${error.message}`);
            errorCount++;
            consecutiveFailures++;

            // Activate circuit breaker if too many consecutive failures
            if (consecutiveFailures >= maxConsecutiveFailures) {
              circuitOpen = true;
            }

            // Mark video with error status
            try {
              await db.update(schema.youtubeVideos)
                .set({ 
                  importStatus: 'completed_with_errors',
                  errorMessage: `Retry failed: ${error.message}`
                })
                .where(eq(schema.youtubeVideos.id, videoId));
            } catch (updateError) {
              console.error(`Failed to update error status for video ${videoId}:`, updateError);
            }
          }
        }

        // Inter-batch delay (longer)
        if (batchIndex + batchSize < videoIds.length) {
          const interBatchDelay = 45000 + (Math.random() * 15000); // 45-60 seconds
          console.log(`📦 Inter-batch delay: ${interBatchDelay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, interBatchDelay));
        }
      }

      console.log(`📊 Intelligent transcript retry complete:`);
      console.log(`   - Successfully extracted: ${successCount} real transcripts`);
      console.log(`   - Content extracts: ${results.filter(r => r.type === 'content_extract').length} videos`);
      console.log(`   - Errors: ${errors.length} videos`);
      console.log(`   - Skipped: ${skippedCount} videos`);
      console.log(`   - Circuit breaker activated: ${circuitOpen ? 'Yes' : 'No'}`);

      res.json({
        success: true,
        successCount,
        errorCount,
        skippedCount,
        errors,
        results,
        circuitBreakerActivated: circuitOpen,
        message: `Intelligent retry complete: ${successCount} real transcripts extracted, ${results.filter(r => r.type === 'content_extract').length} content extracts, ${errors.length} errors, ${skippedCount} skipped.`
      });
    } catch (error) {
      console.error("Error in intelligent transcript retry:", error);
      res.status(500).json({ message: "Failed to retry transcripts" });
    }
  });

  app.post('/api/admin/youtube/resolve-channel', async (req, res) => {
    try {
      const { channelIdentifier } = req.body;

      if (!channelIdentifier) {
        return res.status(400).json({ message: 'Channel identifier is required' });
      }

      console.log(`🔍 Resolving YouTube channel: ${channelIdentifier}`);

      // Use YouTube service to get channel details
      const channelDetails = await youtubeService.getChannelDetails(channelIdentifier);

      console.log(`✅ Resolved channel: ${channelDetails.title} (${channelDetails.id})`);

      res.json({
        id: channelDetails.id,
        channelId: channelDetails.id,
        title: channelDetails.title,
        name: channelDetails.title,
        description: channelDetails.description,
        subscribers: channelDetails.subscriberCount,
        videoCount: channelDetails.videoCount
      });

    } catch (error) {
      console.error('❌ Error resolving YouTube channel:', error);
      res.status(400).json({ 
        message: error.message || 'Failed to resolve YouTube channel'
      });
    }
  });

  // YouTube channel routes
  app.get('/api/admin/youtube/channels', async (req, res) => {
    try {
      const channels = await storage.getAdminYoutubeChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching admin YouTube channels:", error);
      res.status(500).json({ message: "Failed to fetch YouTube channels" });
    }
  });

  return httpServer;
}