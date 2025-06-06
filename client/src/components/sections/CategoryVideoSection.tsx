
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, Eye } from "lucide-react";

interface CategoryVideoSectionProps {
  category: string;
}

const CategoryVideoSection = ({ category }: CategoryVideoSectionProps) => {
  const { data: videos, isLoading } = useQuery({
    queryKey: [`/api/category-videos/${category}`],
  });

  const { data: settings } = useQuery({
    queryKey: [`/api/admin/category-video-settings/${category}`],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-video bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0 || !settings?.isActive) {
    return null;
  }

  // Separate shorts and videos
  const shorts = videos.filter((video: any) => video.videoType === 'short');
  const regularVideos = videos.filter((video: any) => video.videoType === 'video');

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            {settings.title || "Shorts & Videos"}
          </h2>
          {settings.description && (
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {settings.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shorts Section */}
          {shorts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-semibold">Shorts</h3>
                <Badge variant="secondary" className="text-xs">
                  Auto-playing
                </Badge>
                <span className="text-sm text-muted-foreground ml-auto">
                  {shorts.length} shorts
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {shorts.slice(0, 4).map((video: any) => (
                  <div key={video.id} className="group cursor-pointer">
                    <div className="relative aspect-[9/16] mb-3 rounded-lg overflow-hidden bg-black">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <Badge 
                        variant="destructive" 
                        className="absolute top-2 left-2 text-xs px-2 py-1"
                      >
                        Short
                      </Badge>
                      {video.duration && (
                        <Badge 
                          variant="secondary" 
                          className="absolute bottom-2 right-2 text-xs px-2 py-1 bg-black/70 text-white"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(video.duration)}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {regularVideos.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-semibold">Videos</h3>
                <span className="text-sm text-muted-foreground ml-auto">
                  {regularVideos.length} videos
                </span>
              </div>
              
              <div className="space-y-4">
                {regularVideos.slice(0, 3).map((video: any) => (
                  <div key={video.id} className="group cursor-pointer">
                    <div className="flex gap-4">
                      <div className="relative w-48 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <Badge 
                          variant="default" 
                          className="absolute top-2 left-2 text-xs px-2 py-1"
                        >
                          Video
                        </Badge>
                        {video.duration && (
                          <Badge 
                            variant="secondary" 
                            className="absolute bottom-2 right-2 text-xs px-2 py-1 bg-black/70 text-white"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(video.duration)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                          {video.viewCount && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{formatViews(video.viewCount)} views</span>
                            </div>
                          )}
                        </div>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {videos.length > 6 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              View All Videos
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryVideoSection;
