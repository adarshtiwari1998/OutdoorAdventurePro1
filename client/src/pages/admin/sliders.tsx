import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MoreHorizontal, Plus, Trash, Edit, Eye, ArrowUp, ArrowDown, PlaySquare, Upload, Image } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define slider form schema
const sliderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  backgroundImage: z.string().optional(),
  videoUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().optional()
});

type SliderFormValues = z.infer<typeof sliderFormSchema>;

export default function SlidersPage() {
  const { toast } = useToast();
  const [editingSlider, setEditingSlider] = useState<any>(null);
  const [sliderToDelete, setSliderToDelete] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch all sliders
  const { data: sliders, isLoading } = useQuery({
    queryKey: ['/api/admin/sliders'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sliders');
      if (!res.ok) throw new Error('Failed to fetch sliders');
      return res.json();
    },
  });

  // Create slider mutation
  const createSliderMutation = useMutation({
    mutationFn: async (data: SliderFormValues) => {
      const res = await apiRequest('POST', '/api/admin/sliders', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Slider created',
        description: 'The slider has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sliders'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create slider: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update slider mutation
  const updateSliderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SliderFormValues> }) => {
      const res = await apiRequest('PATCH', `/api/admin/sliders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Slider updated',
        description: 'The slider has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sliders'] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update slider: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete slider mutation
  const deleteSliderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/sliders/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Slider deleted',
        description: 'The slider has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sliders'] });
      setIsDeleting(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete slider: ${error.message}`,
        variant: 'destructive',
      });
      setIsDeleting(false);
    },
  });

  // Reorder slider mutation
  const reorderSliderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number; order: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/sliders/${id}/order`, { order });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sliders'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to reorder slider: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Process YouTube URL mutation
  const processYoutubeUrlMutation = useMutation({
    mutationFn: async ({ youtubeUrl, sliderId }: { youtubeUrl: string, sliderId?: number }) => {
      const res = await apiRequest('POST', '/api/admin/process-youtube-url', { youtubeUrl, sliderId });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'YouTube URL processed',
        description: 'The YouTube URL has been processed. Converting to MP4 in the background...',
      });
      
      // If we're editing, update the form values
      if (isEditDialogOpen && editForm) {
        editForm.setValue('videoUrl', data.directVideoUrl);
        if (!editForm.getValues().backgroundImage) {
          editForm.setValue('backgroundImage', data.thumbnailUrl);
        }
      }
      
      // If we're creating, update the form values
      if (isCreateDialogOpen && createForm) {
        createForm.setValue('videoUrl', data.directVideoUrl);
        if (!createForm.getValues().backgroundImage) {
          createForm.setValue('backgroundImage', data.thumbnailUrl);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to process YouTube URL: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create form
  const createForm = useForm<SliderFormValues>({
    resolver: zodResolver(sliderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      backgroundImage: '',
      videoUrl: '',
      youtubeUrl: '',
      ctaText: '',
      ctaLink: '',
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<SliderFormValues>({
    resolver: zodResolver(sliderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      backgroundImage: '',
      videoUrl: '',
      youtubeUrl: '',
      ctaText: '',
      ctaLink: '',
      isActive: true,
    },
  });

  function handleCreateSubmit(data: SliderFormValues) {
    createSliderMutation.mutate(data);
  }

  function handleEditSubmit(data: SliderFormValues) {
    if (!editingSlider) return;
    updateSliderMutation.mutate({ id: editingSlider.id, data });
  }

  function handleProcessYoutubeUrl(form: any) {
    const youtubeUrl = form.getValues('youtubeUrl');
    if (!youtubeUrl) {
      toast({
        title: 'YouTube URL required',
        description: 'Please enter a YouTube URL to process.',
        variant: 'destructive',
      });
      return;
    }

    // If we're editing, include the slider ID to update the record when MP4 is ready
    if (isEditDialogOpen && editingSlider) {
      processYoutubeUrlMutation.mutate({
        youtubeUrl,
        sliderId: editingSlider.id
      });
    } else {
      // For new sliders, just process the URL - the slider ID will be assigned during creation
      processYoutubeUrlMutation.mutate({ youtubeUrl });
    }
  }

  function handleEditSlider(slider: any) {
    setEditingSlider(slider);
    
    // Ensure we preserve the full URL path for videos and don't truncate them
    const fullVideoUrl = slider.videoUrl || '';
    
    editForm.reset({
      title: slider.title || '',
      description: slider.description || '',
      backgroundImage: slider.backgroundImage || '',
      videoUrl: fullVideoUrl, // Use the preserved full video URL
      youtubeUrl: slider.youtubeUrl || '',
      ctaText: slider.ctaText || '',
      ctaLink: slider.ctaLink || '',
      isActive: slider.isActive || false,
    });
    setIsEditDialogOpen(true);
    
    console.log("Editing slider with video URL:", fullVideoUrl);
  }

  function handleDeleteSlider(slider: any) {
    setSliderToDelete(slider);
    setIsDeleteDialogOpen(true);
  }
  
  function confirmDeleteSlider() {
    if (!sliderToDelete) return;
    
    setIsDeleting(true);
    deleteSliderMutation.mutate(sliderToDelete.id);
    setIsDeleteDialogOpen(false);
  }

  function handleToggleActive(slider: any) {
    updateSliderMutation.mutate({
      id: slider.id,
      data: { isActive: !slider.isActive },
    });
  }

  function handleMoveUp(slider: any, index: number) {
    if (index === 0) return;
    const previousSlider = sliders[index - 1];
    reorderSliderMutation.mutate({
      id: slider.id,
      order: previousSlider.order - 1,
    });
  }

  function handleMoveDown(slider: any, index: number) {
    if (index === sliders.length - 1) return;
    const nextSlider = sliders[index + 1];
    reorderSliderMutation.mutate({
      id: slider.id,
      order: nextSlider.order + 1,
    });
  }

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Slider Management</h1>
          <Button onClick={() => {
            createForm.reset({
              title: '',
              description: '',
              backgroundImage: '',
              videoUrl: '',
              youtubeUrl: '',
              ctaText: '',
              ctaLink: '',
              isActive: true,
            });
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Slider
          </Button>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>All Sliders</CardTitle>
            <CardDescription>
              Manage your homepage sliders and videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sliders?.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No sliders found. Create your first slider using the "Add New Slider" button.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="relative overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sliders?.map((slider: any, index: number) => (
                      <TableRow key={slider.id}>
                        <TableCell>
                          <div className="font-medium">{slider.title}</div>
                          {slider.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-md">
                              {slider.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {slider.videoUrl ? (
                            <div className="flex items-center">
                              <PlaySquare className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="text-sm">Video</span>
                            </div>
                          ) : slider.backgroundImage ? (
                            <div className="flex items-center">
                              <Image className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Image</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {slider.isActive ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => handleMoveUp(slider, index)}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => handleMoveDown(slider, index)}
                              disabled={index === sliders.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditSlider(slider)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(slider)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>{slider.isActive ? 'Deactivate' : 'Activate'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteSlider(slider)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Slider Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Slider</DialogTitle>
            <DialogDescription>
              Add a new slider to your homepage. You can use an image background, video, or both.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
                  <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                  <TabsTrigger value="cta" className="flex-1">Call to Action</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a title for this slider" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter a brief description" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Slider Status</FormLabel>
                          <FormDescription>
                            Enable to display this slider on the homepage
                          </FormDescription>
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
                </TabsContent>
                
                <TabsContent value="media" className="space-y-4 pt-4">
                  <FormField
                    control={createForm.control}
                    name="backgroundImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Image URL</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input placeholder="Enter image URL" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter a URL for the background image of this slider
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="youtubeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input placeholder="Enter YouTube URL" {...field} />
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => handleProcessYoutubeUrl(createForm)}
                              disabled={processYoutubeUrlMutation.isPending}
                            >
                              {processYoutubeUrlMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Process
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter a YouTube URL to automatically extract the video
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direct Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter direct video URL" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be automatically filled when processing a YouTube URL, or you can enter a direct MP4 video URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="cta" className="space-y-4 pt-4">
                  <FormField
                    control={createForm.control}
                    name="ctaText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter button text (e.g. 'Learn More')" {...field} />
                        </FormControl>
                        <FormDescription>
                          Text to display on the call-to-action button
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="ctaLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter button link (e.g. '/products')" {...field} />
                        </FormControl>
                        <FormDescription>
                          Where the button should link to, either a relative path (/about) or full URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createSliderMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {createSliderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Slider
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Slider Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Slider</DialogTitle>
            <DialogDescription>
              Make changes to the slider.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
                  <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                  <TabsTrigger value="cta" className="flex-1">Call to Action</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a title for this slider" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter a brief description" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Slider Status</FormLabel>
                          <FormDescription>
                            Enable to display this slider on the homepage
                          </FormDescription>
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
                </TabsContent>
                
                <TabsContent value="media" className="space-y-4 pt-4">
                  <FormField
                    control={editForm.control}
                    name="backgroundImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Image URL</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input placeholder="Enter image URL" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter a URL for the background image of this slider
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="youtubeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input placeholder="Enter YouTube URL" {...field} />
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => handleProcessYoutubeUrl(editForm)}
                              disabled={processYoutubeUrlMutation.isPending}
                            >
                              {processYoutubeUrlMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Process
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter a YouTube URL to automatically extract the video
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direct Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter direct video URL" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be automatically filled when processing a YouTube URL, or you can enter a direct MP4 video URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="cta" className="space-y-4 pt-4">
                  <FormField
                    control={editForm.control}
                    name="ctaText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter button text (e.g. 'Learn More')" {...field} />
                        </FormControl>
                        <FormDescription>
                          Text to display on the call-to-action button
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="ctaLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter button link (e.g. '/products')" {...field} />
                        </FormControl>
                        <FormDescription>
                          Where the button should link to, either a relative path (/about) or full URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateSliderMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {updateSliderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Slider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this slider? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {sliderToDelete && (
              <div className="flex flex-col space-y-2 p-4 border rounded-md bg-muted/50">
                <div className="font-medium">{sliderToDelete.title}</div>
                {sliderToDelete.description && (
                  <div className="text-sm text-muted-foreground">{sliderToDelete.description}</div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteSlider}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Slider'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}