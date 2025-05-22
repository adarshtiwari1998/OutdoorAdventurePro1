
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";

const FavoriteDestinations = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: destinations } = useQuery({
    queryKey: ['/api/favorite-destinations'],
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
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-heading font-bold mb-4">Favourite Destinations</h2>
          <p className="text-neutral-dark">
            Explore a curated collection of the most captivating destinations around the world.
          </p>
        </div>

        <div 
          ref={containerRef}
          className="flex overflow-x-hidden gap-6 py-4"
        >
          {destinations?.map((destination) => (
            <div key={destination.id} className="flex-none">
              <div className="w-[150px] h-[150px] rounded-full overflow-hidden mb-4">
                <img
                  src={destination.image}
                  alt={destination.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-center font-medium">{destination.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FavoriteDestinations;
