import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import MobileMenu from "./MobileMenu";
import MegaMenu from "./MegaMenu";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingCart, 
  ChevronDown,
  Search,
  User,
  Menu
} from "lucide-react";
import { Button } from "../ui/button";

// Define the header configuration interfaces (same as CategoryHeader)
interface MegaMenuItem {
  id: string | number;
  label: string;
  path: string;
  order: number;
  featuredItem?: boolean;
  categoryId: number;
  createdAt: string;
}

interface MegaMenuCategory {
  id: string | number;
  title: string;
  order: number;
  menuItemId: number;
  createdAt: string;
  items: MegaMenuItem[];
}

interface HeaderMenuItem {
  id: string | number;
  label: string;
  path: string;
  order: number;
  hasMegaMenu: boolean;
  createdAt: string;
  megaMenuCategories?: MegaMenuCategory[];
}

interface HeaderConfig {
  id: string | number;
  category: string;
  logoSrc: string;
  logoText: string;
  primaryColor: string;
  bannerText?: string;
  menuItems: HeaderMenuItem[];
  createdAt: string;
  updatedAt: string;
}

// Default header config for fallback
const defaultConfig: Omit<HeaderConfig, 'id' | 'category' | 'createdAt' | 'updatedAt'> = {
  logoSrc: "/logo.svg",
  logoText: "Outdoor Enthusiast",
  primaryColor: "#3B82F6",
  bannerText: "Your ultimate guide to outdoor adventures and experiences",
  menuItems: [
    { id: "default-1", label: "Destinations", path: "/destinations", order: 0, hasMegaMenu: false, createdAt: '' },
    { id: "default-2", label: "Gear", path: "/shop", order: 1, hasMegaMenu: false, createdAt: '' },
    { id: "default-3", label: "Blog", path: "/blog", order: 2, hasMegaMenu: false, createdAt: '' },
    { id: "default-4", label: "Community", path: "/community", order: 3, hasMegaMenu: false, createdAt: '' }
  ]
};

