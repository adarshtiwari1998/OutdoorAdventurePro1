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
import { Map, Compass, Mountain, Shield, Wrench, AlertTriangle } from "lucide-react";
import { useCategoryTheme } from "@/hooks/use-category-theme";
import CategoryVideoSection from "@/components/sections/CategoryVideoSection";

const FourXFour = () => {
  // Apply category-specific theme for this page
  const { categoryStyle } = useCategoryTheme('four-x-four');

  const { data: fourxfourActivities, isLoading, error } = useQuery<ActivityProps[]>({
    queryKey: ['/api/activities/category/four-x-four'],
  });

  const { data: headerConfig } = useQuery<{ bannerText?: string }>({
    queryKey: ['/api/header-configs/category/four-x-four'],
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
        title="Conquer the Trails with 4x4 Adventures"
        subtitle="Experience off-road excitement, rugged terrain, and breathtaking destinations across North America's most challenging trails."
        primaryButtonText="Explore Trails"
        primaryButtonLink="#trails"
        secondaryButtonText="4x4 Gear"
        secondaryButtonLink="/shop?category=4x4"
        mainImage="https://images.unsplash.com/photo-1533676802871-eca1ae998cd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        smallTopImage="https://images.unsplash.com/photo-1520116468816-95b69f847357?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        smallBottomImage="https://images.unsplash.com/photo-1563911302283-d2bc129e7570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"

        stats={[
          { icon: <Map size={24} />, text: "120+ Premium Trail Routes" },
          { icon: <Compass size={24} />, text: "Expert Guided Expeditions" },
          { icon: <Mountain size={24} />, text: "All Difficulty Levels" },
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
            <section id="trails">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8">Epic 4x4 Adventures</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  renderSkeletons()
                ) : error ? (
                  <div className="col-span-full text-center">
                    <p className="text-destructive">Failed to load 4x4 activities. Please try again later.</p>
                  </div>
                ) : fourxfourActivities && fourxfourActivities.length > 0 ? (
                  fourxfourActivities.map((activity) => (
                    <ActivityCard key={activity.id} {...activity} />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border border-neutral rounded-lg bg-white">
                    <h3 className="font-heading font-bold text-xl mb-2">No 4x4 Adventures Found</h3>
                    <p className="text-neutral-dark mb-4">We're currently updating our off-road adventures.</p>
                    <p className="text-neutral-dark">Check back soon for exciting 4x4 trails!</p>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-16 bg-card rounded-lg p-8 shadow-md">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2">
                  <img 
                    src="https://images.unsplash.com/photo-1565963925428-3365fb11b6b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    alt="4x4 vehicle on trail" 
                    className="rounded-lg shadow-md w-full h-auto"
                  />
                </div>
                <div className="md:w-1/2">
                  <h2 className="font-heading font-bold text-2xl md:text-3xl mb-4">Off-Road Experience Like No Other</h2>
                  <p className="mb-6">Our 4x4 adventures take you to remote and stunning landscapes that are inaccessible to regular vehicles. Experience the thrill of conquering challenging terrain while enjoying breathtaking vistas.</p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                      <span>Expert guides with extensive off-road experience</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                      <span>High-performance 4x4 vehicles with all necessary equipment</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                      <span>Trails for all difficulty levels from beginner to extreme</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                      <span>Safety training and equipment included with every trip</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Takes 1/4 width on desktop */}
          <div className="md:col-span-1 lg:col-span-1 order-1 md:order-2">
            <div className="sticky top-24">
              <Sidebar category="four-x-four" />
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
              Everything You Need for a Perfect 4x4 Adventure
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              From essential gear to trail navigation, we've got everything you need to conquer the toughest terrains and enjoy an unforgettable off-road experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1504222490345-c075b6008014?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="4x4 Vehicle Preparation" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Vehicle Preparation</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Proper vehicle preparation is crucial for safe and successful off-road adventures. Make sure your 4x4 is ready for the challenges ahead.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">1</span>
                    <span>Reliable off-road tires with proper pressure</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span>
                    <span>Essential vehicle modifications for clearance</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
                    <span>Regular maintenance checks before hitting trails</span>
                  </li>
                </ul>
                <Link href="/shop?category=4x4-accessories">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white border-primary/20">Shop 4x4 Gear</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1612335409506-4d5eed7c7bc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Recovery Equipment" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Recovery Essentials</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Even the most experienced off-roaders get stuck sometimes. Carrying proper recovery gear is non-negotiable for any serious 4x4 adventure.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
                    <span>Recovery straps, shackles, and winch accessories</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
                    <span>High-lift jack and traction boards</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                    <span>Basic mechanical tools for field repairs</span>
                  </li>
                </ul>
                <Link href="/shop?category=recovery-gear">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white border-primary/20">Shop Recovery Gear</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1551214359-b81f66a605b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Trail Navigation" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Trail Navigation</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Staying on course and knowing the terrain ahead is critical for safe off-roading. Modern navigation tools make exploring remote areas safer and more enjoyable.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                    <span>Off-road specific GPS with trail maps</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                    <span>Communication devices for remote areas</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                    <span>Weather monitoring and emergency planning</span>
                  </li>
                </ul>
                <Link href="/blog?category=4x4-navigation">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white border-primary/20">Explore Trail Maps</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Adventure Tips Slider */}
      <AdventureTipsSlider category="offroad" />

      <CategoryVideoSection category="four-x-four" />

      <FeaturedProducts />
      <BlogSection />
      <NewsletterSection />
    </>
  );
};

export default FourXFour;