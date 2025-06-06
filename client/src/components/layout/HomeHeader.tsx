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
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollThreshold = 150; // When to switch to fixed header mode
          const hideThreshold = 200; // When to start hiding header on scroll down

          // Calculate scroll direction and speed
          const scrollDelta = currentScrollY - lastScrollY;
          const scrollingDown = scrollDelta > 0;
          const scrollingUp = scrollDelta < 0;
          const isScrollingFast = Math.abs(scrollDelta) > 2;

          // Near the top - always show normal header
          if (currentScrollY <= scrollThreshold) {
            setIsScrolled(false);
            setShowMainHeader(true);
            setLastScrollY(currentScrollY);
            ticking = false;
            return;
          }

          // Past threshold - enable fixed header behavior
          setIsScrolled(true);
          
          // Show fixed header immediately when scrolling down past threshold
          if (scrollingDown && currentScrollY > scrollThreshold) {
            setShowMainHeader(true);
          }
          // Hide header when scrolling down fast and past hide threshold
          else if (scrollingDown && isScrollingFast && currentScrollY > hideThreshold) {
            setShowMainHeader(false);
          } 
          // Show header when scrolling up
          else if (scrollingUp) {
            setShowMainHeader(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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
    <header ref={headerRef} className={`bg-white shadow-md smooth-header-transition ${isScrolled ? 'fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-white/95' : 'sticky top-0 z-50'} ${!showMainHeader && isScrolled ? 'header-hidden' : 'header-show'}`}>
      {/* Banner announcement - only show when not scrolled */}
      {headerConfig.bannerText && !isScrolled && (
        <div className="py-1 px-4 text-center text-white bg-theme text-xs md:text-sm">
          {headerConfig.bannerText}
        </div>
      )}

      {/* Main Header Content */}
      <div className="w-full bg-white">
        {/* Activity Circles Section - Only show when not scrolled */}
        {!isScrolled && (
          <div className="w-full border-b border-gray-100">
            {/* Desktop Layout */}
            {!isMobile && (
              <div className="px-4 py-6">
                <div className="relative flex items-center justify-between">
                  {/* Home Logo and Text - Left side */}
                  <div className="flex items-center z-10">
                    <Link href="/" className="flex items-center space-x-3">
                      <img 
                        src={headerConfig.logoSrc} 
                        alt={headerConfig.logoText} 
                        className="h-16 w-16 object-cover rounded-full"
                      />
                      <span className="font-heading font-bold text-2xl text-theme whitespace-nowrap">
                        {headerConfig.logoText}
                      </span>
                    </Link>
                  </div>

                  {/* Activity Circles - Center */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-4">
                    {activities?.slice(0, 6).map((activity) => (
                      <Link 
                        key={activity.id} 
                        href={`/${activity.category}`}
                        className="flex flex-col items-center group"
                      > 
                        <div 
                          className="w-20 h-20 rounded-full overflow-hidden border-3 border-transparent group-hover:border-theme transition-all duration-200 shadow-lg"
                          style={{ borderColor: activity.primaryColor }}
                        >
                          <img 
                            src={activity.logoSrc} 
                            alt={activity.logoText} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Right side placeholder for balance */}
                  <div className="w-16"></div>
                </div>
              </div>
            )}

            {/* Mobile Layout */}
            {isMobile && (
              <div className="px-4 py-4">
                {/* Logo Row - Left aligned */}
                <div className="flex items-center justify-start mb-4">
                  <Link href="/" className="flex items-center space-x-3">
                    <img 
                      src={headerConfig.logoSrc} 
                      alt={headerConfig.logoText} 
                      className="h-14 w-14 object-cover rounded-full"
                    />
                    <span className="font-heading font-bold text-lg text-theme">
                      {headerConfig.logoText}
                    </span>
                  </Link>
                </div>

                {/* Activity Circles Row with Horizontal Scroll - Left aligned */}
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex items-center justify-start gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                    {activities?.map((activity) => (
                      <Link 
                        key={activity.id} 
                        href={`/${activity.category}`}
                        className="flex flex-col items-center group flex-shrink-0"
                      > 
                        <div 
                          className="w-12 h-12 rounded-full overflow-hidden border border-transparent group-hover:border-theme transition-all duration-200 shadow-md"
                          style={{ borderColor: activity.primaryColor }}
                        >
                          <img 
                            src={activity.logoSrc} 
                            alt={activity.logoText} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Section */}
        <div className="w-full bg-white">
          {/* Scrolled Header Layout - Compact */}
          {isScrolled ? (
            <div className="px-4 py-3">
              {/* Desktop Scrolled Layout */}
              {!isMobile && (
                <div>
                  <div className="flex items-center justify-between">
                    {/* Logo and Activity Circles - Left side */}
                    <div className="flex items-center gap-4">
                      <Link href="/" className="flex items-center space-x-2">
                        <img 
                          src={headerConfig.logoSrc} 
                          alt={headerConfig.logoText} 
                          className="h-10 w-10 object-cover rounded-full"
                        />
                        <span className="font-heading font-bold text-lg text-theme whitespace-nowrap">
                          {headerConfig.logoText}
                        </span>
                      </Link>

                      {/* Activity Circles - Compact */}
                      <div className="flex items-center justify-center gap-2 ml-4">
                        {activities?.slice(0, 5).map((activity) => (
                          <Link 
                            key={activity.id} 
                            href={`/${activity.category}`}
                            className="group"
                          > 
                            <div 
                              className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-theme transition-all duration-200 shadow-md"
                              style={{ borderColor: activity.primaryColor }}
                            >
                              <img 
                                src={activity.logoSrc} 
                                alt={activity.logoText} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Right side - Search and Actions */}
                    <div className="flex items-center space-x-4">
                      {/* Search Bar */}
                      <div className="flex-1 max-w-md">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            placeholder="Search destinations, activities..."
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-theme focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button className="bg-transparent border border-theme text-theme hover:bg-theme hover:text-white transition rounded-full px-3 py-1.5 font-medium text-sm">
                          Sign In
                        </button>
                        <button className="bg-orange-500 text-white hover:bg-theme-dark transition rounded-full px-3 py-1.5 font-medium text-sm">
                          Join Now
                        </button>
                        <Link href="/cart" className="relative">
                          <ShoppingCart className="text-gray-700 hover:text-theme transition" size={18} />
                          {(typeof cartCount === 'number' && cartCount > 0) && (
                            <span className="absolute -top-2 -right-2 bg-theme text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {cartCount > 9 ? '9+' : cartCount}
                            </span>
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Menu in Second Row */}
                  <div className="flex justify-center mt-2">
                    <nav className="flex items-center space-x-4">
                      {headerConfig.menuItems.map((item) => (
                        <div 
                          key={typeof item.id === 'string' ? item.id : `menu-${item.id}`}
                          className="relative"
                        >
                          <Link 
                            href={item.path} 
                            className="font-medium hover:text-theme transition flex items-center gap-1"
                            onClick={() => setActiveMegaMenu(null)}
                          >
                            {item.label}
                            {item.hasMegaMenu && <ChevronDown size={16} />}
                          </Link>
                        </div>
                      ))}
                    </nav>
                  </div>
                </div>
              )}

              {/* Mobile Scrolled Layout - Google Style */}
              {isMobile && (
                <div className="flex items-center justify-between py-1">
                  {/* Left side - Logo and Activity Circles with Scroll */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                      <img 
                        src={headerConfig.logoSrc} 
                        alt={headerConfig.logoText} 
                        className="h-12 w-12 object-cover rounded-full"
                      />
                      <span className="font-heading font-bold text-base text-theme whitespace-nowrap">
                        {headerConfig.logoText.split(' ')[0]}
                      </span>
                    </Link>

                    {/* Activity Circles with Horizontal Scroll */}
                    <div className="overflow-x-auto scrollbar-hide flex-1">
                      <div className="flex items-center gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                        {activities?.slice(0, 6).map((activity) => (
                          <Link 
                            key={activity.id} 
                            href={`/${activity.category}`}
                            className="group flex-shrink-0"
                          > 
                            <div 
                              className="w-8 h-8 rounded-full overflow-hidden border border-transparent group-hover:border-theme transition-all duration-200 shadow-sm"
                              style={{ borderColor: activity.primaryColor }}
                            >
                              <img 
                                src={activity.logoSrc} 
                                alt={activity.logoText} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <Link href="/cart" className="relative">
                      <ShoppingCart className="text-gray-700 hover:text-theme transition" size={20} />
                      {(typeof cartCount === 'number' && cartCount > 0) && (
                        <span className="absolute -top-1 -right-1 bg-theme text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {cartCount > 9 ? '9+' : cartCount}
                        </span>
                      )}
                    </Link>
                    <button 
                      className="text-gray-700 hover:text-theme transition p-1" 
                      onClick={toggleMobileMenu}
                    >
                      <Menu size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Normal Layout - Navigation row */
            <div className="px-4 py-3">
              {/* Desktop Normal Layout */}
              {!isMobile && (
                <div className="flex justify-between items-center">
                  {/* Main Navigation - Desktop - Centered */}
                  <div className="flex-1 flex justify-center">
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
                  </div>

                  {/* Search Bar and Action Buttons */}
                  <div className="flex items-center space-x-4">
                    {/* Search Bar */}
                    <div className="max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search destinations, activities..."
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-theme focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      <button className="bg-transparent border border-theme text-theme hover:bg-theme hover:text-white transition rounded-full px-4 py-2 font-medium text-sm">
                        Sign In
                      </button>
                      <button className="bg-orange-500 text-white hover:bg-theme-dark transition rounded-full px-4 py-2 font-medium text-sm">
                        Join Now
                      </button>
                      <Link href="/cart" className="relative">
                        <ShoppingCart className="text-gray-700 hover:text-theme transition" size={20} />
                        {(typeof cartCount === 'number' && cartCount > 0) && (
                          <span className="absolute -top-2 -right-2 bg-theme text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cartCount > 9 ? '9+' : cartCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Normal Layout - Google Style Single Row */}
              {isMobile && (
                <div className="flex items-center justify-between">
                  {/* Search Bar - Takes most space */}
                  <div className="flex-1 mr-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search destinations, activities..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-theme focus:border-transparent text-sm bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <Link href="/cart" className="relative">
                      <ShoppingCart className="text-gray-700 hover:text-theme transition" size={22} />
                      {(typeof cartCount === 'number' && cartCount > 0) && (
                        <span className="absolute -top-1 -right-1 bg-theme text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {cartCount > 9 ? '9+' : cartCount}
                        </span>
                      )}
                    </Link>
                    <button 
                      className="text-gray-700 hover:text-theme transition p-1" 
                      onClick={toggleMobileMenu}
                    >
                      <Menu size={22} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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