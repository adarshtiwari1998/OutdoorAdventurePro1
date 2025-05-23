
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TravelersChoice = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const { data: choices } = useQuery({
    queryKey: ['/api/travelers-choice'],
  });

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout;
    
    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollLeft += 1;
        }
      }, 50);
    };

    if (!isHovering) {
      startAutoScroll();
    }

    return () => {
      clearInterval(scrollInterval);
    };
  }, [isHovering]);

  return (
    <section className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-heading font-bold mb-4 text-neutral-900">
            2025's Travelers' Choice
          </h2>
          <p className="text-neutral-600 text-lg">
            Explore the top adventure's choice
          </p>
        </div>

        <div className="relative group">
          <div 
            ref={containerRef}
            className="flex overflow-x-hidden gap-6 py-4 scroll-smooth"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {choices?.map((choice) => (
              <Link 
                key={choice.id} 
                href={`/travelers-choice/${choice.slug}`}
                className="flex-none group/card relative transform transition-all duration-300 hover:scale-105"
              >
                <div className="w-[300px] h-[200px] rounded-lg overflow-hidden mb-4 shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="w-full h-full relative overflow-hidden">
                    <img
                      src={choice.image}
                      alt={choice.title}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover/card:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 transition-opacity duration-300 group-hover/card:opacity-70" />
                  </div>
                  <div className="absolute top-2 left-2">
                    <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded shadow-sm">
                      2025
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-xl font-bold transform transition-transform duration-300 group-hover/card:translate-y-[-4px]">
                      {choice.category}
                    </h3>
                    <p className="text-white/80 text-sm mt-1 opacity-0 transform translate-y-4 transition-all duration-300 group-hover/card:opacity-100 group-hover/card:translate-y-0">
                      {choice.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute left-[-20px] top-1/2 transform -translate-y-1/2 opacity-0 transition-opacity duration-300",
              "bg-white/80 hover:bg-white shadow-md",
              "group-hover:opacity-100"
            )}
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute right-[-20px] top-1/2 transform -translate-y-1/2 opacity-0 transition-opacity duration-300",
              "bg-white/80 hover:bg-white shadow-md",
              "group-hover:opacity-100"
            )}
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TravelersChoice;
