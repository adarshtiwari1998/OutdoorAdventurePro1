
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Video, Eye, EyeOff, Plus, Trash2, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    queryKey: [`/api/admin/category-video-preview/${watchedCategory}`],
    queryFn: async () => {
      const currentCategoryId = form.getValues('categoryId');
      const currentVideoCount = form.getValues('videoCount');
      const currentVideoType = form.getValues('videoType');
      const currentCategory = form.getValues('category');
      
      if (!currentCategory || !currentCategoryId || currentCategoryId === "" || currentCategoryId === "undefined") {
        return [];
      }
      
      const response = await fetch(`/api/admin/category-video-preview/${currentCategory}?categoryId=${currentCategoryId}&videoCount=${currentVideoCount || 8}&videoType=${currentVideoType || 'all'}`);
      return response.json();
    },
    enabled: !!(watchedCategory && watchedCategoryId && watchedCategoryId !== "" && watchedCategoryId !== "undefined"),
    refetchOnMount: true,
  });

  // Get available categories (header configs that have landing pages)
  const availableCategories = headerConfigs?.filter((config: any) => 
    ['hiking', 'fishing', 'camping', 'cruising', 'outdoors', 'four-x-four'].includes(config.category)
  ) || [];

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: async (values: CategoryVideoSettings) => {
      return apiRequest('POST', '/api/admin/category-video-settings', values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category video settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-video-settings'] });
      setEditingCategory(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error}`,
        variant: "destructive",
      });
    }
  });

  const deleteSettingsMutation = useMutation({
    mutationFn: async (category: string) => {
      return apiRequest('DELETE', `/api/admin/category-video-settings/${category}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category video settings deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-video-settings'] });
      setEditingCategory(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete settings: ${error}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: CategoryVideoSettings) => {
    saveSettingsMutation.mutate(values);
  };

  const handleEdit = (settings: any) => {
    setEditingCategory(settings.category);
    form.reset({
      category: settings.category,
      categoryId: settings.categoryId?.toString() || "",
      videoCount: settings.videoCount || 8,
      isActive: settings.isActive ?? true,
      title: settings.title || "Latest Videos",
      description: settings.description || "",
      videoType: settings.videoType || "all",
    });
  };

  const handleDelete = (category: string) => {
    if (confirm(`Are you sure you want to delete video settings for ${category}?`)) {
      deleteSettingsMutation.mutate(category);
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    form.reset();
  };

  if (settingsLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Category Video Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure video sections for category landing pages
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? `Edit ${editingCategory} Video Settings` : "Add New Category Video Section"}
            </CardTitle>
            <CardDescription>
              Choose category and configure video display settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landing Page Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!!editingCategory}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCategories.map((config: any) => (
                            <SelectItem 
                              key={config.category} 
                              value={config.category}
                            >
                              {config.category.charAt(0).toUpperCase() + config.category.slice(1)} Landing Page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Video Section
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Show/hide the video section on category page
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Latest Videos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Description (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Experience our content in two formats - quick shorts and detailed videos" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: any) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name} (ID: {category.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Videos</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="20" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="text-sm text-muted-foreground">
                        How many videos to display in the section (1-20)
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Type Filter</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select video type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Videos (Shorts + Videos)</SelectItem>
                          <SelectItem value="video">Videos Only</SelectItem>
                          <SelectItem value="short">Shorts Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={saveSettingsMutation.isPending}
                    className="flex-1"
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingCategory ? "Update Settings" : "Save Settings"}
                      </>
                    )}
                  </Button>
                  {editingCategory && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Preview
            </CardTitle>
            <CardDescription>
              Preview of videos that will appear in the section
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!form.watch('categoryId') || form.watch('categoryId') === "" ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a video category to see preview</p>
              </div>
            ) : previewLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-20 h-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : previewVideos?.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos available for this category</p>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {form.watch('isActive') ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Section will be visible on category page</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-600">Section will be hidden on category page</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Settings Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Existing Category Video Settings</CardTitle>
          <CardDescription>
            Manage video sections for all category landing pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSettings?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Video Count</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSettings.map((setting: any) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {setting.category.charAt(0).toUpperCase() + setting.category.slice(1)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={setting.isActive ? "default" : "secondary"}>
                        {setting.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{setting.title}</TableCell>
                    <TableCell>{setting.videoCount}</TableCell>
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
