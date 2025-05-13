import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { HexColorPicker } from "react-colorful";
import { useQuery, useMutation } from "@tanstack/react-query";
import { hexToHSL } from "@/contexts/ThemeContext";
import { ThemeButton } from "@/components/ui/theme-button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CategoryStyle {
  id: number;
  category: string;
  primaryColor: string;
  primaryColorHSL: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to get the display name for a category
const getCategoryDisplayName = (category: string): string => {
  const displayNames: Record<string, string> = {
    'home': 'Home',
    'outdoors': 'Outdoors',
    'cruising': 'Cruising',
    'fishing': 'Fishing',
    'hiking': 'Hiking',
    'camping': 'Camping',
    'four-x-four': '4x4 Adventures'
  };
  
  return displayNames[category] || category;
};

const LandingPageStyle = () => {
  const { toast } = useToast();
  // Extract the category from the URL path
  const [location] = useLocation();
  const category = location.split('/').pop() || "home";
  const [colorValue, setColorValue] = useState<string>("#3B82F6");
  const [hslPreview, setHslPreview] = useState<string>("220 93% 60%");
  
  // Fetch all category styles
  const { data: categoryStyles, refetch } = useQuery<CategoryStyle[]>({
    queryKey: ['/api/category-styles'],
  });
  
  // Create or update a category style
  const updateStyleMutation = useMutation({
    mutationFn: async (data: { category: string; primaryColor: string }) => {
      return apiRequest('POST', '/api/category-styles', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Colors for ${getCategoryDisplayName(category)} page updated successfully.`,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category colors. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating category colors:", error);
    }
  });
  
  // Handle saving the color
  const handleSaveColor = () => {
    updateStyleMutation.mutate({
      category: category,
      primaryColor: colorValue
    });
  };
  
  // Set the color picker to the category's color when data loads
  useEffect(() => {
    if (categoryStyles && category) {
      const style = categoryStyles.find(s => s.category === category);
      if (style) {
        setColorValue(style.primaryColor);
      }
    }
  }, [category, categoryStyles]);
  
  // Update HSL preview when color changes
  useEffect(() => {
    setHslPreview(hexToHSL(colorValue));
  }, [colorValue]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">{getCategoryDisplayName(category)} Landing Page Colors</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Customize the primary colors for the {getCategoryDisplayName(category)} landing page. 
          These colors will be used for buttons, links, icons, and accent elements throughout the page.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Category info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Selected Landing Page</h3>
            <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
              <div className="text-xl font-medium mb-2">{getCategoryDisplayName(category)}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">Path: /{category === 'home' ? '' : category}</div>
              
              {categoryStyles?.find(s => s.category === category) && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Last updated: {new Date(categoryStyles.find(s => s.category === category)!.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
          
          {/* Color picker */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Customize Primary Color</h3>
            <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
              <HexColorPicker color={colorValue} onChange={setColorValue} className="w-full mb-4" />
              
              <div className="flex items-center mb-4 space-x-2">
                <div 
                  className="w-10 h-10 rounded-md shadow-sm border border-slate-300 dark:border-slate-600" 
                  style={{ backgroundColor: colorValue }}
                />
                <input
                  type="text"
                  value={colorValue}
                  onChange={(e) => setColorValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                />
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">HSL Value:</div>
                <div className="font-mono bg-slate-200 dark:bg-slate-600 p-2 rounded text-sm">
                  {hslPreview}
                </div>
              </div>
              
              <div className="flex justify-end">
                <ThemeButton
                  onClick={handleSaveColor}
                  disabled={updateStyleMutation.isPending}
                >
                  {updateStyleMutation.isPending ? "Saving..." : "Save Color"}
                </ThemeButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-md">
          <div className="mb-6">
            <h4 className="font-medium mb-3">Button Variants</h4>
            <div className="flex flex-wrap gap-3">
              <button 
                className="px-4 py-2 rounded-md text-white font-medium"
                style={{ backgroundColor: colorValue }}
              >
                Primary Button
              </button>
              <button 
                className="px-4 py-2 rounded-md font-medium border-2"
                style={{ 
                  borderColor: colorValue,
                  color: colorValue
                }}
              >
                Outline Button
              </button>
              <button 
                className="px-4 py-2 rounded-md font-medium"
                style={{ color: colorValue }}
              >
                Text Button
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-3">Text Elements</h4>
            <p className="mb-3">
              Regular text with{" "}
              <a 
                href="#" 
                style={{ color: colorValue }}
                className="hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                themed links
              </a>{" "}
              that use the primary color.
            </p>
            <h5 
              style={{ color: colorValue }}
              className="text-xl font-semibold mb-2"
            >
              Themed Heading Example
            </h5>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">UI Elements</h4>
            <div className="flex flex-wrap gap-4 items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: colorValue }}
              >
                Icon
              </div>
              <div 
                className="h-4 w-40 rounded-full"
                style={{ backgroundColor: colorValue }}
              >
              </div>
              <div className="flex items-center">
                <div 
                  className="w-5 h-5 rounded border mr-2"
                  style={{ 
                    borderColor: colorValue,
                    backgroundColor: colorValue 
                  }}
                ></div>
                <span>Checkbox</span>
              </div>
              <div
                className="h-10 w-24 rounded-md flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: colorValue }}
              >
                Badge
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          This preview shows how the selected color will appear across various UI elements on the {getCategoryDisplayName(category)} landing page.
        </div>
      </div>
    </div>
  );
};

export default LandingPageStyle;