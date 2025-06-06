
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX, Info } from "lucide-react";

interface SlideProps {
  id: number;
  title: string;
  description: string;
  backgroundImage: string;
  videoUrl?: string;
  ctaText: string;
  ctaLink: string;
  tags?: string[];
  year?: string;
  rating?: string;
  subtitles?: string[];
}

interface AdvancedCarouselProps {
  slides: SlideProps[];
}

const AdvancedCarousel = ({ slides }: AdvancedCarouselProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoplayInterval, setAutoplayInterval] = useState<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredArrow, setHoveredArrow] = useState<'left' | 'right' | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>(new Array(slides.length).fill(null));
  
  // Set up autoplay for the carousel
  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setActiveSlide((current) => (current + 1) % slides.length);
      }, 8000);
      
      setAutoplayInterval(interval);
    }
    
    return () => {
      if (autoplayInterval) clearInterval(autoplayInterval);
    };
  }, [slides.length, isHovering]);
  
  // Reset autoplay when manually changing slides
  const changeSlide = (index: number) => {
    // Pause all videos
    videoRefs.current.forEach(video => {
      if (video) {
        video.pause();
      }
    });
    
    setActiveSlide(index);
    
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      
      if (!isHovering) {
        const newInterval = setInterval(() => {
          setActiveSlide((current) => (current + 1) % slides.length);
        }, 8000);
        
        setAutoplayInterval(newInterval);
      }
    }
  };
  
  // Play or pause the current video
  useEffect(() => {
    // Pause all videos first
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === activeSlide) {
          if (isPlaying) {
            video.play().catch(e => console.log("Video play prevented:", e));
          } else {
            video.pause();
          }
          video.muted = isMuted;
        } else {
          video.pause();
        }
      }
    });
  }, [activeSlide, isPlaying, isMuted]);
  
  const goToNextSlide = () => {
    changeSlide((activeSlide + 1) % slides.length);
  };
  
  const goToPrevSlide = () => {
    changeSlide((activeSlide - 1 + slides.length) % slides.length);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    const currentVideo = videoRefs.current[activeSlide];
    if (currentVideo) {
      currentVideo.muted = !isMuted;
    }
  };
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    const currentVideo = videoRefs.current[activeSlide];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
      } else {
        currentVideo.play().catch(e => console.log("Video play prevented:", e));
      }
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      setAutoplayInterval(null);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoveredArrow(null);
    // Restart autoplay
    const newInterval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 8000);
    
    setAutoplayInterval(newInterval);
  };

  // Calculate relative positions for other slides
  const getSlideStyle = (index: number) => {
    const position = index - activeSlide;
    
    // Normalize position for wrapping (if we're at the end of the array)
    const normalizedPosition = 
      position < -Math.floor(slides.length / 2) 
        ? position + slides.length 
        : position > Math.floor(slides.length / 2) 
          ? position - slides.length 
          : position;
    
    const translateX = normalizedPosition * 75;
    const zIndex = 5 - Math.abs(normalizedPosition);
    const opacity = 1 - (Math.abs(normalizedPosition) * 0.25);
    const scale = 1 - (Math.abs(normalizedPosition) * 0.1);
    
    return {
      transform: `translateX(${translateX}%) scale(${scale})`,
      zIndex,
      opacity: opacity > 0 ? opacity : 0
    };
  };

  const getPreviewSlideIndex = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      return (activeSlide - 1 + slides.length) % slides.length;
    } else {
      return (activeSlide + 1) % slides.length;
    }
  };

  return (
    <div 
      className="relative h-[650px] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute w-[80%] h-[90%] transition-all duration-500 cursor-pointer`}
            style={getSlideStyle(index)}
            onClick={() => index !== activeSlide && changeSlide(index)}
          >
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {slide.videoUrl && index === activeSlide ? (
                // Check if it's a YouTube embed URL
                slide.videoUrl.includes('youtube.com/embed') ? (
                  <iframe
                    src={`${slide.videoUrl}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${slide.videoUrl.split('/').pop()?.split('?')[0]}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
                    className="w-full h-full"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '100vw',
                      height: '100vh',
                      transform: 'translate(-50%, -50%)',
                      minWidth: '100%',
                      minHeight: '100%',
                      objectFit: 'cover'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={slide.title}
                    onError={(e) => console.log("YouTube iframe error:", e)}
                  ></iframe>
                ) : (
                  <video
                    ref={el => videoRefs.current[index] = el}
                    src={slide.videoUrl}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    loop
                    playsInline
                    autoPlay={isPlaying}
                    onError={(e) => console.log("Video playback error:", e)}
                  />
                )
              ) : (
                <img 
                  src={slide.backgroundImage} 
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className={`absolute inset-0 ${index === activeSlide ? 'bg-theme-overlay-gradient' : 'bg-gradient-to-r from-black/70 via-black/50 to-black/40'}`}></div>
            </div>
            
            {index === activeSlide && (
              <div className="absolute inset-0 p-10 flex flex-col justify-center">
                <div className="max-w-xl text-white">
                  {slide.subtitles && slide.subtitles.length > 0 && (
                    <div className="mb-2 flex gap-2">
                      {slide.subtitles.map((subtitle, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-white/20 rounded-full">
                          {subtitle}
                        </span>
                      ))}
                    </div>
                  )}
                  <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-4 animate-fadeIn"
                    style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}>
                    {slide.title}
                  </h1>
                  
                  {(slide.year || slide.tags) && (
                    <div className="flex items-center gap-4 mb-4">
                      {slide.year && <span className="text-sm font-medium">{slide.year}</span>}
                      {slide.tags && slide.tags.map((tag, i) => (
                        <span key={i} className="text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-lg md:text-xl mb-8 animate-fadeIn max-w-lg"
                    style={{animationDelay: '0.6s', animationFillMode: 'forwards'}}>
                    {slide.description}
                  </p>
                  
                  <div className="flex gap-4 animate-fadeIn"
                    style={{animationDelay: '0.9s', animationFillMode: 'forwards'}}>
                    <a 
                      href={slide.ctaLink}
                      className="bg-white text-black hover:bg-theme hover:text-white font-medium px-8 py-3 rounded-md transition inline-flex items-center"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      {slide.ctaText}
                    </a>
                    <button 
                      className="bg-theme/40 hover:bg-theme text-white font-medium px-4 py-3 rounded-md transition inline-flex items-center"
                    >
                      <Info className="mr-2 h-5 w-5" />
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Controls for video when active */}
            {index === activeSlide && slide.videoUrl && (
              <div className="absolute bottom-4 left-10 flex items-center gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="p-2 rounded-full bg-black/40 hover:bg-theme text-white transition"
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <Play size={24} />
                  )}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="p-2 rounded-full bg-black/40 hover:bg-theme text-white transition"
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={goToPrevSlide} 
        onMouseEnter={() => setHoveredArrow('left')}
        onMouseLeave={() => setHoveredArrow(null)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-theme text-white p-3 rounded-full transition-colors duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button 
        onClick={goToNextSlide} 
        onMouseEnter={() => setHoveredArrow('right')}
        onMouseLeave={() => setHoveredArrow(null)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-theme text-white p-3 rounded-full transition-colors duration-300"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Arrow Hover Previews */}
      {hoveredArrow && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          hoveredArrow === 'left' ? 'left-16' : 'right-16'
        }`}>
          <div className="w-48 h-28 rounded-lg overflow-hidden border-2 border-white/60 shadow-lg">
            <img 
              src={slides[getPreviewSlideIndex(hoveredArrow)].backgroundImage}
              alt={slides[getPreviewSlideIndex(hoveredArrow)].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-2 left-2 right-2">
              <h4 className="text-white text-xs font-medium line-clamp-2">
                {slides[getPreviewSlideIndex(hoveredArrow)].title}
              </h4>
            </div>
          </div>
        </div>
      )}
      
      {/* Thumbnails/Indicators at the bottom */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 px-4">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar py-2 px-4 bg-black/40 rounded-full">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => changeSlide(index)}
              className={`flex-shrink-0 w-16 h-10 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                index === activeSlide ? 'border-theme scale-110' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              <img 
                src={slide.backgroundImage} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedCarousel;
