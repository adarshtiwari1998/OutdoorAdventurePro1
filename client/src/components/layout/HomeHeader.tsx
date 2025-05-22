import { useState } from "react";
import { Link } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search } from "lucide-react";

const HomeHeader = () => {
  const isMobile = useMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: cartCount } = useQuery<number>({
    queryKey: ['/api/cart/count'],
    staleTime: 60000,
  });

  const { data: headerConfigs } = useQuery({
    queryKey: ['/api/admin/header-configs'],
    select: (data) => data.filter(config => config.category !== 'home'),
  });

  return (
    <header className="bg-white w-full">
      {/* Top Banner */}
      <div className="bg-[#025323] text-white text-center py-2 text-sm">
        Your ultimate guide to outdoor adventures and experiences
      </div>

      {/* Search and Social Bar */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="text-sm">Made with ❤️ by HTHFO</div>
          <div className="flex items-center space-x-4">
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-sm">YOUTUBE</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm">INSTAGRAM</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm">TWITTER</a>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search here..." 
                className="pl-8 pr-4 py-1 text-sm border border-gray-200 rounded-full w-40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo.svg" 
              alt="Your vacation ideas Channel" 
              className="h-12 w-12"
            />
            <span className="text-xl font-semibold">Your vacation ideas Channel</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/destinations" className="hover:text-[#025323]">Destinations</Link>
            <Link href="/gear" className="hover:text-[#025323]">Gear</Link>
            <Link href="/blog" className="hover:text-[#025323]">Blog</Link>
            <Link href="/community" className="hover:text-[#025323]">Community</Link>
            <Link href="/about" className="hover:text-[#025323]">About Us</Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button className="text-[#025323] border border-[#025323] px-4 py-2 rounded-full hover:bg-[#025323] hover:text-white transition">
              Sign In
            </button>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition">
              Join Now
            </button>
            <Link href="/cart" className="relative">
              <ShoppingCart className="text-gray-700" />
              {cartCount && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Channel Navigation */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {headerConfigs?.map((config) => (
              <Link 
                key={config.id} 
                href={`/${config.category}`}
                className="flex flex-col items-center group"
              >
                <img 
                  src={config.logoSrc} 
                  alt={config.logoText}
                  className="w-16 h-16 rounded-full mb-2"
                />
                <span className="text-sm group-hover:text-[#025323]">
                  {config.logoText}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;