import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  primaryColor: string;
  primaryColorHex: string;
  setPrimaryColor: (color: string) => void;
  resetToDefault: () => void;
}

const defaultPrimaryColor = '#3B82F6'; // Default blue

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: defaultPrimaryColor,
  primaryColorHex: defaultPrimaryColor,
  setPrimaryColor: () => {},
  resetToDefault: () => {},
});

// Convert hex to HSL string for CSS variables
export function hexToHSL(hex: string): string {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB first
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  // Normalize RGB values
  r /= 255;
  g /= 255;
  b /= 255;
  
  // Find min and max values to calculate hue and saturation
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else if (max === b) {
      h = (r - g) / d + 4;
    }
    
    h /= 6;
  }
  
  // Convert to HSL format
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState<string>(defaultPrimaryColor);
  
  const resetToDefault = () => {
    setPrimaryColor(defaultPrimaryColor);
  };
  
  // Apply the theme CSS variables when the primary color changes
  useEffect(() => {
    // Convert color to HSL values for CSS variables
    if (!primaryColor) return;
    
    const hslValue = hexToHSL(primaryColor);
    
    document.documentElement.style.setProperty('--theme-primary', hslValue);
    document.documentElement.style.setProperty('--theme-primary-hex', primaryColor);
    
    // Also set lighter and darker shades if needed
    const [h, s, l] = hslValue.split(' ');
    const lightL = parseInt(l) + 10;
    const darkL = parseInt(l) - 10;
    
    document.documentElement.style.setProperty('--theme-primary-light', `${h} ${s} ${lightL < 100 ? lightL : 90}%`);
    document.documentElement.style.setProperty('--theme-primary-dark', `${h} ${s} ${darkL > 0 ? darkL : 10}%`);
  }, [primaryColor]);
  
  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        primaryColorHex: primaryColor,
        setPrimaryColor,
        resetToDefault,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);