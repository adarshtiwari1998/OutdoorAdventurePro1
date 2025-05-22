import { db, pool } from "./index";
import * as schema from "@shared/schema";
import { createSlug } from "../server/utils/slugify";
import { eq, sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

// For password hashing
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Define types for the menu items and mega menu structure
type MegaMenuItem = {
  label: string;
  path: string;
  order: number;
  featuredItem?: boolean;
};

type MegaMenuCategory = {
  title: string;
  order: number;
  items: MegaMenuItem[];
};

type MenuItem = {
  label: string;
  path: string;
  order: number;
  hasMegaMenu?: boolean;
  megaMenuCategories?: MegaMenuCategory[];
};

async function seed() {
  try {
    console.log("Starting database seeding...");
    await pool.query('SELECT 1'); // Test connection

    // Create tables
    console.log("Creating tables if they don't exist...");
    await db.execute(sql`

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP WITH TIME ZONE NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      type TEXT NOT NULL, -- activity, blog, product
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL DEFAULT 0,
      category_id INTEGER REFERENCES categories(id),
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      location TEXT,
      duration TEXT,
      difficulty TEXT,
      max_group_size INTEGER,
      included_items JSONB,
      excluded_items JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS youtube_channels (
      id SERIAL PRIMARY KEY,
      channel_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      subscribers INTEGER NOT NULL DEFAULT 0,
      video_count INTEGER NOT NULL DEFAULT 0,
      last_import TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sliders (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      background_image TEXT NOT NULL,
      video_url TEXT,
      youtube_url TEXT,
      video_id TEXT,
      cta_text TEXT NOT NULL,
      cta_link TEXT NOT NULL,
      year TEXT,
      rating TEXT,
      tags TEXT[],
      subtitles TEXT[],
      is_active BOOLEAN DEFAULT TRUE,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      featured_image TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      author_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'draft', -- draft, published, scheduled
      published_at TIMESTAMP,
      scheduled_at TIMESTAMP,
      tags JSONB DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS youtube_videos (
      id SERIAL PRIMARY KEY,
      video_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      published_at TIMESTAMP NOT NULL,
      channel_id INTEGER REFERENCES youtube_channels(id),
      transcript TEXT,
      import_status TEXT NOT NULL DEFAULT 'pending',
      blog_post_id INTEGER REFERENCES blog_posts(id),
      error_message TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      original_price DOUBLE PRECISION,
      category_id INTEGER REFERENCES categories(id),
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      shopify_id TEXT,
      shopify_data JSONB,
      rating DOUBLE PRECISION NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      is_new BOOLEAN NOT NULL DEFAULT FALSE,
      is_sale BOOLEAN NOT NULL DEFAULT FALSE,
      inventory INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_title TEXT NOT NULL,
      author_avatar TEXT NOT NULL,
      rating INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      interests TEXT DEFAULT 'all' NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      shopify_order_id TEXT,
      status TEXT NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      email TEXT NOT NULL,
      shipping_address JSONB,
      billing_address JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      quantity INTEGER NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS carts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      session_id TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      cart_id INTEGER REFERENCES carts(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS admin_stats (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP NOT NULL,
      orders INTEGER NOT NULL DEFAULT 0,
      revenue DOUBLE PRECISION NOT NULL DEFAULT 0,
      page_views INTEGER NOT NULL DEFAULT 0,
      users INTEGER NOT NULL DEFAULT 0,
      blog_posts INTEGER NOT NULL DEFAULT 0,
      videos INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS header_configs (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL UNIQUE,
      logo_src TEXT NOT NULL,
      logo_text TEXT NOT NULL,
      primary_color TEXT NOT NULL,
      banner_text TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS header_menu_items (
      id SERIAL PRIMARY KEY,
      header_config_id INTEGER REFERENCES header_configs(id) ON DELETE CASCADE NOT NULL,
      label TEXT NOT NULL,
      path TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      has_mega_menu BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS mega_menu_categories (
      id SERIAL PRIMARY KEY,
      menu_item_id INTEGER REFERENCES header_menu_items(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS mega_menu_items (
      id SERIAL PRIMARY KEY,
      category_id INTEGER REFERENCES mega_menu_categories(id) ON DELETE CASCADE NOT NULL,
      label TEXT NOT NULL,
      path TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      featured_item BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sidebar_configs (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sidebar_items (
      id SERIAL PRIMARY KEY,
      sidebar_id INTEGER REFERENCES sidebar_configs(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      link_url TEXT,
      link_text TEXT,
      "order" INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS category_styles (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL UNIQUE,
      primary_color TEXT NOT NULL DEFAULT '#3B82F6',
      primary_color_hsl TEXT,
      accent_color TEXT,
      button_radius TEXT,
      heading_font TEXT,
      body_font TEXT,
      navigation_font TEXT,
      button_font TEXT,
      display_font TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorite_destinations (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    description TEXT NOT NULL,
    "order" INTEGER NOT NULL
);
  `);
    console.log("Seeding database...");

    // Seed admin user
    const existingUsers = await db.query.users.findMany({
      where: eq(schema.users.email, "admin@example.com"),
    });

    if (existingUsers.length === 0) {
      console.log("Creating admin user...");
      const hashedPassword = await hashPassword("password123");
      await db.insert(schema.users).values({
        username: "admin",
        password: hashedPassword,
        email: "admin@example.com",
        fullName: "Admin User",
        isAdmin: true,
        isApproved: true,
      });
    }

    // Seed categories
    const categoryTypes = ["activity", "blog", "product"];
    const categoryNames = {
      activity: ["Hiking", "Fishing", "Camping", "Cruising", "4x4 Adventures"],
      blog: ["Outdoor Tips", "Gear Reviews", "Trip Reports", "Adventure Stories", "Conservation"],
      product: ["Gear", "Clothing", "Footwear", "Equipment", "Accessories"],
    };

    for (const type of categoryTypes) {
      for (const name of categoryNames[type as keyof typeof categoryNames]) {
        const slug = createSlug(name);
        const existingCategory = await db.query.categories.findFirst({
          where: eq(schema.categories.slug, slug),
        });

        if (!existingCategory) {
          console.log(`Creating ${type} category: ${name}`);
          await db.insert(schema.categories).values({
            name,
            slug,
            description: `${name} ${type} category`,
            type,
          });
        }
      }
    }

    // Get category IDs for referencing
    const hikingCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, "hiking"),
    });

    const fishingCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, "fishing"),
    });

    const campingCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, "camping"),
    });

    const outdoorTipsCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, "outdoor-tips"),
    });

    const gearCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, "gear"),
    });

    // Retrieve the "blog" category
    const blogCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.type, "blog"),
    });

    // Seed activities
    const activities = [
      {
        title: "Appalachian Trail Hike",
        description: "Experience the beauty of the Appalachian Trail with our guided hiking tour. Perfect for adventurers of all levels.",
        image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        price: 149.99,
        categoryId: hikingCategory?.id,
        featured: true,
        location: "Appalachian Mountains",
        duration: "1 day",
        difficulty: "Moderate",
      },
      {
        title: "Rocky Mountain Fishing Trip",
        description: "Join us for a day of fishing in the beautiful Rocky Mountains. All equipment provided.",
        image: "https://images.unsplash.com/photo-1516399662004-ee8259d135ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        price: 129.99,
        categoryId: fishingCategory?.id,
        featured: true,
        location: "Rocky Mountains",
        duration: "1 day",
        difficulty: "Easy",
      },
      {
        title: "Yellowstone Camping Adventure",
        description: "A three-day camping adventure in the heart of Yellowstone National Park.",
        image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        price: 299.99,
        categoryId: campingCategory?.id,
        featured: true,
        location: "Yellowstone National Park",
        duration: "3 days",
        difficulty: "Moderate",
      },
    ];

    for (const activity of activities) {
      const existingActivity = await db.query.activities.findFirst({
        where: eq(schema.activities.title, activity.title),
      });

      if (!existingActivity) {
        console.log(`Creating activity: ${activity.title}`);
        await db.insert(schema.activities).values({
          ...activity,
          slug: createSlug(activity.title),
        });
      }
    }

    // Seed testimonials
    const testimonials = [
      {
        content: "The hiking tour was amazing! Our guide was knowledgeable and made the experience unforgettable.",
        authorName: "John Smith",
        authorTitle: "Avid Hiker",
        authorAvatar: "https://randomuser.me/api/portraits/men/1.jpg",
        rating: 5,
      },
      {
        content: "I had never been fishing before, but the instructors made it easy and fun. Caught my first fish!",
        authorName: "Sarah Johnson",
        authorTitle: "First-time Angler",
        authorAvatar: "https://randomuser.me/api/portraits/women/2.jpg",
        rating: 5,
      },
      {
        content: "The camping trip was well organized and the equipment provided was top-notch. Will definitely book again!",
        authorName: "Michael Brown",
        authorTitle: "Weekend Adventurer",
        authorAvatar: "https://randomuser.me/api/portraits/men/3.jpg",
        rating: 4,
      },
    ];

    for (const testimonial of testimonials) {
      const existingTestimonial = await db.query.testimonials.findFirst({
        where: eq(schema.testimonials.authorName, testimonial.authorName),
      });

      if (!existingTestimonial) {
        console.log(`Creating testimonial from: ${testimonial.authorName}`);
        await db.insert(schema.testimonials).values(testimonial);
      }
    }

    // Seed products
    const products = [
      {
        title: "Wilderness Explorer Backpack",
        description: "A durable, waterproof backpack perfect for all your outdoor adventures.",
        image: "https://images.unsplash.com/photo-1622560480605-d83c951d5516?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        price: 129.99,
        originalPrice: 149.99,
        categoryId: gearCategory?.id,
        featured: true,
        rating: 4.8,
        reviewCount: 42,
        isNew: true,
        isSale: true,
      },
      {
        title: "Pro Fishing Rod",
        description: "Professional-grade fishing rod for serious anglers.",
        image: "https://images.unsplash.com/photo-1612387625080-83eedfc5339a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        price: 89.99,
        originalPrice: 99.99,
        categoryId: gearCategory?.id,
        featured: true,
        rating: 4.5,
        reviewCount: 28,
        isNew: false,
        isSale: true,
      },
      {
        title: "Deluxe Camping Tent",
        description: "Spacious 4-person tent with easy setup and weather-resistant materials.",
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        price: 199.99,
        originalPrice: null,
        categoryId: gearCategory?.id,
        featured: true,
        rating: 4.9,
        reviewCount: 56,
        isNew: true,
        isSale: false,
      },
      {
        title: "Hiking Boots",
        description: "Waterproof hiking boots with excellent ankle support and grip.",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        price: 149.99,
        originalPrice: 179.99,
        categoryId: gearCategory?.id,
        featured: true,
        rating: 4.7,
        reviewCount: 31,
        isNew: false,
        isSale: true,
      },
    ];

    for (const product of products) {
      const existingProduct = await db.query.products.findFirst({
        where: eq(schema.products.title, product.title),
      });

      if (!existingProduct) {
        console.log(`Creating product: ${product.title}`);
        await db.insert(schema.products).values({
          ...product,
          slug: createSlug(product.title),
        });
      }
    }

    // Seed blog posts
    const blogPosts = [
      {
        title: "10 Essential Tips for Hiking Beginners",
        content: `
# 10 Essential Tips for Hiking Beginners

Hiking is a wonderful way to connect with nature, get exercise, and clear your mind. But if you're new to hiking, there are some important things to know before hitting the trails. Here are 10 essential tips for beginners:

## 1. Start Small and Build Up

Choose shorter, easier trails for your first few hikes. As your fitness and confidence improve, gradually increase the length and difficulty of your hikes.

## 2. Wear Proper Footwear

Good hiking boots or trail shoes with ankle support and proper traction are essential, especially on uneven terrain.

## 3. Dress in Layers

Weather conditions can change quickly in the outdoors. Dressing in layers allows you to adjust to changing temperatures and conditions.

## 4. Pack the Ten Essentials

Always bring:
- Navigation (map, compass, GPS)
- Sun protection (sunglasses, sunscreen, hat)
- Insulation (extra clothing)
- Illumination (headlamp or flashlight)
- First-aid supplies
- Fire (matches, lighter, fire starters)
- Repair kit and tools
- Nutrition (extra food)
- Hydration (extra water)
- Emergency shelter

## 5. Stay Hydrated

Bring plenty of water, more than you think you'll need. A good rule of thumb is about half a liter per hour of moderate activity in moderate temperatures.

## 6. Tell Someone Your Plans

Always let someone know where you're going and when you expect to return.

## 7. Check the Weather

Always check the forecast before heading out and be prepared for changing conditions.

## 8. Leave No Trace

Respect nature by packing out all trash, staying on designated trails, and leaving what you find.

## 9. Know Your Limits

Don't push yourself too hard, especially when starting out. It's better to end a hike feeling like you could have gone farther than to get into trouble on the trail.

## 10. Bring a Friend

Hiking with a companion is not only more fun but also safer, especially for beginners.

With these tips in mind, you're ready to start your hiking journey. Remember, the goal is to enjoy the experience and connect with nature. Happy trails!
        `,
        excerpt: "New to hiking? Learn these essential tips to ensure your first hiking adventures are safe, enjoyable, and memorable.",
        featuredImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        categoryId: blogCategory.id,
        status: "published",
        publishedAt: new Date(),
        tags: JSON.stringify(["hiking", "beginners", "outdoor tips", "safety", "gear"]),
      },
      {
        title: "The Ultimate Guide to Choosing Fishing Gear",
        content: `
# The Ultimate Guide to Choosing Fishing Gear

Selecting the right fishing gear can make the difference between a frustrating day on the water and an amazing one. This guide will help beginners navigate the sometimes overwhelming world of fishing equipment.

## Rods

### Consider the following factors:
- **Length**: Longer rods (7-12 feet) cast farther, while shorter rods provide more control.
- **Power**: This refers to how much weight the rod can handle. Options range from ultra-light to extra-heavy.
- **Action**: This describes how much the rod bends when pressure is applied. Fast action bends mainly at the tip, while slow action bends throughout the rod.

Choose based on the type of fish you're targeting and where you'll be fishing.

## Reels

### The main types include:
- **Spinning Reels**: Easy to use and great for beginners.
- **Baitcasting Reels**: Offer more precision but have a learning curve.
- **Spincast Reels**: The simplest option, ideal for children and complete beginners.

Match your reel to your rod for balanced performance.

## Line

### Popular options include:
- **Monofilament**: Versatile, affordable, and forgiving.
- **Fluorocarbon**: Less visible underwater but more expensive.
- **Braided**: Super strong with no stretch, good for deep water or heavy cover.

The line weight should match your rod and reel ratings and the size of fish you're targeting.

## Bait and Lures

Your choice depends on the fish species and conditions. Some basics to have:
- Live bait (worms, minnows)
- Plastic worms
- Spinners
- Crankbaits
- Topwater lures

## Accessories

Don't forget these essentials:
- Tackle box
- Extra hooks and weights
- Pliers or fishing tool
- Line cutter
- First aid kit
- Polarized sunglasses
- Sun protection

## Getting Started Package

If you're just starting out, consider buying a combo package that includes a matched rod and reel. Add a simple tackle kit and you're ready to go.

Remember, expensive doesn't always mean better, especially for beginners. Start with basic, quality gear and upgrade as your skills and interests develop.

Happy fishing!
        `,
        excerpt: "Confused about what fishing gear to buy? This comprehensive guide breaks down everything from rods and reels to lines and lures for beginners.",
        featuredImage: "https://images.unsplash.com/photo-1516399662004-ee8259d135ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        categoryId: blogCategory.id,
        status: "published",
        publishedAt: new Date(Date.now() - 86400000), // Yesterday
        tags: JSON.stringify(["fishing", "gear guide", "beginners", "equipment"]),
      },
    ];

    for (const post of blogPosts) {
      const existingPost = await db.query.blogPosts.findFirst({
        where: eq(schema.blogPosts.title, post.title),
      });

      if (!existingPost) {
        console.log(`Creating blog post: ${post.title}`);
        await db.insert(schema.blogPosts).values({
          ...post,
          slug: createSlug(post.title),
          authorId: 1, // Admin user
        });
      }
    }

    // Seed header configurations
    const headerConfigs = [
      {
        category: "home",
        logoSrc: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
        logoText: "Outdoor Enthusiast",
        primaryColor: "#3B82F6", // Blue-500
        bannerText: "Your ultimate guide to outdoor adventures and experiences"
      },
      {
        category: "hiking",
        logoSrc: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
        logoText: "Hiking Trails",
        primaryColor: "#F59E0B", // Amber-500
        bannerText: "Discover breathtaking hiking trails and essential gear guides"
      },
      {
        category: "fishing",
        logoSrc: "https://images.unsplash.com/photo-1516399662004-ee8259d135ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
        logoText: "Fishing Expeditions",
        primaryColor: "#06B6D4", // Cyan-500
        bannerText: "Find the best fishing spots and gear for your next expedition"
      },
      {
        category: "camping",
        logoSrc: "https://images.unsplash.com/photo-1517824806704-9040b037703b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
        logoText: "Camping Guides",
        primaryColor: "#F97316", // Orange-500
        bannerText: "Everything you need for perfect camping adventures"
      },
      {
        category: "outdoors",
        logoSrc: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
        logoText: "Outdoor Adventures",
        primaryColor: "#10B981", // Green-500
        bannerText: "Explore the great outdoors with our comprehensive guides and gear"
      },
      {
        category: "cruising",
        logoSrc: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
        logoText: "Cruising Adventures",
        primaryColor: "#3B82F6", // Blue-500
        bannerText: "Discover the best cruise experiences around the world"
      },
      {
        category: "four-x-four",
        logoSrc: "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
        logoText: "4x4 Adventures",
        primaryColor: "#EF4444", // Red-500
        bannerText: "Explore off-road adventures and find the best 4x4 gear"
      }
    ];

    // Menu items for each category with mega menu configuration
    const menuItems: Record<string, MenuItem[]> = {
      home: [
        { 
          label: "Destinations", 
          path: "/destinations", 
          order: 0,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "Popular Activities",
              order: 0,
              items: [
                { label: "Hiking", path: "/hiking", order: 0, featuredItem: true },
                { label: "Camping", path: "/camping", order: 1, featuredItem: true },
                { label: "Fishing", path: "/fishing", order: 2, featuredItem: true },
                { label: "Cruising", path: "/cruising", order: 3 },
                { label: "4x4 Adventures", path: "/four-x-four", order: 4 }
              ]
            },
            {
              title: "By Region",
              order: 1,
              items: [
                { label: "Mountain Adventures", path: "/destinations/mountains", order: 0 },
                { label: "Coastal Getaways", path: "/destinations/coastal", order: 1 },
                { label: "Desert Exploration", path: "/destinations/desert", order: 2 },
                { label: "Forest Retreats", path: "/destinations/forest", order: 3 },
                { label: "Lake Destinations", path: "/destinations/lakes", order: 4 }
              ]
            },
            {
              title: "Seasonal",
              order: 2,
              items: [
                { label: "Summer Escapes", path: "/destinations/summer", order: 0 },
                { label: "Fall Adventures", path: "/destinations/fall", order: 1 },
                { label: "Winter Experiences", path: "/destinations/winter", order: 2 },
                { label: "Spring Getaways", path: "/destinations/spring", order: 3 }
              ]
            }
          ]
        },
        { 
          label: "Gear", 
          path: "/shop", 
          order: 1,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "Activity Gear",
              order: 0,
              items: [
                { label: "Hiking Equipment", path: "/shop?category=hiking-gear", order: 0 },
                { label: "Camping Essentials", path: "/shop?category=camping-gear", order: 1 },
                { label: "Fishing Tackle", path: "/shop?category=fishing-gear", order: 2 },
                { label: "4x4 Accessories", path: "/shop?category=4x4-gear", order: 3 },
                { label: "Cruising Supplies", path: "/shop?category=cruising-gear", order: 4 }
              ]
            },
            {
              title: "Clothing",
              order: 1,
              items: [
                { label: "Outdoor Apparel", path: "/shop?category=outdoor-apparel", order: 0 },
                { label: "Footwear", path: "/shop?category=footwear", order: 1 },
                { label: "Weather Protection", path: "/shop?category=weather-protection", order: 2 },
                { label: "Accessories", path: "/shop?category=clothing-accessories", order: 3 }
              ]
            },
            {
              title: "Featured",
              order: 2,
              items: [
                { label: "New Arrivals", path: "/shop?filter=new", order: 0, featuredItem: true },
                { label: "Bestsellers", path: "/shop?filter=bestsellers", order: 1, featuredItem: true },
                { label: "Deals & Offers", path: "/shop?filter=deals", order: 2, featuredItem: true },
                { label: "Gift Ideas", path: "/shop?filter=gifts", order: 3 }
              ]
            }
          ]
        },
        { 
          label: "Blog", 
          path: "/blog", 
          order: 2,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "Topics",
              order: 0,
              items: [
                { label: "Outdoor Skills", path: "/blog?category=skills", order: 0 },
                { label: "Gear Reviews", path: "/blog?category=reviews", order: 1 },
                { label: "Adventure Stories", path: "/blog?category=stories", order: 2 },
                { label: "Expert Advice", path: "/blog?category=advice", order: 3 }
              ]
            },
            {
              title: "Activity Guides",
              order: 1,
              items: [
                { label: "Hiking Guides", path: "/blog?activity=hiking", order: 0 },
                { label: "Camping Tips", path: "/blog?activity=camping", order: 1 },
                { label: "Fishing Techniques", path: "/blog?activity=fishing", order: 2 },
                { label: "4x4 Adventures", path: "/blog?activity=4x4", order: 3 }
              ]
            },
            {
              title: "Featured",
              order: 2,
              items: [
                { label: "Editor's Picks", path: "/blog?featured=editors", order: 0, featuredItem: true },
                { label: "Top Stories", path: "/blog?featured=top", order: 1, featuredItem: true },
                { label: "Latest Posts", path: "/blog?sort=latest", order: 2 },
                { label: "Contributors", path: "/blog/contributors", order: 3 }
              ]
            }
          ]
        },
        { label: "Community", path: "/community", order: 3 },
        { label: "About Us", path: "/about", order: 4 }
      ],
      hiking: [
        { 
          label: "Trail Finder", 
          path: "/hiking/trail-finder", 
          order: 0,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "By Region",
              order: 0,
              items: [
                { label: "Western Trails", path: "/hiking/region/western", order: 0 },
                { label: "Eastern Trails", path: "/hiking/region/eastern", order: 1 },
                { label: "Southern Trails", path: "/hiking/region/southern", order: 2 },
                { label: "Northern Trails", path: "/hiking/region/northern", order: 3 },
                { label: "International", path: "/hiking/region/international", order: 4 }
              ]
            },
            {
              title: "By Difficulty",
              order: 1,
              items: [
                { label: "Easy Trails", path: "/hiking/difficulty/easy", order: 0 },
                { label: "Moderate Trails", path: "/hiking/difficulty/moderate", order: 1 },
                { label: "Challenging Trails", path: "/hiking/difficulty/challenging", order: 2 },
                { label: "Expert Trails", path: "/hiking/difficulty/expert", order: 3 }
              ]
            },
            {
              title: "By Features",
              order: 2,
              items: [
                { label: "Waterfalls", path: "/hiking/feature/waterfalls", order: 0 },
                { label: "Mountain Views", path: "/hiking/feature/mountain-views", order: 1 },
                { label: "Forest Trails", path: "/hiking/feature/forest", order: 2 },
                { label: "Coastal Trails", path: "/hiking/feature/coastal", order: 3 }
              ]
            }
          ]
        },
        { label: "Gear Guide", path: "/hiking/gear", order: 1 },
        { label: "Safety Tips", path: "/hiking/safety", order: 2 },
        { label: "Community", path: "/hiking/community", order: 3 }
      ],
      fishing: [
        { 
          label: "Fishing Spots", 
          path: "/fishing/spots", 
          order: 0,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "By Water Type",
              order: 0,
              items: [
                { label: "Freshwater", path: "/fishing/spots/freshwater", order: 0 },
                { label: "Saltwater", path: "/fishing/spots/saltwater", order: 1 },
                { label: "Lakes & Reservoirs", path: "/fishing/spots/lakes", order: 2 },
                { label: "Rivers & Streams", path: "/fishing/spots/rivers", order: 3 }
              ]
            },
            {
              title: "By Region",
              order: 1,
              items: [
                { label: "Northeast", path: "/fishing/spots/northeast", order: 0 },
                { label: "Southeast", path: "/fishing/spots/southeast", order: 1 },
                { label: "Midwest", path: "/fishing/spots/midwest", order: 2 },
                { label: "West Coast", path: "/fishing/spots/west-coast", order: 3 }
              ]
            },
            {
              title: "By Season",
              order: 2,
              items: [
                { label: "Spring Fishing", path: "/fishing/spots/spring", order: 0 },
                { label: "Summer Fishing", path: "/fishing/spots/summer", order: 1 },
                { label: "Fall Fishing", path: "/fishing/spots/fall", order: 2 },
                { label: "Winter Fishing", path: "/fishing/spots/winter", order: 3 }
              ]
            }
          ]
        },
        { 
          label: "Techniques", 
          path: "/fishing/techniques", 
          order: 1,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "Casting Methods",
              order: 0,
              items: [
                { label: "Fly Fishing", path: "/fishing/techniques/fly", order: 0 },
                { label: "Baitcasting", path: "/fishing/techniques/baitcasting", order: 1 },
                { label: "Spinning", path: "/fishing/techniques/spinning", order: 2 },
                { label: "Trolling", path: "/fishing/techniques/trolling", order: 3 }
              ]
            },
            {
              title: "Target Species",
              order: 1,
              items: [
                { label: "Bass Fishing", path: "/fishing/techniques/bass", order: 0 },
                { label: "Trout Fishing", path: "/fishing/techniques/trout", order: 1 },
                { label: "Catfish Techniques", path: "/fishing/techniques/catfish", order: 2 },
                { label: "Salmon Fishing", path: "/fishing/techniques/salmon", order: 3 }
              ]
            },
            {
              title: "Skill Level",
              order: 2,
              items: [
                { label: "Beginner Tips", path: "/fishing/techniques/beginner", order: 0 },
                { label: "Intermediate", path: "/fishing/techniques/intermediate", order: 1 },
                { label: "Advanced Tactics", path: "/fishing/techniques/advanced", order: 2 },
                { label: "Pro Techniques", path: "/fishing/techniques/pro", order: 3 }
              ]
            }
          ]
        },
        { 
          label: "Equipment", 
          path: "/shop?category=fishing", 
          order: 2,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "Rods & Reels",
              order: 0,
              items: [
                { label: "Fishing Rods", path: "/shop?category=fishing&type=rods", order: 0 },
                { label: "Fishing Reels", path: "/shop?category=fishing&type=reels", order: 1 },
                { label: "Rod & Reel Combos", path: "/shop?category=fishing&type=combos", order: 2 },
                { label: "Fly Fishing Gear", path: "/shop?category=fishing&type=fly", order: 3 }
              ]
            },
            {
              title: "Bait & Lures",
              order: 1,
              items: [
                { label: "Live Bait", path: "/shop?category=fishing&type=live-bait", order: 0 },
                { label: "Artificial Lures", path: "/shop?category=fishing&type=lures", order: 1 },
                { label: "Soft Baits", path: "/shop?category=fishing&type=soft-baits", order: 2 },
                { label: "Flies", path: "/shop?category=fishing&type=flies", order: 3 }
              ]
            },
            {
              title: "Accessories",
              order: 2,
              items: [
                { label: "Tackle Boxes", path: "/shop?category=fishing&type=tackle-boxes", order: 0 },
                { label: "Fishing Line", path: "/shop?category=fishing&type=line", order: 1 },
                { label: "Hooks & Weights", path: "/shop?category=fishing&type=hooks", order: 2 },
                { label: "Fishing Electronics", path: "/shop?category=fishing&type=electronics", order: 3 }
              ]
            }
          ]
        },
        { 
          label: "Catches", 
          path: "/fishing/catches", 
          order: 3,
          hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "Trophy Catches",
              order: 0,
              items: [
                { label: "Record Catches", path: "/fishing/catches/records", order: 0 },
                { label: "Trophy Gallery", path: "/fishing/catches/gallery", order: 1 },
                { label: "Featured Catches", path: "/fishing/catches/featured", order: 2 },
                { label: "Competition Winners", path: "/fishing/catches/competition", order: 3 }
              ]
            },
            {
              title: "By Species",
              order: 1,
              items: [
                { label: "Bass Catches", path: "/fishing/catches/bass", order: 0 },
                { label: "Trout & Salmon", path: "/fishing/catches/trout-salmon", order: 1 },
                { label: "Catfish", path: "/fishing/catches/catfish", order: 2 },
                { label: "Saltwater Trophies", path: "/fishing/catches/saltwater", order: 3 }
              ]
            },
            {
              title: "User Submissions",
              order: 2,
              items: [
                { label: "Submit Your Catch", path: "/fishing/catches/submit", order: 0 },
                { label: "Recent Submissions", path: "/fishing/catches/recent", order: 1 },
                { label: "Fishing Stories", path: "/fishing/catches/stories", order: 2 },
                { label: "Catch & Release", path: "/fishing/catches/catch-release", order: 3 }
              ]
            }
          ]
        }
      ],
      camping: [
        { label: "Campgrounds", path: "/camping/grounds", order: 0, hasMegaMenu: true,
          megaMenuCategories: [
            {
              title: "By Region",
              order: 0,
              items: [
                { label: "Western Campgrounds", path: "/camping/grounds/western", order: 0 },
                { label: "Eastern Campgrounds", path: "/camping/grounds/eastern", order: 1 },
                { label: "National Parks", path: "/camping/grounds/national-parks", order: 2 },
                { label: "State Parks", path: "/camping/grounds/state-parks", order: 3 }
              ]
            },
            {
              title: "By Type",
              order: 1,
              items: [
                { label: "RV Camping", path: "/camping/grounds/rv", order: 0 },
                { label: "Tent Camping", path: "/camping/grounds/tent", order: 1 },
                { label: "Cabin Stays", path: "/camping/grounds/cabins", order: 2 },
                { label: "Glamping", path: "/camping/grounds/glamping", order: 3 }
              ]
            },
            {
              title: "By Features",
              order: 2,
              items: [
                { label: "Waterfront", path: "/camping/grounds/waterfront", order: 0 },
                { label: "Pet-Friendly", path: "/camping/grounds/pet-friendly", order: 1 },
                { label: "Family-Friendly", path: "/camping/grounds/family", order: 2 },
                { label: "Remote/Wilderness", path: "/camping/grounds/remote", order: 3 }
              ]
            }
          ]
        },
        { label: "Equipment", path: "/shop?category=camping", order: 1 },
        { label: "Tips & Tricks", path: "/camping/tips", order: 2 },
        { label: "Recipes", path: "/camping/recipes", order: 3 }
      ],
      outdoors: [
        { label: "Destinations", path: "/outdoors/destinations", order: 0 },
        { label: "Guides", path: "/outdoors/guides", order: 1 },
        { label: "Equipment", path: "/shop?category=outdoors", order: 2 },
        { label: "Community", path: "/outdoors/community", order: 3 }
      ],
      cruising: [
        { label: "Cruise Lines", path: "/cruising/lines", order: 0 },
        { label: "Destinations", path: "/cruising/destinations", order: 1 },
        { label: "Packages", path: "/cruising/packages", order: 2 },
        { label: "Reviews", path: "/cruising/reviews", order: 3 }
      ],
      "four-x-four": [
        { label: "Trails", path: "/four-x-four/trails", order: 0 },
        { label: "Vehicles", path: "/four-x-four/vehicles", order: 1 },
        { label: "Equipment", path: "/shop?category=4x4", order: 2 },
        { label: "Events", path: "/four-x-four/events", order: 3 }
      ]
    };

    // Insert header configs and their menu items
    for (const config of headerConfigs) {
      const existingConfig = await db.query.headerConfigs.findFirst({
        where: eq(schema.headerConfigs.category, config.category),
      });

      if (!existingConfig) {
        console.log(`Creating header config for: ${config.category}`);
        const [newConfig] = await db.insert(schema.headerConfigs).values(config).returning();

        // Insert menu items for this config
        const categoryMenuItems = menuItems[config.category];
        for (const menuItem of categoryMenuItems) {
          const [newMenuItem] = await db.insert(schema.headerMenuItems).values({
            headerConfigId: newConfig.id,
            label: menuItem.label,
            path: menuItem.path,
            order: menuItem.order,
            hasMegaMenu: menuItem.hasMegaMenu || false
          }).returning();

          // If this menu item has megaMenuCategories, create them
          if (menuItem.hasMegaMenu && menuItem.megaMenuCategories) {
            for (const category of menuItem.megaMenuCategories) {
              const [newCategory] = await db.insert(schema.megaMenuCategories).values({
                menuItemId: newMenuItem.id,
                title: category.title,
                order: category.order
              }).returning();

              // Create items for this category
              if (category.items && category.items.length > 0) {
                for (const item of category.items) {
                  await db.insert(schema.megaMenuItems).values({
                    categoryId: newCategory.id,
                    label: item.label,
                    path: item.path,
                    order: item.order,
                    featuredItem: item.featuredItem || false
                  });
                }
              }
            }
          }
        }
      }
    }

    // Seed sidebar configurations
    const sidebarConfigs = [
      {
        category: "hiking",
        title: "Hiking Resources",
        description: "Essential resources for hikers of all levels"
      },
      {
        category: "fishing",
        title: "Fishing Guides",
        description: "Tips and guides for your fishing adventures"
      },
      {
        category: "camping",
        title: "Camping Essentials",
        description: "Everything you need for a great camping trip"
      },
      {
        category: "cruising",
        title: "Cruising Information",
        description: "Guides and resources for cruising enthusiasts"
      },
      {
        category: "outdoors",
        title: "Outdoor Activities",
        description: "Resources for all outdoor adventures"
      },
      {
        category: "four-x-four",
        title: "Off-Road Resources",
        description: "Guides for off-road and 4x4 adventures"
      }
    ];

    const sidebarItems = {
      hiking: [
        {
          title: "Trail Maps",
          content: "Access our collection of detailed trail maps for popular hiking destinations.",
          imageUrl: "https://images.unsplash.com/photo-1503221043305-f7498f8b7888?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/shop?category=maps",
          linkText: "View Maps"
        },
        {
          title: "Hiking Gear Guide",
          content: "Essential equipment every hiker should have for safety and comfort on the trails.",
          imageUrl: "https://images.unsplash.com/photo-1578735547588-77c1ce78dab5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/shop?category=hiking",
          linkText: "Shop Gear"
        },
        {
          title: "Hiking Skills Workshops",
          content: "Join our expert-led workshops to improve your hiking skills and safety knowledge.",
          imageUrl: null,
          linkUrl: "/events",
          linkText: "Upcoming Workshops"
        }
      ],
      fishing: [
        {
          title: "Local Fishing Spots",
          content: "Discover the best fishing locations in your area with our curated guides.",
          imageUrl: "https://images.unsplash.com/photo-1493787039806-2edcbe808750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/fishing-spots",
          linkText: "Find Spots"
        },
        {
          title: "Seasonal Fishing Guide",
          content: "Learn what fish are biting in each season and the best techniques to catch them.",
          imageUrl: "https://images.unsplash.com/photo-1513652990199-8a52e2313122?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/blog?category=fishing",
          linkText: "Read Guide"
        },
        {
          title: "Fishing Equipment Rental",
          content: "Don't own gear? No problem! Rent quality fishing equipment for your next trip.",
          imageUrl: null,
          linkUrl: "/rentals",
          linkText: "View Rentals"
        }
      ],
      camping: [
        {
          title: "Campsite Directory",
          content: "Browse our comprehensive directory of campsites with reviews and amenities.",
          imageUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/campsites",
          linkText: "Find Campsites"
        },
        {
          title: "Camping Checklist",
          content: "Never forget essential camping gear with our comprehensive packing checklist.",
          imageUrl: null,
          linkUrl: "/blog/camping-checklist",
          linkText: "View Checklist"
        },
        {
          title: "Outdoor Cooking Recipes",
          content: "Delicious and easy recipes perfect for preparing at your campsite.",
          imageUrl: "https://images.unsplash.com/photo-1517770317440-f99d64a4fde2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/blog?tag=camp-cooking",
          linkText: "Get Recipes"
        }
      ],
      cruising: [
        {
          title: "Cruising Destinations",
          content: "Explore popular cruising routes and destinations with our detailed guides.",
          imageUrl: "https://images.unsplash.com/photo-1548574505-5e239809ee19?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/cruising-destinations",
          linkText: "Explore"
        },
        {
          title: "Boat Maintenance Tips",
          content: "Keep your vessel in top condition with these essential maintenance guides.",
          imageUrl: null,
          linkUrl: "/blog?tag=boat-maintenance",
          linkText: "Read Tips"
        },
        {
          title: "Weather Resources",
          content: "Access reliable weather forecasts and information for safe cruising.",
          imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/weather",
          linkText: "Check Weather"
        }
      ],
      outdoors: [
        {
          title: "Adventure Planning Guide",
          content: "Tips and resources for planning your next outdoor adventure safely.",
          imageUrl: "https://images.unsplash.com/photo-1598953431143-5cc64c3f68bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/blog/adventure-planning",
          linkText: "Plan Your Trip"
        },
        {
          title: "Conservation Resources",
          content: "Learn how you can help protect and preserve our natural environments.",
          imageUrl: null,
          linkUrl: "/conservation",
          linkText: "Get Involved"
        },
        {
          title: "Outdoor Photography Tips",
          content: "Capture your outdoor adventures with these expert photography techniques.",
          imageUrl: "https://images.unsplash.com/photo-1464254786288-b2ffd32824a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/blog?tag=photography",
          linkText: "Improve Your Skills"
        }
      ],
      "4x4": [
        {
          title: "Off-Road Trail Maps",
          content: "Detailed maps of 4x4 trails with difficulty ratings and terrain information.",
          imageUrl: "https://images.unsplash.com/photo-1519400060284-dad50ccc7478?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/trails/4x4",
          linkText: "View Trails"
        },
        {
          title: "Vehicle Preparation Guide",
          content: "Essential modifications and checks to prepare your vehicle for off-roading.",
          imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1a7cbc38?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          linkUrl: "/blog/vehicle-preparation",
          linkText: "Prepare Your Vehicle"
        },
        {
          title: "Recovery Techniques",
          content: "Learn essential recovery methods to safely get unstuck in challenging terrain.",
          imageUrl: null,
          linkUrl: "/blog?tag=recovery",
          linkText: "Learn Techniques"
        }
      ]
    };

    // Add sidebar configurations and items
    for (const config of sidebarConfigs) {
      // Check if sidebar config already exists
      const existingConfig = await db.query.sidebarConfigs.findFirst({
        where: eq(schema.sidebarConfigs.category, config.category),
      });

      if (!existingConfig) {
        console.log(`Creating sidebar config for: ${config.category}`);
        const [newConfig] = await db.insert(schema.sidebarConfigs).values({
          ...config,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        // Insert sidebar items for this config
        const categoryItems = sidebarItems[config.category as keyof typeof sidebarItems];
        if (categoryItems) {
          for (let i = 0; i < categoryItems.length; i++) {
            const item = categoryItems[i];
            console.log(`Creating sidebar item: ${item.title} for ${config.category}`);
            await db.insert(schema.sidebarItems).values({
              sidebarId: newConfig.id,
              title: item.title,
              content: item.content,
              imageUrl: item.imageUrl,
              linkUrl: item.linkUrl,
              linkText: item.linkText,
              order: i
            });
          }
        }
      }
    }

    // Seed category styles
    console.log("Seeding category styles...");
    const categoryStyleData = [
      { category: "home", primaryColor: "#3B82F6", primaryColorHSL: "220 93% 60%" },
      { category: "outdoors", primaryColor: "#10B981", primaryColorHSL: "158 64% 39%" },
      { category: "cruising", primaryColor: "#06B6D4", primaryColorHSL: "187 85% 43%" },
      { category: "fishing", primaryColor: "#0EA5E9", primaryColorHSL: "199 89% 48%" },
      { category: "hiking", primaryColor: "#84CC16", primaryColorHSL: "78 62% 44%" },
      { category: "camping", primaryColor: "#EAB308", primaryColorHSL: "43 96% 47%" },
      { category: "four-x-four", primaryColor: "#F97316", primaryColorHSL: "24 95% 53%" },
    ];

    for (const style of categoryStyleData) {
      const existingStyle = await db.query.categoryStyles.findFirst({
        where: eq(schema.categoryStyles.category, style.category)
      });

      if (!existingStyle) {
        await db.insert(schema.categoryStyles).values({
          category: style.category,
          primaryColor: style.primaryColor,
          primaryColorHSL: style.primaryColorHSL,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Seed destinations
    await db.insert(schema.favoriteDestinations).values([
      {
        title: "Texas",
        image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934",
        slug: "texas",
        country: "United States",
        description: "Experience the unique culture and vast landscapes",
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Paris",
        image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
        slug: "paris",
        country: "France",
        description: "City of love and iconic architecture",
        order: 1
      },
      {
        title: "Michigan",
        image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6",
        slug: "michigan",
        country: "United States",
        description: "Beautiful vineyards and scenic landscapes",
        order: 2
      },
      {
        title: "Colorado",
        image: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47",
        slug: "colorado",
        country: "United States",
        description: "Majestic mountains and outdoor adventures",
        order: 3
      },
      {
        title: "Georgia",
        image: "https://images.unsplash.com/photo-1603888613934-ee2f7d143dd0",
        slug: "georgia",
        country: "United States",
        description: "Crystal clear waters and natural wonders",
        order: 4
      },
      {
        title: "Florida",
        image: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c",
        slug: "florida",
        country: "United States",
        description: "Beautiful beaches and endless sunshine",
        order: 5
      },
      {
        title: "Africa",
        image: "https://images.unsplash.com/photo-1589182337358-2cb63099350c",
        slug: "africa",
        country: "Africa",
        description: "Ancient pyramids and rich culture",
        order: 6
      },
      {
        title: "New York",
        image: "https://images.unsplash.com/photo-1522083165195-3424ed129620",
        slug: "new-york",
        country: "United States",
        description: "Iconic cityscape and vibrant culture",
        order: 7
      }
    ]);

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();