import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronUp, ChevronDown, Play, Calendar, Clock, X } from "lucide-react";
import { format } from "date-fns";

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
}

interface ShortsAndVideosSectionProps {
  className?: string;
}

const ShortsAndVideosSection = ({ className = "" }: ShortsAndVideosSectionProps) => {
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout>();

  // Fetch home video settings and videos
  const { data: settings } = useQuery({
    queryKey: ['/api/home-video-settings'],
  });

  const { data: allVideos, isLoading } = useQuery<Video[]>({
    queryKey: ['/api/home-videos', settings?.categoryId, settings?.videoCount, settings?.videoType],
    queryFn: async () => {
      if (!settings?.isActive || !settings?.categoryId) {
        return [];
      }

      const params = new URLSearchParams({
        categoryId: settings.categoryId.toString(),
        videoCount: (settings.videoCount || 8).toString(),
        videoType: 'all'
      });

      const response = await fetch(`/api/home-videos?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      return response.json();
    },
    enabled: !!(settings?.isActive && settings?.categoryId),
  });

  // Separate shorts and regular videos
  const shorts = allVideos?.filter(video => video.videoType === 'short') || [];
  const videos = allVideos?.filter(video => video.videoType === 'video') || [];

  // Auto scroll for shorts
  useEffect(() => {
    if (!isAutoScrolling || shorts.length === 0) return;

    autoScrollRef.current = setInterval(() => {
      setCurrentShortIndex((prev) => (prev + 1) % shorts.length);
    }, 3000);

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, shorts.length]);

  const handlePreviousShort = () => {
    setIsAutoScrolling(false);
    setCurrentShortIndex((prev) => (prev - 1 + shorts.length) % shorts.length);
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const handleNextShort = () => {
    setIsAutoScrolling(false);
    setCurrentShortIndex((prev) => (prev + 1) % shorts.length);
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setShowFullDescription(false);
  };

  const closeModal = () => {
    setSelectedVideo(null);
    setShowFullDescription(false);
  };

  const truncateDescription = (text: string, limit: number = 100) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  // Don't render if settings are not active or no videos
  if (!settings?.isActive || (!shorts.length && !videos.length) || isLoading) {
    return null;
  }

  return (
    <>
      <section className={`py-16 bg-white ${className}`}>
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4 text-gray-900">
              Shorts & Videos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience our content in two formats - quick shorts and detailed videos
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left Side - Shorts */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold flex items-center gap-2 text-gray-900">
                  <div className="w-1 h-6 bg-red-500 rounded"></div>
                  Shorts
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${isAutoScrolling ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  {isAutoScrolling ? 'Auto-playing' : 'Paused'}
                </div>
              </div>

              {shorts.length > 0 && (
                <div className="relative">
                  {/* Shorts Container */}
                  <div 
                    className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-lg border"
                    style={{ aspectRatio: '9/16', height: '600px' }}
                    onMouseEnter={() => setIsAutoScrolling(false)}
                    onMouseLeave={() => setIsAutoScrolling(true)}
                  >
                    {/* Current Short */}
                    <div className="relative w-full h-full group cursor-pointer" onClick={() => handleVideoClick(shorts[currentShortIndex])}>
                      <img
                        src={shorts[currentShortIndex]?.thumbnail}
                        alt={shorts[currentShortIndex]?.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="h-12 w-12 text-gray-900 fill-current" />
                        </div>
                      </div>

                      {/* Short Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-600 text-white border-none">
                          🩳 Short
                        </Badge>
                      </div>

                      {/* Content Info */}
                      
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                        {shorts[currentShortIndex]?.title}
                      </h3>
                      <div className="flex items-center justify-between text-white/80 text-sm mb-2">
                        <span className="truncate">{shorts[currentShortIndex]?.channelName}</span>
                        <span>{formatDuration(shorts[currentShortIndex]?.duration || 0)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-white/70 text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span>{formatNumber(shorts[currentShortIndex]?.viewCount || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                          </svg>
                          <span>{formatNumber(shorts[currentShortIndex]?.likeCount || 0)}</span>
                        </div>
                      </div>
                    </div>

                      {/* Navigation Arrows */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-white/20 hover:bg-white/30 border-white/20 text-white h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviousShort();
                          }}
                          disabled={shorts.length <= 1}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-white/20 hover:bg-white/30 border-white/20 text-white h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextShort();
                          }}
                          disabled={shorts.length <= 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Shorts Indicator */}
                  <div className="flex justify-center mt-4 space-x-1">
                    {shorts.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentShortIndex 
                            ? 'bg-red-500 w-8' 
                            : 'bg-gray-400 hover:bg-gray-500'
                        }`}
                        onClick={() => {
                          setCurrentShortIndex(index);
                          setIsAutoScrolling(false);
                          setTimeout(() => setIsAutoScrolling(true), 10000);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Regular Videos */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold flex items-center gap-2 text-gray-900">
                  <div className="w-1 h-6 bg-blue-500 rounded"></div>
                  Videos
                </h3>
                <span className="text-sm text-gray-500">{videos.length} videos</span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {videos.map((video) => (
                  <Card 
                    key={video.id}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border border-gray-200 hover:border-gray-300"
                    onClick={() => handleVideoClick(video)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        {/* Video Thumbnail */}
                        <div className="relative flex-shrink-0 w-40 h-24 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md rounded-full p-2">
                              <Play className="h-4 w-4 text-white fill-current" />
                            </div>
                          </div>

                          {/* Duration Badge */}
                          {video.duration && (
                            <div className="absolute bottom-1 right-1">
                              <Badge variant="outline" className="bg-black/70 text-white text-xs border-none">
                                {formatDuration(video.duration)}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors text-gray-900">
                            {video.title}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
                            </div>
                            {video.channelName && (
                              <span className="truncate">By {video.channelName}</span>
                            )}
                          </div>

                          <Badge 
                            variant="outline" 
                            className="mt-2 text-xs bg-blue-50 text-blue-600 border-blue-200"
                          >
                            🎬 Video
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                     <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-white/80 text-sm mb-2">
                        <span className="truncate">{video.channelName}</span>
                        <span>{formatDuration(video.duration || 0)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-white/70 text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span>{formatNumber(video.viewCount || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                          </svg>
                          <span>{formatNumber(video.likeCount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {videos.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No videos available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={closeModal}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0">
          <div className="flex h-full">
            {/* Left side - Video Player */}
            <div className="flex-1 bg-black flex items-center justify-center">
              {selectedVideo && (
                <div className="w-full h-full flex items-center justify-center">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Right side - Video Info */}
            <div className="w-96 bg-white flex flex-col">
              <DialogHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Description
                  </DialogTitle>
                  <Button variant="ghost" size="icon" onClick={closeModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedVideo && (
                  <>
                    {/* Video Title */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {selectedVideo.title}
                      </h3>
                    </div>

                    {/* Video Stats */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">10</div>
                        <div className="text-xs text-gray-500">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">155</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {format(new Date(selectedVideo.publishedAt), 'MMM d')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(selectedVideo.publishedAt), 'yyyy')}
                        </div>
                      </div>
                    </div>

                    {/* Video Description */}
                    <div>
                      <div 
                        className={`text-sm text-gray-700 whitespace-pre-wrap ${
                          showFullDescription ? 'max-h-60 overflow-y-auto' : ''
                        }`}
                      >
                        {showFullDescription 
                          ? selectedVideo.description 
                          : truncateDescription(selectedVideo.description, 100)
                        }
                        {selectedVideo.description.length > 100 && (
                          <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-blue-600 hover:text-blue-700 ml-1 font-medium"
                          >
                            {showFullDescription ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* See on YouTube Button */}
                    <div className="pt-4 border-t">
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 justify-center"
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedVideo.videoId}`, '_blank')}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        See on YouTube
                      </Button>
                    </div>

                    {/* Channel Info */}
                    {selectedVideo.channelName && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-600">
                            {selectedVideo.channelName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            @{selectedVideo.channelName.toLowerCase().replace(/\s+/g, '')}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShortsAndVideosSection;