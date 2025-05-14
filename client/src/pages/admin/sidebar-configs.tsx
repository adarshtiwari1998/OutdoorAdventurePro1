import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Pencil, Trash2, X, Plus, MoveUp, MoveDown } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertSidebarConfig, SidebarConfig, SidebarItem } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SidebarConfigWithItems extends SidebarConfig {
  items: SidebarItem[];
}

// Form validation schema
const sidebarItemSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  content: z.string().min(5, "Content must be at least 5 characters"),
  imageUrl: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  linkText: z.string().optional().nullable(),
  order: z.number().default(0),
});

const sidebarFormSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  category: z.string().min(2, "Category must be at least 2 characters"),
  description: z.string().optional().nullable(),
  items: z.array(sidebarItemSchema),
});

type SidebarFormValues = z.infer<typeof sidebarFormSchema>;

const SidebarConfigs = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SidebarConfigWithItems | null>(null);
  
  // Fetch all sidebar configurations
  const { data: sidebarConfigs, isLoading, error } = useQuery<SidebarConfigWithItems[]>({
    queryKey: ['/api/admin/sidebar-configs'],
  });
  
  // Form setup for creating a new sidebar configuration
  const createForm = useForm<SidebarFormValues>({
    resolver: zodResolver(sidebarFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      items: [],
    },
  });
  
  // Form setup for editing an existing sidebar configuration
  const editForm = useForm<SidebarFormValues>({
    resolver: zodResolver(sidebarFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      items: [],
    },
  });
  
  // Field array for managing items in the create form
  const { fields: createItems, append: appendCreateItem, remove: removeCreateItem, swap: swapCreateItem } = useFieldArray({
    control: createForm.control,
    name: "items",
  });
  
  // Field array for managing items in the edit form
  const { fields: editItems, append: appendEditItem, remove: removeEditItem, swap: swapEditItem } = useFieldArray({
    control: editForm.control,
    name: "items",
  });
  
  // Handle creating a new sidebar configuration
  const handleCreateConfig = async (data: SidebarFormValues) => {
    try {
      await apiRequest('POST', '/api/admin/sidebar-configs', data);
      
      toast({
        title: "Sidebar configuration created",
        description: "The sidebar configuration has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sidebar-configs'] });
      createForm.reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating sidebar config:", error);
      toast({
        title: "Error",
        description: "Failed to create sidebar configuration. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle updating an existing sidebar configuration
  const handleUpdateConfig = async (data: SidebarFormValues) => {
    if (!currentConfig) return;
    
    try {
      await apiRequest('PATCH', `/api/admin/sidebar-configs/${currentConfig.id}`, data);
      
      toast({
        title: "Sidebar configuration updated",
        description: "The sidebar configuration has been updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sidebar-configs'] });
      editForm.reset();
      setIsEditDialogOpen(false);
      setCurrentConfig(null);
    } catch (error) {
      console.error("Error updating sidebar config:", error);
      toast({
        title: "Error",
        description: "Failed to update sidebar configuration. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle deleting a sidebar configuration
  const handleDeleteConfig = async () => {
    if (!currentConfig) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/sidebar-configs/${currentConfig.id}`);
      
      toast({
        title: "Sidebar configuration deleted",
        description: "The sidebar configuration has been deleted successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sidebar-configs'] });
      setIsDeleteDialogOpen(false);
      setCurrentConfig(null);
    } catch (error) {
      console.error("Error deleting sidebar config:", error);
      toast({
        title: "Error",
        description: "Failed to delete sidebar configuration. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Open the edit dialog and populate the form with the current configuration
  const openEditDialog = (config: SidebarConfigWithItems) => {
    setCurrentConfig(config);
    editForm.reset({
      id: config.id,
      title: config.title,
      category: config.category,
      description: config.description || "",
      items: config.items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || "",
        linkUrl: item.linkUrl || "",
        linkText: item.linkText || "",
        order: item.order,
      })),
    });
    setIsEditDialogOpen(true);
  };
  
  // Open the delete confirmation dialog
  const openDeleteDialog = (config: SidebarConfigWithItems) => {
    setCurrentConfig(config);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Sidebar Configurations</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Sidebar Configurations</CardTitle>
          <CardDescription>
            Create and manage sidebar configurations for different landing pages. Each category can have its own sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="text-center p-4 text-destructive">
              Failed to load sidebar configurations. Please try again.
            </div>
          ) : sidebarConfigs && sidebarConfigs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sidebarConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.title}</TableCell>
                    <TableCell>{config.category}</TableCell>
                    <TableCell>{config.items.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => openEditDialog(config)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-destructive" 
                          onClick={() => openDeleteDialog(config)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p>No sidebar configurations found. Create your first one!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Sidebar Configuration Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sidebar Configuration</DialogTitle>
            <DialogDescription>
              Add a new sidebar configuration for a landing page category.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateConfig)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Hiking Resources" {...field} />
                      </FormControl>
                      <FormDescription>
                        The title displayed at the top of the sidebar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hiking">Hiking</SelectItem>
                          <SelectItem value="camping">Camping</SelectItem>
                          <SelectItem value="fishing">Fishing</SelectItem>
                          <SelectItem value="cruising">Cruising</SelectItem>
                          <SelectItem value="outdoors">Outdoors</SelectItem>
                          <SelectItem value="four-x-four">four-x-four</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The landing page category this sidebar will appear on.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional description text shown below the sidebar title" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A short description that appears below the sidebar title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Sidebar Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Sidebar Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendCreateItem({ 
                      title: "", 
                      content: "", 
                      imageUrl: "", 
                      linkUrl: "", 
                      linkText: "", 
                      order: createItems.length 
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
                
                {createItems.length === 0 ? (
                  <div className="text-center p-4 border rounded-md text-muted-foreground">
                    No items added yet. Click the button above to add an item.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {createItems.map((item, index) => (
                      <Card key={item.id}>
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                          <div>
                            <CardTitle className="text-base">Item {index + 1}</CardTitle>
                          </div>
                          <div className="flex gap-2">
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => swapCreateItem(index, index - 1)}
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                            )}
                            {index < createItems.length - 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => swapCreateItem(index, index + 1)}
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeCreateItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={createForm.control}
                              name={`items.${index}.title`}
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
                              control={createForm.control}
                              name={`items.${index}.imageUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={createForm.control}
                            name={`items.${index}.content`}
                            render={({ field }) => (
                              <FormItem className="mt-4">
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={createForm.control}
                              name={`items.${index}.linkUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Link URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={createForm.control}
                              name={`items.${index}.linkText`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Link Text</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="submit">Create Sidebar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Sidebar Configuration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sidebar Configuration</DialogTitle>
            <DialogDescription>
              Update this sidebar configuration.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateConfig)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Hiking Resources" {...field} />
                      </FormControl>
                      <FormDescription>
                        The title displayed at the top of the sidebar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hiking">Hiking</SelectItem>
                          <SelectItem value="camping">Camping</SelectItem>
                          <SelectItem value="fishing">Fishing</SelectItem>
                          <SelectItem value="cruising">Cruising</SelectItem>
                          <SelectItem value="outdoors">Outdoors</SelectItem>
                          <SelectItem value="four-x-four">four-x-four</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The landing page category this sidebar will appear on.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional description text shown below the sidebar title" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A short description that appears below the sidebar title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Sidebar Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Sidebar Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEditItem({ 
                      title: "", 
                      content: "", 
                      imageUrl: "", 
                      linkUrl: "", 
                      linkText: "", 
                      order: editItems.length 
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
                
                {editItems.length === 0 ? (
                  <div className="text-center p-4 border rounded-md text-muted-foreground">
                    No items added yet. Click the button above to add an item.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editItems.map((item, index) => (
                      <Card key={item.id}>
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                          <div>
                            <CardTitle className="text-base">Item {index + 1}</CardTitle>
                          </div>
                          <div className="flex gap-2">
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => swapEditItem(index, index - 1)}
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                            )}
                            {index < editItems.length - 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => swapEditItem(index, index + 1)}
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeEditItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={editForm.control}
                              name={`items.${index}.title`}
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
                              control={editForm.control}
                              name={`items.${index}.imageUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={editForm.control}
                            name={`items.${index}.content`}
                            render={({ field }) => (
                              <FormItem className="mt-4">
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={editForm.control}
                              name={`items.${index}.linkUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Link URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name={`items.${index}.linkText`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Link Text</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="submit">Update Sidebar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              {currentConfig && <span className="font-medium"> "{currentConfig.title}" </span>}
              sidebar configuration and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfig}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SidebarConfigs;