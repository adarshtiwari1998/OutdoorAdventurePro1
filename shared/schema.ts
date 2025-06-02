import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session table for express-session with connect-pg-simple
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull()
});

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: text("type").notNull(), // activity, blog, product
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  activities: many(activities),
  blogPosts: many(blogPosts),
  products: many(products),
}));

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  price: doublePrecision("price").notNull().default(0),
  categoryId: integer("category_id").references(() => categories.id),
  featured: boolean("featured").default(false).notNull(),
  location: text("location"),
  duration: text("duration"),
  difficulty: text("difficulty"),
  maxGroupSize: integer("max_group_size"),
  includedItems: jsonb("included_items"),
  excludedItems: jsonb("excluded_items"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  category: one(categories, {
    fields: [activities.categoryId],
    references: [categories.id],
  }),
}));

// YouTube channels
export const youtubeChannels = pgTable("youtube_channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  subscribers: integer("subscribers").default(0).notNull(),
  videoCount: integer("video_count").default(0).notNull(),
  lastImport: timestamp("last_import"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const youtubeChannelsRelations = relations(youtubeChannels, ({ many }) => ({
  videos: many(youtubeVideos),
}));

// Slider management for homepage
export const sliders = pgTable("sliders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  backgroundImage: text("background_image").notNull(),
  videoUrl: text("video_url"),
  youtubeUrl: text("youtube_url"),
  videoId: text("video_id"),
  ctaText: text("cta_text").notNull(),
  ctaLink: text("cta_link").notNull(),
  year: text("year"),
  rating: text("rating"),
  tags: text("tags").array(),
  subtitles: text("subtitles").array(),
  isActive: boolean("is_active").default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// YouTube videos
export const youtubeVideos = pgTable("youtube_videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  publishedAt: timestamp("published_at").notNull(),
  channelId: integer("channel_id").references(() => youtubeChannels.id),
  transcript: text("transcript"),
  importStatus: text("import_status").default("pending").notNull(),
  blogPostId: integer("blog_post_id").references(() => blogPosts.id),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const youtubeVideosRelations = relations(youtubeVideos, ({ one }) => ({
  channel: one(youtubeChannels, {
    fields: [youtubeVideos.channelId],
    references: [youtubeChannels.id],
  }),
  blogPost: one(blogPosts, {
    fields: [youtubeVideos.blogPostId],
    references: [blogPosts.id],
  }),
}));

// Blog posts
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  featuredImage: text("featured_image").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  authorId: integer("author_id").references(() => users.id),
  status: text("status").default("draft").notNull(), // draft, published, scheduled
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  category: one(categories, {
    fields: [blogPosts.categoryId],
    references: [categories.id],
  }),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  youtubeVideo: many(youtubeVideos),
}));

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  price: doublePrecision("price").notNull(),
  originalPrice: doublePrecision("original_price"),
  categoryId: integer("category_id").references(() => categories.id),
  featured: boolean("featured").default(false).notNull(),
  shopifyId: text("shopify_id"),
  shopifyData: jsonb("shopify_data"),
  rating: doublePrecision("rating").default(0).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  isSale: boolean("is_sale").default(false).notNull(),
  inventory: integer("inventory").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  authorTitle: text("author_title").notNull(),
  authorAvatar: text("author_avatar").notNull(),
  rating: integer("rating").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  interests: text("interests").default("all").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  shopifyOrderId: text("shopify_order_id"),
  status: text("status").notNull(),
  total: doublePrecision("total").notNull(),
  email: text("email").notNull(),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  total: doublePrecision("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cart
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin stats
export const adminStats = pgTable("admin_stats", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  orders: integer("orders").default(0).notNull(),
  revenue: doublePrecision("revenue").default(0).notNull(),
  pageViews: integer("page_views").default(0).notNull(),
  users: integer("users").default(0).notNull(),
  blogPosts: integer("blog_posts").default(0).notNull(),
  videos: integer("videos").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Travelers Choice
export const travelersChoice = pgTable("travelersChoice", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  image: text("image").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertTravelersChoiceSchema = createInsertSchema(travelersChoice, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  image: (schema) => schema.url("Image must be a valid URL"),
  slug: (schema) => schema.min(2, "Slug must be at least 2 characters"),
  category: (schema) => schema.min(2, "Category must be at least 2 characters"),
});

export type InsertTravelersChoice = z.infer<typeof insertTravelersChoiceSchema>;
export type TravelersChoice = typeof travelersChoice.$inferSelect;

// Validation schemas
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters long"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters long"),
  email: (schema) => schema.email("Must be a valid email address"),
});

export const insertCategorySchema = createInsertSchema(categories, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters long"),
  slug: (schema) => schema.min(2, "Slug must be at least 2 characters long"),
  type: (schema) => schema.refine(val => ['activity', 'blog', 'product'].includes(val), {
    message: "Type must be one of: activity, blog, product"
  }),
});

