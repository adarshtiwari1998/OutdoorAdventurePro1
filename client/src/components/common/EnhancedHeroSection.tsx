import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface EnhancedHeroSectionProps {
  title: string;
  subtitle: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  stats?: Array<{
    icon: ReactNode;
    text: string;
  }>;
  mainImage: string;
  smallTopImage: string;
  smallBottomImage: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;

  children?: ReactNode;
}

const EnhancedHeroSection = ({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  stats,
  mainImage,
  smallTopImage,
  smallBottomImage,
  backgroundImage,
  backgroundColor = "bg-background",
  textColor = "text-foreground",
  accentColor = "border-primary",
  children
}: EnhancedHeroSectionProps) => {
  return (
    <section className={`relative ${backgroundColor} ${textColor} py-12 lg:py-16 overflow-hidden min-h-[500px] flex items-center`}>
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${mainImage})`, backgroundSize: 'cover' }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column - 8/12 on desktop */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                {title}
              </h1>
              <p className="text-lg sm:text-xl max-w-3xl text-white/90">
                {subtitle}
              </p>
              
              {/* Hero Buttons */}
              {(primaryButtonText || secondaryButtonText) && (
                <div className="flex flex-wrap gap-4 pt-2">
                  {primaryButtonText && primaryButtonLink && (
                    <Button size="lg" asChild>
                      <Link href={primaryButtonLink}>{primaryButtonText}</Link>
                    </Button>
                  )}
                  
                  {secondaryButtonText && secondaryButtonLink && (
                    <Button size="lg" variant="outline" className="bg-background/10 hover:bg-background/20 text-white border-white/20" asChild>
                      <Link href={secondaryButtonLink}>{secondaryButtonText}</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Statistics Row */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-4 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 shadow-xl"
                  >
                    <div className="shrink-0 text-primary">{stat.icon}</div>
                    <p className="text-sm font-medium text-white">{stat.text}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Optional Additional Content */}
            {children && (
              <div className="hidden">
                {children}
              </div>
            )}
          </div>
          
          {/* Two-Box Column - 4/12 on desktop */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Top Image Box */}
            <div className="relative rounded-lg overflow-hidden shadow-lg h-[250px]">
              <img 
                src={smallTopImage} 
                alt={`${title} highlight 1`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-bold text-white">Popular Destinations</h3>
                <p className="text-white/80 text-sm">Discover the most loved spots</p>
              </div>
            </div>
            
            {/* Bottom Image Box */}
            <div className="relative rounded-lg overflow-hidden shadow-lg h-[250px]">
              <img 
                src={smallBottomImage} 
                alt={`${title} highlight 2`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-bold text-white">Seasonal Highlights</h3>
                <p className="text-white/80 text-sm">Best times to visit</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;