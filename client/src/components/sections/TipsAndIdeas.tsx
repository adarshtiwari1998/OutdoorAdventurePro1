import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight, 
  Calendar, 
  Clock, 
  ThumbsUp, 
  Eye, 
  ArrowRight,
  Compass,
  Mountain,
  Tent,
  Fish,
  Sailboat,
  Car
} from "lucide-react";
import { motion } from "framer-motion";

interface TipsAndIdeasProps {
  category?: string;
}

const getIconByCategory = (category: string) => {
  const icons = {
    hiking: Mountain,
    camping: Tent,
    fishing: Fish,
    cruising: Sailboat,
    "four-x-four": Car,
    default: Compass
  };
  return icons[category as keyof typeof icons] || icons.default;
};

const TipsAndIdeas = ({ category }: TipsAndIdeasProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 300;
    container.scrollTo({
      left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    });
  };

  const { data: tips = [] } = useQuery({
    queryKey: ["admin-tips", category],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tips${category ? `?category=${category}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tips');
      }
      return response.json();
    }
  });

  return (
    <section className="py-12 bg-gradient-to-b from-white to-primary/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-8 text-center">
          <Badge className="bg-primary/10 text-primary mb-2">Expert Knowledge</Badge>
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark mb-3">
            Tips & Ideas Worth Sharing
          </h2>
          <p className="text-neutral-dark/80 max-w-2xl text-sm md:text-base">
            Discover expert-curated tips and innovative ideas to enhance your outdoor adventures
          </p>
        </div>

        <div className="relative">
          {/* Navigation Arrows */}
          <button 
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button 
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            {tips.map((tip: any, index: number) => {
              const Icon = getIconByCategory(tip.category);
              return (
                <motion.div
                  key={tip.id}
                  className="flex-none w-[300px] snap-start"
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-[380px]">
                    <div className="relative">
                      <img 
                        src={tip.image} 
                        alt={tip.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {tip.difficultylevel}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tip.seasonality}
                        </Badge>
                      </div>

                      <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                        {tip.title}
                      </h3>

                      <p className="text-neutral-dark/80 mb-4 line-clamp-2">
                        {tip.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-neutral-dark/60">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {tip.estimatedtime}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {tip.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {tip.views}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between hover:text-primary"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TipsAndIdeas;