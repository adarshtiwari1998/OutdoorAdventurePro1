import { useQuery } from "@tanstack/react-query";
import TestimonialCard, { TestimonialProps } from "@/components/common/TestimonialCard";
import { Skeleton } from "@/components/ui/skeleton";

const TestimonialSection = () => {
  const { data: testimonials, isLoading, error } = useQuery<TestimonialProps[]>({
    queryKey: ['/api/testimonials'],
  });

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-4/5 mb-4" />
        <div className="flex items-center justify-center">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    ));
  };

  if (error) {
    return (
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="text-center">
            <p>Failed to load testimonials. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2">What Adventurers Say</h2>
        <p className="max-w-2xl mx-auto mb-10">Hear from our community of outdoor enthusiasts who have explored with us.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            renderSkeletons()
          ) : (
            testimonials?.map((testimonial) => (
              <TestimonialCard key={testimonial.id} {...testimonial} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
