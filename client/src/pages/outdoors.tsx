import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import EnhancedHeroSection from "@/components/common/EnhancedHeroSection";
import Sidebar from "@/components/common/Sidebar";
import SearchBox from "@/components/common/SearchBox";
import FeaturedActivities from "@/components/sections/FeaturedActivities";
import BlogSection from "@/components/sections/BlogSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import NewsletterSection from "@/components/sections/NewsletterSection";
import AdventureTipsSlider from "@/components/sections/AdventureTipsSlider";
import { ActivityProps } from "@/components/common/ActivityCard";
import ActivityCard from "@/components/common/ActivityCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mountain, Sun, Trees, Wind, Map, Compass } from "lucide-react";
import CategoryVideoSection from "@/components/sections/CategoryVideoSection";

const Outdoors = () => {
  const { data: topActivities, isLoading, error } = useQuery<ActivityProps[]>({
    queryKey: ['/api/activities/category/outdoors'],
  });

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="rounded-lg overflow-hidden shadow-md bg-white">
        <div className="h-48">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="p-5">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <EnhancedHeroSection 
        title="Explore the Great Outdoors"
        subtitle="Discover adventure activities, trails, and parks for your outdoor enjoyment across all seasons and terrains."
        primaryButtonText="Find Activities"
        primaryButtonLink="#activities"
        secondaryButtonText="View Gear"
        secondaryButtonLink="/shop?category=outdoors"
        mainImage="https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        smallTopImage="https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        smallBottomImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        stats={[
          { icon: <Mountain size={24} />, text: "All Terrain Types" },
          { icon: <Sun size={24} />, text: "Year-Round Activities" },
          { icon: <Trees size={24} />, text: "Nature Preservation" },
        ]}
      />

      {/* Search Box Below Hero Section */}
      <div className="container mx-auto px-4 pt-6 pb-0">
        <SearchBox />
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Main Content - Takes 3/4 width on desktop */}
          <div className="md:col-span-2 lg:col-span-3 order-2 md:order-1">
            <section id="activities">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8">Top Outdoor Activities</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  renderSkeletons()
                ) : error ? (
                  <div className="col-span-full text-center">
                    <p className="text-destructive">Failed to load outdoor activities. Please try again later.</p>
                  </div>
                ) : topActivities && topActivities.length > 0 ? (
                  topActivities.map((activity) => (
                    <ActivityCard key={activity.id} {...activity} />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border border-neutral rounded-lg bg-white">
                    <h3 className="font-heading font-bold text-xl mb-2">No Activities Found</h3>
                    <p className="text-neutral-dark mb-4">We're currently updating our outdoor activities.</p>
                    <p className="text-neutral-dark">Check back soon for exciting outdoor adventures!</p>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-16 bg-white p-8 rounded-lg shadow-md">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8 text-center">Outdoor Activity Categories</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 border border-neutral rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Mountain className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Mountain Adventures</h3>
                  <p className="text-neutral-dark">Explore peaks, trails, and valleys with guided tours and independent adventures.</p>
                </div>

                <div className="p-6 border border-neutral rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Water Sports</h3>
                  <p className="text-neutral-dark">Dive into kayaking, canoeing, paddleboarding, and more lake and river adventures.</p>
                </div>

                <div className="p-6 border border-neutral rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Trees className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Forest Exploration</h3>
                  <p className="text-neutral-dark">Discover wildlife, plant species, and tranquil environments in nature preserves.</p>
                </div>

                <div className="p-6 border border-neutral rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Wind className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Weather Activities</h3>
                  <p className="text-neutral-dark">Enjoy seasonal outdoor adventures from winter sports to summer hiking trails.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Takes 1/4 width on desktop */}
          <div className="md:col-span-1 lg:col-span-1 order-1 md:order-2">
            <div className="sticky top-24">
              <Sidebar category="outdoors" />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Your Trip */}
      <section className="py-16 bg-neutral-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-secondary/10 text-secondary mb-2">Plan Your Trip</Badge>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark mb-3">
              Everything You Need for a Perfect Outdoor Adventure
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              From selecting the right gear to finding the best locations, we've got you covered with expert advice for a memorable outdoor experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Outdoor gear" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Essential Equipment</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Get the right gear for your outdoor adventures. Quality equipment makes all the difference in comfort, safety, and enjoyment.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">1</span>
                    <span>Weather-appropriate clothing</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span>
                    <span>Navigation and communication tools</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
                    <span>First aid and emergency supplies</span>
                  </li>
                </ul>
                <Link href="/shop?category=outdoor-gear">
                  <Button variant="outline" className="w-full">Shop Outdoor Gear</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Outdoor location" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Find Perfect Locations</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Discover stunning outdoor destinations that match your interests, from serene forests to adventurous mountain trails.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
                    <span>Research accessibility and facilities</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
                    <span>Check seasonal conditions</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                    <span>Read reviews from other adventurers</span>
                  </li>
                </ul>
                <Link href="/outdoors/locations">
                  <Button variant="outline" className="w-full">Explore Destinations</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1598953431143-5aa3797c1703?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Outdoor planning" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Plan Your Activities</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Make the most of your time outdoors with well-planned activities suitable for your skill level and interests.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                    <span>Create a flexible itinerary</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                    <span>Include options for different weather</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                    <span>Book guided experiences when needed</span>
                  </li>
                </ul>
                <Link href="/outdoors/activities">
                  <Button variant="outline" className="w-full">Activity Ideas</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Adventure Tips Slider */}
      <AdventureTipsSlider category="outdoors" />

      <CategoryVideoSection category="outdoors" />

      <BlogSection />
      <NewsletterSection />
    </>
  );
};

export default Outdoors;