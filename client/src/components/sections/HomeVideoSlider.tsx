
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Calendar, Clock } from "lucide-react";
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

interface HomeVideoSliderProps {
  className?: string;
}

const HomeVideoSlider = ({ className = "" }: HomeVideoSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout>();

  // Fetch home video settings and videos
  const { data: settings } = useQuery({
    queryKey: ['/api/home-video-settings'],
  });

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ['/api/home-videos', settings?.categoryId, settings?.videoCount],
    enabled: !!(settings?.isActive && settings?.categoryId),
  });

  // Auto scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || !videos?.length) return;

    autoScrollRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, videos.length - getVisibleCount());
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000); // Change slide every 4 seconds

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, videos?.length]);

  // Get number of visible videos based on screen size
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  };

  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrevious = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    // Resume auto-scroll after 10 seconds
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const handleNext = () => {
    setIsAutoScrolling(false);
    const maxIndex = Math.max(0, (videos?.length || 0) - visibleCount);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    // Resume auto-scroll after 10 seconds
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
  if (!settings?.isActive || !videos?.length || isLoading) {
    return null;
  }

  const maxIndex = Math.max(0, videos.length - visibleCount);

  return (
    <section className={`py-12 bg-gradient-to-b from-gray-50 to-white ${className}`}>
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

        {/* Video Slider */}
        <div className="relative">
          {/* Navigation Buttons */}
          {videos.length > visibleCount && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Video Grid */}
          <div 
            ref={scrollRef}
            className="overflow-hidden"
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => setIsAutoScrolling(true)}
          >
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                width: `${(videos.length / visibleCount) * 100}%`
              }}
            >
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="px-2"
                  style={{ width: `${100 / videos.length}%` }}
                  onMouseEnter={() => setHoveredVideo(video.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  <Card 
                    className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    onClick={() => handleVideoClick(video.videoId)}
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
                        
                        {/* Hover Info */}
                        <div className={`transition-all duration-300 overflow-hidden ${
                          hoveredVideo === video.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
                          </div>
                          {video.channelName && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium">By {video.channelName}</span>
                            </div>
                          )}
                        </div>

                        {/* Static Info (always visible) */}
                        <div className={`transition-all duration-300 ${
                          hoveredVideo === video.id ? 'opacity-0 max-h-0' : 'opacity-100 max-h-10'
                        }`}>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
                            {video.duration && (
                              <>
                                <Clock className="h-3 w-3 ml-2" />
                                <span>{formatDuration(video.duration)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          {videos.length > visibleCount && (
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-theme w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsAutoScrolling(false);
                    setTimeout(() => setIsAutoScrolling(true), 10000);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Auto-scroll indicator */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            {isAutoScrolling ? "Auto-scrolling enabled" : "Auto-scroll paused"}
            <span className="mx-2">•</span>
            Showing {videos.length} videos
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomeVideoSlider;
