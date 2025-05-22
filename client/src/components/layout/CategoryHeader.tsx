import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import MobileMenu from "./MobileMenu";
import MegaMenu from "./MegaMenu";
import ActivitySelector from "../navigation/ActivitySelector";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingCart, 
  ChevronDown,
  MapPin, 
  Calendar, 
  Tag, 
  BookOpen, 
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeButton } from "@/components/ui/theme-button";
import { useTheme } from "@/contexts/ThemeContext";

// Define the header configuration interfaces
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
  logoText: "Outdoor Adventures",
  primaryColor: "#3B82F6",
  menuItems: [
    { id: "default-1", label: "Home", path: "/", order: 0, hasMegaMenu: false, createdAt: '' },
    { id: "default-2", label: "Shop", path: "/shop", order: 1, hasMegaMenu: false, createdAt: '' },
    { id: "default-3", label: "Blog", path: "/blog", order: 2, hasMegaMenu: false, createdAt: '' },
    { id: "default-4", label: "Contact", path: "/contact", order: 3, hasMegaMenu: false, createdAt: '' }
  ]
};

// Map of color HEX values to Tailwind classes
const colorMap: Record<string, string> = {
  "#3B82F6": "text-blue-500",
  "#10B981": "text-green-500",
  "#F97316": "text-orange-500",
  "#F59E0B": "text-amber-500",
  "#06B6D4": "text-cyan-500",
  "#EF4444": "text-red-500",
  "#8B5CF6": "text-violet-500",
  "#7e3af2": "text-violet-600", // Additional violet shade
  "#1e40af": "text-blue-800",   // Dark blue
  "#b91c1c": "text-red-700",    // Dark red
  "#0d9488": "text-teal-600",   // Teal
  "#0369a1": "text-blue-700",   // Dark blue shade
  "#4b5563": "text-gray-600",   // Gray
  "#a16207": "text-amber-700",  // Dark amber
  "#1f2937": "text-gray-800",   // Dark gray
  "#7c2d12": "text-orange-900"  // Dark orange
};

const CategoryHeader = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<number | null>(null);
  const [isHoveringMegaMenu, setIsHoveringMegaMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuTimeoutRef = useRef<number | null>(null);

  // Determine the current category from the URL path
  const currentPath = location.split('/')[1]; // Gets "hiking", "camping", etc.

  // Fetch header configuration from API
  const { data: headerData, isLoading, error } = useQuery<HeaderConfig>({
    queryKey: [`/api/header-configs/category/${currentPath}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!currentPath, // Only run if we have a path
    retry: false
  });

  // Determine which config to use - API data or default
  const headerConfig = headerData || {
    ...defaultConfig,
    id: 0,
    category: currentPath,
    createdAt: '',
    updatedAt: ''
  };

  // Access the theme context
  const { setPrimaryColor } = useTheme();

  // Map color to Tailwind class or prepare inline style
  const colorClass = headerConfig.primaryColor ? 
    (colorMap[headerConfig.primaryColor] || 'text-primary') : 
    'text-primary';

  // Determine if we need inline style (when no matching Tailwind class exists)
  const useInlineStyle = headerConfig.primaryColor && !colorMap[headerConfig.primaryColor];

  // Update the theme color when header config changes
  useEffect(() => {
    if (headerConfig?.primaryColor) {
      setPrimaryColor(headerConfig.primaryColor);
    }
  }, [headerConfig?.primaryColor, setPrimaryColor]);

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

  return (
    <header ref={headerRef} className="bg-white shadow-md sticky top-0 z-50 relative">
      {/* Optional Banner for category-specific announcements */}
      {headerConfig.bannerText && (
        <div className={`py-1 px-4 text-center text-white bg-gradient-to-r from-primary to-secondary text-xs md:text-sm`}>
          {headerConfig.bannerText}
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Category-specific Logo */}
          <Link href={`/${currentPath}`} className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img 
                src={headerConfig.logoSrc || '/logo.svg'} 
                alt={headerConfig.logoText}
                className="w-full h-full object-cover"
              />
            </div>
            {useInlineStyle ? (
              <span 
                className="font-heading font-bold text-xl md:text-2xl" 
                style={{ color: headerConfig.primaryColor }}
              >
                {headerConfig.logoText}
              </span>
            ) : (
              <span className={`font-heading font-bold text-xl md:text-2xl ${colorClass}`}>
                {headerConfig.logoText}
              </span>
            )}
          </Link>

          {/* Category-specific Navigation - Desktop */}
          {!isMobile && (
            <nav className="flex items-center space-x-8">
              {headerConfig.menuItems.map((item) => (
                <div 
                  key={typeof item.id === 'string' ? item.id : `menu-${item.id}`}
                  className="relative mega-menu-trigger"
                  onMouseEnter={() => {
                    if (item.hasMegaMenu && typeof item.id === 'number') {
                      console.log(`Mouse entered menu item ${item.label} with id ${item.id}`);
                      handleMenuMouseEnter(item.id);
                    }
                  }}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <Link 
                    href={item.path} 
                    className={`font-medium transition flex items-center gap-1 hover:text-theme ${activeMegaMenu === item.id ? 'text-theme' : ''}`}
                    onClick={() => setActiveMegaMenu(null)}
                  >
                    {item.label}
                    {item.hasMegaMenu && (
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${activeMegaMenu === item.id ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>
                </div>
              ))}
            </nav>
          )}

          {/* Action Buttons - Same across categories */}
          <div className="flex items-center space-x-4">
            {!isMobile && (
              <>
                <ThemeButton variant="outline" className="rounded-full font-medium">
                  Sign In
                </ThemeButton>
                <ThemeButton 
                  variant="default" 
                  className="rounded-full font-medium bg-secondary hover:bg-secondary-dark text-white"
                >
                  Join Now
                </ThemeButton>
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
                <Menu size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Category-specific Submenu */}
        {!isMobile && (
          <div className="py-2 border-t border-neutral overflow-x-auto">
            <div className="flex justify-between items-center">
              <div className="flex space-x-6">
                <Link href={`/${currentPath}/popular`} className="text-sm font-medium text-neutral-dark hover:text-theme flex items-center gap-1">
                  <MapPin size={14} /> Popular Destinations
                </Link>
                <Link href={`/${currentPath}/seasonal`} className="text-sm font-medium text-neutral-dark hover:text-theme flex items-center gap-1">
                  <Calendar size={14} /> Seasonal Activities
                </Link>
                <Link href={`/${currentPath}/deals`} className="text-sm font-medium text-neutral-dark hover:text-theme flex items-center gap-1">
                  <Tag size={14} /> Special Deals
                </Link>
                <Link href={`/${currentPath}/guides`} className="text-sm font-medium text-neutral-dark hover:text-theme flex items-center gap-1">
                  <BookOpen size={14} /> Guides & Tips
                </Link>
              </div>

              {/* Activity Selector for switching between different landing pages */}
              <ActivitySelector />
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
          colorClass={colorClass}
          onClose={() => setActiveMegaMenu(null)}
          onMouseEnter={handleMegaMenuMouseEnter}
          onMouseLeave={handleMegaMenuMouseLeave}
        />
      )}
    </header>
  );
};

export default CategoryHeader;