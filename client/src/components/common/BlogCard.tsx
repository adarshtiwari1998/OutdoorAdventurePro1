import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export interface BlogPostProps {
  id: string;
  title: string;
  excerpt: string;
  featuredImage: string;
  category: {
    name: string;
    slug: string;
  };
  author: {
    name: string;
    avatar: string;
  };
  publishedAt: string;
  slug: string;
  featured?: boolean;
}

const BlogCard = ({
  title,
  excerpt,
  featuredImage,
  category,
  author,
  publishedAt,
  slug,
  featured = false
}: BlogPostProps) => {
  const date = new Date(publishedAt);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  
  if (featured) {
    return (
      <Card className="bg-neutral-light rounded-lg overflow-hidden shadow-md">
        <div className="flex flex-col md:flex-row h-full">
          <div className="md:w-1/2">
            <img 
              src={featuredImage || "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"}
              alt={title} 
              className="w-full h-48 md:h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80";
              }}
            />
          </div>
          <div className="md:w-1/2 p-6 flex flex-col">
            <div className="mb-2">
              <Badge variant="outline" className="bg-primary bg-opacity-20 text-primary">
                {category.name}
              </Badge>
            </div>
            <Link href={`/blog/${slug}`}>
              <h3 className="font-heading font-bold text-xl mb-2 hover:text-primary transition-colors">{title}</h3>
            </Link>
            <p className="text-neutral-dark mb-4 flex-grow">{excerpt}</p>
            <div className="flex items-center text-sm text-neutral-dark">
              <Avatar className="w-8 h-8 mr-2">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{author.name}</span>
              <span className="mx-2">•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="bg-neutral-light rounded-lg overflow-hidden shadow-md h-full">
      <img 
        src={featuredImage || "https://images.unsplash.com/photo-1543039625-14cbd3802e7d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
        alt={title} 
        className="w-full h-48 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = "https://images.unsplash.com/photo-1543039625-14cbd3802e7d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
        }}
      />
      <CardContent className="p-4">
        <div className="mb-2">
          <Badge variant="outline" className="bg-primary bg-opacity-20 text-primary">
            {category.name}
          </Badge>
        </div>
        <Link href={`/blog/${slug}`}>
          <h3 className="font-heading font-bold text-lg mb-2 hover:text-primary transition-colors">{title}</h3>
        </Link>
        <p className="text-neutral-dark text-sm mb-4 line-clamp-3">{excerpt}</p>
        <div className="flex items-center text-xs text-neutral-dark">
          <Avatar className="w-6 h-6 mr-2">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{author.name}</span>
          <span className="mx-2">•</span>
          <span>{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCard;
