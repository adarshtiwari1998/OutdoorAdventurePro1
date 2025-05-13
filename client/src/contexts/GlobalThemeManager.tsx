import { createContext, useContext, useEffect, useState } from 'react';
import { hexToHSL } from './ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface CategoryStyle {
  id: number;
  category: string;
  primaryColor: string;
  primaryColorHSL: string;
  // Font family fields
  headingFont: string | null;
  bodyFont: string | null;
  navigationFont: string | null;
  buttonFont: string | null;
  displayFont: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GlobalThemeContextType {
  currentCategory: string | null;
  setCurrentCategory: (category: string | null) => void;
  resetTheme: () => void;
}

const defaultPrimaryColor = '#10b981'; // Default green from the main theme

const GlobalThemeContext = createContext<GlobalThemeContextType>({
  currentCategory: null,
  setCurrentCategory: () => {},
  resetTheme: () => {},
});

export const GlobalThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [location] = useLocation();
  
  // Fetch all category styles
  const { data: categoryStyles } = useQuery<CategoryStyle[]>({
    queryKey: ['/api/category-styles'],
    staleTime: 0,
    refetchOnMount: true
  });
  
  // Apply the theme when the category changes
  useEffect(() => {
    if (categoryStyles && currentCategory) {
      const style = categoryStyles.find(s => s.category === currentCategory);
      
      if (style) {
        // Apply color theme if available
        if (style.primaryColor) {
          applyTheme(style, style.primaryColorHSL);
          console.log(`🎨 Global theme manager: Applied theme for ${currentCategory}:`, style.primaryColor);
        }
      }
    }
  }, [currentCategory, categoryStyles]);
  
  // Set the right theme based on current location
  useEffect(() => {
    // Extract category from path
    const path = location.split('/')[1]; // Get first path segment
    
    if (!path) {
      // Home page - use the "home" category theme
      setCurrentCategory('home');
      console.log('🏠 Global theme manager: Setting home category theme');
    } else if (
      ['hiking', 'camping', 'fishing', 'four-x-four', 'cruising', 'outdoors'].includes(path)
    ) {
      // Landing page - set the category
      setCurrentCategory(path);
    } else if (path === 'admin') {
      // Admin pages - use admin theme
      setCurrentCategory('admin');
      console.log('👨‍💼 Global theme manager: Setting admin theme');
    } else {
      // Other pages - use default theme
      resetTheme();
      setCurrentCategory(null);
    }
  }, [location]);
  
  const resetTheme = () => {
    // Create a default style with only the primary color
    const defaultStyle: Partial<CategoryStyle> = {
      primaryColor: defaultPrimaryColor,
      primaryColorHSL: hexToHSL(defaultPrimaryColor),
      // Default fonts
      headingFont: 'Jost',
      bodyFont: 'Open Sans',
      navigationFont: 'Jost',
      buttonFont: 'Jost',
      displayFont: 'Jost'
    };
    
    applyTheme(defaultStyle, hexToHSL(defaultPrimaryColor));
    console.log('🎨 Global theme manager: Reset to default theme');
  };
  
  const applyTheme = (style: Partial<CategoryStyle> | string, hsl: string) => {
    // Handle both string and object parameters for backward compatibility
    const isStyleObject = typeof style === 'object';
    const hex = isStyleObject ? style.primaryColor || defaultPrimaryColor : style;
    
    // Apply CSS custom properties to root for colors
    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--theme-primary', hsl);
    document.documentElement.style.setProperty('--theme-primary-hex', hex);
    
    // Convert hex to RGB for CSS variables
    const hexToRgb = (hex: string): string => {
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Parse the hex values
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `${r}, ${g}, ${b}`;
    };
    
    // Set RGB value for gradient overlays and other effects
    document.documentElement.style.setProperty('--theme-primary-hex-rgb', hexToRgb(hex));
    
    // Calculate and set lighter and darker shades
    const [h, s, l] = hsl.split(' ');
    const lightL = parseInt(l) + 10;
    const darkL = parseInt(l) - 10;
    
    document.documentElement.style.setProperty('--primary-light', `${h} ${s} ${lightL < 100 ? lightL : 90}%`);
    document.documentElement.style.setProperty('--theme-primary-light', `${h} ${s} ${lightL < 100 ? lightL : 90}%`);
    document.documentElement.style.setProperty('--primary-dark', `${h} ${s} ${darkL > 0 ? darkL : 10}%`);
    document.documentElement.style.setProperty('--theme-primary-dark', `${h} ${s} ${darkL > 0 ? darkL : 10}%`);
    
    // Apply font families if they are defined
    if (isStyleObject) {
      // Apply heading font
      if (style.headingFont) {
        document.documentElement.style.setProperty('--font-heading', style.headingFont);
        const fontClass = `.font-heading, h1, h2, h3, h4, h5, h6 { font-family: "${style.headingFont}", sans-serif !important; }`;
        updateOrCreateStyleTag('heading-font-style', fontClass);
      }
      
      // Apply body font
      if (style.bodyFont) {
        document.documentElement.style.setProperty('--font-body', style.bodyFont);
        const fontClass = `body, p, div, .font-body { font-family: "${style.bodyFont}", sans-serif !important; }`;
        updateOrCreateStyleTag('body-font-style', fontClass);
      }
      
      // Apply navigation font
      if (style.navigationFont) {
        document.documentElement.style.setProperty('--font-navigation', style.navigationFont);
        const fontClass = `nav, .nav, .navbar, .font-navigation { font-family: "${style.navigationFont}", sans-serif !important; }`;
        updateOrCreateStyleTag('navigation-font-style', fontClass);
      }
      
      // Apply button font
      if (style.buttonFont) {
        document.documentElement.style.setProperty('--font-button', style.buttonFont);
        const fontClass = `button, .button, .btn, .font-button { font-family: "${style.buttonFont}", sans-serif !important; }`;
        updateOrCreateStyleTag('button-font-style', fontClass);
      }
      
      // Apply display font
      if (style.displayFont) {
        document.documentElement.style.setProperty('--font-display', style.displayFont);
        const fontClass = `.display, .hero-title, .font-display { font-family: "${style.displayFont}", sans-serif !important; }`;
        updateOrCreateStyleTag('display-font-style', fontClass);
      }
      
      // Log applied fonts
      console.log('🔤 Fonts applied:', {
        heading: style.headingFont || 'default',
        body: style.bodyFont || 'default',
        navigation: style.navigationFont || 'default',
        button: style.buttonFont || 'default',
        display: style.displayFont || 'default'
      });
    }
    
    console.log(`🎨 Theme applied: ${hex} | HSL: ${hsl} | RGB: ${hexToRgb(hex)}`);
  };
  
  // Helper function to update or create a style tag
  const updateOrCreateStyleTag = (id: string, cssContent: string) => {
    let styleTag = document.getElementById(id);
    
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = id;
      document.head.appendChild(styleTag);
    }
    
    styleTag.innerHTML = cssContent;
  };
  
  return (
    <GlobalThemeContext.Provider
      value={{
        currentCategory,
        setCurrentCategory,
        resetTheme,
      }}
    >
      {children}
    </GlobalThemeContext.Provider>
  );
};

export const useGlobalTheme = () => useContext(GlobalThemeContext);