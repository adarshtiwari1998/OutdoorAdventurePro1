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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Video, Eye, EyeOff } from "lucide-react";

const homeVideoSettingsSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  videoCount: z.number().min(1, "Must show at least 1 video").max(20, "Maximum 20 videos allowed"),
  isActive: z.boolean(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoType: z.enum(["all", "video", "short"]).default("all"),
});

type HomeVideoSettings = z.infer<typeof homeVideoSettingsSchema>;

const HomeVideos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/home-video-settings'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Form
  const form = useForm<HomeVideoSettings>({
    resolver: zodResolver(homeVideoSettingsSchema),
    defaultValues: {
      categoryId: "",
      videoCount: 8,
      isActive: true,
      title: "Latest Videos",
      description: "Check out our latest outdoor adventure videos",
      videoType: "all",
    },
  });

  // Watch form values for preview
  const watchedCategoryId = form.watch('categoryId');
  const watchedVideoCount = form.watch('videoCount');

  const { data: previewVideos, isLoading: previewLoading } = useQuery({
    queryKey: ['/api/admin/home-video-preview'],
    queryFn: async () => {
      const currentCategoryId = form.getValues('categoryId');
      const currentVideoCount = form.getValues('videoCount');
      const currentVideoType = form.getValues('videoType');
      
      console.log('Preview query - using form values:', { currentCategoryId, currentVideoCount, currentVideoType });
      
      if (!currentCategoryId || currentCategoryId === "" || currentCategoryId === "undefined" || currentCategoryId.startsWith('header_')) {
        console.log('Preview query - invalid categoryId, returning empty array');
        return [];
      }
      
      const response = await fetch(`/api/admin/home-video-preview?categoryId=${currentCategoryId}&videoCount=${currentVideoCount || 8}&videoType=${currentVideoType || 'all'}`);
      return response.json();
    },
    enabled: !!(watchedCategoryId && watchedCategoryId !== "" && watchedCategoryId !== "undefined" && !watchedCategoryId.startsWith('header_')),
    refetchOnMount: true,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      console.log('Updating form with settings:', settings);
      const newValues = {
        categoryId: settings.categoryId?.toString() || "",
        videoCount: settings.videoCount || 8,
        isActive: settings.isActive ?? true,
        title: settings.title || "Latest Videos",
        description: settings.description || "Check out our latest outdoor adventure videos",
        videoType: settings.videoType || "all",
      };
      console.log('Setting form values:', newValues);
      form.reset(newValues);
    }
  }, [settings, form]);

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: async (values: HomeVideoSettings) => {
      return apiRequest('POST', '/api/admin/home-video-settings', values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Home video settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/home-video-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/home-video-preview'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: HomeVideoSettings) => {
    saveSettingsMutation.mutate(values);
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
          <h1 className="text-3xl font-heading font-bold">Home Video Slider</h1>
          <p className="text-muted-foreground mt-2">
            Configure which videos appear in the homepage video slider section
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>Video Slider Settings</CardTitle>
            <CardDescription>
              Choose which category videos to display on the homepage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Video Slider
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Show/hide the video slider section on homepage
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
                          placeholder="Check out our latest outdoor adventure videos" 
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
                        How many videos to display in the slider (1-20)
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
                      <div className="text-sm text-muted-foreground">
                        Choose what type of content to show in the slider
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={saveSettingsMutation.isPending}
                  className="w-full"
                >
                  {saveSettingsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
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
              Preview of videos that will appear in the slider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!form.watch('categoryId') || form.watch('categoryId') === "" ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a category to see video preview</p>
                <p className="text-xs mt-2">Current categoryId: {form.watch('categoryId') || 'undefined'}</p>
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
                {previewVideos.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No videos found for this category</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos available</p>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {form.watch('isActive') ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Slider will be visible on homepage</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-600">Slider will be hidden on homepage</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeVideos;