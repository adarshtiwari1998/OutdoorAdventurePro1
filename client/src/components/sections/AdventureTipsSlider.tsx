import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TipItem {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
}

interface AdventureTipsSliderProps {
  category: string;
}

const AdventureTipsSlider = ({ category }: AdventureTipsSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sample adventure tips data - in a real app, this would be fetched from an API
  const adventureTips: TipItem[] = [
    {
      id: 1,
      title: "Essential Fishing Gear Guide",
      description: "Must-have equipment for both beginners and seasoned anglers to enhance your fishing experience.",
      image: `https://images.unsplash.com/photo-1544551763-92ab472cad5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "fishing"
    },
    {
      id: 2,
      title: "Best Fishing Spots by Season",
      description: "Learn where to fish throughout the year to maximize your chances of a great catch.",
      image: `https://images.unsplash.com/photo-1542261777448-23d2a287091c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "fishing"
    },
    {
      id: 3,
      title: "Catch & Release Techniques",
      description: "Proper methods to safely return fish to the water while minimizing stress and injury.",
      image: `https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "fishing"
    },
    {
      id: 4,
      title: "Weather Patterns for Fishers",
      description: "How different weather conditions affect fish behavior and feeding patterns.",
      image: `https://images.unsplash.com/photo-1595503240812-7286dafaddc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "fishing"
    },
    {
      id: 5,
      title: "Sustainable Fishing Practices",
      description: "Ethical approaches to fishing that help preserve fish populations and aquatic ecosystems.",
      image: `https://images.unsplash.com/photo-1584376247629-b5181dba41df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "fishing"
    },
    {
      id: 6,
      title: "Safety First: Weather Awareness",
      description: "Learn to read weather patterns and prepare for changing conditions during your adventure.",
      image: `https://images.unsplash.com/photo-1516166328576-82e16a127024?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "safety"
    },
    {
      id: 7,
      title: "Navigation Skills Everyone Should Know",
      description: "Basic navigation techniques that can help you find your way even when technology fails.",
      image: `https://images.unsplash.com/photo-1503221043305-f7498f8b7888?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "skills"
    },
    {
      id: 8,
      title: "Leave No Trace Principles",
      description: "Protect nature and preserve the wilderness by following these essential practices.",
      image: `https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      category: "environment"
    },
  ];

  // Filter tips by category if needed
  const filteredTips = category ? 
    adventureTips.filter(tip => tip.category.toLowerCase() === category.toLowerCase()) : 
    adventureTips;

  // Display all tips if filtered results are too few
  const displayTips = filteredTips.length >= 3 ? filteredTips : adventureTips;

  const totalSlides = displayTips.length;
  const slidesToShow = Math.min(3, totalSlides);
  const maxIndex = totalSlides - slidesToShow;

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prevIndex => (prevIndex >= maxIndex ? 0 : prevIndex + 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prevIndex => (prevIndex <= 0 ? maxIndex : prevIndex - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Auto slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, isAnimating]);

  // Calculate visibility for each slide
  const getVisibility = (index: number) => {
    const isVisible = index >= currentIndex && index < currentIndex + slidesToShow;
    return isVisible ? "block" : "hidden";
  };

  // Get the appropriate width class
  const getWidthClass = () => {
    if (slidesToShow === 1) return "w-full";
    if (slidesToShow === 2) return "w-1/2";
    return "w-1/3";
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <div>
            <Badge className="bg-primary/10 text-primary mb-2">Expert Advice</Badge>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-dark">
              Latest Adventure Tips
            </h2>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={prevSlide}
              disabled={isAnimating}
              className="rounded-full border-neutral hover:bg-primary/10 hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={nextSlide}
              disabled={isAnimating}
              className="rounded-full border-neutral hover:bg-primary/10 hover:text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="relative overflow-hidden">
          <div 
            ref={sliderRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / slidesToShow)}%)` }}
          >
            {displayTips.map((tip, index) => (
              <div 
                key={tip.id} 
                className={`${getWidthClass()} px-3 flex-shrink-0`}
              >
                <Card className="h-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-video overflow-hidden relative">
                    <img 
                      src={tip.image} 
                      alt={tip.title} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                      <h3 className="text-white font-heading font-bold text-xl">{tip.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-neutral-dark mb-4">{tip.description}</p>
                    <a href="#" className="text-primary font-medium hover:underline">Read More →</a>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        {/* Dots indicators */}
        <div className="flex justify-center mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={`w-2.5 h-2.5 rounded-full mx-1 transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-neutral"
              }`}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdventureTipsSlider;