import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CategoryStyle {
  id: number;
  category: string;
  primaryColor: string;
  primaryColorHSL: string;
  headingFont: string | null;
  bodyFont: string | null;
  navigationFont: string | null;
  buttonFont: string | null;
  displayFont: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryDisplayInfo {
  label: string;
  path: string;
  category: string;
}

// Available font options
const fontOptions = [
  // Admin-friendly fonts
  { value: "Lato", label: "Lato (Recommended for Admin)" },
  { value: "Inter", label: "Inter (Great for Admin UI)" },
  { value: "Roboto", label: "Roboto (Clean Admin UI)" },
  { value: "Source Sans Pro", label: "Source Sans Pro (Admin-friendly)" },
  { value: "Nunito", label: "Nunito (Modern Admin)" },
  { value: "Ubuntu", label: "Ubuntu (Technical UI)" },
  
  // Content & Display fonts
  { value: "Jost", label: "Jost (Default)" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Raleway", label: "Raleway" },
  { value: "PT Sans", label: "PT Sans" },
  { value: "Titillium Web", label: "Titillium Web" },
  { value: "Playfair Display", label: "Playfair Display (Elegant)" },
  { value: "Merriweather", label: "Merriweather (Readable)" },
  { value: "Oswald", label: "Oswald (Bold)" },
];

const FontPreview = ({ fontFamily, text, fontType }: { 
  fontFamily: string, 
  text: string, 
  fontType?: 'headingFont' | 'bodyFont' | 'navigationFont' | 'buttonFont' | 'displayFont' 
}) => {
  // Generate the appropriate class name based on font type
  const getPreviewClass = () => {
    if (!fontType) return '';
    
    const classMap = {
      'headingFont': 'font-preview-heading font-heading-preview',
      'bodyFont': 'font-preview-body font-body-preview',
      'navigationFont': 'font-preview-navigation font-navigation-preview',
      'buttonFont': 'font-preview-button font-button-preview',
      'displayFont': 'font-preview-display font-display-preview'
    };
    
    return classMap[fontType] || '';
  };

  return (
    <div 
      className={`p-4 border rounded-md bg-white dark:bg-slate-800 mt-2 mb-4 ${getPreviewClass()}`}
      style={{ 
        fontFamily: `${fontFamily}, sans-serif`,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {text}
    </div>
  );
};

const FontFamilies = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("home");
  const [fontSettings, setFontSettings] = useState({
    headingFont: "Jost",
    bodyFont: "Open Sans",
    navigationFont: "Jost",
    buttonFont: "Jost",
    displayFont: "Jost",
  });
  
  // Define category display information
  const categories: CategoryDisplayInfo[] = [
    { label: "Admin Dashboard", path: "/admin", category: "admin" },
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
    mutationFn: async (data: { 
      category: string; 
      headingFont: string;
      bodyFont: string;
      navigationFont: string;
      buttonFont: string;
      displayFont: string;
    }) => {
      // Find the existing style for the category to preserve other fields
      const existingStyle = categoryStyles?.find(style => style.category === data.category);
      
      // Preserve the existing color values if they exist
      const payload = {
        ...data,
        primaryColor: existingStyle?.primaryColor || "#3B82F6",
        primaryColorHSL: existingStyle?.primaryColorHSL
      };
      
      const response = await apiRequest('POST', '/api/category-styles', payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/category-styles'] });
      toast({
        title: "Font families updated",
        description: `The font settings for ${selectedCategory} have been saved.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating font families",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set font values when category changes or data loads
  useEffect(() => {
    if (categoryStyles) {
      const selectedStyle = categoryStyles.find(style => style.category === selectedCategory);
      if (selectedStyle) {
        setFontSettings({
          headingFont: selectedStyle.headingFont || "Jost",
          bodyFont: selectedStyle.bodyFont || "Open Sans",
          navigationFont: selectedStyle.navigationFont || "Jost",
          buttonFont: selectedStyle.buttonFont || "Jost",
          displayFont: selectedStyle.displayFont || "Jost",
        });
      }
    }
  }, [selectedCategory, categoryStyles]);

  // Handle form submission
  const handleSubmit = () => {
    updateStyleMutation.mutate({
      category: selectedCategory,
      ...fontSettings
    });
  };

  // Handle font family changes
  const handleFontChange = (value: string, fontType: keyof typeof fontSettings) => {
    // Update component state
    setFontSettings(prev => ({
      ...prev,
      [fontType]: value
    }));
    
    // Create a temporary style to preview the font immediately
    const createPreviewStyle = () => {
      // Map font type to CSS selectors
      const selectors = {
        headingFont: ".font-preview-heading, .font-heading-preview",
        bodyFont: ".font-preview-body, .font-body-preview",
        navigationFont: ".font-preview-navigation, .font-navigation-preview",
        buttonFont: ".font-preview-button, .font-button-preview",
        displayFont: ".font-preview-display, .font-display-preview",
      };
      
      // Create or update the style tag for this specific font preview
      const styleId = `preview-${fontType}`;
      let styleTag = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      
      // Set the CSS rule
      const selector = selectors[fontType] || '.font-preview';
      styleTag.innerHTML = `${selector} { font-family: "${value}", sans-serif !important; }`;
    };
    
    // Apply the preview style
    createPreviewStyle();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Font Family Management</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Customize the font families for different elements on each landing page. These fonts will be used for headings,
          body text, navigation, buttons, and display text throughout the respective pages.
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
          
          {/* Font selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Font Families</h3>
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-blue-600 dark:text-blue-300 text-sm">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <strong>Live Preview:</strong> Select different fonts to see how they look in real-time before saving. Changes take effect across the entire site after saving.
                </div>
              </div>
            </div>
            <Card className="p-4">
              <CardContent className="pt-4 px-0">
                <div className="space-y-6">
                  {/* Heading Font */}
                  <div>
                    <Label htmlFor="headingFont">Heading Font (h1-h6)</Label>
                    <Select
                      value={fontSettings.headingFont}
                      onValueChange={(value) => handleFontChange(value, 'headingFont')}
                    >
                      <SelectTrigger id="headingFont" className="w-full">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FontPreview 
                      fontFamily={fontSettings.headingFont}
                      text="This is how headings will look"
                      fontType="headingFont"
                    />
                  </div>
                  
                  {/* Body Font */}
                  <div>
                    <Label htmlFor="bodyFont">Body Font (paragraphs and content)</Label>
                    <Select
                      value={fontSettings.bodyFont}
                      onValueChange={(value) => handleFontChange(value, 'bodyFont')}
                    >
                      <SelectTrigger id="bodyFont" className="w-full">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FontPreview 
                      fontFamily={fontSettings.bodyFont}
                      text="This is how body text will look. The body font is used for most content throughout the site."
                      fontType="bodyFont"
                    />
                  </div>
                  
                  {/* Navigation Font */}
                  <div>
                    <Label htmlFor="navigationFont">Navigation Font (menus and links)</Label>
                    <Select
                      value={fontSettings.navigationFont}
                      onValueChange={(value) => handleFontChange(value, 'navigationFont')}
                    >
                      <SelectTrigger id="navigationFont" className="w-full">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FontPreview 
                      fontFamily={fontSettings.navigationFont}
                      text="This is how navigation menus will look"
                      fontType="navigationFont"
                    />
                  </div>
                  
                  {/* Button Font */}
                  <div>
                    <Label htmlFor="buttonFont">Button Font</Label>
                    <Select
                      value={fontSettings.buttonFont}
                      onValueChange={(value) => handleFontChange(value, 'buttonFont')}
                    >
                      <SelectTrigger id="buttonFont" className="w-full">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FontPreview 
                      fontFamily={fontSettings.buttonFont}
                      text="BOOK NOW | EXPLORE MORE | SIGN UP"
                      fontType="buttonFont"
                    />
                  </div>
                  
                  {/* Display Font */}
                  <div>
                    <Label htmlFor="displayFont">Display Font (hero headlines, special text)</Label>
                    <Select
                      value={fontSettings.displayFont}
                      onValueChange={(value) => handleFontChange(value, 'displayFont')}
                    >
                      <SelectTrigger id="displayFont" className="w-full">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FontPreview 
                      fontFamily={fontSettings.displayFont}
                      text="ADVENTURE AWAITS"
                      fontType="displayFont"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={updateStyleMutation.isPending}
                    className="mt-4 w-full"
                  >
                    {updateStyleMutation.isPending ? "Saving..." : "Save Font Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontFamilies;