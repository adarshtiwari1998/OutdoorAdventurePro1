import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";

export interface ChannelProps {
  id: string;
  title: string;
  image: string;
  subscribers: number;
  youtubeUrl: string;
}

const formatSubscribers = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const ChannelCard = ({
  title,
  image,
  subscribers,
  youtubeUrl
}: ChannelProps) => {
  return (
    <Card className="w-72 flex-shrink-0 bg-neutral-light rounded-lg overflow-hidden shadow-md">
      <div className="relative">
        <img 
          src={image}
          alt={title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-secondary bg-opacity-90 rounded-full h-12 w-12 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-heading font-bold text-lg mb-1">{title}</h3>
        <div className="flex items-center mb-3">
          <Youtube className="h-4 w-4 text-red-600 mr-1" />
          <span className="ml-2 text-sm text-neutral-dark">{formatSubscribers(subscribers)} subscribers</span>
        </div>
        <Button
          variant="default"
          className="w-full bg-neutral-dark hover:bg-primary text-white rounded-full py-2 text-sm transition"
          onClick={() => window.open(youtubeUrl, '_blank')}
        >
          Subscribe
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChannelCard;
