import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import MobileMenu from "./MobileMenu";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingCart, 
  ChevronDown, 
  MapPin, 
  Calendar, 
  Tag, 
  BookOpen 
} from "lucide-react";

const activities = [
  { 
    name: "Outdoors", 
    path: "/outdoors",
    icon: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
    color: "bg-green-100"
  },
  { 
    name: "Cruising", 
    path: "/cruising",
    icon: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
    color: "bg-blue-100"
  },
  { 
    name: "Fishing", 
    path: "/fishing",
    icon: "https://images.unsplash.com/photo-1516399662004-ee8259d135ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
    color: "bg-cyan-100"
  },
  { 
    name: "Hiking", 
    path: "/hiking",
    icon: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
    color: "bg-amber-100"
  },
  { 
    name: "Camping", 
    path: "/camping",
    icon: "https://images.unsplash.com/photo-1517824806704-9040b037703b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
    color: "bg-orange-100"
  },
  { 
    name: "4x4 Adventures", 
    path: "/four-x-four",
    icon: "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
    color: "bg-red-100"
  },
];

const Header = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: cartCount } = useQuery<number>({
    queryKey: ['/api/cart/count'],
    staleTime: 60000, // 1 minute
  });
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-10 w-10 text-primary"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
            <span className="font-heading font-bold text-xl md:text-2xl text-primary">OutdoorAdventures</span>
          </Link>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center space-x-8">
              <Link href="/" className="font-medium hover:text-secondary transition">Home</Link>
              <Link href="/shop" className="font-medium hover:text-secondary transition">Shop</Link>
              <Link href="/blog" className="font-medium hover:text-secondary transition">Blog</Link>
              <Link href="/contact" className="font-medium hover:text-secondary transition">Contact</Link>
            </nav>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {!isMobile && (
              <>
                <button className="bg-transparent border border-primary text-primary hover:bg-primary hover:text-white transition rounded-full px-4 py-2 font-medium">
                  Sign In
                </button>
                <button className="bg-secondary text-white hover:bg-secondary-dark transition rounded-full px-5 py-2 font-medium">
                  Join Now
                </button>
              </>
            )}
            <Link href="/cart" className="relative">
              <ShoppingCart className="text-neutral-dark hover:text-secondary transition" size={24} />
              {(typeof cartCount === 'number' && cartCount > 0) && (
                <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            {isMobile && (
              <button 
                className="text-neutral-dark" 
                onClick={toggleMobileMenu}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Activity Navigation Icons */}
        <div className="overflow-x-auto pb-4 mt-2">
          <div className="flex space-x-4 md:space-x-8 justify-center min-w-max py-2">
            {activities.map((activity) => {
              const isActive = activity.path === location;
              return (
                <Link
                  key={activity.path}
                  href={activity.path}
                  className="flex flex-col items-center group"
                >
                  <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden ${activity.color} mb-2 ${
                    isActive ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}>
                    <img 
                      src={activity.icon} 
                      alt={activity.name}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-primary bg-opacity-20" />
                    )}
                  </div>
                  <span className={`text-xs md:text-sm font-medium ${
                    isActive ? 'text-primary' : 'text-neutral-dark group-hover:text-secondary'
                  } transition text-center`}>
                    {activity.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Mega Menu */}
        {!isMobile && location !== "/" && activities.find(a => a.path === location) && (
          <div className="border-t border-neutral py-4 bg-white shadow-md">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-4 gap-8">
                <div>
                  <h3 className="font-heading font-bold text-lg mb-3 text-primary">Popular Activities</h3>
                  <ul className="space-y-2">
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition flex items-center gap-2"><MapPin size={14} /> Best Trails</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition flex items-center gap-2"><Calendar size={14} /> Seasonal Events</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition flex items-center gap-2"><Tag size={14} /> Special Offers</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition flex items-center gap-2"><BookOpen size={14} /> Guided Tours</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg mb-3 text-primary">Popular Destinations</h3>
                  <ul className="space-y-2">
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Yellowstone National Park</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Appalachian Trail</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Grand Canyon</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Rocky Mountains</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg mb-3 text-primary">Featured Gear</h3>
                  <ul className="space-y-2">
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Essential Equipment</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Clothing</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Safety Gear</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Navigation Tools</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg mb-3 text-primary">Resources</h3>
                  <ul className="space-y-2">
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Beginner Guides</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Advanced Techniques</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Safety Tips</Link></li>
                    <li><Link href="#" className="text-neutral-dark hover:text-secondary transition">Community Forums</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Menu */}
      {isMobile && (
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </header>
  );
};

export default Header;
