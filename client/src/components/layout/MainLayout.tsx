import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "./Header";
import HomeHeader from "./HomeHeader";
import CategoryHeader from "./CategoryHeader";
import Footer from "./Footer";
import { useTheme } from "@/contexts/ThemeContext";
import { hexToHSL } from "@/contexts/ThemeContext";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [location] = useLocation();
  const { setPrimaryColor } = useTheme();
  
  // Array of category pages with their pathname
  const categoryPages = [
    "/hiking", 
    "/camping", 
    "/fishing", 
    "/cruising",
    "/outdoors",
    "/four-x-four"
  ];
  
  // Extract the current category from the location
  const getCurrentCategory = (): string => {
    if (location === '/') return 'home';
    
    for (const page of categoryPages) {
      if (location === page || location.startsWith(`${page}/`)) {
        return page.slice(1); // Remove the leading slash
      }
    }
    
    return 'home'; // Default to home theme if not on a category page
  };
  
  // Fetch category style from API
  const { data: categoryStyle } = useQuery({
    queryKey: ['/api/category-styles', getCurrentCategory()],
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Define the type for category style
  interface CategoryStyle {
    primaryColor: string;
    primaryColorHSL: string;
    category: string;
  }
  
  // Apply category style when it changes
  useEffect(() => {
    if (categoryStyle) {
      const style = categoryStyle as CategoryStyle;
      if (style && style.primaryColor) {
        setPrimaryColor(style.primaryColor);
        // Also update the CSS custom property for immediate visual update
        document.documentElement.style.setProperty('--theme-primary', style.primaryColorHSL);
        console.log(`🎨 MainLayout: Applied style for ${style.category} category:`, style.primaryColor, style.primaryColorHSL);
      } else {
        console.log('⚠️ MainLayout: Style object found but no primaryColor defined');
      }
    } else {
      console.log('⚠️ MainLayout: No category style found for:', getCurrentCategory());
    }
  }, [categoryStyle, setPrimaryColor]);
  
  // Determine if we need to use a category-specific header
  const useCategoryHeader = () => {
    // Check if the current location is a category page or its subpage
    return categoryPages.some(page => 
      location === page || location.startsWith(`${page}/`)
    );
  };
  
  // Determine which header to use based on location
  const getHeader = () => {
    if (location === '/') {
      return <HomeHeader />;
    } else if (useCategoryHeader()) {
      return <CategoryHeader />;
    } else {
      return <Header />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {getHeader()}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
