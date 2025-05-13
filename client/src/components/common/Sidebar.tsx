import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

// Define data types based on schema
interface SidebarItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string | null;
  order: number;
}

interface SidebarConfig {
  id: number;
  title: string;
  description: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface SidebarItemData extends SidebarItem {
  // Include any additional fields we need
}

interface SidebarConfigWithItems extends SidebarConfig {
  items: SidebarItemData[];
}

interface SidebarProps {
  category: string;
  className?: string;
}

const Sidebar = ({ category, className = "" }: SidebarProps) => {
  // Fetch sidebar config for the specified category
  const { data: sidebarConfig, isLoading, error } = useQuery<SidebarConfigWithItems>({
    queryKey: [`/api/sidebar-configs/${category}`],
  });

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Error Loading Sidebar</CardTitle>
            <CardDescription>
              Unable to load sidebar content for this category. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!sidebarConfig) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>
              No sidebar content available for this category.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>{sidebarConfig.title}</CardTitle>
          {sidebarConfig.description && (
            <CardDescription>{sidebarConfig.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {sidebarConfig.items.map((item) => (
            <div key={item.id} className="space-y-2">
              <h3 className="font-medium text-lg">{item.title}</h3>
              
              {item.imageUrl && (
                <div className="rounded-md overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">{item.content}</p>
              
              {item.linkUrl && item.linkText && (
                <div className="pt-1">
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href={item.linkUrl}>
                      {item.linkText} <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
              
              {item !== sidebarConfig.items[sidebarConfig.items.length - 1] && (
                <hr className="my-3" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;