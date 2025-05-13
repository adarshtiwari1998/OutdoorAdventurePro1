import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface ActivityProps {
  id: string | number;
  title: string;
  description: string;
  image: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    type: string;
    createdAt: string;
  } | string;
  price: number;
  slug: string;
}

const ActivityCard = ({ 
  id,
  title, 
  description, 
  image, 
  category, 
  price,
  slug
}: ActivityProps) => {
  return (
    <Card className="rounded-lg overflow-hidden shadow-md bg-white hover:shadow-lg transition">
      <div className="relative h-48">
        <img 
          src={image}
          alt={title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-white bg-opacity-90 text-primary">
            {typeof category === 'object' && category ? category.name : category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="font-heading font-bold text-xl mb-2">{title}</h3>
        <p className="text-neutral-dark mb-4 line-clamp-3">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-secondary font-bold">
            {price > 0 ? `From $${price}` : 'Free'}
          </span>
          <Link href={`/activities/${slug}`}>
            <button className="bg-primary text-white hover:bg-primary-dark transition px-4 py-2 rounded-full text-sm">
              Learn More
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
