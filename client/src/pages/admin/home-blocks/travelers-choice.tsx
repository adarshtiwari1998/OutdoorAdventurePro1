import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Choice {
  id: number;
  title: string;
  image: string;
  category: string;
  order: number;
}

const TravelersChoice = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNextSlide = () => {
    if (currentIndex < 2) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <section className="py-8 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Stay at the world's top hotels</h2>
          <p className="text-gray-600">2025's Travelers' Choice Awards Best of the Best Hotels</p>
        </div>

        <div className="relative">
          <div className="flex gap-6 transition-transform duration-500" 
               style={{ transform: `translateX(-${currentIndex * 33.33}%)` }}>
            {['World', 'Luxury', 'Family-Friendly', 'One of a Kind'].map((category, idx) => (
              <div key={idx} className="min-w-[300px] group relative rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="relative h-[250px] w-full">
                  <img
                    src={`https://source.unsplash.com/800x600/?hotel,${category.toLowerCase()}`}
                    alt={category}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-2 left-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded">
                    2025
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2 transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                    {category}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={goToPrevSlide}
            className={`absolute left-[-20px] top-1/2 transform -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg transition-all duration-300 hover:bg-theme hover:text-white ${
              currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
            }`}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNextSlide}
            className={`absolute right-[-20px] top-1/2 transform -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg transition-all duration-300 hover:bg-theme hover:text-white ${
              currentIndex === 2 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
            }`}
            disabled={currentIndex === 2}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TravelersChoice;