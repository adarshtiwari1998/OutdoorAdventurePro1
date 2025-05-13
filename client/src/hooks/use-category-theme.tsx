import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useGlobalTheme } from "@/contexts/GlobalThemeManager";

interface CategoryStyle {
  id: number;
  category: string;
  primaryColor: string;
  primaryColorHSL: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A hook that loads and applies the theme for a specific category page
 * @param category The category slug (e.g., 'hiking', 'camping', 'four-x-four')
 * @returns The loaded category style object
 */
export function useCategoryTheme(category: string) {
  const { setCurrentCategory } = useGlobalTheme();
  
  // Fetch all category styles
  const { data: categoryStyles, isLoading } = useQuery<CategoryStyle[]>({
    queryKey: ['/api/category-styles'],
  });
  
  // Register this category with the global theme manager
  useEffect(() => {
    if (category) {
      setCurrentCategory(category);
    }
    
    // When the component unmounts, we don't reset the theme here
    // because that's handled by the GlobalThemeManager
  }, [category, setCurrentCategory]);
  
  // Find the current category style
  const currentStyle = categoryStyles?.find(s => s.category === category);
  
  return {
    categoryStyle: currentStyle,
    isLoading
  };
}