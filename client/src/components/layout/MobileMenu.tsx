import { Link } from "wouter";
import { useEffect } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('#mobile-menu') && !target.closest('#mobile-menu-button')) {
        onClose();
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white shadow-lg" id="mobile-menu">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex flex-col space-y-3">
          <Link href="/" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Home</Link>
          <Link href="/outdoors" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Outdoors</Link>
          <Link href="/cruising" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Cruising</Link>
          <Link href="/fishing" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Fishing</Link>
          <Link href="/hiking" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Hiking</Link>
          <Link href="/camping" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Camping</Link>
          <Link href="/4x4" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>4x4 Adventures</Link>
          <Link href="/blog" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Blog</Link>
          <Link href="/shop" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Shop</Link>
          <Link href="/contact" className="font-medium hover:text-secondary py-2 border-b border-neutral" onClick={onClose}>Contact</Link>
          <div className="flex space-x-3 py-2">
            <button className="flex-1 bg-transparent border border-primary text-primary hover:bg-primary hover:text-white transition rounded-full py-2 font-medium">
              Sign In
            </button>
            <button className="flex-1 bg-secondary text-white hover:bg-secondary-dark transition rounded-full py-2 font-medium">
              Join Now
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
