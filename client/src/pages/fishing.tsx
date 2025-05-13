import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ActivityProps } from "@/components/common/ActivityCard";
import ActivityCard from "@/components/common/ActivityCard";
import SearchBox from "@/components/common/SearchBox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Fish, Anchor, Compass, Award } from "lucide-react";
import EnhancedHeroSection from "@/components/common/EnhancedHeroSection";
import Sidebar from "@/components/common/Sidebar";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import BlogSection from "@/components/sections/BlogSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import AdventureTipsSlider from "@/components/sections/AdventureTipsSlider";

const Fishing = () => {
  const { data: fishingActivities, isLoading, error } = useQuery<ActivityProps[]>({
    queryKey: ['/api/activities/category/fishing'],
  });
  
  const { data: headerConfig } = useQuery<{ bannerText?: string }>({
    queryKey: ['/api/header-configs/category/fishing'],
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
        title="Fishing Adventures Await"
        subtitle="Discover the best fishing spots, gear, and techniques for your next expedition in pristine waters across North America."
        primaryButtonText="Find Fishing Spots"
        primaryButtonLink="#fishing-spots"
        secondaryButtonText="Shop Gear"
        secondaryButtonLink="/shop?category=fishing"
        mainImage="https://images.unsplash.com/photo-1544551763-92ab472cad5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        smallTopImage="https://images.unsplash.com/photo-1542261777448-23d2a287091c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        smallBottomImage="https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"

        stats={[
          { icon: <Fish size={24} />, text: "150+ Premium Fishing Spots" },
          { icon: <Anchor size={24} />, text: "Fresh & Saltwater Expeditions" },
          { icon: <Compass size={24} />, text: "All Seasons Availability" },
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
            <section id="fishing-spots">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8">Top Fishing Destinations</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  renderSkeletons()
                ) : error ? (
                  <div className="col-span-full text-center">
                    <p className="text-destructive">Failed to load fishing activities. Please try again later.</p>
                  </div>
                ) : fishingActivities && fishingActivities.length > 0 ? (
                  fishingActivities.map((activity) => (
                    <ActivityCard key={activity.id} {...activity} />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border border-neutral rounded-lg bg-white">
                    <h3 className="font-heading font-bold text-xl mb-2">No Fishing Trips Found</h3>
                    <p className="text-neutral-dark mb-4">We're currently updating our fishing activities.</p>
                    <p className="text-neutral-dark">Check back soon for exciting fishing adventures!</p>
                  </div>
                )}
              </div>
            </section>
            
            <section className="mt-16 bg-card rounded-lg p-8 shadow-md">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2">
                  <img 
                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    alt="Fishing techniques" 
                    className="rounded-lg shadow-md w-full h-auto"
                  />
                </div>
                <div className="md:w-1/2">
                  <h2 className="font-heading font-bold text-2xl md:text-3xl mb-4">Master the Art of Fishing</h2>
                  <p className="mb-6">Whether you're a beginner or an experienced angler, our guides and resources will help you improve your fishing skills and catch more fish.</p>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Award className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium">Expert Guides</h3>
                        <p className="text-sm text-muted-foreground">Learn from professional anglers who know the local waters and best techniques.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Award className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium">Quality Equipment</h3>
                        <p className="text-sm text-muted-foreground">Access to top-of-the-line fishing gear tailored to your specific needs.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Award className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium">Secret Spots</h3>
                        <p className="text-sm text-muted-foreground">Discover hidden fishing locations that are off the beaten path.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          {/* Sidebar - Takes 1/4 width on desktop */}
          <div className="md:col-span-1 lg:col-span-1 order-1 md:order-2">
            <div className="sticky top-24">
              <Sidebar category="fishing" />
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
              Everything You Need for a Perfect Fishing Adventure
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              From selecting the right gear to finding the best fishing spots, we've got you covered with expert advice for a successful day on the water.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1544551763-92ab472cad5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Fishing tackle" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Premium Tackle</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Choose the right equipment for your target species and fishing environment. Quality gear makes all the difference in your fishing success.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">1</span>
                    <span>Match rod and reel to your target fish</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span>
                    <span>Select appropriate bait and lures</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
                    <span>Don't forget essential accessories</span>
                  </li>
                </ul>
                <Link href="/shop?category=fishing-gear">
                  <Button variant="outline" className="w-full">Shop Fishing Gear</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1542261777448-23d2a287091c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Fishing guide" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Expert Guidance</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Learn from experienced anglers and fishing guides who know the best techniques for your chosen fishing location and conditions.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
                    <span>Book local guides for insider spots</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
                    <span>Learn appropriate techniques</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                    <span>Understand seasonal fish behavior</span>
                  </li>
                </ul>
                <Link href="/fishing?service=guides">
                  <Button variant="outline" className="w-full">Find a Guide</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Fishing planning" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Trip Planning</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Prepare for a successful fishing adventure with proper planning and preparation for weather, regulations, and safety.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                    <span>Check fishing regulations and licenses</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                    <span>Monitor weather conditions</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                    <span>Pack safety and comfort essentials</span>
                  </li>
                </ul>
                <Link href="/blog?category=fishing-tips">
                  <Button variant="outline" className="w-full">Fishing Resources</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Latest Adventure Tips Slider */}
      <AdventureTipsSlider category="fishing" />
      
      <FeaturedProducts />
      <BlogSection />
      <NewsletterSection />
    </>
  );
};

export default Fishing;