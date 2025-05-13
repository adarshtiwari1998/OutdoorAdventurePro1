import React, { useState } from 'react';
import { Link } from 'wouter';
import { ChevronDownIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Define the activity type
interface Activity {
  id: number;
  category: string;
  logoSrc: string;
  logoText: string;
  primaryColor: string;
}

const ActivitySelector = () => {
  const [open, setOpen] = useState(false);
  
  // Fetch all category headers
  const { data: headerConfigs, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/admin/header-configs'],
    select: (data) => data.filter(config => config.category !== 'home'), // Exclude home category
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="flex justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="border-dashed border-2 border-gray-300 hover:border-gray-500 flex items-center gap-2"
          >
            Switch Activity
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-4">
            <h3 className="font-medium text-center text-lg border-b pb-2">Explore More Activities</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {headerConfigs?.map((activity) => (
                  <Link 
                    key={activity.id} 
                    href={`/${activity.category}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={activity.logoSrc} 
                        alt={activity.logoText} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate font-medium" style={{ color: activity.primaryColor }}>
                      {activity.logoText}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="pt-2 border-t text-center">
              <Link 
                href="/"
                onClick={() => setOpen(false)}
                className="text-sm text-primary hover:text-primary-dark"
              >
                Return to Main Page
              </Link>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ActivitySelector;