import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Star } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import NewsletterSection from "@/components/sections/NewsletterSection";
import Sidebar from "@/components/common/Sidebar";
import CategoryVideoSection from "@/components/sections/CategoryVideoSection";
import { Link } from "wouter";
import EnhancedHeroSection from "@/components/common/EnhancedHeroSection";
import SearchBox from "@/components/common/SearchBox";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import BlogSection from "@/components/sections/BlogSection";
import AdventureTipsSlider from "@/components/sections/AdventureTipsSlider";
import { ActivityProps } from "@/components/common/ActivityCard";
import ActivityCard from "@/components/common/ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tent, Map, Compass, Sun, Flame } from "lucide-react";
import { useCategoryTheme } from "@/hooks/use-category-theme";

const Camping = () => {
  // Apply category-specific theme for this page
  const { categoryStyle } = useCategoryTheme('camping');

  const { data: campingActivities, isLoading, error } = useQuery<ActivityProps[]>({
    queryKey: ['/api/activities/category/camping'],
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
        title="Camping Under the Stars"
        subtitle="Discover the best camping destinations, gear, and tips for your next outdoor overnight adventure."
        primaryButtonText="Find Campgrounds"
        primaryButtonLink="#campgrounds"
        secondaryButtonText="Camping Gear"
        secondaryButtonLink="/shop?category=camping"
        mainImage="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        smallTopImage="https://images.unsplash.com/photo-1510312305653-8ed496efae75?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        smallBottomImage="https://images.unsplash.com/photo-1496080174650-637e3f22fa03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        stats={[
          { icon: <Tent size={24} />, text: "800+ Campgrounds" },
          { icon: <Star size={24} />, text: "Rated Top Experiences" },
          { icon: <Map size={24} />, text: "National Park Guides" },
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
            <section id="campgrounds">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8">Top Camping Destinations</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  renderSkeletons()
                ) : error ? (
                  <div className="col-span-full text-center">
                    <p className="text-destructive">Failed to load camping activities. Please try again later.</p>
                  </div>
                ) : campingActivities && campingActivities.length > 0 ? (
                  campingActivities.map((activity) => (
                    <ActivityCard key={activity.id} {...activity} />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border border-neutral rounded-lg bg-white">
                    <h3 className="font-heading font-bold text-xl mb-2">No Camping Trips Found</h3>
                    <p className="text-neutral-dark mb-4">We're currently updating our camping activities.</p>
                    <p className="text-neutral-dark">Check back soon for exciting camping adventures!</p>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-16 bg-white p-8 rounded-lg shadow-md">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8 text-center">Essential Camping Tips</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 border border-neutral rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Sun className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2 text-center">Check Weather Forecast</h3>
                  <p className="text-neutral-dark">Always check the weather forecast before heading out to properly prepare for conditions.</p>
                </div>

                <div className="p-6 border border-neutral rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Tent className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2 text-center">Pack Proper Clothing</h3>
                  <p className="text-neutral-dark">Bring layers suitable for both day and night temperatures, even in summer.</p>
                </div>

                <div className="p-6 border border-neutral rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Flame className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2 text-center">First Aid Kit</h3>
                  <p className="text-neutral-dark">Always bring a well-stocked first aid kit for emergencies and minor injuries.</p>
                </div>

                <div className="p-6 border border-neutral rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Compass className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2 text-center">Leave No Trace</h3>
                  <p className="text-neutral-dark">Pack out all trash and leave your campsite better than you found it.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Takes 1/4 width on desktop */}
          <div className="md:col-span-1 lg:col-span-1 order-1 md:order-2">
            <div className="sticky top-24">
              <Sidebar category="camping" />
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
              Everything You Need for a Perfect Camping Adventure
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              From selecting the right gear to finding the perfect campsite, we've got you covered with expert advice for an unforgettable outdoor experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Camping equipment" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Essential Gear</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Quality camping gear makes all the difference between a comfortable trip and a miserable one. Invest in reliable equipment for all weather conditions.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">1</span>
                    <span>Weather-appropriate tent & sleeping bag</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span>
                    <span>Portable cooking equipment</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
                    <span>Lighting, first aid, and emergency supplies</span>
                  </li>
                </ul>
                <Link href="/shop?category=camping-gear">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white border-primary/20">Shop Camping Gear</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Campsite location" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Perfect Campsites</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Finding the ideal campsite enhances your outdoor experience. Consider accessibility, amenities, and natural surroundings to match your camping style.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
                    <span>Research accessibility and facilities</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
                    <span>Check seasonal availability</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                    <span>Book permits and reservations in advance</span>
                  </li>
                </ul>
                <Link href="/camping/campsites">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white border-primary/20">Find Campsites</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Campfire cooking" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Camping Skills</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Basic camping skills enhance your safety and enjoyment in the outdoors. Learn the essentials before your adventure begins.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                    <span>Setting up camp properly</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                    <span>Outdoor cooking techniques</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                    <span>Leave No Trace principles</span>
                  </li>
                </ul>
                <Link href="/blog?category=camping-tips">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white border-primary/20">Learn Camping Skills</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Adventure Tips Slider */}
      <AdventureTipsSlider category="camping" />

      <CategoryVideoSection category="camping" />

      <NewsletterSection />
    </>
  );
};

export default Camping;