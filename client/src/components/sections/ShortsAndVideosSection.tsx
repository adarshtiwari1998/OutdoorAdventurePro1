
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Play, Calendar, Clock, Volume2, VolumeX } from "lucide-react";
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
}

interface ShortsAndVideosSectionProps {
  className?: string;
}

const ShortsAndVideosSection = ({ className = "" }: ShortsAndVideosSectionProps) => {
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const autoScrollRef = useRef<NodeJS.Timeout>();
  const shortsContainerRef = useRef<HTMLDivElement>(null);

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
        videoType: 'all' // Get both shorts and videos
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
    }, 3000); // Change short every 3 seconds

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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = (videoId: string) => {
    window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
  };

  // Don't render if settings are not active or no videos
  if (!settings?.isActive || (!shorts.length && !videos.length) || isLoading) {
    return null;
  }

  return (
    <section className={`py-16 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Shorts & Videos
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience our content in two formats - quick shorts and detailed videos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Side - Shorts (YouTube Shorts Style) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <div className="w-1 h-6 bg-red-500 rounded"></div>
                Shorts
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className={`w-2 h-2 rounded-full ${isAutoScrolling ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                {isAutoScrolling ? 'Auto-playing' : 'Paused'}
              </div>
            </div>

            {shorts.length > 0 && (
              <div className="relative">
                {/* Shorts Container */}
                <div 
                  ref={shortsContainerRef}
                  className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
                  style={{ aspectRatio: '9/16', height: '600px' }}
                  onMouseEnter={() => setIsAutoScrolling(false)}
                  onMouseLeave={() => setIsAutoScrolling(true)}
                >
                  {/* Current Short */}
                  <div className="relative w-full h-full group cursor-pointer">
                    <img
                      src={shorts[currentShortIndex]?.thumbnail}
                      alt={shorts[currentShortIndex]?.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                    
                    {/* Play Button */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={() => handleVideoClick(shorts[currentShortIndex]?.videoId)}
                    >
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-6 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="h-12 w-12 text-white fill-current" />
                      </div>
                    </div>

                    {/* Short Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-600 text-white border-none">
                        🩳 Short
                      </Badge>
                    </div>

                    {/* Mute/Unmute Button */}
                    <button
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>

                    {/* Content Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h4 className="text-lg font-semibold mb-2 line-clamp-2">
                        {shorts[currentShortIndex]?.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(shorts[currentShortIndex]?.publishedAt), 'MMM d')}</span>
                        </div>
                        {shorts[currentShortIndex]?.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(shorts[currentShortIndex]?.duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-black/50 hover:bg-black/70 border-white/20 text-white h-8 w-8"
                        onClick={handlePreviousShort}
                        disabled={shorts.length <= 1}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-black/50 hover:bg-black/70 border-white/20 text-white h-8 w-8"
                        onClick={handleNextShort}
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
                          : 'bg-gray-600 hover:bg-gray-500'
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
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-500 rounded"></div>
                Videos
              </h3>
              <span className="text-sm text-gray-400">{videos.length} videos</span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {videos.map((video) => (
                <Card 
                  key={video.id}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-gray-600"
                  onClick={() => handleVideoClick(video.videoId)}
                >
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {/* Video Thumbnail */}
                      <div className="relative flex-shrink-0 w-32 h-20 bg-gray-900 rounded-lg overflow-hidden">
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
                        <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                          {video.title}
                        </h4>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-400">
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
                          className="mt-2 text-xs bg-blue-600/20 text-blue-400 border-blue-600/30"
                        >
                          🎬 Video
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {videos.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No videos available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShortsAndVideosSection;
