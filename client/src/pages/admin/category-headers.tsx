import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hexToHSL } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { SaveIcon, Upload, Trash2, Plus } from "lucide-react";

interface HeaderMenuItem {
  id: string;
  label: string;
  path: string;
}

interface HeaderConfig {
  id: string;
  category: string;
  logoSrc: string;
  logoText: string;
  primaryColor: string;
  bannerText: string;
  menuItems: HeaderMenuItem[];
}

const defaultHeaderConfig: Omit<HeaderConfig, 'id'> = {
  category: "",
  logoSrc: "",
  logoText: "",
  primaryColor: "#000000",
  bannerText: "",
  menuItems: [
    { id: "1", label: "", path: "" }
  ]
};

const CategoryHeadersAdmin = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("outdoors");
  const [newConfig, setNewConfig] = useState<Omit<HeaderConfig, 'id'>>(defaultHeaderConfig);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch header configs from API
  const { data: headerConfigs, isLoading, error } = useQuery<HeaderConfig[]>({
    queryKey: ['/api/admin/header-configs'],
  });

  // Mutation for updating a header config
  const updateHeaderConfig = useMutation({
    mutationFn: async (config: HeaderConfig) => {
      // Create a clean copy without any circular references
      const cleanConfig = {
        id: config.id,
        category: config.category,
        logoText: config.logoText,
        logoSrc: config.logoSrc,
        primaryColor: config.primaryColor,
        bannerText: config.bannerText,
        menuItems: config.menuItems.map(item => ({
          id: item.id,
          label: item.label,
          path: item.path
        }))
      };
      console.log('Sending clean config:', cleanConfig);
      const response = await apiRequest(`/api/admin/header-configs/${config.id}`, 'PATCH', cleanConfig);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs'] });
      toast({
        title: "Header configuration updated",
        description: "The changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating header",
        description: "There was a problem saving your changes.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    }
  });

  // Mutation for creating a new header config
  const createHeaderConfig = useMutation({
    mutationFn: async (config: Omit<HeaderConfig, 'id'>) => {
      // Create a clean copy without any circular references
      const cleanConfig = {
        category: config.category,
        logoText: config.logoText,
        logoSrc: config.logoSrc,
        primaryColor: config.primaryColor,
        bannerText: config.bannerText,
        menuItems: config.menuItems.map(item => ({
          id: item.id,
          label: item.label,
          path: item.path
        }))
      };
      console.log('Sending clean config for creation:', cleanConfig);
      const response = await apiRequest('POST', '/api/admin/header-configs', cleanConfig);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs'] });
      setIsCreating(false);
      setNewConfig(defaultHeaderConfig);
      toast({
        title: "Header configuration created",
        description: "The new header has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating header",
        description: "There was a problem creating the new header.",
        variant: "destructive",
      });
      console.error("Create error:", error);
    }
  });

  // Mutation for deleting a header config
  const deleteHeaderConfig = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/header-configs/${id}`, 'DELETE');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs'] });
      toast({
        title: "Header configuration deleted",
        description: "The header has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting header",
        description: "There was a problem deleting the header.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    }
  });

  // Get the current active header config
  const activeConfig = headerConfigs?.find(config => config.category === activeTab);
  
  // Update theme color when active tab changes
  useEffect(() => {
    if (activeConfig && activeConfig.primaryColor) {
      // Update the theme color to match the selected header's primary color
      const hslValue = hexToHSL(activeConfig.primaryColor);
      document.documentElement.style.setProperty('--theme-primary', hslValue);
      console.log(`Updated theme color to ${activeConfig.primaryColor} (${hslValue})`);
    }
  }, [activeConfig]);

  // Handle menu item updates for existing config
  const handleMenuItemChange = (index: number, field: keyof HeaderMenuItem, value: string) => {
    if (!activeConfig) return;
    
    const updatedConfig = {
      ...activeConfig,
      menuItems: activeConfig.menuItems.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    };
    
    updateHeaderConfig.mutate(updatedConfig);
  };

  // Add a new menu item to existing config
  const addMenuItem = () => {
    if (!activeConfig) return;
    
    const updatedConfig = {
      ...activeConfig,
      menuItems: [
        ...activeConfig.menuItems,
        { id: `new-${Date.now()}`, label: "", path: "" }
      ]
    };
    
    updateHeaderConfig.mutate(updatedConfig);
  };

  // Remove a menu item from existing config
  const removeMenuItem = (index: number) => {
    if (!activeConfig || activeConfig.menuItems.length <= 1) return;
    
    const updatedConfig = {
      ...activeConfig,
      menuItems: activeConfig.menuItems.filter((_, i) => i !== index)
    };
    
    updateHeaderConfig.mutate(updatedConfig);
  };

  // Handle field changes for existing config
  const handleFieldChange = (field: keyof HeaderConfig, value: string) => {
    if (!activeConfig) return;
    
    const updatedConfig = {
      ...activeConfig,
      [field]: value
    };
    
    updateHeaderConfig.mutate(updatedConfig);
  };

  // Handle menu item changes for new config
  const handleNewMenuItemChange = (index: number, field: keyof HeaderMenuItem, value: string) => {
    setNewConfig({
      ...newConfig,
      menuItems: newConfig.menuItems.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    });
  };

  // Add menu item to new config
  const addNewMenuItem = () => {
    setNewConfig({
      ...newConfig,
      menuItems: [
        ...newConfig.menuItems,
        { id: `new-${Date.now()}`, label: "", path: "" }
      ]
    });
  };

  // Remove menu item from new config
  const removeNewMenuItem = (index: number) => {
    if (newConfig.menuItems.length <= 1) return;
    
    setNewConfig({
      ...newConfig,
      menuItems: newConfig.menuItems.filter((_, i) => i !== index)
    });
  };

  // Handle field changes for new config
  const handleNewFieldChange = (field: keyof Omit<HeaderConfig, 'id'>, value: string) => {
    setNewConfig({
      ...newConfig,
      [field]: value
    });
  };

  // Submit new config
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createHeaderConfig.mutate(newConfig);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-6 w-2/3" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-destructive">
          <h2 className="text-2xl font-bold mb-2">Error Loading Header Configurations</h2>
          <p>There was a problem loading the data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">Category Header Management</h1>
        <p className="text-neutral-dark/70">Customize the header appearance and navigation for each category landing page.</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-dark">Edit Category Headers</h2>
        <Button 
          onClick={() => setIsCreating(!isCreating)} 
          variant={isCreating ? "outline" : "default"}
        >
          {isCreating ? "Cancel" : "Create New Header"}
        </Button>
      </div>

      {isCreating ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Category Header</CardTitle>
            <CardDescription>
              Add a new header configuration for a category page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="new-category">Category Slug</Label>
                  <Input 
                    id="new-category" 
                    placeholder="e.g., hiking, camping" 
                    value={newConfig.category}
                    onChange={(e) => handleNewFieldChange('category', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-logo-text">Logo Text</Label>
                  <Input 
                    id="new-logo-text" 
                    placeholder="e.g., Hiking Trails" 
                    value={newConfig.logoText}
                    onChange={(e) => handleNewFieldChange('logoText', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-logo-src">Logo Image URL</Label>
                  <Input 
                    id="new-logo-src" 
                    placeholder="https://example.com/image.jpg" 
                    value={newConfig.logoSrc}
                    onChange={(e) => handleNewFieldChange('logoSrc', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-primary-color">
                    Primary Color 
                    <span className="text-sm text-gray-500 ml-2 font-normal">
                      (For initial setup only - manage colors in Category Colors page)
                    </span>
                  </Label>
                  <Input 
                    id="new-primary-color" 
                    type="color"
                    value={newConfig.primaryColor}
                    onChange={(e) => handleNewFieldChange('primaryColor', e.target.value)}
                    required
                  />
                  <p className="text-amber-600 text-xs mt-1">
                    Note: After creation, use the Category Colors page to manage colors consistently across all pages
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="new-banner-text">Banner Text</Label>
                  <Input 
                    id="new-banner-text" 
                    placeholder="Promotional text to display in the banner" 
                    value={newConfig.bannerText}
                    onChange={(e) => handleNewFieldChange('bannerText', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Menu Items</Label>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={addNewMenuItem}
                  >
                    <Plus size={16} className="mr-1" /> Add Item
                  </Button>
                </div>
                
                {newConfig.menuItems.map((item, index) => (
                  <div key={item.id} className="flex gap-4 mb-3">
                    <div className="flex-1">
                      <Input 
                        placeholder="Label" 
                        value={item.label}
                        onChange={(e) => handleNewMenuItemChange(index, 'label', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Input 
                        placeholder="Path" 
                        value={item.path}
                        onChange={(e) => handleNewMenuItemChange(index, 'path', e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeNewMenuItem(index)}
                      disabled={newConfig.menuItems.length <= 1}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSubmit}
              disabled={createHeaderConfig.isPending}
            >
              {createHeaderConfig.isPending ? "Creating..." : "Create Header"}
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {headerConfigs && headerConfigs.length > 0 ? (
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6 flex flex-wrap">
            {headerConfigs.map((config) => (
              <TabsTrigger 
                key={config.id} 
                value={config.category}
                className="px-4 py-2"
              >
                {config.category.charAt(0).toUpperCase() + config.category.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {headerConfigs.map((config) => (
            <TabsContent key={config.id} value={config.category}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Edit {config.category.charAt(0).toUpperCase() + config.category.slice(1)} Header</CardTitle>
                      <CardDescription>
                        Customize how the header appears on {config.category} landing pages
                      </CardDescription>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the ${config.category} header configuration?`)) {
                          deleteHeaderConfig.mutate(config.id);
                        }
                      }}
                      disabled={deleteHeaderConfig.isPending}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label htmlFor={`${config.id}-logo-text`}>Logo Text</Label>
                      <Input 
                        id={`${config.id}-logo-text`} 
                        value={config.logoText}
                        onChange={(e) => handleFieldChange('logoText', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${config.id}-logo-src`}>Logo Image URL</Label>
                      <div className="flex gap-2">
                        <Input 
                          id={`${config.id}-logo-src`} 
                          value={config.logoSrc}
                          onChange={(e) => handleFieldChange('logoSrc', e.target.value)}
                        />
                        <Button variant="outline" size="icon">
                          <Upload size={16} />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`${config.id}-primary-color`}>
                        Primary Color
                        <span className="text-sm text-gray-500 ml-2 font-normal">
                          (Use Category Colors page for consistent colors)
                        </span>
                      </Label>
                      <Input 
                        id={`${config.id}-primary-color`} 
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                      />
                      <p className="text-amber-600 text-xs mt-1">
                        Note: This color will be overwritten by changes made in the Category Colors page. For consistent theming across all pages, please use the Category Colors page.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`${config.id}-banner-text`}>Banner Text</Label>
                      <Input 
                        id={`${config.id}-banner-text`} 
                        value={config.bannerText}
                        onChange={(e) => handleFieldChange('bannerText', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label>Menu Items</Label>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={addMenuItem}
                      >
                        <Plus size={16} className="mr-1" /> Add Item
                      </Button>
                    </div>
                    
                    {config.menuItems.map((item, index) => (
                      <div key={item.id} className="flex gap-4 mb-3">
                        <div className="flex-1">
                          <Input 
                            placeholder="Label" 
                            value={item.label}
                            onChange={(e) => handleMenuItemChange(index, 'label', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input 
                            placeholder="Path" 
                            value={item.path}
                            onChange={(e) => handleMenuItemChange(index, 'path', e.target.value)}
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeMenuItem(index)}
                          disabled={config.menuItems.length <= 1}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-end">
                    <Button 
                      onClick={() => {
                        console.log("Saving config:", config);
                        updateHeaderConfig.mutate(config);
                      }}
                      disabled={updateHeaderConfig.isPending}
                    >
                      <SaveIcon size={16} className="mr-2" />
                      {updateHeaderConfig.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-neutral-dark">No Header Configurations Found</h3>
          <p className="text-neutral-dark/70 mb-6">Create your first category header to get started.</p>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              Create Header Configuration
            </Button>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-neutral-light rounded-lg">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 text-amber-700 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Usage Instructions</h3>
            <p className="text-neutral-dark/70 mb-2">The category headers will be automatically displayed when users visit the corresponding category landing pages.</p>
            <ul className="list-disc list-inside text-sm text-neutral-dark/70">
              <li>The <Badge>category</Badge> field should match the URL path (e.g., "hiking" for "/hiking")</li>
              <li>Logo images should be square format for best results</li>
              <li>Menu items will be displayed in the order listed</li>
              <li><strong>Important:</strong> For theme color management, use the <Badge><a href="/admin/category-colors" className="hover:underline">Category Colors</a></Badge> page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryHeadersAdmin;