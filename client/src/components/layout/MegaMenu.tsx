import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

interface MegaMenuItem {
  id: string | number;
  label: string;
  path: string;
  order: number;
  featuredItem?: boolean;
  categoryId: number;
  createdAt: string;
}

interface MegaMenuCategory {
  id: string | number;
  title: string;
  order: number;
  menuItemId: number;
  createdAt: string;
  items: MegaMenuItem[];
}

interface MegaMenuProps {
  categories: MegaMenuCategory[];
  isOpen: boolean;
  colorClass: string;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const MegaMenu: React.FC<MegaMenuProps> = ({ 
  categories, 
  isOpen, 
  colorClass,
  onClose,
  onMouseEnter,
  onMouseLeave 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close the menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={menuRef}
      className="mega-menu absolute left-0 w-full bg-white shadow-xl border-t border-neutral z-50 py-6 animate-in fade-in slide-in-from-top-4 duration-300"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.sort((a, b) => a.order - b.order).map((category) => (
            <div key={`cat-${category.id}`} className="space-y-3">
              <h4 className={`font-semibold text-base mb-2 ${colorClass}`}>{category.title}</h4>
              <ul className="space-y-2">
                {category.items.sort((a, b) => a.order - b.order).map((item) => (
                  <li key={`item-${item.id}`}>
                    <Link 
                      href={item.path}
                      className={`text-sm text-neutral-dark hover:${colorClass} transition flex items-center gap-1 ${item.featuredItem ? 'font-medium' : ''}`}
                    >
                      {item.featuredItem && <ChevronRight size={14} />}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;