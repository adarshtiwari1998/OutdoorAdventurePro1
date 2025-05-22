
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search } from "lucide-react";

const HomeHeader = () => {
  const { data: cartCount } = useQuery<number>({
    queryKey: ['/api/cart/count'],
    staleTime: 60000,
  });

  return (
    <header className="bg-white w-full sticky top-0 z-50">
      {/* Top Banner */}
      <div className="bg-[#025323] text-white text-center py-2 text-sm">
        Your ultimate guide to outdoor adventures and experiences
      </div>

      {/* Top Bar */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="text-sm">Made with ❤️ by HTHFO</div>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-sm hover:text-[#025323]">YOUTUBE</a>
            <a href="#" className="text-sm hover:text-[#025323]">INSTAGRAM</a>
            <a href="#" className="text-sm hover:text-[#025323]">TWITTER</a>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search here..." 
                className="pl-4 pr-8 py-1 text-sm border border-gray-200 rounded w-40"
              />
              <Search className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/icons/outdoor-logo.png"
              alt="Logo" 
              className="h-16 w-16 object-contain mr-3"
              loading="eager"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = target.src.replace(/\?.*$/, '') + '?' + new Date().getTime();
              }}
            />
            <Link href="/" className="text-xl font-semibold hover:text-[#025323] transition-colors">
              Your vacation ideas Channel
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/destinations" className="hover:text-[#025323]">Destinations</Link>
              <Link href="/categories" className="hover:text-[#025323]">Categories</Link>
              <Link href="/shop" className="hover:text-[#025323]">Shop</Link>
              <Link href="/blog" className="hover:text-[#025323]">Blog</Link>
              <Link href="/tips" className="hover:text-[#025323]">Tips & Ideas</Link>
            </nav>
            <div className="flex items-center space-x-3">
              <button className="border border-[#025323] text-[#025323] px-4 py-1.5 rounded-full hover:bg-[#025323] hover:text-white transition">
                Sign In
              </button>
              <button className="bg-[#FF6B00] text-white px-4 py-1.5 rounded-full hover:bg-[#FF5500] transition">
                Join Now
              </button>
              <Link href="/cart" className="relative">
                <ShoppingCart className="text-gray-700" />
                <span className="absolute -top-2 -right-2 bg-[#FF6B00] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount || 0}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center items-center space-x-6">
            {['Outdoors', 'Cruising', 'Fishing', 'Hiking', 'Camping', '4x4'].map((category) => (
              <Link 
                key={category} 
                href={`/${category.toLowerCase()}`}
                className="flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full bg-[#025323] mb-2 flex items-center justify-center">
                  <img 
                    src={`/icons/${category.toLowerCase()}.png`}
                    alt={category}
                    className="w-8 h-8"
                  />
                </div>
                <span className="text-sm font-medium">
                  {category}
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
