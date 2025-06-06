
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
  const [gradientColors, setGradientColors] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch home video settings and videos
  const { data: settings } = useQuery({
    queryKey: ['/api/home-video-settings'],
  });

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ['/api/home-videos', settings?.categoryId, settings?.videoCount, settings?.videoType],
    queryFn: async () => {
      if (!settings?.isActive || !settings?.categoryId) {
        return [];
      }
      
      const params = new URLSearchParams({
        categoryId: settings.categoryId.toString(),
        videoCount: (settings.videoCount || 8).toString(),
        videoType: settings.videoType || 'all'
      });
      
      const response = await fetch(`/api/home-videos?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      return response.json();
    },
    enabled: !!(settings?.isActive && settings?.categoryId),
  });

  // Extract dominant colors from video thumbnails
  const extractColorsFromThumbnail = (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(['#1a1a1a', '#2d2d2d', '#3d3d3d']);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(['#1a1a1a', '#2d2d2d', '#3d3d3d']);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = 100;
        canvas.height = 60;
        ctx.drawImage(img, 0, 0, 100, 60);
        
        try {
          const imageData = ctx.getImageData(0, 0, 100, 60);
          const data = imageData.data;
          const colorCounts: { [key: string]: number } = {};
          
          // Sample every 4th pixel for performance
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            if (alpha > 128) { // Only consider non-transparent pixels
              // Group similar colors
              const roundedR = Math.round(r / 20) * 20;
              const roundedG = Math.round(g / 20) * 20;
              const roundedB = Math.round(b / 20) * 20;
              
              const color = `${roundedR},${roundedG},${roundedB}`;
              colorCounts[color] = (colorCounts[color] || 0) + 1;
            }
          }
          
          // Get the most dominant colors
          const sortedColors = Object.entries(colorCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([color]) => {
              const [r, g, b] = color.split(',').map(Number);
              // Darken the colors for better background effect
              const darkR = Math.max(0, Math.round(r * 0.3));
              const darkG = Math.max(0, Math.round(g * 0.3));
              const darkB = Math.max(0, Math.round(b * 0.3));
              return `rgb(${darkR}, ${darkG}, ${darkB})`;
            });
          
          if (sortedColors.length > 0) {
            resolve(sortedColors);
          } else {
            resolve(['#1a1a1a', '#2d2d2d', '#3d3d3d']);
          }
        } catch (error) {
          resolve(['#1a1a1a', '#2d2d2d', '#3d3d3d']);
        }
      };
      
      img.onerror = () => {
        resolve(['#1a1a1a', '#2d2d2d', '#3d3d3d']);
      };
      
      img.src = imageUrl;
    });
  };

  // Update gradient when current video changes
  useEffect(() => {
    if (videos && videos.length > 0 && currentIndex < videos.length) {
      const currentVideo = videos[currentIndex];
      extractColorsFromThumbnail(currentVideo.thumbnail).then(colors => {
        setGradientColors(colors);
      });
    }
  }, [currentIndex, videos]);

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

  // Create the gradient background style
  const gradientStyle = gradientColors.length > 0 ? {
    background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1] || gradientColors[0]} 50%, ${gradientColors[2] || gradientColors[0]} 100%)`,
    transition: 'background 1s ease-in-out'
  } : {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)'
  };

  return (
    <>
      {/* Hidden canvas for color extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <section className={`relative py-16 overflow-hidden ${className}`}>
        {/* Dynamic gradient background */}
        <div 
          className="absolute inset-0 z-0"
          style={gradientStyle}
        />
        
        {/* Overlay for better content readability */}
        <div className="absolute inset-0 bg-black/20 z-10" />
        
        <div className="container mx-auto px-4 relative z-20">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 drop-shadow-lg">
              {settings.title || "Latest Videos"}
            </h2>
            {settings.description && (
              <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 border-white/20 hover:bg-black/70 text-white backdrop-blur-sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 border-white/20 hover:bg-black/70 text-white backdrop-blur-sm"
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
                className="flex transition-transform duration-700 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                  width: `${(videos.length / visibleCount) * 100}%`
                }}
              >
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="px-3"
                    style={{ width: `${100 / videos.length}%` }}
                    onMouseEnter={() => setHoveredVideo(video.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    <Card 
                      className={`group cursor-pointer transition-all duration-500 bg-black/30 border-white/10 backdrop-blur-sm hover:bg-black/50 hover:border-white/30 ${
                        index === currentIndex 
                          ? 'ring-2 ring-white/50 shadow-2xl scale-105' 
                          : 'hover:shadow-2xl hover:scale-105'
                      }`}
                      onClick={() => handleVideoClick(video.videoId)}
                    >
                      <CardContent className="p-0">
                        {/* Video Thumbnail */}
                        <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm text-white rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/30">
                              <Play className="h-8 w-8 fill-current" />
                            </div>
                          </div>

                          {/* Video Type Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge 
                              variant={video.videoType === 'short' ? 'secondary' : 'default'}
                              className="text-xs bg-black/70 text-white border-white/20"
                            >
                              {video.videoType === 'short' ? 'Short' : 'Video'}
                            </Badge>
                          </div>

                          {/* Duration Badge */}
                          {video.duration && (
                            <div className="absolute bottom-3 right-3">
                              <Badge className="bg-black/80 text-white text-xs border-white/20">
                                {formatDuration(video.duration)}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="p-5">
                          <h3 className="font-semibold text-base line-clamp-2 mb-3 text-white group-hover:text-white/90 transition-colors">
                            {video.title}
                          </h3>
                          
                          {/* Hover Info */}
                          <div className={`transition-all duration-300 overflow-hidden ${
                            hoveredVideo === video.id ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
                            </div>
                            {video.channelName && (
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <span className="font-medium">By {video.channelName}</span>
                              </div>
                            )}
                          </div>

                          {/* Static Info (always visible) */}
                          <div className={`transition-all duration-300 ${
                            hoveredVideo === video.id ? 'opacity-0 max-h-0' : 'opacity-100 max-h-12'
                          }`}>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
                              {video.duration && (
                                <>
                                  <Clock className="h-4 w-4 ml-2" />
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
              <div className="flex justify-center space-x-3 mt-8">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                  <button
                    key={index}
                    className={`h-3 rounded-full transition-all duration-300 backdrop-blur-sm ${
                      index === currentIndex 
                        ? 'bg-white w-8 shadow-lg' 
                        : 'bg-white/40 w-3 hover:bg-white/60'
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
          <div className="text-center mt-6">
            <p className="text-sm text-white/70 backdrop-blur-sm bg-black/20 inline-block px-4 py-2 rounded-full">
              {isAutoScrolling ? "Auto-scrolling enabled" : "Auto-scroll paused"}
              <span className="mx-2">•</span>
              Showing {videos.length} videos
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomeVideoSlider;