const HomeHeader = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<number | null>(null);
  const [isHoveringMegaMenu, setIsHoveringMegaMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuTimeoutRef = useRef<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
const [showMainHeader, setShowMainHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollThreshold = 50;
          
          if (currentScrollY > scrollThreshold) {
            setIsScrolled(true);
            setShowMainHeader(currentScrollY <= lastScrollY);
          } else {
            setIsScrolled(false);
            setShowMainHeader(true);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Fetch header configuration from API for the home page
  const { data: headerData, isLoading, error } = useQuery<HeaderConfig>({
    queryKey: ['/api/header-configs/category/home'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine which config to use - API data or default
  const headerConfig = headerData || {
    ...defaultConfig,
    id: 0,
    category: 'home',
    createdAt: '',
    updatedAt: ''
  };

  const { data: cartCount } = useQuery<number>({
    queryKey: ['/api/cart/count'],
    staleTime: 60000, // 1 minute
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle mega menu activation on hover
  const handleMenuMouseEnter = (itemId: number) => {
    if (menuTimeoutRef.current) {
      window.clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setActiveMegaMenu(itemId);
  };

  // Handle mouse leave events for mega menu
  const handleMenuMouseLeave = () => {
    if (menuTimeoutRef.current) {
      window.clearTimeout(menuTimeoutRef.current);
    }

    menuTimeoutRef.current = window.setTimeout(() => {
      if (!isHoveringMegaMenu) {
        setActiveMegaMenu(null);
      }
    }, 150);
  };

  // Handle mouse events for the mega menu itself
  const handleMegaMenuMouseEnter = () => {
    setIsHoveringMegaMenu(true);
    if (menuTimeoutRef.current) {
      window.clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  };

  const handleMegaMenuMouseLeave = () => {
    setIsHoveringMegaMenu(false);
    if (menuTimeoutRef.current) {
      window.clearTimeout(menuTimeoutRef.current);
    }
    menuTimeoutRef.current = window.setTimeout(() => {
      setActiveMegaMenu(null);
    }, 150);
  };

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        window.clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  // Close mega menu when clicking outside or navigating away
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveMegaMenu(null);
        setIsHoveringMegaMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Close mega menu when navigating to a new route
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      setActiveMegaMenu(null);
      setIsHoveringMegaMenu(false);
    };
  }, []);

  // Get the active menu item with mega menu data
  const activeMenuItem = activeMegaMenu !== null 
    ? headerConfig.menuItems.find(item => item.id === activeMegaMenu)
    : null;

  // Fetch available activities for the activity cards
  const { data: activities } = useQuery<HeaderConfig[]>({
    queryKey: ['/api/admin/header-configs'],
    select: (data) => data.filter(config => config.category !== 'home'), // Exclude home
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <header ref={headerRef} className={`bg-white shadow-md sticky top-0 z-50 ${!showMainHeader && isScrolled ? 'pt-0' : ''}`}>
      {/* Banner announcement */}
      {headerConfig.bannerText && (
        <div className="py-1 px-4 text-center text-white bg-theme text-xs md:text-sm">
          {headerConfig.bannerText}
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className={`flex justify-between items-center py-4 transition-all duration-300 ${isScrolled ? 'hidden' : ''}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              <img 
                src={headerConfig.logoSrc || '/logo.svg'} 
                alt={headerConfig.logoText}
                className="w-full h-full object-cover"
              />
            </div>
            {/* <span className="font-heading font-bold text-xl md:text-2xl text-theme">
              {headerConfig.logoText}
            </span> */}
          </Link>

          {/* Main Navigation - Desktop */}
          {!isMobile && (
            <nav className="flex items-center space-x-8">
              {headerConfig.menuItems.map((item) => (
                <div 
                  key={typeof item.id === 'string' ? item.id : `menu-${item.id}`}
                  className="relative"
                  onMouseEnter={() => {
                    if (item.hasMegaMenu && typeof item.id === 'number') {
                      handleMenuMouseEnter(item.id);
                    }
                  }}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <Link 
                    href={item.path} 
                    className={`font-medium hover:text-theme transition flex items-center gap-1 ${activeMegaMenu === item.id ? 'text-theme' : ''}`}
                    onClick={() => setActiveMegaMenu(null)}
                  >
                    {item.label}
                    {item.hasMegaMenu && <ChevronDown size={16} />}
                  </Link>
                </div>
              ))}
            </nav>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {!isMobile && (
              <>
                <button className="bg-transparent border border-theme text-theme hover:bg-theme hover:text-white transition rounded-full px-4 py-2 font-medium">
                  Sign In
                </button>
                <button className="bg-orange-500 text-white hover:bg-theme-dark transition rounded-full px-5 py-2 font-medium">
                  Join Now
                </button>
              </>
            )}
            <Link href="/cart" className="relative">
              <ShoppingCart className="text-gray-700 hover:text-theme transition" size={24} />
              {(typeof cartCount === 'number' && cartCount > 0) && (
                <span className="absolute -top-2 -right-2 bg-theme text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            {isMobile && (
              <button 
                className="text-gray-700 hover:text-theme transition" 
                onClick={toggleMobileMenu}
              >
                <Menu size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Activity Shortcuts */}
        {!isMobile && (
          <div className={`flex justify-between items-center container mx-auto px-4 transition-all duration-300 ease-in-out ${isScrolled ? 'fixed top-0 left-0 right-0 bg-white shadow-md z-50 py-2 opacity-100 translate-y-0' : 'mt-4 -translate-y-1 opacity-100'}`}>
            <Link href="/" className="flex items-center">
              {isScrolled && (
                 <>
              <div className="w-20 h-20 rounded-full overflow-hidden">        
                <img 
                  src={headerConfig.logoSrc} 
                  alt={headerConfig.logoText}
                  className="w-full h-full object-cover"
                />
              
              </div>
                </>
                )}
            </Link>
            <div className="flex items-center gap-4 p-2">
              <span className="font-heading font-bold text-xl md:text-2xl text-theme">
                {headerConfig.logoText}
              </span>
              {activities?.slice(0, 6).map((activity) => (
                <Link 
                  key={activity.id} 
                  href={`/${activity.category}`}
                  className="flex flex-col items-center group"
                > 
                  <div 
                    className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-theme transition-all duration-200"
                    style={{ borderColor: activity.primaryColor }}
                  >
                    <img 
                      src={activity.logoSrc} 
                      alt={activity.logoText} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* <span 
                    className="mt-2 text-sm font-medium group-hover:font-semibold transition-all duration-200"
                    style={{ color: activity.primaryColor }}
                  >
                    {activity.logoText}
                  </span> */}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {isScrolled && (
                <>
                  <button className="bg-transparent border border-theme text-theme hover:bg-theme hover:text-white transition rounded-full px-4 py-2 font-medium">
                    Sign In
                  </button>
                  <button className="bg-orange-500 text-white hover:bg-theme-dark transition rounded-full px-5 py-2 font-medium">
                    Join Now
                  </button>
                </>
              )}
              <Link href="/cart" className="relative">
                <ShoppingCart className="text-gray-700 hover:text-theme transition" size={24} />
                {(typeof cartCount === 'number' && cartCount > 0) && (
                  <span className="absolute -top-2 -right-2 bg-theme text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && (
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mega Menu Display */}
      {!isMobile && activeMenuItem?.megaMenuCategories && activeMenuItem.megaMenuCategories.length > 0 && (
        <MegaMenu 
          categories={activeMenuItem.megaMenuCategories} 
          isOpen={activeMegaMenu !== null} 
          colorClass="text-theme"
          onClose={() => setActiveMegaMenu(null)}
          onMouseEnter={handleMegaMenuMouseEnter}
          onMouseLeave={handleMegaMenuMouseLeave}
        />
      )}
    </header>
  );
};

export default HomeHeader;