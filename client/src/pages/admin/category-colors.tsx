import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hexToHSL } from "@/contexts/ThemeContext";
// AdminLayout is already applied by ProtectedRoute, no need to import
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

interface CategoryDisplayInfo {
  label: string;
  path: string;
  category: string;
}

const CategoryColors = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("home");
  const [colorValue, setColorValue] = useState<string>("#3B82F6");
  const [hslPreview, setHslPreview] = useState<string>("220 93% 60%");
  
  // Define category display information
  const categories: CategoryDisplayInfo[] = [
    { label: "Home", path: "/", category: "home" },
    { label: "Outdoors", path: "/outdoors", category: "outdoors" },
    { label: "Cruising", path: "/cruising", category: "cruising" },
    { label: "Fishing", path: "/fishing", category: "fishing" },
    { label: "Hiking", path: "/hiking", category: "hiking" },
    { label: "Camping", path: "/camping", category: "camping" },
    { label: "4x4 Adventures", path: "/four-x-four", category: "four-x-four" },
  ];
  
  // Fetch all category styles
  const { data: categoryStyles, refetch } = useQuery<CategoryStyle[]>({
    queryKey: ['/api/category-styles'],
  });
  
  // Define query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Create or update a category style
  const updateStyleMutation = useMutation({
    mutationFn: async (data: { category: string; primaryColor: string }) => {
      // First update the category style
      const styleResult = await apiRequest('POST', '/api/category-styles', data);
      
      // Then update the matching header config if it exists
      try {
        // Get the header config for this category
        const response = await apiRequest(`/api/admin/header-configs`, 'GET');
        const headerConfigs = await response.json();
        
        // Find the header config for this category
        const headerConfig = headerConfigs.find((config: any) => config.category === data.category);
        
        // If header config exists, update its color too
        if (headerConfig) {
          await apiRequest(`/api/admin/header-configs/${headerConfig.id}`, 'PATCH', {
            ...headerConfig,
            primaryColor: data.primaryColor
          });
          console.log(`Updated header config ${headerConfig.id} with color ${data.primaryColor}`);
        }
      } catch (headerError) {
        console.error("Error updating header config color:", headerError);
        // Don't fail the whole operation if header update fails
      }
      
      return styleResult;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Colors for ${getDisplayName(selectedCategory)} page updated successfully.`,
      });
      refetch();
      
      // Force a refresh of header configs data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs'] });
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
      category: selectedCategory,
      primaryColor: colorValue
    });
  };
  
  // Set the color picker to the selected category's color
  useEffect(() => {
    if (categoryStyles && selectedCategory) {
      const style = categoryStyles.find(s => s.category === selectedCategory);
      if (style) {
        // Update color picker value
        setColorValue(style.primaryColor);
        // Update HSL preview text
        setHslPreview(style.primaryColorHSL);
        // Update the actual theme color for live preview
        document.documentElement.style.setProperty('--theme-primary', style.primaryColorHSL);
        console.log(`Updated theme from category selection to ${style.primaryColor} (${style.primaryColorHSL})`);
      } else {
        // If no style exists for this category, still update the preview using the current colorValue
        // This handles the case where a user switches to a category without a saved style
        const hslValue = hexToHSL(colorValue);
        document.documentElement.style.setProperty('--theme-primary', hslValue);
        console.log(`No style found for ${selectedCategory}, using default ${colorValue} (${hslValue})`);
      }
    }
  // Removed colorValue from dependencies to prevent conflict with the other useEffect
  }, [selectedCategory, categoryStyles]);
  
  // Update HSL preview when color changes (from color picker or input)
  // This needs to be separate from the category selection effect to avoid loops
  useEffect(() => {
    const newHslValue = hexToHSL(colorValue);
    
    // Only update if color was changed directly (not from category selection)
    // This prevents loops between the two effects
    if (hslPreview !== newHslValue) {
      setHslPreview(newHslValue);
      
      // Apply the current color to the preview section for real-time updates
      document.documentElement.style.setProperty('--theme-primary', newHslValue);
      console.log(`Updated theme from color picker to ${colorValue} (${newHslValue})`);
    }
  }, [colorValue, hslPreview]);
  
  // Get display name for a category
  const getDisplayName = (category: string): string => {
    const found = categories.find(c => c.category === category);
    return found ? found.label : category;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Landing Page Color Management</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Customize the primary colors for each landing page. These colors will be used for buttons,
          links, icons, and accent elements throughout the respective pages.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Category selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Landing Page</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                    selectedCategory === cat.category
                      ? "bg-[hsl(var(--theme-primary))] text-white"
                      : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-sm opacity-80">{cat.path}</div>
                </button>
              ))}
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
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {updateStyleMutation.isPending ? "Saving..." : (
                    categoryStyles?.find(s => s.category === selectedCategory)
                      ? "Last updated: " + new Date(categoryStyles.find(s => s.category === selectedCategory)!.updatedAt).toLocaleString()
                      : "Not saved yet"
                  )}
                </div>
                <ThemeButton
                  onClick={handleSaveColor}
                  disabled={updateStyleMutation.isPending}
                >
                  Save Color
                </ThemeButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-md">
          <div className="mb-4">
            <h4 className="font-medium mb-2">Button Variants</h4>
            <div className="flex flex-wrap gap-2">
              <ThemeButton>Default</ThemeButton>
              <ThemeButton variant="outline">Outline</ThemeButton>
              <ThemeButton variant="ghost">Ghost</ThemeButton>
              <ThemeButton variant="link">Link</ThemeButton>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Text Elements</h4>
            <p className="mb-2">
              Regular text with{" "}
              <a href="#" className="text-[hsl(var(--theme-primary))] hover:underline">
                themed links
              </a>{" "}
              that use the primary color.
            </p>
            <h5 className="text-[hsl(var(--theme-primary))] font-semibold mb-2">
              Themed Heading
            </h5>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Styled Elements</h4>
            <div className="flex gap-2">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--theme-primary))] flex items-center justify-center text-white">
                Icon
              </div>
              <div className="h-4 w-40 bg-[hsl(var(--theme-primary))] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryColors;