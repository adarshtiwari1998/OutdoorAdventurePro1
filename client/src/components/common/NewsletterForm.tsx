import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NewsletterForm = () => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/newsletter/subscribe", {
        fullName,
        email,
        interests,
      });
      
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter",
      });
      
      // Reset form
      setFullName("");
      setEmail("");
      setInterests("all");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="fullname" className="block text-sm font-medium text-neutral-dark mb-1">Full Name</Label>
        <Input 
          type="text" 
          id="fullname" 
          placeholder="Your full name" 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-neutral-dark mb-1">Email Address</Label>
        <Input 
          type="email" 
          id="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="interests" className="block text-sm font-medium text-neutral-dark mb-1">Interests</Label>
        <Select value={interests} onValueChange={setInterests}>
          <SelectTrigger id="interests">
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
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-md transition"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Subscribing..." : "Subscribe Now"}
      </Button>
    </form>
  );
};

export default NewsletterForm;
