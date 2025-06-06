import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ActivityProps } from "@/components/common/ActivityCard";
import ActivityCard from "@/components/common/ActivityCard";
import SearchBox from "@/components/common/SearchBox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Star, 
  Users, 
  Compass, 
  Sun, 
  Cloud, 
  ShoppingBag,
  Mountain,
  Map
} from "lucide-react";
import { ProductProps } from "@/components/common/ProductCard";
import ProductCard from "@/components/common/ProductCard";
import { BlogPostProps } from "@/components/common/BlogCard";
import BlogCard from "@/components/common/BlogCard";
import EnhancedHeroSection from "@/components/common/EnhancedHeroSection";
import Sidebar from "@/components/common/Sidebar";
import AdventureTipsSlider from "@/components/sections/AdventureTipsSlider";
import CategoryVideoSection from "@/components/sections/CategoryVideoSection";

const Hiking = () => {
  const { data: hikingActivities, isLoading, error } = useQuery<ActivityProps[]>({
    queryKey: ['/api/activities/category/hiking'],
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

  // Get hiking-related products
  const { data: hikingProducts } = useQuery<ProductProps[]>({
    queryKey: ['/api/products/category/hiking'],
  });

  // Get hiking-related blog posts
  const { data: hikingBlogPosts } = useQuery<BlogPostProps[]>({
    queryKey: ['/api/blog/category/hiking'],
  });

  // Query for products by category specifically for hiking
  const { data: hikingProductsSpecific } = useQuery<ProductProps[]>({
    queryKey: ['/api/products/category/hiking-gear'],
  });

  return (
    <>
      <EnhancedHeroSection 
        title="Explore Breathtaking Hiking Trails"
        subtitle="Discover scenic paths, mountain views, and wilderness adventures on foot. From gentle walks to challenging climbs, find your perfect trail."
        primaryButtonText="Explore Trails"
        primaryButtonLink="#trails"
        secondaryButtonText="Hiking Gear"
        secondaryButtonLink="/shop?category=hiking"
        mainImage="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        smallTopImage="https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        smallBottomImage="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        stats={[
          { icon: <Map size={24} />, text: "1000+ Premium Trails" },
          { icon: <Mountain size={24} />, text: "All Difficulty Levels" },
          { icon: <Compass size={24} />, text: "Guided & Self-Guided Options" },
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
              <div className="flex justify-between items-center mb-8">
                <div>
                  <Badge className="bg-primary/10 text-primary mb-2">Featured Trails</Badge>
                  <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark">
                    Most Popular Hiking Trails
                  </h2>
                </div>
                <Link href="/hiking/all" className="text-primary hover:text-primary-dark flex items-center gap-1">
                  View All <ChevronRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  renderSkeletons()
                ) : error ? (
                  <div className="col-span-full text-center">
                    <p className="text-destructive">Failed to load hiking activities. Please try again later.</p>
                  </div>
                ) : (
                  hikingActivities?.map((activity) => (
                    <ActivityCard key={activity.id} {...activity} />
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar - Takes 1/4 width on desktop */}
          <div className="md:col-span-1 lg:col-span-1 order-1 md:order-2">
            <div className="sticky top-24">
              <Sidebar category="hiking" />
            </div>
          </div>
        </div>
      </div>

      {/* Block 2: Plan Your Trip */}
      <section className="py-16 bg-neutral-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-secondary/10 text-secondary mb-2">Plan Your Trip</Badge>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark mb-3">
              Everything You Need for a Perfect Hiking Adventure
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              From choosing the right trail to packing essential gear, we've got you covered with expert advice for a safe and enjoyable hiking experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Trail selection" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Choose Your Trail</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Find the perfect trail based on your experience level, available time, and desired scenery. Consider distance, elevation gain, and trail conditions.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">1</span>
                    <span>Assess your fitness level</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span>
                    <span>Check weather conditions</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
                    <span>Verify trail access and regulations</span>
                  </li>
                </ul>
                <Link href="/hiking/trail-finder">
                  <Button variant="outline" className="w-full">Find Perfect Trail</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1556429287-2b974f9ebb9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Hiking essentials" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Pack Essential Gear</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Be prepared with the right equipment for your hiking adventure. The essentials that every hiker should carry for comfort and safety.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
                    <span>Navigation tools and map</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
                    <span>First aid kit and emergency supplies</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                    <span>Appropriate clothing and footwear</span>
                  </li>
                </ul>
                <Link href="/shop?category=hiking-gear">
                  <Button variant="outline" className="w-full">Shop Hiking Gear</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1521336575822-6da63fb45455?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Hiking safety" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-heading font-bold text-xl">Stay Safe on the Trail</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-neutral-dark mb-4">
                  Follow important safety guidelines to ensure a problem-free hiking experience. Being prepared helps prevent emergencies.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                    <span>Share your itinerary with someone</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                    <span>Stay hydrated and bring extra water</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                    <span>Know basic wilderness first aid</span>
                  </li>
                </ul>
                <Link href="/hiking/safety-tips">
                  <Button variant="outline" className="w-full">Safety Guidelines</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Adventure Tips Slider */}
      <AdventureTipsSlider category="hiking" />

      {/* Block 3: Inspiration & Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-accent/10 text-accent mb-2">Inspiration & Information</Badge>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark mb-3">
              Discover Hiking Knowledge & Stories
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              Get inspired by hiking guides, trail reports, and outdoor wisdom from experienced hikers and nature enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative rounded-xl overflow-hidden h-96">
                <img 
                  src="https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Mountain sunset" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                  <div className="text-white">
                    <Badge className="bg-secondary text-white mb-3">Featured</Badge>
                    <h3 className="font-heading font-bold text-2xl mb-2">
                      The Ultimate Guide to Hiking at High Altitude
                    </h3>
                    <p className="text-white/90 mb-4">
                      Learn essential tips for safely navigating high-elevation terrain and how to prepare your body for reduced oxygen levels.
                    </p>
                    <Link href="/blog/high-altitude-hiking-guide">
                      <Button className="bg-white text-neutral-dark hover:bg-white/90">Read Full Guide</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4">
                  <Badge className="bg-accent/10 text-accent mb-2">Latest Articles</Badge>

                  <div className="space-y-4">
                    {hikingBlogPosts ? hikingBlogPosts.slice(0, 3).map((post) => (
                      <Link href={`/blog/${post.slug}`} key={post.id} className="block">
                        <div className="flex gap-3 group">
                          <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                            <img 
                              src={post.featuredImage} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-dark group-hover:text-primary transition line-clamp-2">
                              {post.title}
                            </h4>
                            <p className="text-xs text-neutral-dark/70">
                              {new Date(post.publishedAt as string).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )) : (
                      Array(3).fill(0).map((_, i) => (
                        <div className="flex gap-3" key={i}>
                          <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-3/4 mb-1" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link href="/blog?category=hiking" className="block mt-4 text-primary hover:text-primary-dark text-sm font-medium">
                    View All Hiking Articles <ChevronRight size={14} className="inline" />
                  </Link>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-6">
                <h3 className="font-heading font-bold text-lg mb-3 text-primary">Hiking Newsletter</h3>
                <p className="text-sm text-neutral-dark mb-4">
                  Subscribe to receive trail recommendations, gear reviews, and outdoor tips every month.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="flex-1 px-3 py-2 rounded-md border border-neutral focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                  <Button size="sm" className="bg-primary hover:bg-primary-dark text-white">Subscribe</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Block 4: Related Products */}
      <section className="py-16 bg-neutral-light">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Badge className="bg-secondary/10 text-secondary mb-2">Hiking Essentials</Badge>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark">
                Gear Up for the Trail
              </h2>
            </div>
            <Link href="/shop?category=hiking" className="text-primary hover:text-primary-dark flex items-center gap-1">
              Shop All <ShoppingBag size={16} />
            </Link>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="inline-flex gap-6 min-w-max">
              {hikingProducts ? (
                hikingProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="w-64">
                    <ProductCard {...product} />
                  </div>
                ))
              ) : (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="w-64">
                    <div className="rounded-lg overflow-hidden shadow-md bg-white">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Block 5: Expert Advice */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary mb-2">Expert Advice</Badge>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark mb-3">
              Tips From Seasoned Hikers
            </h2>
            <p className="text-neutral-dark/80 max-w-3xl mx-auto">
              Learn from experienced hikers who've walked thousands of miles on trails around the world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="relative pt-8 px-8">
                <div className="absolute top-4 left-4">
                  <Compass className="text-primary" size={24} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-4">Navigation Mastery</h3>
                <p className="text-neutral-dark mb-6">
                  "Always carry a physical map and compass as backup even if you use GPS. The most important skill is knowing how to orient yourself if technology fails."
                </p>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src="https://randomuser.me/api/portraits/men/32.jpg" 
                      alt="Expert hiker"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Michael Rodriguez</p>
                    <p className="text-sm text-neutral-dark/70">Thru-Hiker, 15+ Years Experience</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="relative pt-8 px-8">
                <div className="absolute top-4 left-4">
                  <Cloud className="text-primary" size={24} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-4">Weather Wisdom</h3>
                <p className="text-neutral-dark mb-6">
                  "Learn to read cloud formations and understand changing weather patterns. In mountain environments, conditions can shift dramatically in minutes."
                </p>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src="https://randomuser.me/api/portraits/women/44.jpg" 
                      alt="Expert hiker"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Sarah Patel</p>
                    <p className="text-sm text-neutral-dark/70">Mountain Guide, 12+ Years Experience</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition">
              <div className="relative pt-8 px-8">
                <div className="absolute top-4 left-4">
                  <Sun className="text-primary" size={24} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-4">Sustainable Hiking</h3>
                <p className="text-neutral-dark mb-6">
                  "Practice Leave No Trace principles diligently. The wilderness we enjoy today must be preserved for future generations of hikers and wildlife."
                </p>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src="https://randomuser.me/api/portraits/men/75.jpg" 
                      alt="Expert hiker"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">David Thompson</p>
                    <p className="text-sm text-neutral-dark/70">Conservation Specialist, 20+ Years Experience</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/hiking/expert-advice">
              <Button variant="outline" className="bg-white">View All Expert Tips</Button>
            </Link>
          </div>
        </div>
      </section>

      <CategoryVideoSection category="hiking" />

      {/* Newsletter Signup */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading font-bold text-2xl md:text-3xl mb-3">
              Join Our Hiking Community
            </h2>
            <p className="text-white/80 mb-6">
              Subscribe to receive trail updates, gear recommendations, and exclusive hiking guides delivered straight to your inbox.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Your name" 
                  className="flex-1 px-4 py-3 rounded-md bg-white/20 placeholder-white/60 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex-1 px-4 py-3 rounded-md bg-white/20 placeholder-white/60 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded text-secondary" />
                  <span>Trail Updates</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded text-secondary" />
                  <span>Gear Reviews</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded text-secondary" />
                  <span>Safety Tips</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded text-secondary" />
                  <span>Exclusive Offers</span>
                </label>
              </div>

              <Button className="mt-4 bg-secondary hover:bg-secondary-dark text-white w-full">
                Subscribe Now
              </Button>

              <p className="text-xs text-white/60 mt-3">
                By subscribing, you agree to our privacy policy and consent to receive marketing emails. You can unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hiking;