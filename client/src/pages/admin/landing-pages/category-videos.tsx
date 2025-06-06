
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Video, Loader2 } from "lucide-react";

const categoryVideoSettingsSchema = z.object({
  category: z.string().min(1, "Category is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  videoCount: z.number().min(1, "Must show at least 1 video").max(20, "Maximum 20 videos allowed"),
  isActive: z.boolean(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoType: z.enum(["all", "video", "short"]).default("all"),
});

type CategoryVideoSettings = z.infer<typeof categoryVideoSettingsSchema>;

const CategoryVideos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // Queries
  const { data: allSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/category-video-settings'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: headerConfigs } = useQuery({
    queryKey: ['/api/admin/header-configs'],
  });

  // Form
  const form = useForm<CategoryVideoSettings>({
    resolver: zodResolver(categoryVideoSettingsSchema),
    defaultValues: {
      category: "",
      categoryId: "",
      videoCount: 8,
      isActive: true,
      title: "Latest Videos",
      description: "Check out our latest videos",
      videoType: "all",
    },
  });

  // Watch form values for preview
  const watchedCategoryId = form.watch('categoryId');
  const watchedVideoCount = form.watch('videoCount');
  const watchedCategory = form.watch('category');

  const { data: previewVideos, isLoading: previewLoading } = useQuery({
    queryKey: [`/api/admin/category-video-preview/${watchedCategory}`, watchedCategoryId, watchedVideoCount],
    queryFn: async () => {
      const currentCategoryId = form.getValues('categoryId');
      const currentVideoCount = form.getValues('videoCount');
      const currentVideoType = form.getValues('videoType');
      const currentCategory = form.getValues('category');

      if (!currentCategoryId || currentCategoryId === "" || currentCategoryId === "undefined") {
        return [];
      }

      // Use the actual category ID if it's numeric, otherwise use the category name
      const categoryForUrl = currentCategory || 'preview';
      const response = await fetch(`/api/admin/category-video-preview/${categoryForUrl}?categoryId=${currentCategoryId}&videoCount=${currentVideoCount || 8}&videoType=${currentVideoType || 'all'}`);
      return response.json();
    },
    enabled: !!(watchedCategoryId && watchedCategoryId !== "" && watchedCategoryId !== "undefined"),
    refetchOnMount: true,
  });

  // Get available categories (header configs that have landing pages)
  const availableCategories = headerConfigs?.filter((config: any) => 
    ['hiking', 'fishing', 'camping', 'cruising', 'outdoors', 'four-x-four'].includes(config.category)
  ) || [];

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: CategoryVideoSettings) => {
      const response = await fetch('/api/admin/category-video-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category video settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-video-settings'] });
      form.reset();
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await fetch(`/api/admin/category-video-settings/${category}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete settings');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category video settings deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-video-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryVideoSettings) => {
    // Ensure we have a proper numeric category ID
    let finalCategoryId = data.categoryId;
    
    // If categoryId is not a number, try to find the corresponding category
    if (isNaN(parseInt(finalCategoryId))) {
      const category = categories?.find((cat: any) => 
        cat.name.toLowerCase() === finalCategoryId.toLowerCase() ||
        cat.slug.toLowerCase() === finalCategoryId.toLowerCase()
      );
      if (category) {
        finalCategoryId = category.id.toString();
      }
    }
    
    const submissionData = {
      ...data,
      categoryId: finalCategoryId
    };
    
    console.log('Submitting category video settings:', submissionData);
    saveMutation.mutate(submissionData);
  };

  const handleEdit = (setting: any) => {
    setEditingCategory(setting.category);
    
    // Set the selected category for the preview
    setSelectedCategory(setting.category);
    
    // Find the actual category ID from the categories list
    let actualCategoryId = setting.categoryId;
    if (!actualCategoryId && categories) {
      const category = categories.find((cat: any) => cat.name.toLowerCase() === setting.category.toLowerCase());
      actualCategoryId = category?.id;
    }
    
    form.reset({
      category: setting.category,
      categoryId: actualCategoryId ? actualCategoryId.toString() : "",
      videoCount: setting.videoCount,
      isActive: setting.isActive,
      title: setting.title,
      description: setting.description || "",
      videoType: setting.videoType || "all",
    });

    // Scroll to form for better UX
    setTimeout(() => {
      document.getElementById('category-form')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const handleDelete = (category: string) => {
    if (confirm(`Are you sure you want to delete the video settings for ${category}?`)) {
      deleteMutation.mutate(category);
    }
  };

  const handleCategoryChange = (categoryValue: string) => {
    // Check if it's a header category or regular category
    const headerConfig = availableCategories.find((config: any) => config.category === categoryValue);
    
    if (headerConfig) {
      // It's a header category - use the category name and find corresponding blog category ID
      form.setValue('category', categoryValue);
      
      // Find the corresponding blog category
      const blogCategory = categories?.find((cat: any) => 
        cat.name.toLowerCase() === categoryValue.toLowerCase() || 
        cat.slug.toLowerCase() === categoryValue.toLowerCase()
      );
      
      if (blogCategory) {
        form.setValue('categoryId', blogCategory.id.toString());
      } else {
        form.setValue('categoryId', categoryValue); // Fallback to category name
      }
      
      setSelectedCategory(categoryValue);
    } else {
      // Check if it's a regular category ID
      const category = categories?.find((cat: any) => cat.id.toString() === categoryValue);
      if (category) {
        form.setValue('category', category.name.toLowerCase());
        form.setValue('categoryId', category.id.toString());
        setSelectedCategory(category.name.toLowerCase());
      }
    }
  };

  // Group categories by type for better organization
  const getCategoryDisplayText = (category: any) => {
    const type = category.type || 'blog';
    const typeLabel = type === 'activity' ? 'Activity' : 
                     type === 'product' ? 'Product' : 
                     type === 'header' ? 'Landing Page' : 'Blog';
    return `${category.name} (${typeLabel} - ID: ${category.id})`;
  };

  return (
      <div className="space-y-6">
        <Card id="category-form">
          <CardHeader>
            <CardTitle>
              {editingCategory ? `Edit ${editingCategory} Video Settings` : 'Add Category Video Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.watch('categoryId')}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {/* Header categories (landing pages) */}
                      {availableCategories.length > 0 && (
                        <>
                          {availableCategories.map((config: any) => (
                            <SelectItem key={config.category} value={config.category}>
                              {config.category.charAt(0).toUpperCase() + config.category.slice(1)} (Landing Page)
                            </SelectItem>
                          ))}
                          {categories && categories.length > 0 && <hr className="my-2" />}
                        </>
                      )}
                      
                      {/* Activity categories */}
                      {categories?.filter((cat: any) => cat.type === 'activity').length > 0 && (
                        <>
                          {categories.filter((cat: any) => cat.type === 'activity').map((category: any) => (
                            <SelectItem key={`activity-${category.id}`} value={category.id.toString()}>
                              {getCategoryDisplayText(category)}
                            </SelectItem>
                          ))}
                          {categories.filter((cat: any) => cat.type === 'blog').length > 0 && <hr className="my-2" />}
                        </>
                      )}
                      
                      {/* Blog categories that don't have landing pages */}
                      {categories?.filter((cat: any) => 
                        cat.type === 'blog' && 
                        !availableCategories.some((header: any) => 
                          header.category.toLowerCase() === cat.name.toLowerCase()
                        )
                      ).map((category: any) => (
                        <SelectItem key={`blog-${category.id}`} value={category.id.toString()}>
                          {getCategoryDisplayText(category)}
                        </SelectItem>
                      ))}
                      
                      {/* Other category types */}
                      {categories?.filter((cat: any) => 
                        cat.type !== 'activity' && 
                        cat.type !== 'blog' &&
                        !availableCategories.some((header: any) => 
                          header.category.toLowerCase() === cat.name.toLowerCase()
                        )
                      ).map((category: any) => (
                        <SelectItem key={`other-${category.id}`} value={category.id.toString()}>
                          {getCategoryDisplayText(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="videoCount">Video Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    {...form.register('videoCount', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="title">Section Title</Label>
                  <Input {...form.register('title')} />
                </div>

                <div>
                  <Label htmlFor="videoType">Video Type</Label>
                  <Select
                    value={form.watch('videoType')}
                    onValueChange={(value) => form.setValue('videoType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Videos</SelectItem>
                      <SelectItem value="video">Videos Only</SelectItem>
                      <SelectItem value="short">Shorts Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea {...form.register('description')} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingCategory ? 'Update Settings' : 'Save Settings'
                  )}
                </Button>
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : previewVideos && previewVideos.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {previewVideos.slice(0, form.watch('videoCount')).map((video: any) => (
                      <div key={video.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{video.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {video.videoType === 'short' ? 'Short' : 'Video'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(video.publishedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No videos found for this category</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : allSettings && allSettings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Video Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Video Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSettings.map((setting: any) => (
                    <TableRow key={setting.category}>
                      <TableCell className="font-medium">
                        {setting.category.charAt(0).toUpperCase() + setting.category.slice(1)}
                      </TableCell>
                      <TableCell>{setting.title}</TableCell>
                      <TableCell>{setting.videoCount}</TableCell>
                      <TableCell>
                        <Badge variant={setting.isActive ? "default" : "secondary"}>
                          {setting.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {setting.videoType === 'all' ? 'All' : setting.videoType === 'video' ? 'Videos' : 'Shorts'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(setting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(setting.category)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <AlertDescription>
                  No category video settings configured yet. Create your first one above.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default CategoryVideos;
