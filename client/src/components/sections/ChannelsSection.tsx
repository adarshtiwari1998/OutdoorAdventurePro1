import { useQuery } from "@tanstack/react-query";
import ChannelCard, { ChannelProps } from "@/components/common/ChannelCard";
import { Skeleton } from "@/components/ui/skeleton";

const ChannelsSection = () => {
  const { data: channels, isLoading, error } = useQuery<ChannelProps[]>({
    queryKey: ['/api/youtube/channels'],
  });

  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, i) => (
      <div key={i} className="w-72 flex-shrink-0 bg-neutral-light rounded-lg overflow-hidden shadow-md">
        <div className="h-40">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="p-4">
          <Skeleton className="h-5 w-3/4 mb-1" />
          <div className="flex items-center mb-3">
            <Skeleton className="h-4 w-4 rounded-full mr-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-full rounded-full" />
        </div>
      </div>
    ));
  };

  if (error) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-destructive">Failed to load YouTube channels. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2">Our Adventure Channels</h2>
          <p className="text-neutral-dark max-w-3xl mx-auto">Subscribe to our YouTube channels for tips, guides, and inspiring content about outdoor adventures.</p>
        </div>
        
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max scroll-snap-x">
            {isLoading ? (
              renderSkeletons()
            ) : (
              channels?.map((channel) => (
                <ChannelCard key={channel.id} {...channel} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChannelsSection;
