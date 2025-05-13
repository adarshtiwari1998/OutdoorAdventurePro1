import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export interface TestimonialProps {
  id: string;
  content: string;
  author: {
    name: string;
    title: string;
    avatar: string;
  };
  rating: number;
}

const TestimonialCard = ({
  content,
  author,
  rating
}: TestimonialProps) => {
  const renderStars = () => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`${i < rating ? 'fill-secondary text-secondary' : 'text-gray-300'}`} 
        size={20} 
      />
    ));
  };

  return (
    <Card className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
      <CardContent className="p-0">
        <div className="flex text-secondary text-lg mb-4 justify-center">
          {renderStars()}
        </div>
        <p className="italic mb-4">{content}</p>
        <div className="flex items-center justify-center">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="font-medium">{author.name}</div>
            <div className="text-xs opacity-75">{author.title}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
