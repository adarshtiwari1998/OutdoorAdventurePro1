import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hexToHSL } from "@/contexts/ThemeContext";
import { Link } from "wouter";
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  Trash2Icon, 
  Edit2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  SaveIcon,
  LayoutIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Types
interface MegaMenuItem {
  id?: string | number;
  label: string;
  path: string;
  order: number;
  featuredItem?: boolean;
  categoryId?: number;
  createdAt?: string;
}

interface MegaMenuCategory {
  id?: string | number;
  title: string;
  order: number;
  menuItemId?: number;
  createdAt?: string;
  items: MegaMenuItem[];
}

interface HeaderMenuItem {
  id?: string | number;
  label: string;
  path: string;
  order: number;
  hasMegaMenu: boolean;
  createdAt?: string;
  headerConfigId?: number;
  megaMenuCategories?: MegaMenuCategory[];
}

interface HeaderConfig {
  id?: string | number;
  category: string;
  logoSrc: string;
  logoText: string;
  primaryColor: string;
  bannerText?: string;
  menuItems: HeaderMenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

const HeaderMenusAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("headers");
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [editingConfig, setEditingConfig] = useState<HeaderConfig | null>(null);
  const [isNewConfig, setIsNewConfig] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<HeaderMenuItem | null>(null);
  const [isNewMenuItem, setIsNewMenuItem] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MegaMenuCategory | null>(null);
  const [editingMegaItem, setEditingMegaItem] = useState<MegaMenuItem | null>(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewMegaItem, setIsNewMegaItem] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: string, id: number} | null>(null);

  const { data: headerConfigs, isLoading } = useQuery<HeaderConfig[]>({
    queryKey: ['/api/admin/header-configs'],
  });

  // Using an explicit query function to log details and handle errors better
  const { data: selectedConfig, isLoading: isSelectedConfigLoading, error: configError } = useQuery<HeaderConfig>({
    queryKey: ['/api/admin/header-configs', selectedHeaderId],
    queryFn: async () => {
      console.log(`Fetching header config with ID: ${selectedHeaderId}`);
      
      if (!selectedHeaderId) {
        throw new Error("No header ID selected");
      }
      
      const response = await fetch(`/api/admin/header-configs/${selectedHeaderId}`);
      
      if (!response.ok) {
        console.error(`Error fetching header config: ${response.statusText}`);
        throw new Error(`Failed to fetch header configuration: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Header config data:`, data);
      return data;
    },
    enabled: !!selectedHeaderId,
    staleTime: 0,  // Disable stale time to always fetch fresh data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    retry: 2, // Retry failed queries twice
  });
  
  // Effect to handle selectedHeaderId changes
  useEffect(() => {
    if (selectedHeaderId) {
      // Force refetch of the selected header config when the ID changes
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/header-configs', selectedHeaderId] 
      });
    }
  }, [selectedHeaderId, queryClient]);
  
  // Update theme color when selected config changes
  useEffect(() => {
    if (selectedConfig && selectedConfig.primaryColor) {
      // Update the theme color to match the selected header's primary color
      const hslValue = hexToHSL(selectedConfig.primaryColor);
      document.documentElement.style.setProperty('--theme-primary', hslValue);
      console.log(`Updated theme color to ${selectedConfig.primaryColor} (${hslValue})`);
    }
  }, [selectedConfig]);

  // Create/update header config
  const { mutate: saveHeaderConfig, isPending: isSavingConfig } = useMutation({
    mutationFn: async (config: HeaderConfig) => {
      if (config.id) {
        const response = await apiRequest(
          'PATCH',
          `/api/admin/header-configs/${config.id}`,
          config
        );
        return await response.json();
      } else {
        const response = await apiRequest(
          `/api/admin/header-configs`,
          'POST',
          config
        );
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs'] });
      setEditingConfig(null);
      toast({
        title: "Success",
        description: `Header configuration ${isNewConfig ? 'created' : 'updated'} successfully.`,
      });
      setIsNewConfig(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isNewConfig ? 'create' : 'update'} header configuration.`,
        variant: "destructive",
      });
    },
  });

  // Delete header config
  const { mutate: deleteHeaderConfig, isPending: isDeletingConfig } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        `/api/admin/header-configs/${id}`,
        'DELETE'
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs'] });
      setSelectedHeaderId(null);
      toast({
        title: "Success",
        description: "Header configuration deleted successfully.",
      });
    },
    onSettled: () => {
      // Ensure we refetch after any change (success or error)
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete header configuration.",
        variant: "destructive",
      });
    },
  });

  // Create/update menu item (including mega menu settings)
  const { mutate: saveMenuItem, isPending: isSavingMenuItem } = useMutation({
    mutationFn: async (data: { configId: number, menuItem: HeaderMenuItem }) => {
      const { configId, menuItem } = data;
      
      // Update header config with the new/updated menu item
      const updatedConfig = { ...selectedConfig } as HeaderConfig;
      
      if (isNewMenuItem) {
        // Add new menu item
        updatedConfig.menuItems = [...updatedConfig.menuItems, menuItem];
      } else {
        // Update existing menu item
        updatedConfig.menuItems = updatedConfig.menuItems.map(item => 
          item.id === menuItem.id ? menuItem : item
        );
      }
      
      const response = await apiRequest(
        'PATCH',
        `/api/admin/header-configs/${configId}`,
        updatedConfig
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs', selectedHeaderId] });
      setEditingMenuItem(null);
      toast({
        title: "Success",
        description: `Menu item ${isNewMenuItem ? 'created' : 'updated'} successfully.`,
      });
      setIsNewMenuItem(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isNewMenuItem ? 'create' : 'update'} menu item.`,
        variant: "destructive",
      });
    },
  });

  // Create/update mega menu category
  const { mutate: saveMegaMenuCategory, isPending: isSavingCategory } = useMutation({
    mutationFn: async (data: { 
      configId: number, 
      menuItemId: number,
      category: MegaMenuCategory 
    }) => {
      const { configId, menuItemId, category } = data;
      
      // Update header config with the new/updated category
      const updatedConfig = { ...selectedConfig } as HeaderConfig;
      const menuItemIndex = updatedConfig.menuItems.findIndex(item => item.id === menuItemId);
      
      if (menuItemIndex === -1) {
        throw new Error("Menu item not found");
      }
      
      if (!updatedConfig.menuItems[menuItemIndex].megaMenuCategories) {
        updatedConfig.menuItems[menuItemIndex].megaMenuCategories = [];
      }
      
      if (isNewCategory) {
        // Add new category
        updatedConfig.menuItems[menuItemIndex].megaMenuCategories!.push(category);
      } else {
        // Update existing category
        updatedConfig.menuItems[menuItemIndex].megaMenuCategories = 
          updatedConfig.menuItems[menuItemIndex].megaMenuCategories!.map(cat => 
            cat.id === category.id ? category : cat
          );
      }
      
      // Ensure hasMegaMenu is set to true
      updatedConfig.menuItems[menuItemIndex].hasMegaMenu = true;
      
      const response = await apiRequest(
        'PATCH',
        `/api/admin/header-configs/${configId}`,
        updatedConfig
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs', selectedHeaderId] });
      setEditingCategory(null);
      toast({
        title: "Success",
        description: `Category ${isNewCategory ? 'created' : 'updated'} successfully.`,
      });
      setIsNewCategory(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isNewCategory ? 'create' : 'update'} category.`,
        variant: "destructive",
      });
    },
  });

  // Create/update mega menu item
  const { mutate: saveMegaMenuItem, isPending: isSavingMegaItem } = useMutation({
    mutationFn: async (data: { 
      configId: number, 
      menuItemId: number, 
      categoryId: number,
      megaItem: MegaMenuItem 
    }) => {
      const { configId, menuItemId, categoryId, megaItem } = data;
      
      // Update header config with the new/updated mega menu item
      const updatedConfig = { ...selectedConfig } as HeaderConfig;
      const menuItemIndex = updatedConfig.menuItems.findIndex(item => item.id === menuItemId);
      
      if (menuItemIndex === -1) {
        throw new Error("Menu item not found");
      }
      
      const categoryIndex = updatedConfig.menuItems[menuItemIndex].megaMenuCategories!.findIndex(
        cat => cat.id === categoryId
      );
      
      if (categoryIndex === -1) {
        throw new Error("Category not found");
      }
      
      if (isNewMegaItem) {
        // Add new mega menu item
        updatedConfig.menuItems[menuItemIndex].megaMenuCategories![categoryIndex].items.push(megaItem);
      } else {
        // Update existing mega menu item
        updatedConfig.menuItems[menuItemIndex].megaMenuCategories![categoryIndex].items = 
          updatedConfig.menuItems[menuItemIndex].megaMenuCategories![categoryIndex].items.map(item => 
            item.id === megaItem.id ? megaItem : item
          );
      }
      
      const response = await apiRequest(
        'PATCH',
        `/api/admin/header-configs/${configId}`,
        updatedConfig
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs', selectedHeaderId] });
      setEditingMegaItem(null);
      toast({
        title: "Success",
        description: `Menu item ${isNewMegaItem ? 'created' : 'updated'} successfully.`,
      });
      setIsNewMegaItem(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isNewMegaItem ? 'create' : 'update'} menu item.`,
        variant: "destructive",
      });
    },
  });

  // Delete item (header, menu item, category, or mega menu item)
  const { mutate: deleteItem, isPending: isDeleting } = useMutation({
    mutationFn: async (data: { type: string, id: number, configId: number }) => {
      const { type, id, configId } = data;
      
      if (type === 'header') {
        return deleteHeaderConfig(id);
      }
      
      // Otherwise, update the config to remove the item
      const updatedConfig = { ...selectedConfig } as HeaderConfig;
      
      if (type === 'menuItem') {
        // Remove menu item
        updatedConfig.menuItems = updatedConfig.menuItems.filter(item => item.id !== id);
      } else if (type === 'category') {
        // Find the menu item this category belongs to
        const menuItem = updatedConfig.menuItems.find(item => 
          item.megaMenuCategories?.some(cat => cat.id === id)
        );
        
        if (menuItem && menuItem.megaMenuCategories) {
          menuItem.megaMenuCategories = menuItem.megaMenuCategories.filter(cat => cat.id !== id);
          
          // If no categories left, set hasMegaMenu to false
          if (menuItem.megaMenuCategories.length === 0) {
            menuItem.hasMegaMenu = false;
          }
        }
      } else if (type === 'megaItem') {
        // Find the category and menu item this mega menu item belongs to
        for (const menuItem of updatedConfig.menuItems) {
          if (!menuItem.megaMenuCategories) continue;
          
          for (const category of menuItem.megaMenuCategories) {
            const itemIndex = category.items.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
              category.items = category.items.filter(item => item.id !== id);
              break;
            }
          }
        }
      }
      
      const response = await apiRequest(
        'PATCH',
        `/api/admin/header-configs/${configId}`,
        updatedConfig
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs', selectedHeaderId] });
      setOpenDeleteDialog(false);
      setItemToDelete(null);
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    },
  });

  const handleCreateHeader = () => {
    setIsNewConfig(true);
    setEditingConfig({
      category: "",
      logoSrc: "",
      logoText: "",
      primaryColor: "#3B82F6",
      menuItems: []
    });
  };

  const handleEditHeader = (config: HeaderConfig) => {
    setIsNewConfig(false);
    setEditingConfig({ ...config });
  };

  const handleCreateMenuItem = () => {
    setIsNewMenuItem(true);
    setEditingMenuItem({
      label: "",
      path: "",
      order: selectedConfig?.menuItems?.length || 0,
      hasMegaMenu: false
    });
  };

  const handleEditMenuItem = (menuItem: HeaderMenuItem) => {
    setIsNewMenuItem(false);
    setEditingMenuItem({ ...menuItem });
  };

  const handleCreateCategory = (menuItemId: number) => {
    setSelectedMenuItemId(menuItemId);
    setIsNewCategory(true);
    setEditingCategory({
      title: "",
      order: 0,
      items: []
    });
  };

  const handleEditCategory = (menuItemId: number, category: MegaMenuCategory) => {
    setSelectedMenuItemId(menuItemId);
    setIsNewCategory(false);
    setEditingCategory({ ...category });
  };

  const handleCreateMegaMenuItem = (menuItemId: number, categoryId: number) => {
    setSelectedMenuItemId(menuItemId);
    setSelectedCategoryId(categoryId);
    setIsNewMegaItem(true);
    setEditingMegaItem({
      label: "",
      path: "",
      order: 0,
      featuredItem: false
    });
  };

  const handleEditMegaMenuItem = (menuItemId: number, categoryId: number, megaItem: MegaMenuItem) => {
    setSelectedMenuItemId(menuItemId);
    setSelectedCategoryId(categoryId);
    setIsNewMegaItem(false);
    setEditingMegaItem({ ...megaItem });
  };

  const handleDeleteClick = (type: string, id: number) => {
    setItemToDelete({ type, id });
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (itemToDelete && selectedHeaderId) {
      deleteItem({
        type: itemToDelete.type,
        id: itemToDelete.id,
        configId: selectedHeaderId
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {selectedHeaderId && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedHeaderId(null)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-3xl font-heading font-bold">
            {selectedHeaderId 
              ? `${selectedConfig?.category.charAt(0).toUpperCase() + selectedConfig?.category.slice(1)} Header Menu` 
              : "Header Menu Management"}
          </h1>
        </div>
        
        {!selectedHeaderId && (
          <Button onClick={handleCreateHeader}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Header
          </Button>
        )}
      </div>

      {!selectedHeaderId ? (
        <div>
          {editingConfig ? (
            <EditHeaderForm 
              header={editingConfig} 
              isNew={isNewConfig}
              isPending={isSavingConfig}
              onSave={(config) => saveHeaderConfig(config)}
              onCancel={() => {
                setEditingConfig(null);
                setIsNewConfig(false);
              }}
            />
          ) : (
            <HeadersList 
              headers={headerConfigs || []} 
              isLoading={isLoading}
              onSelect={setSelectedHeaderId}
              onEdit={handleEditHeader}
              onDelete={(id) => {
                if (window.confirm("Are you sure you want to delete this header configuration?")) {
                  deleteHeaderConfig(id as number);
                }
              }}
            />
          )}
        </div>
      ) : (
        <div>
          {isSelectedConfigLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : configError ? (
            <div className="text-center text-destructive my-8">
              <h3 className="text-xl font-bold">Error Loading Configuration</h3>
              <p>There was a problem loading the header configuration.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/header-configs', selectedHeaderId] })}
              >
                Retry
              </Button>
            </div>
          ) : selectedConfig ? (
            <div>
              <Tabs defaultValue="menuItems" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="menuItems">Menu Items</TabsTrigger>
                  <TabsTrigger value="headerSettings">Header Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="menuItems">
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Menu Items</h2>
                    <Button onClick={handleCreateMenuItem}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </div>
                  
                  {editingMenuItem && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>{isNewMenuItem ? "Add New Menu Item" : "Edit Menu Item"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor="menu-item-label">Label</Label>
                            <Input 
                              id="menu-item-label" 
                              value={editingMenuItem.label}
                              onChange={(e) => setEditingMenuItem({
                                ...editingMenuItem,
                                label: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="menu-item-path">Path</Label>
                            <Input 
                              id="menu-item-path" 
                              value={editingMenuItem.path}
                              onChange={(e) => setEditingMenuItem({
                                ...editingMenuItem,
                                path: e.target.value
                              })}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="has-mega-menu">Has Mega Menu</Label>
                          <Switch 
                            id="has-mega-menu"
                            checked={editingMenuItem.hasMegaMenu}
                            onCheckedChange={(checked) => setEditingMenuItem({
                              ...editingMenuItem,
                              hasMegaMenu: checked
                            })}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingMenuItem(null);
                            setIsNewMenuItem(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => saveMenuItem({
                            configId: selectedHeaderId,
                            menuItem: editingMenuItem
                          })}
                          disabled={isSavingMenuItem}
                        >
                          <SaveIcon className="h-4 w-4 mr-2" />
                          {isSavingMenuItem ? "Saving..." : "Save"}
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                  
                  {selectedConfig.menuItems.length === 0 ? (
                    <div className="text-center py-12 bg-secondary/10 rounded-lg">
                      <MenuIcon className="h-12 w-12 mx-auto mb-4 text-secondary/50" />
                      <h3 className="text-xl font-medium mb-2">No Menu Items</h3>
                      <p className="text-muted-foreground mb-4">
                        This header doesn't have any menu items yet.
                      </p>
                      <Button onClick={handleCreateMenuItem}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Menu Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedConfig.menuItems.map((item) => (
                        <Accordion key={item.id} type="single" collapsible>
                          <AccordionItem value="item-1">
                            <div className="flex items-center justify-between p-4 bg-card border rounded-t-md">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-sm text-muted-foreground">{item.path}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMenuItem(item);
                                  }}
                                >
                                  <Edit2Icon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick('menuItem', item.id as number);
                                  }}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                                <AccordionTrigger className="hover:no-underline" />
                              </div>
                            </div>
                            <AccordionContent>
                              <div className="p-4 border-x border-b rounded-b-md">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-medium">Mega Menu Categories</h4>
                                  {item.hasMegaMenu && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleCreateCategory(item.id as number)}
                                    >
                                      <PlusIcon className="h-4 w-4 mr-1" />
                                      Add Category
                                    </Button>
                                  )}
                                </div>
                                
                                {!item.hasMegaMenu ? (
                                  <div className="text-center py-6 bg-secondary/10 rounded-lg">
                                    <p className="text-muted-foreground">
                                      Mega menu is not enabled for this item.
                                    </p>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2"
                                      onClick={() => {
                                        const updatedItem = { ...item, hasMegaMenu: true };
                                        saveMenuItem({
                                          configId: selectedHeaderId,
                                          menuItem: updatedItem
                                        });
                                      }}
                                    >
                                      Enable Mega Menu
                                    </Button>
                                  </div>
                                ) : (
                                  <div>
                                    {editingCategory && selectedMenuItemId === item.id && (
                                      <Card className="mb-4">
                                        <CardHeader className="py-3">
                                          <CardTitle className="text-base">{isNewCategory ? "Add New Category" : "Edit Category"}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2">
                                          <div className="space-y-3">
                                            <div>
                                              <Label htmlFor="category-title">Title</Label>
                                              <Input 
                                                id="category-title" 
                                                value={editingCategory.title}
                                                onChange={(e) => setEditingCategory({
                                                  ...editingCategory,
                                                  title: e.target.value
                                                })}
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="category-order">Display Order</Label>
                                              <Input 
                                                id="category-order" 
                                                type="number"
                                                value={editingCategory.order}
                                                onChange={(e) => setEditingCategory({
                                                  ...editingCategory,
                                                  order: parseInt(e.target.value) || 0
                                                })}
                                              />
                                            </div>
                                          </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-2 py-3">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                              setEditingCategory(null);
                                              setIsNewCategory(false);
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            size="sm"
                                            onClick={() => saveMegaMenuCategory({
                                              configId: selectedHeaderId,
                                              menuItemId: selectedMenuItemId as number,
                                              category: editingCategory
                                            })}
                                            disabled={isSavingCategory}
                                          >
                                            <SaveIcon className="h-3 w-3 mr-1" />
                                            {isSavingCategory ? "Saving..." : "Save"}
                                          </Button>
                                        </CardFooter>
                                      </Card>
                                    )}
                                    
                                    {!item.megaMenuCategories || item.megaMenuCategories.length === 0 ? (
                                      <div className="text-center py-4 bg-secondary/10 rounded-lg">
                                        <p className="text-muted-foreground mb-2">
                                          No categories defined yet.
                                        </p>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleCreateCategory(item.id as number)}
                                        >
                                          <PlusIcon className="h-3 w-3 mr-1" />
                                          Add Category
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {item.megaMenuCategories.map((category) => (
                                          <Accordion key={category.id} type="single" collapsible>
                                            <AccordionItem value="category-1">
                                              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-t-md">
                                                <div>
                                                  <span className="font-medium">{category.title}</span>
                                                  <span className="text-xs ml-2 text-muted-foreground">Order: {category.order}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleEditCategory(item.id as number, category);
                                                    }}
                                                  >
                                                    <Edit2Icon className="h-3 w-3" />
                                                  </Button>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteClick('category', category.id as number);
                                                    }}
                                                  >
                                                    <Trash2Icon className="h-3 w-3" />
                                                  </Button>
                                                  <AccordionTrigger className="hover:no-underline" />
                                                </div>
                                              </div>
                                              <AccordionContent>
                                                <div className="p-3 border-x border-b rounded-b-md bg-background">
                                                  <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-sm font-medium">Menu Items</h4>
                                                    <Button 
                                                      size="sm" 
                                                      variant="outline"
                                                      onClick={() => handleCreateMegaMenuItem(item.id as number, category.id as number)}
                                                    >
                                                      <PlusIcon className="h-3 w-3 mr-1" />
                                                      Add Item
                                                    </Button>
                                                  </div>
                                                  
                                                  {editingMegaItem && 
                                                   selectedMenuItemId === item.id && 
                                                   selectedCategoryId === category.id && (
                                                    <Card className="mb-3">
                                                      <CardHeader className="py-2">
                                                        <CardTitle className="text-sm">{isNewMegaItem ? "Add New Item" : "Edit Item"}</CardTitle>
                                                      </CardHeader>
                                                      <CardContent className="py-2">
                                                        <div className="grid grid-cols-1 gap-3">
                                                          <div>
                                                            <Label htmlFor="mega-item-label" className="text-xs">Label</Label>
                                                            <Input 
                                                              id="mega-item-label" 
                                                              value={editingMegaItem.label}
                                                              onChange={(e) => setEditingMegaItem({
                                                                ...editingMegaItem,
                                                                label: e.target.value
                                                              })}
                                                            />
                                                          </div>
                                                          <div>
                                                            <Label htmlFor="mega-item-path" className="text-xs">Path</Label>
                                                            <Input 
                                                              id="mega-item-path" 
                                                              value={editingMegaItem.path}
                                                              onChange={(e) => setEditingMegaItem({
                                                                ...editingMegaItem,
                                                                path: e.target.value
                                                              })}
                                                            />
                                                          </div>
                                                          <div>
                                                            <Label htmlFor="mega-item-order" className="text-xs">Display Order</Label>
                                                            <Input 
                                                              id="mega-item-order" 
                                                              type="number"
                                                              value={editingMegaItem.order}
                                                              onChange={(e) => setEditingMegaItem({
                                                                ...editingMegaItem,
                                                                order: parseInt(e.target.value) || 0
                                                              })}
                                                            />
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <Label htmlFor="featured-item" className="text-xs">Featured Item</Label>
                                                            <Switch 
                                                              id="featured-item"
                                                              checked={editingMegaItem.featuredItem || false}
                                                              onCheckedChange={(checked) => setEditingMegaItem({
                                                                ...editingMegaItem,
                                                                featuredItem: checked
                                                              })}
                                                            />
                                                          </div>
                                                        </div>
                                                      </CardContent>
                                                      <CardFooter className="flex justify-end gap-2 py-2">
                                                        <Button 
                                                          variant="outline" 
                                                          size="sm"
                                                          onClick={() => {
                                                            setEditingMegaItem(null);
                                                            setIsNewMegaItem(false);
                                                          }}
                                                        >
                                                          Cancel
                                                        </Button>
                                                        <Button 
                                                          size="sm"
                                                          onClick={() => saveMegaMenuItem({
                                                            configId: selectedHeaderId,
                                                            menuItemId: selectedMenuItemId as number,
                                                            categoryId: selectedCategoryId as number,
                                                            megaItem: editingMegaItem
                                                          })}
                                                          disabled={isSavingMegaItem}
                                                        >
                                                          <SaveIcon className="h-3 w-3 mr-1" />
                                                          {isSavingMegaItem ? "Saving..." : "Save"}
                                                        </Button>
                                                      </CardFooter>
                                                    </Card>
                                                  )}
                                                  
                                                  {!category.items || category.items.length === 0 ? (
                                                    <div className="text-center py-3 bg-secondary/5 rounded-lg">
                                                      <p className="text-sm text-muted-foreground mb-2">
                                                        No items in this category.
                                                      </p>
                                                      <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleCreateMegaMenuItem(item.id as number, category.id as number)}
                                                      >
                                                        <PlusIcon className="h-3 w-3 mr-1" />
                                                        Add Item
                                                      </Button>
                                                    </div>
                                                  ) : (
                                                    <Table>
                                                      <TableHeader>
                                                        <TableRow>
                                                          <TableHead>Label</TableHead>
                                                          <TableHead>Path</TableHead>
                                                          <TableHead>Order</TableHead>
                                                          <TableHead>Featured</TableHead>
                                                          <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                        {category.items.map((megaItem) => (
                                                          <TableRow key={megaItem.id}>
                                                            <TableCell className="font-medium">{megaItem.label}</TableCell>
                                                            <TableCell>{megaItem.path}</TableCell>
                                                            <TableCell>{megaItem.order}</TableCell>
                                                            <TableCell>{megaItem.featuredItem ? "Yes" : "No"}</TableCell>
                                                            <TableCell className="text-right">
                                                              <div className="flex justify-end gap-1">
                                                                <Button 
                                                                  variant="ghost" 
                                                                  size="icon"
                                                                  onClick={() => handleEditMegaMenuItem(
                                                                    item.id as number, 
                                                                    category.id as number, 
                                                                    megaItem
                                                                  )}
                                                                >
                                                                  <Edit2Icon className="h-3 w-3" />
                                                                </Button>
                                                                <Button 
                                                                  variant="ghost" 
                                                                  size="icon"
                                                                  onClick={() => handleDeleteClick('megaItem', megaItem.id as number)}
                                                                >
                                                                  <Trash2Icon className="h-3 w-3" />
                                                                </Button>
                                                              </div>
                                                            </TableCell>
                                                          </TableRow>
                                                        ))}
                                                      </TableBody>
                                                    </Table>
                                                  )}
                                                </div>
                                              </AccordionContent>
                                            </AccordionItem>
                                          </Accordion>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="headerSettings">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Header Settings</h2>
                  </div>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="edit-category">Category</Label>
                          <Input 
                            id="edit-category" 
                            value={selectedConfig.category}
                            onChange={(e) => {
                              const updatedConfig = {
                                ...selectedConfig,
                                category: e.target.value
                              };
                              saveHeaderConfig(updatedConfig);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-logo-text">Logo Text</Label>
                          <Input 
                            id="edit-logo-text" 
                            value={selectedConfig.logoText}
                            onChange={(e) => {
                              const updatedConfig = {
                                ...selectedConfig,
                                logoText: e.target.value
                              };
                              saveHeaderConfig(updatedConfig);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-logo-src">Logo Image URL</Label>
                          <Input 
                            id="edit-logo-src" 
                            value={selectedConfig.logoSrc}
                            onChange={(e) => {
                              const updatedConfig = {
                                ...selectedConfig,
                                logoSrc: e.target.value
                              };
                              saveHeaderConfig(updatedConfig);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-primary-color">
                            Primary Color
                            <span className="text-sm text-gray-500 ml-2 font-normal">
                              (Read-only - Managed in Category Colors page)
                            </span>
                          </Label>
                          <div className="flex gap-2">
                            <div className="flex-none w-10 h-10 rounded overflow-hidden border">
                              <div 
                                className="w-full h-full" 
                                style={{ backgroundColor: selectedConfig.primaryColor }}
                              ></div>
                            </div>
                            <Input 
                              id="edit-primary-color" 
                              type="color"
                              className="flex-1"
                              value={selectedConfig.primaryColor}
                              onChange={(e) => {
                                const updatedConfig = {
                                  ...selectedConfig,
                                  primaryColor: e.target.value
                                };
                                saveHeaderConfig(updatedConfig);
                              }}
                            />
                          </div>
                          <p className="text-amber-600 text-xs mt-1">
                            Note: For consistent theming, this color is controlled by the 
                            <a href="/admin/category-colors" className="font-medium mx-1 hover:underline">Category Colors</a> 
                            page. Changes made here may be overwritten.
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="edit-banner-text">Banner Text</Label>
                          <Input 
                            id="edit-banner-text" 
                            value={selectedConfig.bannerText || ''}
                            onChange={(e) => {
                              const updatedConfig = {
                                ...selectedConfig,
                                bannerText: e.target.value
                              };
                              saveHeaderConfig(updatedConfig);
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center text-destructive my-8">
              <h3 className="text-xl font-bold">Configuration Not Found</h3>
              <p>The header configuration you're looking for doesn't exist.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSelectedHeaderId(null)}
              >
                Go Back
              </Button>
            </div>
          )}
        </div>
      )}
      
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Header list component
const HeadersList = ({ 
  headers, 
  isLoading,
  onSelect,
  onEdit,
  onDelete
}: { 
  headers: HeaderConfig[],
  isLoading: boolean,
  onSelect: (id: number) => void,
  onEdit: (config: HeaderConfig) => void,
  onDelete: (id: string | number) => void
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!headers.length) {
    return (
      <div className="text-center py-12 bg-secondary/10 rounded-lg">
        <LayoutIcon className="h-12 w-12 mx-auto mb-4 text-secondary/50" />
        <h3 className="text-xl font-medium mb-2">No Header Configurations</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any header configurations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {headers.map((header) => (
        <Card key={header.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="flex-none w-full md:w-1/4 bg-muted p-4 flex items-center justify-center md:border-r">
              <div className="text-center">
                <div 
                  className="inline-block w-8 h-8 rounded-full mb-2"
                  style={{ backgroundColor: header.primaryColor }}
                ></div>
                <h3 className="font-medium">{header.category.charAt(0).toUpperCase() + header.category.slice(1)}</h3>
                <p className="text-sm text-muted-foreground">
                  {header.menuItems?.length || 0} menu items
                </p>
              </div>
            </div>
            <div className="flex-1 p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <h3 className="font-medium mb-1">
                    {header.logoText}
                    {header.bannerText && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                        Has Banner
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {header.createdAt 
                      ? `Created: ${new Date(header.createdAt).toLocaleDateString()}`
                      : "Recently created"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(header)}
                  >
                    <Edit2Icon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(header.id)}
                  >
                    <Trash2Icon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onSelect(header.id as number)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {header.menuItems?.slice(0, 5).map((item) => (
                  <div 
                    key={item.id} 
                    className="text-xs px-2 py-1 bg-secondary/20 rounded-full"
                  >
                    {item.label}
                    {item.hasMegaMenu && (
                      <span className="ml-1 text-primary">•</span>
                    )}
                  </div>
                ))}
                {header.menuItems?.length > 5 && (
                  <div className="text-xs px-2 py-1 bg-secondary/10 rounded-full">
                    +{header.menuItems.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Edit header form component
const EditHeaderForm = ({ 
  header, 
  isNew, 
  isPending,
  onSave,
  onCancel
}: { 
  header: HeaderConfig,
  isNew: boolean,
  isPending: boolean,
  onSave: (config: HeaderConfig) => void,
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState<HeaderConfig>(header);
  
  const handleChange = (field: keyof HeaderConfig, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? "Create New Header" : "Edit Header"}</CardTitle>
        <CardDescription>
          Configure the header appearance and initial navigation structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Category Slug</Label>
              <Input 
                id="category" 
                placeholder="e.g., hiking, camping" 
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be used in URLs and for identifying this header
              </p>
            </div>
            <div>
              <Label htmlFor="logo-text">Logo Text</Label>
              <Input 
                id="logo-text" 
                placeholder="e.g., Hiking Trails" 
                value={formData.logoText}
                onChange={(e) => handleChange('logoText', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="logo-src">Logo Image URL</Label>
              <Input 
                id="logo-src" 
                placeholder="https://example.com/image.jpg" 
                value={formData.logoSrc}
                onChange={(e) => handleChange('logoSrc', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="primary-color">
                Primary Color
                <span className="text-sm text-gray-500 ml-2 font-normal">
                  (For initial setup only)
                </span>
              </Label>
              <Input 
                id="primary-color" 
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                required
              />
              <p className="text-amber-600 text-xs mt-1">
                Note: After creation, use the 
                <a href="/admin/category-colors" className="font-medium mx-1 hover:underline">Category Colors</a> 
                page to manage colors consistently.
              </p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="banner-text">Banner Text (Optional)</Label>
              <Input 
                id="banner-text" 
                placeholder="Promotional text to display in the banner" 
                value={formData.bannerText || ''}
                onChange={(e) => handleChange('bannerText', e.target.value)}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? 
            `${isNew ? "Creating" : "Saving"}...` : 
            isNew ? "Create Header" : "Save Changes"
          }
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HeaderMenusAdmin;