import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/common/HeroSection";
import ProductCard, { ProductProps } from "@/components/common/ProductCard";
import NewsletterSection from "@/components/sections/NewsletterSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SortOption = "newest" | "price-low" | "price-high" | "popularity";

const Shop = () => {
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data, isLoading, error } = useQuery<{
    products: ProductProps[];
    totalPages: number;
  }>({
    queryKey: ['/api/products', { category, searchQuery, page: currentPage, sortBy }],
  });

  const { data: categories } = useQuery<{id: string, name: string, slug: string}[]>({
    queryKey: ['/api/products/categories'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const renderProductSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array(8).fill(0).map((_, i) => (
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
      ))}
    </div>
  );

  return (
    <>
      <HeroSection 
        backgroundImage="https://images.unsplash.com/photo-1465188162913-8fb5709d6d57?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        title="Gear Up for Your Adventure"
        subtitle="Quality outdoor equipment for every type of adventure"
        primaryButton={{ text: "Shop Now", href: "#products" }}
      />
      
      <section className="py-16" id="products">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/5">
                  <Label htmlFor="category" className="block text-sm font-medium mb-1">
                    Category
                  </Label>
                  <Select 
                    value={category} 
                    onValueChange={(value) => {
                      setCategory(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:w-1/5">
                  <Label htmlFor="sort" className="block text-sm font-medium mb-1">
                    Sort By
                  </Label>
                  <Select 
                    value={sortBy} 
                    onValueChange={(value: SortOption) => setSortBy(value)}
                  >
                    <SelectTrigger id="sort">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="search" className="block text-sm font-medium mb-1">
                    Search Products
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="text" 
                      id="search" 
                      placeholder="Search by keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit">Search</Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {isLoading ? (
            renderProductSkeleton()
          ) : error ? (
            <div className="text-center text-destructive">
              <p>Failed to load products. Please try again later.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {data?.products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex justify-center mt-10">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, data.totalPages))}
                      disabled={currentPage === data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {data?.products.length === 0 && (
                <div className="text-center p-10">
                  <h3 className="text-xl font-medium mb-2">No Products Found</h3>
                  <p className="text-neutral-dark">
                    Try adjusting your search or category filters to find what you're looking for.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <NewsletterSection />
    </>
  );
};

export default Shop;
