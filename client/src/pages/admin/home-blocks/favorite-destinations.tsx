
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Pencil,
  Trash2,
  MoveUp,
  MoveDown,
} from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  image: z.string().url("Image must be a valid URL"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string(),
  country: z.string(),
});

const FavoriteDestinations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      image: "",
      slug: "",
      description: "",
      country: ""
    },
  });

  const { data: destinations, isLoading } = useQuery({
    queryKey: ['/api/admin/favorite-destinations'],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/admin/favorite-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create destination');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/favorite-destinations']);
      toast({ title: "Destination created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/admin/favorite-destinations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update destination');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/favorite-destinations']);
      toast({ title: "Destination updated successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/favorite-destinations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete destination');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/favorite-destinations']);
      toast({ title: "Destination deleted successfully" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }) => {
      const response = await fetch(`/api/admin/favorite-destinations/${id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      if (!response.ok) throw new Error('Failed to reorder destination');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/favorite-destinations']);
    },
  });

  const onSubmit = (data) => {
    if (editingDestination) {
      updateMutation.mutate({ id: editingDestination.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <AdminLayout title="Favorite Destinations">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Favorite Destinations</h1>
          <Button onClick={() => {
            setEditingDestination(null);
            form.reset();
            setIsDialogOpen(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations?.map((destination, index) => (
                  <TableRow key={destination.id}>
                    <TableCell>
                      <img src={destination.image} alt={destination.title} className="w-16 h-16 rounded-full object-cover" />
                    </TableCell>
                    <TableCell>{destination.title}</TableCell>
                    <TableCell>{destination.order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {index > 0 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => reorderMutation.mutate({ id: destination.id, direction: 'up' })}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                        )}
                        {index < destinations.length - 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => reorderMutation.mutate({ id: destination.id, direction: 'down' })}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingDestination(destination);
                            form.reset({
                              title: destination.title,
                              image: destination.image,
                              slug: destination.slug,
                              description: destination.description,
                              country: destination.country,
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(destination.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDestination ? "Edit Destination" : "Add New Destination"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {editingDestination ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default FavoriteDestinations;
