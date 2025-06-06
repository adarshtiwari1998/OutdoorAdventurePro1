
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Clock, Calendar, ChevronLeft, ChevronRight, X, ExternalLink, Heart, Eye, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface CategoryVideoSectionProps {
  category: string;
}

interface Video {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  videoType: "video" | "short";
  duration?: number;
  channelName?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

const CategoryVideoSection = ({ category }: CategoryVideoSectionProps) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"shorts" | "videos">("videos");

  // Fetch category video settings
  const { data: settings } = useQuery({
    queryKey: [`/api/category-video-settings/${category}`],
  });

  // Fetch videos for this category
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: [`/api/category-videos/${category}`, settings?.categoryId, settings?.videoCount, settings?.videoType],
    queryFn: async () => {
      if (!settings?.isActive || !settings?.categoryId) {
        return [];
      }
      
      const params = new URLSearchParams({
        categoryId: settings.categoryId.toString(),
        videoCount: (settings.videoCount || 8).toString(),
        videoType: settings.videoType || 'all'
      });
      
      const response = await fetch(`/api/category-videos/${category}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      return response.json();
    },
    enabled: !!(settings?.isActive && settings?.categoryId),
  });

  // Don't render if settings are not active or no videos
  if (!settings?.isActive || !videos?.length || isLoading) {
    return null;
  }

  // Filter videos by type
  const shortVideos = videos.filter(video => video.videoType === 'short');
  const regularVideos = videos.filter(video => video.videoType === 'video');
  const currentVideos = activeTab === 'shorts' ? shortVideos : regularVideos;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const openModal = (videoIndex: number) => {
    setSelectedVideoIndex(videoIndex);
  };

  const closeModal = () => {
    setSelectedVideoIndex(null);
  };

  const navigateVideo = (direction: 'prev' | 'next') => {
    if (selectedVideoIndex === null) return;
    
    if (direction === 'prev' && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    } else if (direction === 'next' && selectedVideoIndex < currentVideos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };

  const selectedVideo = selectedVideoIndex !== null ? currentVideos[selectedVideoIndex] : null;

  return (
    <>
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">
              {settings.title || "Latest Videos"}
            </h2>
            {settings.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {settings.description}
              </p>
            )}
          </div>

          {/* Video Type Tabs */}
          {shortVideos.length > 0 && regularVideos.length > 0 && (
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-md">
                <Button
                  variant={activeTab === "shorts" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("shorts")}
                  className="mr-1"
                >
                  Shorts
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {shortVideos.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === "videos" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("videos")}
                >
                  Videos
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {regularVideos.length}
                  </Badge>
                </Button>
              </div>
            </div>
          )}

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentVideos.map((video, index) => (
              <Card 
                key={video.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => openModal(index)}
              >
                <CardContent className="p-0">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-theme text-white rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="h-6 w-6 fill-current" />
                      </div>
                    </div>

                    {/* Video Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge 
                        variant={video.videoType === 'short' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {video.videoType === 'short' ? 'Short' : 'Video'}
                      </Badge>
                    </div>

                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="outline" className="bg-black/70 text-white text-xs">
                          {formatDuration(video.duration)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-theme transition-colors">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
                      {video.duration && (
                        <>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{formatDuration(video.duration)}</span>
                        </>
                      )}
                    </div>

                    {/* Video Stats */}
                    {video.viewCount && (
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{formatNumber(video.viewCount)} views</span>
                        </div>
                        {video.likeCount && (
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>{formatNumber(video.likeCount)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={selectedVideoIndex !== null} onOpenChange={(open) => {
        if (!open) {
          closeModal();
        }
      }}>
        <DialogContent 
          className="max-w-[95vw] w-[95vw] h-[95vh] p-0 gap-0 border-0 bg-black/95 shadow-none md:max-w-6xl md:w-[85vw] md:h-[90vh]"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {selectedVideo && (
            <div className="flex h-full">
              {/* Video Player Section */}
              <div className="flex-1 relative">
                {/* Custom Close Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                  }}
                  className="absolute top-4 right-4 z-[60] bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Navigation Buttons */}
                {selectedVideoIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateVideo('prev');
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                
                {selectedVideoIndex < currentVideos.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateVideo('next');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-[60] bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors mr-16"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}

                {/* Video Embed */}
                <div className="w-full h-full flex items-center justify-center p-4">
                  <div className="w-full max-w-4xl aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                      title={selectedVideo.title}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>

              {/* Video Details Sidebar */}
              <div className="w-80 bg-white p-6 overflow-y-auto">
                <div className="space-y-4">
                  {/* Video Title */}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {selectedVideo.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedVideo.publishedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  {/* Video Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center py-4 border-t border-b">
                    <div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatNumber(selectedVideo.likeCount)}
                      </div>
                      <div className="text-sm text-gray-500">Likes</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatNumber(selectedVideo.viewCount)}
                      </div>
                      <div className="text-sm text-gray-500">Views</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatNumber(selectedVideo.commentCount)}
                      </div>
                      <div className="text-sm text-gray-500">Comments</div>
                    </div>
                  </div>

                  {/* Video Description */}
                  {selectedVideo.description && (
                    <div>
                      <p className="text-sm text-gray-700 line-clamp-4">
                        {selectedVideo.description}
                      </p>
                      <button className="text-theme text-sm font-medium mt-2 hover:underline">
                        Read more
                      </button>
                    </div>
                  )}

                  {/* YouTube Link */}
                  <div className="pt-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://youtube.com/watch?v=${selectedVideo.videoId}`, '_blank');
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      See on YouTube
                    </Button>
                  </div>

                  {/* Channel Info */}
                  {selectedVideo.channelName && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-500">Channel</div>
                      <div className="font-medium text-gray-900">{selectedVideo.channelName}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategoryVideoSection;
