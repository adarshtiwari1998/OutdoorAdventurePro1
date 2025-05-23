import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { PlusCircle, MoveUp, MoveDown, Pencil, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  image: z.string().url("Image must be a valid URL"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string(),
  category: z.string().min(2, "Category must be at least 2 characters"),
});

const TravelersChoice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChoice, setEditingChoice] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      image: "",
      slug: "",
      description: "",
      category: ""
    },
  });

  const { data: choices, isLoading } = useQuery({
    queryKey: ['/api/travelers-choice'],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/admin/travelers-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create choice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/travelers-choice']);
      toast({ title: "Choice created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/admin/travelers-choice/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update choice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/travelers-choice']);
      toast({ title: "Choice updated successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/travelers-choice/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete choice');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/travelers-choice']);
      toast({ title: "Choice deleted successfully" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }) => {
      const response = await fetch(`/api/admin/travelers-choice/${id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder choice');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travelers-choice'] });
      toast({ title: "Order updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update order",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data) => {
    if (editingChoice) {
      updateMutation.mutate({ id: editingChoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Travelers' Choice</h1>
        <Button onClick={() => {
          setEditingChoice(null);
          form.reset({
            title: "",
            image: "",
            slug: "",
            description: "",
            category: ""
          });
          setIsDialogOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Choices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {choices?.map((choice, index) => (
                <TableRow key={choice.id}>
                  <TableCell>
                    <img src={choice.image} alt={choice.title} className="w-16 h-16 rounded-full object-cover" />
                  </TableCell>
                  <TableCell>{choice.title}</TableCell>
                  <TableCell>{choice.category}</TableCell>
                  <TableCell>{choice.order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {index > 0 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: choice.id, direction: 'up' })}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                      )}
                      {index < choices.length - 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: choice.id, direction: 'down' })}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingChoice(choice);
                          form.reset(choice);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteMutation.mutate(choice.id)}
                      >
                        <Trash className="h-4 w-4" />
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
              {editingChoice ? "Edit Choice" : "Add New Choice"}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
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
              <DialogFooter>
                <Button type="submit">
                  {editingChoice ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TravelersChoice;
