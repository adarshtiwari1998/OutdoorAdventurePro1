
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Info, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CarouselSlide {
  id: number;
  title: string;
  description: string;
  backgroundImage: string;
  videoUrl?: string;
  ctaText: string;
  ctaLink: string;
  year: string;
  rating: string;
  tags: string[];
  subtitles: string[];
}

interface AdvancedCarouselProps {
  slides: CarouselSlide[];
}

const AdvancedCarousel = ({ slides }: AdvancedCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showPreview, setShowPreview] = useState({ left: false, right: false });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();
  const previewTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-slide functionality with longer interval
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000); // Increased from 4s to 8s for longer pause

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, slides.length]);

  // Stop auto-play when user interacts
  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    // Resume after 15 seconds of no interaction
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    setIsVideoPlaying(false);
    pauseAutoPlay();
  };

  const handlePrevSlide = () => {
    const newIndex = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
    handleSlideChange(newIndex);
  };

  const handleNextSlide = () => {
    const newIndex = (currentSlide + 1) % slides.length;
    handleSlideChange(newIndex);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
    pauseAutoPlay();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleMouseEnter = () => {
    setShowControls(true);
    pauseAutoPlay();
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  // Netflix-style preview handlers
  const handlePreviewEnter = (direction: 'left' | 'right') => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      setShowPreview(prev => ({ ...prev, [direction]: true }));
    }, 500); // Show preview after 500ms hover
  };

  const handlePreviewLeave = (direction: 'left' | 'right') => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    setShowPreview(prev => ({ ...prev, [direction]: false }));
  };

  const getPreviewSlide = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      return currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
    }
    return (currentSlide + 1) % slides.length;
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-[85vh] overflow-hidden">
      {/* Main Carousel Container */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image/Video */}
            <div className="absolute inset-0 bg-gray-900">
              {slide.videoUrl && index === currentSlide ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  loop
                  poster={slide.backgroundImage}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                >
                  <source src={slide.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={slide.backgroundImage}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div
              className="relative z-20 h-full flex items-center"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="max-w-2xl text-white space-y-6">
                  {/* Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {slide.subtitles.map((subtitle) => (
                      <Badge key={subtitle} variant="secondary" className="bg-red-600 text-white">
                        {subtitle}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="font-bold text-5xl md:text-6xl lg:text-7xl leading-tight">
                    {slide.title}
                  </h1>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-lg">
                    <span className="text-green-400 font-semibold">{slide.year}</span>
                    <Badge variant="outline" className="border-white text-white">
                      {slide.rating}
                    </Badge>
                    {slide.tags.map((tag) => (
                      <span key={tag} className="text-gray-300">{tag}</span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-xl leading-relaxed max-w-xl text-gray-200">
                    {slide.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-4">
                    {slide.videoUrl && (
                      <Button
                        size="lg"
                        onClick={togglePlayPause}
                        className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 text-lg"
                      >
                        {isVideoPlaying ? (
                          <>
                            <Pause className="mr-2 h-6 w-6" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-6 w-6 fill-current" />
                            Play
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-gray-400 text-white hover:bg-white hover:text-black font-semibold px-8 py-3 text-lg"
                      onClick={() => window.open(slide.ctaLink, '_blank')}
                    >
                      <Info className="mr-2 h-5 w-5" />
                      {slide.ctaText}
                    </Button>

                    {slide.videoUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20 ml-4"
                      >
                        {isMuted ? (
                          <VolumeX className="h-6 w-6" />
                        ) : (
                          <Volume2 className="h-6 w-6" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows with reduced z-index */}
      {slides.length > 1 && (
        <>
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30"
            onMouseEnter={() => handlePreviewEnter('left')}
            onMouseLeave={() => handlePreviewLeave('left')}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevSlide}
              className="bg-black/30 hover:bg-black/60 text-white rounded-full p-3 backdrop-blur-sm border border-white/20"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            {/* Left Preview */}
            {showPreview.left && (
              <div className="absolute top-1/2 -translate-y-1/2 left-full ml-4 w-80 h-48 bg-black rounded-lg overflow-hidden shadow-2xl border border-white/20">
                <img
                  src={slides[getPreviewSlide('left')].backgroundImage}
                  alt={slides[getPreviewSlide('left')].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <h3 className="text-white font-semibold text-sm truncate">
                    {slides[getPreviewSlide('left')].title}
                  </h3>
                </div>
              </div>
            )}
          </div>

          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30"
            onMouseEnter={() => handlePreviewEnter('right')}
            onMouseLeave={() => handlePreviewLeave('right')}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextSlide}
              className="bg-black/30 hover:bg-black/60 text-white rounded-full p-3 backdrop-blur-sm border border-white/20"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            
            {/* Right Preview */}
            {showPreview.right && (
              <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-80 h-48 bg-black rounded-lg overflow-hidden shadow-2xl border border-white/20">
                <img
                  src={slides[getPreviewSlide('right')].backgroundImage}
                  alt={slides[getPreviewSlide('right')].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <h3 className="text-white font-semibold text-sm truncate">
                    {slides[getPreviewSlide('right')].title}
                  </h3>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Slide Indicators with reduced z-index */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <div className="flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-12 h-2 bg-white rounded-full'
                    : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Video Controls Overlay */}
      {currentSlideData.videoUrl && showControls && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedCarousel;
