import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/common/HeroSection";
import BlogCard, { BlogPostProps } from "@/components/common/BlogCard";
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

const Blog = () => {
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data, isLoading, error } = useQuery<{
    posts: BlogPostProps[];
    featured: BlogPostProps;
    totalPages: number;
  }>({
    queryKey: ['/api/blog', { category, searchQuery, page: currentPage }],
  });

  const { data: categories } = useQuery<{id: string, name: string, slug: string}[]>({
    queryKey: ['/api/blog/categories'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const renderBlogSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="bg-neutral-light rounded-lg overflow-hidden shadow-md">
          <Skeleton className="w-full h-48" />
          <div className="p-4">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex items-center">
              <Skeleton className="h-6 w-6 rounded-full mr-2" />
              <Skeleton className="h-3 w-20 mr-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderFeaturedSkeleton = () => (
    <div className="bg-neutral-light rounded-lg overflow-hidden shadow-md mb-10">
      <div className="flex flex-col md:flex-row h-full">
        <div className="md:w-1/2">
          <Skeleton className="w-full h-48 md:h-80" />
        </div>
        <div className="md:w-1/2 p-6 flex flex-col">
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-7 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex items-center mt-auto">
            <Skeleton className="h-8 w-8 rounded-full mr-2" />
            <Skeleton className="h-4 w-24 mr-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <HeroSection 
        backgroundImage="https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        title="Adventure Blog"
        subtitle="Tips, guides, and stories for outdoor enthusiasts"
        primaryButton={{ text: "Latest Articles", href: "#articles" }}
      />
      
      <section className="py-16" id="articles">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/4">
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
                <div className="flex-1">
                  <Label htmlFor="search" className="block text-sm font-medium mb-1">
                    Search Articles
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
            <>
              {renderFeaturedSkeleton()}
              {renderBlogSkeleton()}
            </>
          ) : error ? (
            <div className="text-center text-destructive">
              <p>Failed to load blog posts. Please try again later.</p>
            </div>
          ) : (
            <>
              {data?.featured && (
                <BlogCard 
                  {...data.featured}
                  featured={true}
                  className="mb-10"
                />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.posts.map((post) => (
                  <BlogCard key={post.id} {...post} />
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

              {data?.posts.length === 0 && (
                <div className="text-center p-10">
                  <h3 className="text-xl font-medium mb-2">No Posts Found</h3>
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

export default Blog;
