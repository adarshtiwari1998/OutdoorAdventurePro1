import { useQuery } from "@tanstack/react-query";
import AdvancedCarousel from "@/components/common/AdvancedCarousel";
import SearchBox from "@/components/common/SearchBox";
import FeaturedActivities from "@/components/sections/FeaturedActivities";
import ChannelsSection from "@/components/sections/ChannelsSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import BlogSection from "@/components/sections/BlogSection";
import TestimonialSection from "@/components/sections/TestimonialSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import { Loader2 } from "lucide-react";
import FavoriteDestinations from "@/components/sections/FavoriteDestinations";

const Home = () => {
  // Fetch home sliders from the API
  const { data: sliders, isLoading: slidersLoading } = useQuery({
    queryKey: ['/api/sliders'],
    queryFn: async () => {
      const response = await fetch('/api/sliders');
      if (!response.ok) {
        throw new Error('Failed to fetch sliders');
      }
      return response.json();
    }
  });

  // Fallback carousel slides if API fails or no data
  const fallbackSlides = [
    {
      id: 1,
      title: "Discover Your Next Outdoor Adventure",
      description: "Explore activities, gear, and inspiration for your outdoor lifestyle.",
      backgroundImage: "https://images.unsplash.com/photo-1534515729231-d602d891cf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      ctaText: "Watch Now",
      ctaLink: "/activities",
      year: "2025",
      rating: "PG",
      tags: ["Adventure", "Documentary"],
      subtitles: ["Featured", "New"]
    },
    {
      id: 2,
      title: "Explore Nature's Hidden Gems",
      description: "Find incredible destinations and breathtaking landscapes for your journey.",
      backgroundImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      ctaText: "View Destinations",
      ctaLink: "/destinations",
      year: "2025",
      rating: "G",
      tags: ["Nature", "Travel"],
      subtitles: ["Trending"]
    }
  ];

  // Use API data if available, otherwise use fallback
  const carouselSlides = sliders?.length > 0 
    ? sliders.map((slider: any) => ({
        id: slider.id,
        title: slider.title,
        description: slider.description || '',
        backgroundImage: slider.backgroundImage,
        videoUrl: slider.videoUrl,
        ctaText: slider.ctaText || 'Learn More',
        ctaLink: slider.ctaLink || '#',
        year: new Date().getFullYear().toString(),
        rating: 'PG',
        tags: ['Outdoor', 'Adventure'],
        subtitles: slider.isActive ? ['Featured'] : []
      }))
    : fallbackSlides;

  return (
    <>
      <AdvancedCarousel slides={carouselSlides} />
      <div className="mt-6 relative z-20 container mx-auto px-4 mb-8">
        <SearchBox />
      </div>

      <FavoriteDestinations />
      <FeaturedActivities />
      <ChannelsSection />
      <FeaturedProducts />
      <BlogSection />
      <TestimonialSection />
      <NewsletterSection />
    </>
  );
};

export default Home;