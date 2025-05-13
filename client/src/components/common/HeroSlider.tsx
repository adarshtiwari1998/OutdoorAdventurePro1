import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideProps {
  id: number;
  title: string;
  description: string;
  backgroundImage: string;
  ctaText: string;
  ctaLink: string;
}

interface HeroSliderProps {
  slides: SlideProps[];
}

const HeroSlider = ({ slides }: HeroSliderProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoplayInterval, setAutoplayInterval] = useState<NodeJS.Timeout | null>(null);

  // Set up autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 7000);
    
    setAutoplayInterval(interval);
    
    return () => {
      if (autoplayInterval) clearInterval(autoplayInterval);
    };
  }, [slides.length]);
  
  // Reset autoplay when manually changing slides
  const changeSlide = (index: number) => {
    setActiveSlide(index);
    
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      
      const newInterval = setInterval(() => {
        setActiveSlide((current) => (current + 1) % slides.length);
      }, 7000);
      
      setAutoplayInterval(newInterval);
    }
  };
  
  const goToNextSlide = () => {
    changeSlide((activeSlide + 1) % slides.length);
  };
  
  const goToPrevSlide = () => {
    changeSlide((activeSlide - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-[600px] overflow-hidden">
      <div className="absolute inset-0 flex">
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="absolute inset-0">
              <img 
                src={slide.backgroundImage} 
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-theme-overlay-gradient"></div>
            </div>
            
            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-xl text-white">
                  <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-4 opacity-0 animate-fadeIn" 
                    style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}>
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 opacity-0 animate-fadeIn"
                    style={{animationDelay: '0.6s', animationFillMode: 'forwards'}}>
                    {slide.description}
                  </p>
                  <div className="opacity-0 animate-fadeIn"
                    style={{animationDelay: '0.9s', animationFillMode: 'forwards'}}>
                    <a 
                      href={slide.ctaLink}
                      className="bg-theme hover:bg-theme-dark text-white font-medium px-8 py-3 rounded-full transition inline-flex items-center"
                    >
                      {slide.ctaText}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={goToPrevSlide} 
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-theme text-white p-2 rounded-full transition-colors duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button 
        onClick={goToNextSlide} 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-theme text-white p-2 rounded-full transition-colors duration-300"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => changeSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === activeSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;