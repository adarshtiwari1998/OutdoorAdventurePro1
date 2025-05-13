import { useQuery } from "@tanstack/react-query";
import ActivityCard, { ActivityProps } from "@/components/common/ActivityCard";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedActivities = () => {
  const { data: activities, isLoading, error } = useQuery<ActivityProps[]>({
    queryKey: ['/api/activities/featured'],
  });

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="rounded-lg overflow-hidden shadow-md bg-white">
        <div className="h-48">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="p-5">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    ));
  };

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-destructive">Failed to load featured activities. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading font-bold text-2xl md:text-3xl">Featured Activities</h2>
          <Link href="/activities" className="text-primary hover:text-primary-dark font-medium flex items-center">
            View All
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            renderSkeletons()
          ) : (
            activities?.map((activity) => (
              <ActivityCard key={activity.id} {...activity} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedActivities;
