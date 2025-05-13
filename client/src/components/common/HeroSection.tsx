import { ReactNode } from "react";

interface HeroSectionProps {
  backgroundImage: string;
  title: string;
  subtitle: string;
  primaryButton?: {
    text: string;
    href: string;
  };
  secondaryButton?: {
    text: string;
    href: string;
  };
  children?: ReactNode;
}

const HeroSection = ({
  backgroundImage,
  title,
  subtitle,
  primaryButton,
  secondaryButton,
  children
}: HeroSectionProps) => {
  return (
    <section className="relative">
      <div className="h-[600px] overflow-hidden">
        <img 
          src={backgroundImage}
          alt={title} 
          className="w-full h-full object-cover"
        />
        <div className="hero-overlay-themed absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-xl text-white">
              <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-4">{title}</h1>
              <p className="text-lg md:text-xl mb-8">{subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                {primaryButton && (
                  <a 
                    href={primaryButton.href} 
                    className="bg-theme hover:bg-theme-dark text-white font-medium px-8 py-3 rounded-full transition text-center"
                  >
                    {primaryButton.text}
                  </a>
                )}
                {secondaryButton && (
                  <a 
                    href={secondaryButton.href} 
                    className="bg-white text-theme hover:bg-neutral-light font-medium px-8 py-3 rounded-full transition text-center"
                  >
                    {secondaryButton.text}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
};

export default HeroSection;
