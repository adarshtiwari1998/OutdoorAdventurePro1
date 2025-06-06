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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, Youtube, FileText, Upload, RefreshCw, CheckCircle, AlertTriangle, Trash2, ExternalLink, Plus, Eye, EyeOff, Download, PlayCircle, Loader2, AlertCircle, CheckCircle2, Clock, X, Filter, Search, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

// Schemas
const youtubeChannelSchema = z.object({
  channelUrl: z.string().min(1, "Channel URL is required"),
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
  importedVideoCount: number;
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
  categoryId?: string;
  importStatus: "pending" | "imported" | "failed";
  blogPostId?: string;
  hasBlogPostMatch: boolean;
  matchingBlogPostTitle?: string;
  errorMessage?: string;
  videoType?: "video" | "short";
  duration?: number;
  transcript?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
};

const YoutubeImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("channels");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importChannelId, setImportChannelId] = useState<string | null>(null);
  const [importLimit, setImportLimit] = useState(10);
  const [selectedCategoryForImport, setSelectedCategoryForImport] = useState<string | undefined>(undefined);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVideoType, setFilterVideoType] = useState<string>("all");
  const [importProgress, setImportProgress] = useState({
    isImporting: false,
    currentStep: '',
    progress: 0,
    processedCount: 0,
    totalCount: 0,
    importedCount: 0,
    skippedCount: 0,
    logs: [] as string[],
    canClose: false,
    startTime: null as Date | null,
    elapsedTime: 0
  });
   const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Function to extract channel ID from YouTube URL
  const extractChannelId = (url: string): string => {
    if (!url) return '';

    // Remove whitespace and normalize URL
    url = url.trim();

    // If it's already a channel ID (starts with UC and is 24 chars), return as is
    if (url.startsWith('UC') && url.length === 24) {
      return url;
    }

    // Pattern 1: youtube.com/channel/CHANNEL_ID
    const channelMatch = url.match(/(?:youtube\.com|youtu\.be)\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return channelMatch[1];
    }

    // Pattern 2: youtube.com/@CHANNEL_HANDLE (new format)
    const handleMatch = url.match(/(?:youtube\.com|youtu\.be)\/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
      return handleMatch[1];
    }

    // Pattern 3: youtube.com/c/CHANNEL_NAME (legacy custom URL)
    const customMatch = url.match(/(?:youtube\.com|youtu\.be)\/c\/([a-zA-Z0-9_-]+)/);
    if (customMatch) {
      return customMatch[1];
    }

    // Pattern 4: youtube.com/user/USERNAME (very old format)
    const userMatch = url.match(/(?:youtube\.com|youtu\.be)\/user\/([a-zA-Z0-9_-]+)/);
    if (userMatch) {
      return userMatch[1];
    }

    // Pattern 5: Direct channel name/handle without full URL
    if (url.startsWith('@')) {
      return url.substring(1); // Remove @ symbol
    }

    // If none of the patterns match, assume it might be a handle or channel name
    if (url.length > 0 && !url.includes('/') && !url.includes('youtube')) {
      return url;
    }

    return '';
  };

  // Handle channel URL change and auto-extract channel ID
  const handleChannelUrlChange = async (url: string) => {
    const extractedId = extractChannelId(url);
    channelForm.setValue('channelUrl', url);
    channelForm.setValue('channelId', extractedId);

    // If we have a valid extracted ID, try to fetch channel details
    if (extractedId && extractedId.length > 0) {
      try {
        // Make API call to resolve channel details
        const response = await fetch(`/api/admin/youtube/resolve-channel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channelIdentifier: extractedId })
        });

        if (response.ok) {
          const channelData = await response.json();
          // Auto-fill the channel name and update channel ID with the resolved one
          channelForm.setValue('channelName', channelData.title || channelData.name || '');
          channelForm.setValue('channelId', channelData.id || channelData.channelId || extractedId);
        }
      } catch (error) {
        console.log('Could not auto-fetch channel details:', error);
        // Silently fail - user can still fill manually
      }
    }
  };

  // Update elapsed time every second during import
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Only run timer if importing AND startTime exists (null means stopped)
    if (importProgress.isImporting && importProgress.startTime) {
      interval = setInterval(() => {
        setImportProgress(prev => {
          // Double check startTime still exists before updating
          if (!prev.startTime) {
            return prev;
          }
          const elapsed = Math.floor((new Date().getTime() - prev.startTime.getTime()) / 1000);
          return {
            ...prev,
            elapsedTime: elapsed
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [importProgress.isImporting, importProgress.startTime]);

  // Queries
  const { data: channels, isLoading: channelsLoading } = useQuery<YoutubeChannel[]>({
    queryKey: ['/api/admin/youtube/channels'],
  });

  const { data: videos, isLoading: videosLoading } = useQuery<YoutubeVideo[]>({
    queryKey: ['/api/admin/youtube/videos', { channelId: selectedChannelId }],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey;
      console.log(`🎬 Fetching videos for channel:`, params);
      
      // If no specific channel is selected, fetch all videos
      const url = params.channelId 
        ? `/api/admin/youtube/videos?channelId=${params.channelId}`
        : '/api/admin/youtube/videos';
      
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error fetching videos:`, error);
        throw new Error(error);
      }
      const data = await response.json();
      console.log(`📹 Received ${data.length} videos${params.channelId ? ` for channel ${params.channelId}` : ' from all channels'}`);
      return data;
    },
  });

  const { data: blogCategories } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/admin/blog/categories'],
  });

  // Filter videos based on selected filters
  const filteredVideos = videos?.filter(video => {
    const categoryMatch = filterCategory === "all" || 
                         (filterCategory === "no-category" && !video.categoryId) ||
                         (video.categoryId && video.categoryId === filterCategory);

    const channelMatch = filterChannel === "all" || video.channelId?.toString() === filterChannel;

    const statusMatch = filterStatus === "all" || video.importStatus === filterStatus;

    const typeMatch = filterVideoType === "all" || video.videoType === filterVideoType;

    return categoryMatch && channelMatch && statusMatch && typeMatch;
  }) || [];

  // Forms
  const channelForm = useForm<z.infer<typeof youtubeChannelSchema>>({
    resolver: zodResolver(youtubeChannelSchema),
    defaultValues: {
      channelUrl: "",
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
    mutationFn: async ({ channelId, limit, categoryId }: { channelId: string, limit: number, categoryId?: string }) => {
      console.log(`🎬 Importing ${limit} videos for channel: ${channelId}`);

      // Reset progress and start immediately
      const startTime = new Date();
      setImportProgress({
        isImporting: true,
        currentStep: 'Initializing import...',
        progress: 5,
        processedCount: 0,
        totalCount: 0,
        importedCount: 0,
        skippedCount: 0,
        logs: [
          `🚀 Starting import of ${limit} videos...`,
          `📡 Connecting to YouTube API...`,
          `🎯 Target channel: ${channelId}`,
          `⚙️ Preparing import workflow...`
        ],
        canClose: false,
        startTime,
        elapsedTime: 0
      });

      // Auto-scroll function
      const autoScrollLogs = () => {
        setTimeout(() => {
          const logElement = document.getElementById('import-logs');
          if (logElement) {
            logElement.scrollTop = logElement.scrollHeight;
          }
        }, 100);
      };

      // Small delay to show initial progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // Array to hold video IDs for transcript fetching
      let videoIdsForTranscripts: string[] = [];

      try {
        // Step 1: Fetch videos
        setImportProgress(prev => ({
          ...prev,
          currentStep: 'Fetching videos from YouTube API...',
          progress: 20,
          logs: [...prev.logs, '📡 Making API request to YouTube...', '🔍 Searching for latest videos...']
        }));
        autoScrollLogs();

        const response = await fetch(`/api/admin/youtube/channels/${channelId}/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit, categoryId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        // Step 2: Process response
        setImportProgress(prev => ({
          ...prev,
          currentStep: 'Processing video metadata...',
          progress: 50,
          logs: [...prev.logs, '⚙️ Processing video data...', '🗃️ Saving to database...']
        }));
        autoScrollLogs();

        const data = await response.json();
        const importedVideos = data.videos || []; 

        // Update with actual counts from backend
        setImportProgress(prev => ({
          ...prev,
          currentStep: 'Video import phase completed',
          progress: 70,
          processedCount: data.count || 0,
          importedCount: data.count || 0,
          skippedCount: data.skipped || 0,
          logs: [...prev.logs, 
            `✅ Imported ${data.count || 0} videos successfully`,
            `⏭️ Skipped ${data.skipped || 0} duplicate videos`,
            `📄 Transcripts successful: ${data.transcriptSuccessCount || 0}`,
            `❌ Transcript failures: ${data.transcriptErrorCount || 0}`,
            `🎯 Starting final processing...`
          ]
        }));
        autoScrollLogs();

        // Collect video IDs of successfully imported videos
        videoIdsForTranscripts = importedVideos.map((video: YoutubeVideo) => video.id);

        if (videoIdsForTranscripts.length > 0) {
          setImportProgress(prev => ({
            ...prev,
            currentStep: 'Fetching transcripts...',
            progress: 75,
            logs: [...prev.logs, `📄 Processing transcripts for ${videoIdsForTranscripts.length} videos...`]
          }));
          autoScrollLogs();

          // Step 3: Fetch Transcripts individually after videos are imported
          for (let i = 0; i < videoIdsForTranscripts.length; i++) {
            const videoId = videoIdsForTranscripts[i];
            try {
              const currentProgress = 75 + (20 * (i + 1) / videoIdsForTranscripts.length);
              setImportProgress(prev => ({
                ...prev,
                currentStep: `Fetching transcript ${i + 1}/${videoIdsForTranscripts.length}...`,
                progress: currentProgress,
                logs: [...prev.logs, `🎬 [${i + 1}/${videoIdsForTranscripts.length}] Processing transcript for video: ${videoId}`]
              }));
              autoScrollLogs();

              const transcriptResponse = await fetch(`/api/admin/youtube/videos/${videoId}/transcript`, {method: 'POST'});

              if (!transcriptResponse.ok) {
                const errorData = await transcriptResponse.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || `HTTP ${transcriptResponse.status}`);
              }

              const transcriptData = await transcriptResponse.json();

              setImportProgress(prev => ({
                ...prev,
                logs: [...prev.logs, `✅ Transcript successful for video: ${videoId}`]
              }));
              autoScrollLogs();

            } catch (transcriptError) {
              setImportProgress(prev => ({
                ...prev,
                logs: [...prev.logs, `❌ Transcript failed for video ${videoId}: ${transcriptError instanceof Error ? transcriptError.message : String(transcriptError)}`]
              }));
              autoScrollLogs();
            }
          }
        }

        // Step 4: Complete - use actual counts from backend response
        setImportProgress(prev => ({
          ...prev,
          currentStep: 'Import completed successfully!',
          progress: 100,
          processedCount: data.count || 0,
          totalCount: data.count || 0,
          importedCount: data.count || 0,
          skippedCount: data.skipped || 0,
          logs: [
            ...prev.logs,
            `🎉 Import workflow completed!`,
            `📊 Final Summary:`,
            `   • ${data.count || 0} videos imported`,
            `   • ${data.skipped || 0} videos skipped`,
            `   • ${data.transcriptSuccessCount || 0} transcripts successful`,
            `   • ${data.transcriptErrorCount || 0} transcript failures`,
            `✅ All operations completed successfully!`,
            `⏰ Total time: ${Math.floor((new Date().getTime() - prev.startTime!.getTime()) / 1000)}s`
          ],
          canClose: true,
          // Stop the timer by clearing start time
          startTime: null,
          elapsedTime: Math.floor((new Date().getTime() - prev.startTime!.getTime()) / 1000)
        }));
        autoScrollLogs();

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const finalElapsedTime = prev.startTime ? Math.floor((new Date().getTime() - prev.startTime.getTime()) / 1000) : 0;
        setImportProgress(prev => ({
          ...prev,
          currentStep: 'Import failed',
          progress: 0,
          logs: [
            ...prev.logs, 
            `💥 IMPORT FAILED!`,
            `❌ Error: ${errorMessage}`,
            `⏰ Failed after: ${finalElapsedTime}s`,
            `🔍 Check the error details above`,
            `🔄 You can try importing again`
          ],
          canClose: true,
          // Stop the timer
          startTime: null,
          elapsedTime: finalElapsedTime
        }));

        // Auto scroll to show error
        setTimeout(() => {
          const logElement = document.getElementById('import-logs');
          if (logElement) {
            logElement.scrollTop = logElement.scrollHeight;
          }
        }, 100);

        throw error;
      }
    },
    onSuccess: (data) => {
      const { count = 0, skipped = 0, message } = data || {};

      // Show success toast
      toast({
        title: "Import Complete",
        description: message || `Successfully imported ${count} videos${skipped ? `, ${skipped} skipped` : ''}`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/channels'] });

      // Keep showing completion status for 3 seconds before enabling close
      setTimeout(() => {
        setImportProgress(prev => ({
          ...prev,
          canClose: true,
          // Ensure timer is stopped
          startTime: null
        }));
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Import error:', error);
      let errorMessage = "Failed to import videos";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Show error for 3 seconds before allowing close
      setTimeout(() => {
        setImportProgress(prev => ({
          ...prev,
          canClose: true,
          // Ensure timer is stopped
          startTime: null
        }));
      }, 3000);
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

  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: async ({ videoIds, categoryId }: { videoIds: string[], categoryId: string }) => {
      return apiRequest('PATCH', '/api/admin/youtube/videos/bulk-category', { videoIds, categoryId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Videos category updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/videos'] });
      setSelectedVideos([]);
      setBulkCategoryId("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update videos category: ${error}`,
        variant: "destructive",
      });
    }
  });

  const bulkFetchTranscriptsMutation = useMutation({
    mutationFn: async (videoIds: string[]) => {
      const response = await fetch('/api/admin/youtube/videos/bulk-fetch-transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transcripts Fetched",
        description: data.message || `Successfully fetched ${data.successCount} transcripts`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/videos'] });
      setSelectedVideos([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncCountsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/youtube/channels/sync-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to sync channel counts');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Counts Synced",
        description: data.message || `Successfully synced ${data.syncedCount} channel counts`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/channels'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const onAddChannelSubmit = (values: z.infer<typeof youtubeChannelSchema>) => {
    addChannelMutation.mutate({
      channelId: values.channelId,
      channelName: values.channelName
    });
  };

  const onAddVideoSubmit = (values: z.infer<typeof youtubeVideoSchema>) => {
    addVideoMutation.mutate(values);
  };

  const onChannelSelect = (channelId: string) => {
    console.log(`🎯 Selecting channel: ${channelId}`);
    setSelectedChannelId(channelId);
    setActiveTab("videos");
  };

  const handleImportFromChannel = (channelId: string) => {
    console.log(`🚀 Starting import for channel: ${channelId}`);
    setImportChannelId(channelId);

    // Reset import progress state
    setImportProgress({
      isImporting: false,
      currentStep: '',
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      importedCount: 0,
      skippedCount: 0,
      logs: [],
      canClose: false,
      startTime: null,
      elapsedTime: 0
    });

    // Reset category selection to default
    setSelectedCategoryForImport(undefined);
    setShowImportDialog(true);
  };

  const handleStartImport = () => {
    if (importChannelId) {
      console.log(`🎯 Starting import with category: ${selectedCategoryForImport}`);

      // Ensure we pass the correct category ID
      let categoryIdToPass = null;
      if (selectedCategoryForImport && selectedCategoryForImport !== "no-category") {
        categoryIdToPass = selectedCategoryForImport;
      }

      console.log(`📋 Final category ID to pass: ${categoryIdToPass}`);

      importChannelVideosMutation.mutate({ 
        channelId: importChannelId, 
        limit: importLimit,
        categoryId: categoryIdToPass
      });
    }
  };

  const handleBulkCategoryUpdate = () => {
    if (selectedVideos.length === 0) {
      toast({
        title: "No Videos Selected",
        description: "Please select videos to update",
        variant: "destructive",
      });
      return;
    }

    if (!bulkCategoryId || bulkCategoryId === "" || bulkCategoryId === "NaN") {
      toast({
        title: "No Category Selected",
        description: "Please select a category to assign",
        variant: "destructive",
      });
      return;
    }

    console.log('Bulk update params:', { videoIds: selectedVideos, categoryId: bulkCategoryId });

    bulkUpdateCategoryMutation.mutate({
      videoIds: selectedVideos,
      categoryId: bulkCategoryId
    });
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

   const toggleExpandRow = (videoId: string) => {
    setExpandedRows(prev => {
      const newExpandedRows = new Set(prev);
      if (newExpandedRows.has(videoId)) {
        newExpandedRows.delete(videoId);
      } else {
        newExpandedRows.add(videoId);
      }
      return newExpandedRows;
    });
  };

  const toggleAllVideos = () => {
    if (filteredVideos && filteredVideos.length > 0) {
      if (selectedVideos.length === filteredVideos.length) {
        setSelectedVideos([]);
      } else {
        setSelectedVideos(filteredVideos.map(video => video.id));
      }
    }
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

  const handleBulkFetchTranscripts = () => {
    if (selectedVideos.length === 0) {
      toast({
        title: "No Videos Selected",
        description: "Please select videos to fetch transcripts for",
        variant: "destructive",
      });
      return;
    }

    bulkFetchTranscriptsMutation.mutate(selectedVideos);
  };

  const handleSyncCounts = () => {
    syncCountsMutation.mutate();
  };

  // Renderers
  const renderChannelSkeleton = () => (
    <>
      {Array(3).fill(0).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
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
          <TabsTrigger value="videos">Videos</TabsTrigger>
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
              <div className="admin-table-container channels-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel Name</TableHead>
                      <TableHead>Channel ID</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Total Videos</TableHead>
                      <TableHead>Imported Videos</TableHead>
                      <TableHead>Last Import</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelsLoading ? (
                      renderChannelSkeleton()
                    ) : channels?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No Youtube channels found. Add a new channel to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      channels?.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell>
                            <div 
                              className="font-medium cursor-pointer hover:text-primary"
                              onClick={() => onChannelSelect(channel.id.toString())}
                            >
                              {channel.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {channel.channelId}
                            </code>
                          </TableCell>
                          <TableCell>{channel.subscribers.toLocaleString()}</TableCell>
                          <TableCell>{channel.videoCount}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {channel.importedVideoCount || 0}
                            </Badge>
                          </TableCell>
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
                              onClick={() => handleImportFromChannel(channel.id.toString())}
                              disabled={importChannelVideosMutation.isPending || importProgress.isImporting}
                            >
                              {importProgress.isImporting && importChannelId === channel.id ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Import
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                                    onClick={() => handleDeleteChannel(channel.id.toString())}
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
                {selectedChannelId 
                  ? `${channels?.find(c => c.id === selectedChannelId)?.name || "Channel"} Videos`
                  : "All Channel Videos"
                }
              </CardTitle>
              <CardDescription>
                {selectedChannelId 
                  ? "Manage and import videos from this channel into blog posts."
                  : "Manage and import videos from all channels into blog posts."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full max-w-full">
              {/* Filter Controls */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                {selectedChannelId && (
                  <div className="mb-4 flex items-center gap-4">
                    <span className="text-sm font-medium">Currently viewing: {channels?.find(c => c.id === selectedChannelId)?.name}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedChannelId(null);
                        setFilterChannel("all");
                      }}
                    >
                      View All Channels
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4"></div></old_str>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Filter by Category</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="no-category">No Category</SelectItem>
                        {blogCategories?.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Filter by Channel</label>
                    <Select value={filterChannel} onValueChange={setFilterChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="All channels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        {channels?.map(channel => (
                          <SelectItem key={channel.id} value={channel.id.toString()}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Filter by Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="imported">Imported</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Filter by Type</label>
                    <Select value={filterVideoType} onValueChange={setFilterVideoType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="short">Shorts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFilterCategory("all");
                        setFilterChannel("all");
                        setFilterStatus("all");
                        setFilterVideoType("all");
                      }}
                      size="sm"
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                  Showing {filteredVideos.length} of {videos?.length || 0} videos
                  {filterCategory !== "all" && ` • Category: ${filterCategory === "no-category" ? "No Category" : blogCategories?.find(c => c.id === filterCategory)?.name}`}
                  {filterChannel !== "all" && ` • Channel: ${channels?.find(c => c.id.toString() === filterChannel)?.name}`}
                  {filterStatus !== "all" && ` • Status: ${filterStatus}`}
                  {filterVideoType !== "all" && ` • Type: ${filterVideoType === "video" ? "Videos" : "Shorts"}`}
                </div>
              </div>

              {selectedVideos.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {selectedVideos.length} videos selected
                    </span>
                    <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {blogCategories?.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleBulkCategoryUpdate}
                      disabled={!bulkCategoryId || bulkUpdateCategoryMutation.isPending}
                      size="sm"
                    >
                      {bulkUpdateCategoryMutation.isPending ? "Updating..." : "Update Category"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedVideos([])}
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick action for videos without categories */}
              {filteredVideos && filteredVideos.filter(v => !v.category).length > 0 && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      {filteredVideos.filter(v => !v.category).length} videos without category (in current filter)
                    </span>
                    <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {blogCategories?.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => {
                        const videosWithoutCategory = filteredVideos?.filter(v => !v.category).map(v => v.id) || [];

                        if (videosWithoutCategory.length === 0) {
                          toast({
                            title: "No Videos to Update",
                            description: "All visible videos already have categories assigned",
                            variant: "default",
                          });
                          return;
                        }

                        if (!bulkCategoryId || bulkCategoryId === "" || bulkCategoryId === "NaN") {
                          toast({
                            title: "No Category Selected",
                            description: "Please select a category to assign",
                            variant: "destructive",
                          });
                          return;
                        }

                        console.log('Assign to all params:', { videoIds: videosWithoutCategory, categoryId: bulkCategoryId });

                        bulkUpdateCategoryMutation.mutate({
                          videoIds: videosWithoutCategory,
                          categoryId: bulkCategoryId
                        });
                      }}
                      disabled={!bulkCategoryId || bulkUpdateCategoryMutation.isPending}
                      size="sm"
                      variant="outline"
                    >
                      {bulkUpdateCategoryMutation.isPending ? "Assigning..." : "Assign to All"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const videosWithoutCategory = filteredVideos?.filter(v => !v.category).map(v => v.id) || [];
                        setSelectedVideos(videosWithoutCategory);
                      }}
                      size="sm"
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              )}
              <div className="admin-table-container videos-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sticky left-0 bg-white dark:bg-gray-950 z-10 border-r">
                        <input
                          type="checkbox"
                          checked={filteredVideos?.length > 0 && selectedVideos.length === filteredVideos.length}onChange={toggleAllVideos}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead className="w-[100px] sticky left-[50px] bg-white dark:bg-gray-950 z-10 border-r">Thumbnail</TableHead>
                      <TableHead className="sticky left-[150px] bg-white dark:bg-gray-950 z-10 border-r min-w-[300px]">Title</TableHead>
                      <TableHead className="min-w-[200px]">Channel ID</TableHead>
                      <TableHead className="min-w-[150px]">Category</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[100px]">Duration</TableHead>
                      <TableHead className="min-w-[120px]">Published</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">Blog Post Match</TableHead>
                      <TableHead className="text-right sticky right-0 bg-white dark:bg-gray-950 z-10 border-l min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videosLoading ? (
                      renderVideoSkeleton()
                    ) : filteredVideos?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          {videos?.length === 0 
                            ? "No videos found for this channel. Import videos or add them manually."
                            : "No videos match the current filters. Try adjusting your filter criteria."
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVideos?.map((video) => (
                        <>
                        <TableRow key={video.id} onClick={() => toggleExpandRow(video.id)}>
                          <TableCell className="sticky left-0 bg-white dark:bg-gray-950 z-10 border-r">
                            <input
                              type="checkbox"
                              checked={selectedVideos.includes(video.id)}
                              onChange={() => toggleVideoSelection(video.id)}
                              className="rounded"
                            />
                          </TableCell>
                           <TableCell className="sticky left-[50px] bg-white dark:bg-gray-950 z-10 border-r">
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
                          <TableCell className="sticky left-[150px] bg-white dark:bg-gray-950 z-10 border-r">
                            <div className="font-medium">{video.title}</div>
                            <div className="text-sm text-muted-foreground">{video.videoId}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {video.channelName || video.channel?.name || 'Unknown Channel'}
                              </div>
                              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                                {video.channel?.channelId || channels?.find(c => c.id.toString() === video.channelId)?.channelId || 'N/A'}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>
                            {video.category ? (
                              <Badge variant="outline">
                                {video.category.name}
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">No Category</span>
                                <Select 
                                  value="" 
                                  onValueChange={(categoryId) => {
                                    if (categoryId && categoryId !== "" && categoryId !== "NaN") {
                                      console.log('Individual category assignment:', { videoId: video.id, categoryId });
                                      bulkUpdateCategoryMutation.mutate({
                                        videoIds: [video.id],
                                        categoryId: categoryId
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-32 h-7 text-xs">
                                    <SelectValue placeholder="Assign" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {blogCategories?.map(category => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={video.videoType === 'short' ? 'secondary' : 'default'}>
                              {video.videoType === 'short' ? '🩳 Short' : '🎬 Video'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">
                              {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                            </span>
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
                          <TableCell>
                            {video.hasBlogPostMatch ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-yellow-500 mr-1" />
                                <div>
                                  <div className="text-xs text-yellow-600">Match Found</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-32" title={video.matchingBlogPostTitle}>
                                    {video.matchingBlogPostTitle}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="text-xs text-muted-foreground">No Match</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-white dark:bg-gray-950 z-10 border-l">
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
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
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

                        {/* Expandable row content */}
                        {expandedRows.has(video.id) && (
                          <TableRow>
                            <TableCell colSpan={11} className="bg-gray-50 dark:bg-gray-900/50 sticky left-0 right-0">
                              <div className="py-4 space-y-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Video Description:</h4>
                                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded border max-h-40 overflow-y-auto">
                                    {video.description || 'No description available'}
                                  </div>
                                </div>

                                {video.transcript && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">Transcript:</h4>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded border max-h-40 overflow-y-auto">
                                      {video.transcript}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 text-sm">
                                  <div>
                                    <span className="font-semibold">Video ID:</span>
                                    <div className="text-muted-foreground font-mono">{video.videoId}</div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Type:</span>
                                    <div className="text-muted-foreground capitalize">
                                      {video.videoType === 'short' ? '🩳 Short' : '🎬 Video'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Duration:</span>
                                    <div className="text-muted-foreground font-mono">
                                      {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Published:</span>
                                    <div className="text-muted-foreground">{format(new Date(video.publishedAt), 'PPP')}</div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Channel:</span>
                                    <div className="text-muted-foreground">
                                      {video.channelName || video.channel?.name || channels?.find(c => c.id.toString() === video.channelId)?.name || 'Unknown'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Import Status:</span>
                                    <div className="text-muted-foreground capitalize">{video.importStatus}</div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">View Count:</span>
                                    <div className="text-muted-foreground font-mono">
                                      {video.viewCount ? video.viewCount.toLocaleString() : 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Like Count:</span>
                                    <div className="text-muted-foreground font-mono">
                                      {video.likeCount ? video.likeCount.toLocaleString() : 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Comment Count:</span>
                                    <div className="text-muted-foreground font-mono">
                                      {video.commentCount ? video.commentCount.toLocaleString() : 'N/A'}
                                    </div>
                                  </div>
                                </div>

                                {video.errorMessage && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2 text-red-600">Error Message:</h4>
                                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded border">
                                      {video.errorMessage}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>))
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
                      name="channelUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel URL or Handle</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://youtube.com/@HowToHaveFunCruising or UCfUABeKVh7oJzZG93O2ZioQ"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleChannelUrlChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Paste any YouTube channel URL, handle (@channelname), or Channel ID. Channel details will be fetched automatically.
                          </p>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={channelForm.control}
                      name="channelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Will be resolved automatically (e.g., UCfUABeKVh7oJzZG93O2ZioQ)"
                              {...field}
                              className="bg-gray-50 dark:bg-gray-900"
                              readOnly
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            The actual YouTube Channel ID will appear here after URL/handle resolution
                          </p>
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
                            <Input 
                              placeholder="Will be filled automatically or enter manually" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Channel name will be fetched automatically when URL/handle is resolved
                          </p>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={addChannelMutation.isPending}
                      className="w-full"
                    >
                      {addChannelMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding Channel...
                        </>
                      ) : (
                        <>
                          <Youtube className="h-4 w-4 mr-2" />
                          Add Channel
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Individual Video</CardTitle>
                <CardDescription>
                  Add a specific video by its ID.
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
                          <FormLabel>Video Title (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Leave empty to fetch from YouTube" {...field} />
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
                          <FormLabel>Video Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Leave empty to fetch from YouTube" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={addVideoMutation.isPending}
                      className="w-full"
                    >
                      {addVideoMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding Video...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Video
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Progress Dialog */}
      <AlertDialog open={importProgress.isImporting} onOpenChange={(open) => {
        if (!open && importProgress.canClose) {
          setImportProgress({
            isImporting: false,
            currentStep: '',
            progress: 0,
            processedCount: 0,
            totalCount: 0,
            importedCount: 0,
            skippedCount: 0,
            logs: [],
            canClose: false,
            startTime: null,
            elapsedTime: 0
          });
          setShowImportDialog(false);
        }
      }}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Importing Videos from YouTube
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please wait while we fetch and process the videos...
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {importProgress.isImporting && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {importProgress.currentStep}
                  </span>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                    <span>
                      {Math.floor(importProgress.elapsedTime / 60)}:{(importProgress.elapsedTime % 60).toString().padStart(2, '0')}
                    </span>
                    <span>{importProgress.progress}%</span>
                  </div>
                </div>
                <Progress value={importProgress.progress} className="h-3" />

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Processed</div>
                    <div className="text-lg font-bold">{importProgress.processedCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Imported</div>
                    <div className="text-lg font-bold text-green-600">{importProgress.importedCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Skipped</div>
                    <div className="text-lg font-bold text-orange-600">{importProgress.skippedCount}</div>
                  </div>
                </div>

                {/* Live Log Viewer */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-900">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Live Import Log
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-muted-foreground">Live</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const logElement = document.getElementById('import-logs');
                          if (logElement) {
                            logElement.scrollTop = logElement.scrollHeight;
                          }
                        }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div 
                    id="import-logs"
                    className="p-3 h-48 overflow-y-auto bg-black text-green-400 font-mono text-xs leading-relaxed scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                  >
                    {importProgress.logs.length === 0 ? (
                      <div className="text-gray-500">Waiting for log output...</div>
                    ) : (
                      importProgress.logs.map((log, index) => {
                        const timeStr = new Date().toLocaleTimeString('en-US', { 
                          hour12: false, 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit' 
                        });

                        return (
                          <div key={index} className="mb-1 break-words">
                            <span className="text-gray-500 mr-2 text-xs">
                              [{timeStr}]
                            </span>
                            <span 
                              className={
                                log.includes('❌') || log.includes('Error') || log.includes('failed') ? 'text-red-400' :
                                log.includes('✅') || log.includes('Success') || log.includes('successful') ? 'text-green-400' :
                                log.includes('⚠️') || log.includes('Warning') || log.includes('Partial') ? 'text-yellow-400' :
                                log.includes('🔄') || log.includes('Processing') || log.includes('Starting') ? 'text-blue-400' :
                                log.includes('📄') || log.includes('Fetching') || log.includes('transcript') ? 'text-cyan-400' :
                                log.includes('🎬') || log.includes('Video') || log.includes('Imported') ? 'text-purple-400' :
                                log.includes('💥') || log.includes('FAILED') ? 'text-red-500 font-bold' :
                                log.includes('🎉') || log.includes('completed') ? 'text-green-500 font-bold' :
                                'text-green-400'
                              }
                            >
                              {log}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Special Status Messages */}
                {importProgress.currentStep.includes('transcript') && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">
                      🎯 Fetching transcripts individually to avoid rate limits...
                    </span>
                  </div>
                )}

                {importProgress.progress === 100 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      Import completed successfully!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>


{importProgress.progress === 100 && (
              <AlertDialogFooter className="mt-6">
                <Button 
                  onClick={() => {
                    setImportProgress({
                      isImporting: false,
                      currentStep: '',
                      progress: 0,
                      processedCount: 0,
                      totalCount: 0,
                      importedCount: 0,
                      skippedCount: 0,
                      logs: [],
                      canClose: false,
                      startTime: null,
                      elapsedTime: 0
                    });
                    setShowImportDialog(false);
                    // Refresh channel data to update imported counts
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/youtube/channels'] });
                  }}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Close and Refresh
                </Button>
              </AlertDialogFooter>
            )}

            {!importProgress.canClose && importProgress.isImporting && (
              <AlertDialogFooter className="mt-6">
                <Button disabled className="w-full">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import in progress... Please wait
                </Button>
              </AlertDialogFooter>
            )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Configuration Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Videos from Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Configure the import settings for this channel's videos.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Channel Information */}
          {importChannelId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-sm mb-2">Channel Information:</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  <span className="text-muted-foreground">
                    {channels?.find(c => c.id.toString() === importChannelId)?.name || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Channel ID:</span>{" "}
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                    {channels?.find(c => c.id.toString() === importChannelId)?.channelId || 'Unknown'}
                  </code>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Number of videos to import
              </label>
              <Select 
                value={importLimit.toString()} 
                onValueChange={(value) => setImportLimit(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 videos</SelectItem>
                  <SelectItem value="10">10 videos</SelectItem>
                  <SelectItem value="25">25 videos</SelectItem>
                  <SelectItem value="50">50 videos</SelectItem>
                  <SelectItem value="100">100 videos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Default category for imported videos
              </label>
              <Select 
                value={selectedCategoryForImport || "no-category"} 
                onValueChange={(value) => {
                  console.log(`Category selection changed to: ${value}`);
                  setSelectedCategoryForImport(value === "no-category" ? undefined : value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-category">No Category (assign later)</SelectItem>
                  {blogCategories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategoryForImport && selectedCategoryForImport !== "no-category" && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ Selected: {blogCategories?.find(c => c.id === selectedCategoryForImport)?.name}
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartImport}>
              Start Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default YoutubeImport;