import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, Youtube, FileText, Upload, RefreshCw, CheckCircle, AlertTriangle, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

// Schemas
const youtubeChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  channelName: z.string().min(1, "Channel name is required"),
});

const youtubeVideoSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),
});

// Types
type YoutubeChannel = {
  id: string;
  channelId: string;
  name: string;
  subscribers: number;
  videoCount: number;
  lastImport: string | null;
};

type YoutubeVideo = {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelName: string;
  importStatus: "pending" | "imported" | "failed";
  blogPostId?: string;
  errorMessage?: string;
};

const YoutubeImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("channels");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  
  // Queries
  const { data: channels, isLoading: channelsLoading } = useQuery<YoutubeChannel[]>({
    queryKey: ['/api/admin/youtube/channels'],
  });

  const { data: videos, isLoading: videosLoading } = useQuery<YoutubeVideo[]>({
    queryKey: ['/api/admin/youtube/videos', { channelId: selectedChannelId }],
    enabled: !!selectedChannelId,
  });

  const { data: blogCategories } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/admin/blog/categories'],
  });

  // Forms
  const channelForm = useForm<z.infer<typeof youtubeChannelSchema>>({
    resolver: zodResolver(youtubeChannelSchema),
    defaultValues: {
      channelId: "",
      channelName: "",
    }
  });

  const videoForm = useForm<z.infer<typeof youtubeVideoSchema>>({
    resolver: zodResolver(youtubeVideoSchema),
    defaultValues: {
      videoId: "",
      title: "",
      description: "",
    }
  });

  const importForm = useForm({
    defaultValues: {
      videoId: "",
      title: "",
      categoryId: "",
      summary: true,
      tags: true,
    }
  });

  // Mutations
  const addChannelMutation = useMutation({
    mutationFn: async (values: z.infer<typeof youtubeChannelSchema>) => {
      return apiRequest('POST', '/api/admin/youtube/channels', values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Youtube channel added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/channels'] });
      channelForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add Youtube channel: ${error}`,
        variant: "destructive",
      });
    }
  });

  const addVideoMutation = useMutation({
    mutationFn: async (values: z.infer<typeof youtubeVideoSchema>) => {
      return apiRequest('POST', '/api/admin/youtube/videos', values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Youtube video added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/videos'] });
      videoForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add Youtube video: ${error}`,
        variant: "destructive",
      });
    }
  });

  const importChannelVideosMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return apiRequest('POST', `/api/admin/youtube/channels/${channelId}/import`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Videos are being imported. Check back soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/videos'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to import videos: ${error}`,
        variant: "destructive",
      });
    }
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return apiRequest('DELETE', `/api/admin/youtube/channels/${channelId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Youtube channel deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/channels'] });
      if (selectedChannelId) {
        setSelectedChannelId(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete channel: ${error}`,
        variant: "destructive",
      });
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return apiRequest('DELETE', `/api/admin/youtube/videos/${videoId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Youtube video deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/videos'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete video: ${error}`,
        variant: "destructive",
      });
    }
  });

  const convertToBlogPostMutation = useMutation({
    mutationFn: async (data: { videoId: string, categoryId: string, title?: string, summary: boolean, tags: boolean }) => {
      return apiRequest('POST', '/api/admin/youtube/videos/convert', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video is being converted to a blog post. Check blog management to see the result.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/videos'] });
      importForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to convert video to blog post: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Event handlers
  const onAddChannelSubmit = (values: z.infer<typeof youtubeChannelSchema>) => {
    addChannelMutation.mutate(values);
  };

  const onAddVideoSubmit = (values: z.infer<typeof youtubeVideoSchema>) => {
    addVideoMutation.mutate(values);
  };

  const onChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    setActiveTab("videos");
  };

  const handleImportFromChannel = (channelId: string) => {
    importChannelVideosMutation.mutate(channelId);
  };

  const handleDeleteChannel = (channelId: string) => {
    deleteChannelMutation.mutate(channelId);
  };

  const handleDeleteVideo = (videoId: string) => {
    deleteVideoMutation.mutate(videoId);
  };

  const openImportForm = (video: YoutubeVideo) => {
    importForm.reset({
      videoId: video.id,
      title: video.title,
      categoryId: "",
      summary: true,
      tags: true,
    });
  };

  const onConvertSubmit = (values: any) => {
    convertToBlogPostMutation.mutate(values);
  };

  // Renderers
  const renderChannelSkeleton = () => (
    <>
      {Array(3).fill(0).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  const renderVideoSkeleton = () => (
    <>
      {Array(3).fill(0).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-12 w-20" /></TableCell>
          <TableCell>
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-3 w-32" />
          </TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold">Youtube Import</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="videos" disabled={!selectedChannelId}>Videos</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Your Youtube Channels</CardTitle>
              <CardDescription>
                Manage your connected Youtube channels for content import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel Name</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Videos</TableHead>
                      <TableHead>Last Import</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelsLoading ? (
                      renderChannelSkeleton()
                    ) : channels?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No Youtube channels found. Add a new channel to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      channels?.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell>
                            <div 
                              className="font-medium cursor-pointer hover:text-primary"
                              onClick={() => onChannelSelect(channel.id)}
                            >
                              {channel.name}
                            </div>
                          </TableCell>
                          <TableCell>{channel.subscribers.toLocaleString()}</TableCell>
                          <TableCell>{channel.videoCount}</TableCell>
                          <TableCell>
                            {channel.lastImport 
                              ? format(new Date(channel.lastImport), 'MMM d, yyyy') 
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleImportFromChannel(channel.id)}
                              disabled={importChannelVideosMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Import
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Channel</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this channel? This will remove the channel and all associated videos from your database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteChannel(channel.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>
                {channels?.find(c => c.id === selectedChannelId)?.name || "Channel"} Videos
              </CardTitle>
              <CardDescription>
                Manage and import videos from this channel into blog posts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Thumbnail</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videosLoading ? (
                      renderVideoSkeleton()
                    ) : videos?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No videos found for this channel. Import videos or add them manually.
                        </TableCell>
                      </TableRow>
                    ) : (
                      videos?.map((video) => (
                        <TableRow key={video.id}>
                          <TableCell>
                            <div className="relative w-20 h-12 overflow-hidden rounded">
                              <img 
                                src={video.thumbnail} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                                <a 
                                  href={`https://youtube.com/watch?v=${video.videoId}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Play className="h-6 w-6 text-white" />
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{video.title}</div>
                            <div className="text-sm text-muted-foreground">{video.videoId}</div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(video.publishedAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {video.importStatus === 'imported' ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-success mr-1" />
                                <span>Imported</span>
                              </div>
                            ) : video.importStatus === 'failed' ? (
                              <div className="flex items-center">
                                <AlertTriangle className="h-4 w-4 text-destructive mr-1" />
                                <span>Failed</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span>Pending</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {video.importStatus === 'imported' && video.blogPostId ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2"
                                asChild
                              >
                                <a 
                                  href={`/admin/blog?post=${video.blogPostId}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View Post
                                </a>
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => openImportForm(video)}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Convert
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Convert to Blog Post</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will convert the Youtube video transcript into a blog post using Gemini AI.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <form onSubmit={importForm.handleSubmit(onConvertSubmit)}>
                                    <div className="space-y-4 py-4">
                                      <input 
                                        type="hidden" 
                                        {...importForm.register("videoId")}
                                      />
                                      
                                      <div className="space-y-2">
                                        <label htmlFor="title" className="text-sm font-medium">
                                          Blog Post Title
                                        </label>
                                        <Input 
                                          id="title" 
                                          placeholder="Use video title or customize" 
                                          {...importForm.register("title")}
                                        />
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <label htmlFor="category" className="text-sm font-medium">
                                          Blog Category
                                        </label>
                                        <select 
                                          id="category"
                                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                          {...importForm.register("categoryId", { required: true })}
                                        >
                                          <option value="">Select a category</option>
                                          {blogCategories?.map(category => (
                                            <option key={category.id} value={category.id}>
                                              {category.name}
                                            </option>
                                          ))}
                                        </select>
                                        {importForm.formState.errors.categoryId && (
                                          <p className="text-sm text-destructive">Category is required</p>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <input 
                                          type="checkbox" 
                                          id="summary" 
                                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                          {...importForm.register("summary")}
                                        />
                                        <label htmlFor="summary" className="text-sm">
                                          Include AI-generated summary
                                        </label>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <input 
                                          type="checkbox" 
                                          id="tags" 
                                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                          {...importForm.register("tags")}
                                        />
                                        <label htmlFor="tags" className="text-sm">
                                          Generate relevant tags
                                        </label>
                                      </div>
                                    </div>
                                    
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <Button 
                                        type="submit"
                                        disabled={convertToBlogPostMutation.isPending}
                                      >
                                        {convertToBlogPostMutation.isPending ? "Converting..." : "Convert to Blog Post"}
                                      </Button>
                                    </AlertDialogFooter>
                                  </form>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Video</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this video from your database?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteVideo(video.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Youtube Channel</CardTitle>
                <CardDescription>
                  Connect a Youtube channel to import videos from.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...channelForm}>
                  <form onSubmit={channelForm.handleSubmit(onAddChannelSubmit)} className="space-y-4">
                    <FormField
                      control={channelForm.control}
                      name="channelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel ID</FormLabel>
                          <FormControl>
                            <Input placeholder="UCxxxxxxxxxxxxxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={channelForm.control}
                      name="channelName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Channel display name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addChannelMutation.isPending}
                    >
                      <Youtube className="h-4 w-4 mr-2" />
                      {addChannelMutation.isPending ? "Adding Channel..." : "Add Channel"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Add Individual Video</CardTitle>
                <CardDescription>
                  Add a specific Youtube video without adding the entire channel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...videoForm}>
                  <form onSubmit={videoForm.handleSubmit(onAddVideoSubmit)} className="space-y-4">
                    <FormField
                      control={videoForm.control}
                      name="videoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video ID</FormLabel>
                          <FormControl>
                            <Input placeholder="dQw4w9WgXcQ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={videoForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Video title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={videoForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Video description" {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addVideoMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {addVideoMutation.isPending ? "Adding Video..." : "Add Video"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YoutubeImport;
