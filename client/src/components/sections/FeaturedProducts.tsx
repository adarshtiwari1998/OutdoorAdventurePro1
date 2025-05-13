import { useQuery } from "@tanstack/react-query";
import ProductCard, { ProductProps } from "@/components/common/ProductCard";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedProducts = () => {
  const { data: products, isLoading, error } = useQuery<ProductProps[]>({
    queryKey: ['/api/products/featured'],
  });

  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, i) => (
      <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md">
        <div className="relative">
          <Skeleton className="w-full h-48" />
        </div>
        <div className="p-4">
          <Skeleton className="h-5 w-full mb-1" />
          <div className="flex items-center mb-2">
            <Skeleton className="h-4 w-24 mr-2" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    ));
  };

  if (error) {
    return (
      <section className="py-16 bg-neutral-light">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-destructive">Failed to load featured products. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading font-bold text-2xl md:text-3xl">Featured Gear</h2>
          <Link href="/shop" className="text-primary hover:text-primary-dark font-medium flex items-center">
            Visit Shop 
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            renderSkeletons()
          ) : (
            products?.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
