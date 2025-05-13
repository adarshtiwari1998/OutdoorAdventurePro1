import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import EnhancedHeroSection from "@/components/common/EnhancedHeroSection";
import Sidebar from "@/components/common/Sidebar";
import SearchBox from "@/components/common/SearchBox";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import BlogSection from "@/components/sections/BlogSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import AdventureTipsSlider from "@/components/sections/AdventureTipsSlider";
import { ActivityProps } from "@/components/common/ActivityCard";
import ActivityCard from "@/components/common/ActivityCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Anchor, Ship, Compass, Waves, Map, CalendarClock, Umbrella } from "lucide-react";

const Cruising = () => {
  const { data: cruisingActivities, isLoading, error } = useQuery<ActivityProps[]>({
    queryKey: ['/api/activities/category/cruising'],
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
        title="Unforgettable Cruising Adventures"
        subtitle="Experience the thrill of water exploration through premium cruising adventures on stunning waterways worldwide."
        primaryButtonText="Discover Cruises"
        primaryButtonLink="#cruises"
        secondaryButtonText="View Gear"
        secondaryButtonLink="/shop?category=cruising"
        mainImage="https://images.unsplash.com/photo-1548032885-b5e38734688a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        smallTopImage="https://images.unsplash.com/photo-1599640842225-85d111c60e6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        smallBottomImage="https://images.unsplash.com/photo-1519302959554-a75be0afc82a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        stats={[
          { icon: <Ship size={24} />, text: "Premium Vessels" },
          { icon: <Anchor size={24} />, text: "Expert Navigation" },
          { icon: <Compass size={24} />, text: "Unique Destinations" },
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
            <section id="cruises">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8">Featured Cruising Experiences</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  renderSkeletons()
                ) : error ? (
                  <div className="col-span-full text-center">
                    <p className="text-destructive">Failed to load cruising activities. Please try again later.</p>
                  </div>
                ) : cruisingActivities && cruisingActivities.length > 0 ? (
                  cruisingActivities.map((activity) => (
                    <ActivityCard key={activity.id} {...activity} />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border border-neutral rounded-lg bg-white">
                    <h3 className="font-heading font-bold text-xl mb-2">No Cruises Found</h3>
                    <p className="text-neutral-dark mb-4">We're currently updating our cruising experiences.</p>
                    <p className="text-neutral-dark">Check back soon for exciting water adventures!</p>
                  </div>
                )}
              </div>
            </section>
            
            <section className="mt-16 bg-white p-8 rounded-lg shadow-md">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8 text-center">Why Choose Our Cruising Adventures</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 border border-neutral rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Compass className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Expert Navigation</h3>
                  <p className="text-neutral-dark">Our experienced captains know the best routes and hidden gems for an unforgettable journey.</p>
                </div>
                
                <div className="p-6 border border-neutral rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Ship className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Premium Experience</h3>
                  <p className="text-neutral-dark">Luxury vessels equipped with all the amenities you need for a comfortable adventure on the water.</p>
                </div>
                
                <div className="p-6 border border-neutral rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
                    <Waves className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Stunning Destinations</h3>
                  <p className="text-neutral-dark">Visit breathtaking locations only accessible by water, from hidden coves to pristine beaches.</p>
                </div>
              </div>
            </section>
          </div>
          
          {/* Sidebar - Takes 1/4 width on desktop */}
          <div className="md:col-span-1 lg:col-span-1 order-1 md:order-2">
            <div className="sticky top-24">
              <Sidebar category="cruising" />
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
              Everything You Need for a Perfect Cruising Adventure
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              From vessel selection to destination planning, we have expert resources to ensure your cruising experience is memorable and smooth sailing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1501426026826-31c667bdf23d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Boating Equipment" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Vessel Selection</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Choosing the right vessel is the foundation of a successful cruising adventure. Our experts can help you select the perfect boat for your needs.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">1</span>
                    <span>Determine crew size and cruising style</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span>
                    <span>Essential safety equipment for your journey</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
                    <span>Navigation systems and communication tech</span>
                  </li>
                </ul>
                <Link href="/shop?category=boating-gear">
                  <Button variant="outline" className="w-full">Shop Boating Gear</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1605196560547-b2f7281b7068?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Cruising Destinations" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Route Planning</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  The perfect cruise combines scenic beauty with practical considerations. Plan your route with our expert guidance and detailed navigational charts.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
                    <span>Chart your course with detailed navigation maps</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
                    <span>Identify marina stops and anchorage points</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                    <span>Plan for tidal changes and waterway depths</span>
                  </li>
                </ul>
                <Link href="/blog?category=cruising-destinations">
                  <Button variant="outline" className="w-full">Explore Destinations</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Weather Monitoring" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Weather & Safety</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Safety on the water begins with understanding weather patterns and being prepared for changing conditions. Our resources help you stay safe.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                    <span>Marine forecasting and weather monitoring</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                    <span>Emergency communication protocols</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                    <span>Essential safety equipment checklist</span>
                  </li>
                </ul>
                <Link href="/shop?category=marine-weather">
                  <Button variant="outline" className="w-full">Weather Resources</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Latest Adventure Tips Slider */}
      <AdventureTipsSlider category="cruising" />
      
      <FeaturedProducts />
      <BlogSection />
      <NewsletterSection />
    </>
  );
};

export default Cruising;