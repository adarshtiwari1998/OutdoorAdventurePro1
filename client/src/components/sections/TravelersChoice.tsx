
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Link } from "wouter";

const TravelersChoice = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: choices } = useQuery({
    queryKey: ['/api/travelers-choice'],
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout;
    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft += 1;
        }
      }, 30);
    };

    startAutoScroll();

    container.addEventListener('mouseenter', () => clearInterval(scrollInterval));
    container.addEventListener('mouseleave', startAutoScroll);

    return () => {
      clearInterval(scrollInterval);
    };
  }, []);

  return (
    <section className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-heading font-bold mb-4">2025's Travelers' Choice</h2>
          <p className="text-neutral-dark">
            Stay at the world's top hotels
          </p>
        </div>

        <div 
          ref={containerRef}
          className="flex overflow-x-hidden gap-6 py-4"
        >
          {choices?.map((choice) => (
            <Link 
              key={choice.id} 
              href={`/travelers-choice/${choice.slug}`}
              className="flex-none group relative"
            >
              <div className="w-[300px] h-[200px] rounded-lg overflow-hidden mb-4">
                <img
                  src={choice.image}
                  alt={choice.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                    2025
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-xl font-bold">
                  {choice.category}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TravelersChoice;