export const insertActivitySchema = createInsertSchema(activities, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters long"),
  slug: (schema) => schema.min(3, "Slug must be at least 3 characters long"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters long"),
});

export const insertYoutubeChannelSchema = createInsertSchema(youtubeChannels, {
  channelId: (schema) => schema.min(1, "Channel ID is required"),
  name: (schema) => schema.min(1, "Name is required"),
});

export const insertYoutubeVideoSchema = createInsertSchema(youtubeVideos, {
  videoId: (schema) => schema.min(1, "Video ID is required"),
  title: (schema) => schema.min(1, "Title is required"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters long"),
  slug: (schema) => schema.min(3, "Slug must be at least 3 characters long"),
  content: (schema) => schema.min(10, "Content must be at least 10 characters long"),
  excerpt: (schema) => schema.min(5, "Excerpt must be at least 5 characters long"),
});

export const insertProductSchema = createInsertSchema(products, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters long"),
  slug: (schema) => schema.min(3, "Slug must be at least 3 characters long"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters long"),
  price: (schema) => schema.min(0, "Price must be a positive number"),
});

export const insertTestimonialSchema = createInsertSchema(testimonials, {
  content: (schema) => schema.min(10, "Content must be at least 10 characters long"),
  authorName: (schema) => schema.min(2, "Author name must be at least 2 characters long"),
  rating: (schema) => schema.refine(val => val >= 1 && val <= 5, {
    message: "Rating must be between 1 and 5"
  }),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers, {
  fullName: (schema) => schema.min(2, "Full name must be at least 2 characters long"),
  email: (schema) => schema.email("Must be a valid email address"),
});

export const insertSliderSchema = createInsertSchema(sliders, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters long"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters long"),
  backgroundImage: (schema) => schema.url("Background image must be a valid URL"),
  ctaText: (schema) => schema.min(2, "CTA text must be at least 2 characters long"),
  ctaLink: (schema) => schema.min(1, "CTA link is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertYoutubeChannel = z.infer<typeof insertYoutubeChannelSchema>;
export type YoutubeChannel = typeof youtubeChannels.$inferSelect;

export type InsertYoutubeVideo = z.infer<typeof insertYoutubeVideoSchema>;
export type YoutubeVideo = typeof youtubeVideos.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export type InsertSlider = z.infer<typeof insertSliderSchema>;
export type Slider = typeof sliders.$inferSelect;

// Header configuration schema
export const headerConfigs = pgTable("header_configs", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().unique(),
  logoSrc: text("logo_src").notNull(),
  logoText: text("logo_text").notNull(),
  primaryColor: text("primary_color").notNull(),
  bannerText: text("banner_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const headerMenuItems = pgTable("header_menu_items", {
  id: serial("id").primaryKey(),
  headerConfigId: integer("header_config_id").references(() => headerConfigs.id, { onDelete: 'cascade' }).notNull(),
  label: text("label").notNull(),
  path: text("path").notNull(),
  order: integer("order").notNull(),
  hasMegaMenu: boolean("has_mega_menu").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const megaMenuCategories = pgTable("mega_menu_categories", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").references(() => headerMenuItems.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const megaMenuItems = pgTable("mega_menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => megaMenuCategories.id, { onDelete: 'cascade' }).notNull(),
  label: text("label").notNull(),
  path: text("path").notNull(),
  order: integer("order").notNull(),
  featuredItem: boolean("featured_item").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const headerConfigsRelations = relations(headerConfigs, ({ many }) => ({
  menuItems: many(headerMenuItems)
}));

export const headerMenuItemsRelations = relations(headerMenuItems, ({ one, many }) => ({
  headerConfig: one(headerConfigs, {
    fields: [headerMenuItems.headerConfigId],
    references: [headerConfigs.id]
  }),
  megaMenuCategories: many(megaMenuCategories)
}));

export const megaMenuCategoriesRelations = relations(megaMenuCategories, ({ one, many }) => ({
  menuItem: one(headerMenuItems, {
    fields: [megaMenuCategories.menuItemId],
    references: [headerMenuItems.id]
  }),
  items: many(megaMenuItems)
}));

export const megaMenuItemsRelations = relations(megaMenuItems, ({ one }) => ({
  category: one(megaMenuCategories, {
    fields: [megaMenuItems.categoryId],
    references: [megaMenuCategories.id]
  })
}));

export const adminDashboardAssets = pgTable("admin_dashboard_assets", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'logo' or 'favicon'
  name: text("name").notNull(),
  url: text("url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertHeaderConfigSchema = createInsertSchema(headerConfigs, {
  category: (schema) => schema.min(2, "Category must be at least 2 characters"),
  logoText: (schema) => schema.min(2, "Logo text must be at least 2 characters"),
  logoSrc: (schema) => schema.url("Logo source must be a valid URL")
});

export const insertHeaderMenuItemSchema = createInsertSchema(headerMenuItems, {
  label: (schema) => schema.min(1, "Label must not be empty"),
  path: (schema) => schema.min(1, "Path must not be empty")
});

export const insertMegaMenuCategorySchema = createInsertSchema(megaMenuCategories, {
  title: (schema) => schema.min(1, "Title must not be empty")
});

export const insertMegaMenuItemSchema = createInsertSchema(megaMenuItems, {
  label: (schema) => schema.min(1, "Label must not be empty"),
  path: (schema) => schema.min(1, "Path must not be empty")
});

export type InsertHeaderConfig = z.infer<typeof insertHeaderConfigSchema>;
export type HeaderConfig = typeof headerConfigs.$inferSelect;
export type InsertHeaderMenuItem = z.infer<typeof insertHeaderMenuItemSchema>;
export type HeaderMenuItem = typeof headerMenuItems.$inferSelect;
export type InsertMegaMenuCategory = z.infer<typeof insertMegaMenuCategorySchema>;
export type MegaMenuCategory = typeof megaMenuCategories.$inferSelect;
export type InsertMegaMenuItem = z.infer<typeof insertMegaMenuItemSchema>;
export type MegaMenuItem = typeof megaMenuItems.$inferSelect;

// Sidebar configurations for landing pages
export const sidebarConfigs = pgTable("sidebar_configs", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sidebarItems = pgTable("sidebar_items", {
  id: serial("id").primaryKey(),
  sidebarId: integer("sidebar_id").references(() => sidebarConfigs.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkText: text("link_text"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sidebarConfigsRelations = relations(sidebarConfigs, ({ many }) => ({
  items: many(sidebarItems)
}));

export const sidebarItemsRelations = relations(sidebarItems, ({ one }) => ({
  sidebar: one(sidebarConfigs, { fields: [sidebarItems.sidebarId], references: [sidebarConfigs.id] })
}));

export const insertSidebarConfigSchema = createInsertSchema(sidebarConfigs, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  category: (schema) => schema.min(2, "Category must be at least 2 characters"),
});

export const insertSidebarItemSchema = createInsertSchema(sidebarItems, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  content: (schema) => schema.min(5, "Content must be at least 5 characters"),
});

export type InsertSidebarConfig = z.infer<typeof insertSidebarConfigSchema>;
export type SidebarConfig = typeof sidebarConfigs.$inferSelect;
export type InsertSidebarItem = z.infer<typeof insertSidebarItemSchema>;
export type SidebarItem = typeof sidebarItems.$inferSelect;

// Tips and Ideas 
export const tipsAndIdeas = pgTable("tips_and_ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // hiking, camping, fishing etc
  parentcategory: text("parentcategory"), // For hierarchical organization
  difficultylevel: text("difficultylevel"), // beginner, intermediate, expert
  seasonality: text("seasonality").notNull(), // spring, summer, fall, winter
  estimatedtime: text("estimatedtime").notNull(),
  image: text("image").notNull(),
  icontype: text("icontype").notNull(), // For custom icon display
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const insertTipsAndIdeasSchema = createInsertSchema(tipsAndIdeas, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  category: (schema) => schema.min(2, "Category must be at least 2 characters"),
});

export type InsertTipsAndIdeas = z.infer<typeof insertTipsAndIdeasSchema>;
export type TipsAndIdeas = typeof tipsAndIdeas.$inferSelect;

// Favorite Destinations
export const favoriteDestinations = pgTable("favorite_destinations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  image: text("image").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  country: text("country").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFavoriteDestinationSchema = createInsertSchema(favoriteDestinations, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  image: (schema) => schema.url("Image must be a valid URL"),
});

export type InsertFavoriteDestination = z.infer<typeof insertFavoriteDestinationSchema>;
export type FavoriteDestination = typeof favoriteDestinations.$inferSelect;

// Category Styles
export const categoryStyles = pgTable("category_styles", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().unique(),
  primaryColor: text("primary_color").notNull().default("#3B82F6"),
  primaryColorHSL: text("primary_color_hsl"),
  accentColor: text("accent_color"),
  buttonRadius: text("button_radius"),
  // Font family preferences
  headingFont: text("heading_font"),
  bodyFont: text("body_font"),
  navigationFont: text("navigation_font"),
  buttonFont: text("button_font"),
  displayFont: text("display_font"), // For special display text like hero headers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCategoryStyleSchema = createInsertSchema(categoryStyles, {
  category: (schema) => schema.min(2, "Category must be at least 2 characters"),
  primaryColor: (schema) => schema.min(4, "Primary color must be a valid hex color"),
});

export type InsertCategoryStyle = z.infer<typeof insertCategoryStyleSchema>;
export type CategoryStyle = typeof categoryStyles.$inferSelect;

export const wordpressCredentials = pgTable("wordpress_credentials", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});