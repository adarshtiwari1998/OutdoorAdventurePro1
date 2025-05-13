import { useQuery } from "@tanstack/react-query";
import BlogCard, { BlogPostProps } from "@/components/common/BlogCard";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";

const BlogSection = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  
  const { data: blogPosts, isLoading, error } = useQuery<{
    featured: BlogPostProps;
    regular: BlogPostProps[];
  }>({
    queryKey: ['/api/blog/featured'],
  });
  
  // Check if we're on the fishing page by checking the URL
  const isFishingPage = typeof window !== 'undefined' && window.location.pathname.includes('/fishing');
  
  // Set up intersection observer to detect which slide is visible
  useEffect(() => {
    if (!sliderRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const slideIndex = parseInt(id.split('-').pop() || '0', 10);
            setActiveSlide(slideIndex);
          }
        });
      },
      { 
        root: sliderRef.current,
        threshold: 0.7,
        rootMargin: '0px'
      }
    );
    
    // Observe all slider items
    document.querySelectorAll('[id^="slider-item-"]').forEach((el) => {
      observer.observe(el);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [isLoading, isFishingPage]);
  
  // Scroll functions for the slider
  const scrollLeft = () => {
    if (sliderRef.current) {
      const newIndex = Math.max(0, activeSlide - 1);
      const targetElement = document.getElementById(`slider-item-${newIndex}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        setActiveSlide(newIndex);
      } else {
        sliderRef.current.scrollBy({ left: -340, behavior: 'smooth' });
      }
    }
  };
  
  const scrollRight = () => {
    if (sliderRef.current) {
      const maxIndex = isFishingPage ? 
        fishingRegularPosts.length - 1 : 
        (blogPosts?.regular?.length || 0) - 1;
      const newIndex = Math.min(maxIndex, activeSlide + 1);
      const targetElement = document.getElementById(`slider-item-${newIndex}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        setActiveSlide(newIndex);
      } else {
        sliderRef.current.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }
  };

  const renderFeaturedSkeleton = () => (
    <div className="lg:col-span-2 bg-neutral-light rounded-lg overflow-hidden shadow-md">
      <div className="flex flex-col md:flex-row h-full">
        <div className="md:w-1/2">
          <Skeleton className="w-full h-48 md:h-full" />
        </div>
        <div className="md:w-1/2 p-6 flex flex-col">
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-7 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full mr-2" />
            <Skeleton className="h-4 w-24 mr-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegularSkeleton = () => (
    <div className="bg-neutral-light rounded-lg overflow-hidden shadow-md">
      <Skeleton className="w-full h-48" />
      <div className="p-4">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center">
          <Skeleton className="h-6 w-6 rounded-full mr-2" />
          <Skeleton className="h-3 w-20 mr-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-destructive">Failed to load blog posts. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  // Featured fishing blog post
  const fishingFeaturedPost = {
    id: "fishing-featured",
    title: "The Ultimate Guide to Choosing Fishing Gear",
    excerpt: "Confused about what fishing gear to buy? This comprehensive guide breaks down everything from rods and reels to lines and lures for beginners.",
    featuredImage: "https://images.unsplash.com/photo-1499242611767-cf8b9e9d4b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    category: {
      name: "Fishing",
      slug: "fishing"
    },
    author: {
      name: "Admin User",
      avatar: "https://ui-avatars.com/api/?name=Admin+User&background=random"
    },
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    slug: "ultimate-guide-fishing-gear"
  };

  // Regular fishing blog posts
  const fishingRegularPosts = [
    {
      id: "fishing-post-1",
      title: "Essential Fishing Gear for Different Species",
      excerpt: "Discover the specialized equipment you need to target different fish species, from bass to trout to deep-sea fishing.",
      featuredImage: "https://images.unsplash.com/photo-1532332248682-206cc786359f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: {
        name: "Fishing",
        slug: "fishing"
      },
      author: {
        name: "Michael Rivers",
        avatar: "https://ui-avatars.com/api/?name=Michael+Rivers&background=random"
      },
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      slug: "essential-fishing-gear-different-species"
    },
    {
      id: "fishing-post-2",
      title: "Seasonal Fishing Spots in North America",
      excerpt: "A comprehensive guide to the best fishing locations throughout the year, organized by season and target species.",
      featuredImage: "https://images.unsplash.com/photo-1564689510742-4e9c7584181d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: {
        name: "Fishing",
        slug: "fishing"
      },
      author: {
        name: "Sarah Lakes",
        avatar: "https://ui-avatars.com/api/?name=Sarah+Lakes&background=random"
      },
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      slug: "seasonal-fishing-spots-north-america"
    },
    {
      id: "fishing-post-3",
      title: "Fish Conservation: Catch and Release Tips",
      excerpt: "Learn proper techniques to safely release fish back into the water while minimizing stress and injury for sustainable fishing.",
      featuredImage: "https://images.unsplash.com/photo-1508246325515-244e02aab338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: {
        name: "Fishing",
        slug: "fishing"
      },
      author: {
        name: "Robert Streams",
        avatar: "https://ui-avatars.com/api/?name=Robert+Streams&background=random"
      },
      publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      slug: "fish-conservation-catch-release"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading font-bold text-2xl md:text-3xl">Featured Blog Articles</h2>
          <Link href="/blog" className="text-primary hover:text-primary-dark font-medium flex items-center">
            View All Articles
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        {/* Grid layout for blog posts */}
        <div className="blog-section-container">
          {/* Featured post on the left */}
          <div className="lg:w-1/2 blog-featured">
            {isLoading ? (
              renderFeaturedSkeleton()
            ) : (
              <BlogCard 
                {...(isFishingPage ? fishingFeaturedPost : blogPosts?.featured!)}
                featured={true}
              />
            )}
          </div>

          {/* Regular posts in a slider on the right */}
          <div className="lg:w-1/2 blog-slider">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {renderRegularSkeleton()}
                {renderRegularSkeleton()}
                {renderRegularSkeleton()}
              </div>
            ) : (
              <div className="relative overflow-hidden">
                {/* Left navigation arrow - Fixed position */}
                <div className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center">
                  <button 
                    onClick={scrollLeft}
                    className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md text-primary hover:text-primary-dark transition-all"
                    aria-label="Scroll left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Right navigation arrow - Fixed position */}
                <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center">
                  <button 
                    onClick={scrollRight}
                    className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md text-primary hover:text-primary-dark transition-all"
                    aria-label="Scroll right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Scrollable container separated from the navigation controls */}
                <div className="overflow-x-auto custom-scrollbar px-12 h-full" ref={sliderRef} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="flex flex-nowrap space-x-4 h-full">
                    {isFishingPage ? (
                      <>
                        {fishingRegularPosts.map((post, index) => (
                          <div 
                            key={post.id} 
                            id={`slider-item-${index}`}
                            className="flex-none w-full md:w-[calc(100%-1rem)] transition-transform duration-300 hover:scale-[1.01]" 
                            style={{ scrollSnapAlign: 'start' }}
                          >
                            {/* Horizontal card layout similar to featured post */}
                            <div className="bg-white shadow-md rounded-lg overflow-hidden" style={{ height: '260px' }}>
                              <div className="flex flex-col md:flex-row h-full">
                                {/* Image on the left */}
                                <div className="md:w-2/5 overflow-hidden">
                                  <img 
                                    src={post.featuredImage} 
                                    alt={post.title} 
                                    className="w-full h-32 md:h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                </div>
                                {/* Content on the right */}
                                <div className="md:w-3/5 p-3 flex flex-col">
                                  <div className="bg-primary/10 text-primary text-xs font-medium rounded-full px-2 py-1 mb-1 inline-block w-fit">
                                    {post.category.name}
                                  </div>
                                  <h3 className="font-bold text-base mb-1 line-clamp-2">{post.title}</h3>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{post.excerpt}</p>
                                  <div className="mt-auto flex items-center">
                                    <img 
                                      src={post.author.avatar} 
                                      alt={post.author.name} 
                                      className="w-6 h-6 rounded-full mr-2 object-cover"
                                    />
                                    <div className="text-xs">
                                      <div className="font-medium">{post.author.name}</div>
                                      <div className="text-gray-500">
                                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {blogPosts?.regular?.map((post, index) => (
                          <div 
                            key={post.id} 
                            id={`slider-item-${index}`}
                            className="flex-none w-full md:w-[calc(100%-1rem)] transition-transform duration-300 hover:scale-[1.01]" 
                            style={{ scrollSnapAlign: 'start' }}
                          >
                            {/* Horizontal card layout similar to featured post */}
                            <div className="bg-white shadow-md rounded-lg overflow-hidden" style={{ height: '260px' }}>
                              <div className="flex flex-col md:flex-row h-full">
                                {/* Image on the left */}
                                <div className="md:w-2/5 overflow-hidden">
                                  <img 
                                    src={post.featuredImage} 
                                    alt={post.title} 
                                    className="w-full h-32 md:h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                </div>
                                {/* Content on the right */}
                                <div className="md:w-3/5 p-3 flex flex-col">
                                  <div className="bg-primary/10 text-primary text-xs font-medium rounded-full px-2 py-1 mb-1 inline-block w-fit">
                                    {post.category.name}
                                  </div>
                                  <h3 className="font-bold text-base mb-1 line-clamp-2">{post.title}</h3>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{post.excerpt}</p>
                                  <div className="mt-auto flex items-center">
                                    <img 
                                      src={post.author.avatar} 
                                      alt={post.author.name} 
                                      className="w-6 h-6 rounded-full mr-2 object-cover"
                                    />
                                    <div className="text-xs">
                                      <div className="font-medium">{post.author.name}</div>
                                      <div className="text-gray-500">
                                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Dot indicators */}
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-3">
                    {isFishingPage 
                      ? fishingRegularPosts.map((_, index) => (
                        <button 
                          key={index}
                          onClick={() => {
                            if (sliderRef.current) {
                              const targetElement = document.getElementById(`slider-item-${index}`);
                              if (targetElement) {
                                const containerRect = sliderRef.current.getBoundingClientRect();
                                const targetRect = targetElement.getBoundingClientRect();
                                const scrollOffset = targetRect.left - containerRect.left + sliderRef.current.scrollLeft;
                                sliderRef.current.scrollTo({ left: scrollOffset, behavior: 'smooth' });
                                setActiveSlide(index);
                              }
                            }
                          }}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            index === activeSlide 
                              ? 'bg-primary scale-110' 
                              : 'bg-gray-300 hover:bg-primary/50'
                          }`}
                          aria-label={`View slide ${index + 1}`}
                          aria-current={index === activeSlide ? 'true' : 'false'}
                        />
                      ))
                      : blogPosts?.regular?.map((_, index) => (
                        <button 
                          key={index}
                          onClick={() => {
                            if (sliderRef.current) {
                              const targetElement = document.getElementById(`slider-item-${index}`);
                              if (targetElement) {
                                const containerRect = sliderRef.current.getBoundingClientRect();
                                const targetRect = targetElement.getBoundingClientRect();
                                const scrollOffset = targetRect.left - containerRect.left + sliderRef.current.scrollLeft;
                                sliderRef.current.scrollTo({ left: scrollOffset, behavior: 'smooth' });
                                setActiveSlide(index);
                              }
                            }
                          }}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            index === activeSlide 
                              ? 'bg-primary scale-110' 
                              : 'bg-gray-300 hover:bg-primary/50'
                          }`}
                          aria-label={`View slide ${index + 1}`}
                          aria-current={index === activeSlide ? 'true' : 'false'}
                        />
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;