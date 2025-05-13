import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchBoxProps {
  className?: string;
}

const SearchBox = ({ className = "" }: SearchBoxProps) => {
  const [, navigate] = useLocation();
  const [activity, setActivity] = useState("all");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?activity=${activity}&location=${encodeURIComponent(location)}&date=${date}`);
  };

  return (
    <div className={`container mx-auto px-4 relative -mt-16 z-10 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="activity" className="block text-sm font-medium text-neutral-dark mb-1">Activity</Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger id="activity" className="w-full">
                <SelectValue placeholder="All Outdoor Activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outdoor Activities</SelectItem>
                <SelectItem value="hiking">Hiking</SelectItem>
                <SelectItem value="camping">Camping</SelectItem>
                <SelectItem value="fishing">Fishing</SelectItem>
                <SelectItem value="cruising">Cruising</SelectItem>
                <SelectItem value="4x4">4x4 Adventures</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="location" className="block text-sm font-medium text-neutral-dark mb-1">Location</Label>
            <Input 
              type="text" 
              id="location" 
              placeholder="Where do you want to go?" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="date" className="block text-sm font-medium text-neutral-dark mb-1">Date</Label>
            <Input 
              type="date" 
              id="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-md font-medium transition h-[42px]"
            >
              Search
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchBox;
