import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ProductProps {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isSale?: boolean;
  slug: string;
}

const ProductCard = ({
  id,
  title,
  image,
  price,
  originalPrice,
  rating,
  reviewCount,
  isNew,
  isSale,
  slug
}: ProductProps) => {
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-secondary text-secondary" size={16} />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-secondary text-secondary w-4 h-4">
          <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" fill="currentColor" strokeDasharray="22" strokeDashoffset="11" />
        </svg>
      );
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-secondary" size={16} />);
    }
    
    return stars;
  };

  const addToCart = async () => {
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      await apiRequest('POST', '/api/cart/add', { productId: id, quantity: 1 });
      toast({
        title: "Added to cart",
        description: `${title} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Card className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition">
      <div className="relative">
        <Link href={`/shop/product/${slug}`}>
          <img 
            src={image}
            alt={title} 
            className="w-full h-48 object-contain p-2"
          />
        </Link>
        {(isNew || isSale) && (
          <div className="absolute top-2 left-2">
            {isNew && (
              <Badge className="bg-secondary text-white">New</Badge>
            )}
            {isSale && (
              <Badge className="bg-destructive text-white">Sale</Badge>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <Link href={`/shop/product/${slug}`}>
          <h3 className="font-medium text-sm md:text-base mb-1 line-clamp-3 hover:text-primary transition-colors">{title}</h3>
        </Link>
        <div className="flex items-center mb-2">
          <div className="flex text-secondary text-sm">
            {renderStars(rating)}
          </div>
          <span className="text-xs text-neutral-dark ml-1">({reviewCount})</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold">${price.toFixed(2)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-neutral-dark text-sm line-through ml-1">${originalPrice.toFixed(2)}</span>
            )}
          </div>
          <Button 
            size="icon" 
            className="bg-primary text-white hover:bg-primary-dark transition rounded-full p-2"
            onClick={addToCart}
            disabled={isAddingToCart}
          >
            <ShoppingCart size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
