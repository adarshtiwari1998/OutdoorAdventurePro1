import { useState } from "react";
import { Editor } from '@tinymce/tinymce-react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Edit, Trash2, Plus, Filter, Search, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Schemas
const blogPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().min(5, "Excerpt must be at least 5 characters"),
  categoryId: z.string(),
  featuredImage: z.string().url("Must be a valid URL"),
  status: z.enum(["draft", "published", "scheduled"]),
  scheduledDate: z.string().optional(),
  tags: z.string().optional()
});

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  featuredImage: string;
  category: {
    id: string;
    name: string;
  };
  status: "draft" | "published" | "scheduled";
  publishedAt: string;
  author: {
    name: string;
    avatar: string;
  };
  tags: string[];
};

const BlogManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Queries
  const { data: postsData, isLoading } = useQuery<{
    posts: BlogPost[];
    totalPages: number;
  }>({
    queryKey: ['/api/admin/blog/posts', { page: currentPage, status: statusFilter, category: categoryFilter, search: searchQuery }],
  });

  const { data: categories } = useQuery<{id: number, name: string, slug: string, type: string}[]>({
    queryKey: ['/api/admin/blog/categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/blog/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data;
    }
  });

  // Form setup for create/edit post
  const form = useForm<z.infer<typeof blogPostSchema>>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      categoryId: "",
      featuredImage: "",
      status: "draft",
      tags: ""
    }
  });

  // WordPress import form
  const importForm = useForm({
    defaultValues: {
      wordpressUrl: "",
      username: "",
      password: "",
      postsCount: 10
    },
    validate: {
      wordpressUrl: (value) => {
        if (!value) return "WordPress URL is required";
        try {
          new URL(value);
          return true;
        } catch {
          return "Please enter a valid URL";
        }
      },
      username: (value) => value ? true : "WordPress username is required",
      password: (value) => value ? true : "WordPress application password is required",
    }
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: async (values: z.infer<typeof blogPostSchema>) => {
      return apiRequest('POST', '/api/admin/blog/posts', values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create blog post: ${error}`,
        variant: "destructive",
      });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string, values: z.infer<typeof blogPostSchema> }) => {
      return apiRequest('PATCH', `/api/admin/blog/posts/${id}`, values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      form.reset();
      setIsEditDialogOpen(false);
      setEditingPost(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update blog post: ${error}`,
        variant: "destructive",
      });
    }
  });

  const deletePostsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiRequest('DELETE', '/api/admin/blog/posts', { ids });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog posts deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      setSelectedPosts([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete blog posts: ${error}`,
        variant: "destructive",
      });
    }
  });

  const importFromWordPressMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest('POST', '/api/admin/blog/import/wordpress', values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog posts imported successfully from WordPress",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      importForm.reset();
      setIsImportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to import from WordPress: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Event handlers
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleSelectAllPosts = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPosts(postsData?.posts.map(post => post.id) || []);
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (id: string) => {
    if (selectedPosts.includes(id)) {
      setSelectedPosts(selectedPosts.filter(postId => postId !== id));
    } else {
      setSelectedPosts([...selectedPosts, id]);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      content: post.content || '',
      excerpt: post.excerpt,
      categoryId: post.category.id,
      featuredImage: post.featuredImage,
      status: post.status,
      tags: post.tags.join(", ")
    });
    setIsEditDialogOpen(true);
  };

  const onCreateSubmit = (values: z.infer<typeof blogPostSchema>) => {
    createPostMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof blogPostSchema>) => {
    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, values });
    }
  };

  const onImportSubmit = (values: any) => {
    importFromWordPressMutation.mutate(values);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold">Blog Management</h1>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            if (open) {
              form.reset({
                title: "",
                content: "",
                excerpt: "",
                categoryId: "",
                featuredImage: "",
                status: "draft",
                tags: ""
              });
            }
            setIsCreateDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1" size={16} /> New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Blog Post</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new blog post.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Post title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => {
                      const [excerptViewMode, setExcerptViewMode] = useState<'code' | 'preview'>('code');
                      return (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel>Excerpt</FormLabel>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={excerptViewMode === 'code' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setExcerptViewMode('code')}
                              >
                                Code
                              </Button>
                              <Button
                                type="button"
                                variant={excerptViewMode === 'preview' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setExcerptViewMode('preview')}
                              >
                                Preview
                              </Button>
                            </div>
                          </div>
                          <FormControl>
                            <div className="space-y-4">
                              <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="border rounded-lg">
                                {excerptViewMode === 'code' ? (
                                  <Textarea 
                                    placeholder="Short excerpt of the post" 
                                    {...field} 
                                    rows={4}
                                    className="border-none focus:ring-0"
                                  />
                                ) : (
                                  <div 
                                    className="p-4 bg-white prose dark:prose-invert max-w-none" 
                                    contentEditable={true}
                                    onBlur={(e) => field.onChange(e.currentTarget.textContent)}
                                    dangerouslySetInnerHTML={{ __html: field.value || 'No excerpt to preview' }}
                                  />
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => {
                      const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
                      return (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel>Content</FormLabel>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={viewMode === 'code' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('code')}
                              >
                                Code
                              </Button>
                              <Button
                                type="button"
                                variant={viewMode === 'preview' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('preview')}
                              >
                                Preview
                              </Button>
                            </div>
                          </div>
                          <FormControl>
                            <div className="space-y-4">
                              <div style={{ height: '400px', overflowY: 'auto' }}>
                                {viewMode === 'code' ? (
                                  <Textarea 
                                    placeholder="Post content" 
                                    {...field} 
                                    rows={8}
                                    className="font-mono text-sm h-full"
                                  />
                                ) : (
                                  <div className="p-4 border rounded-lg bg-white">
                                    <div dangerouslySetInnerHTML={{ __html: field.value || 'No content to preview' }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="featuredImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="hiking, camping, outdoors" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {form.watch("status") === "scheduled" && (
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={createPostMutation.isPending}>
                      {createPostMutation.isPending ? "Creating..." : "Create Post"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-1" size={16} /> Import from WordPress
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import from WordPress</DialogTitle>
                <DialogDescription>
                  Connect to your WordPress site to import blog posts.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={importForm.handleSubmit(onImportSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wordpressUrl">WordPress URL</Label>
                  <Input 
                    id="wordpressUrl" 
                    placeholder="https://yourblog.wordpress.com" 
                    {...importForm.register("wordpressUrl")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="WordPress username" 
                    {...importForm.register("username")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Application Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="WordPress application password" 
                    {...importForm.register("password")}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Generate this in WordPress under Users profile Application Passwords
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postsCount">Number of Posts</Label>
                  <Input 
                    id="postsCount" 
                    type="number" 
                    defaultValue={10} 
                    {...importForm.register("postsCount", { valueAsNumber: true })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={importFromWordPressMutation.isPending}>
                    {importFromWordPressMutation.isPending ? "Importing..." : "Import Posts"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {selectedPosts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-1" size={16} /> Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Posts</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedPosts.length} selected posts? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletePostsMutation.mutate(selectedPosts)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filter Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSearch} className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/4">
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-1/4">
              <Label htmlFor="categoryFilter">Category</Label>
              <Select 
                value={categoryFilter} 
                onValueChange={handleCategoryFilterChange}
                defaultValue="all"
              >
                <SelectTrigger id="categoryFilter">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input 
                  id="search" 
                  placeholder="Search by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit">
                  <Search size={16} />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          if (checked) {
                            setSelectedPosts(postsData?.posts.map(post => post.id) || []);
                          } else {
                            setSelectedPosts([]);
                          }
                        }
                      }}
                      checked={postsData?.posts.length === selectedPosts.length && postsData?.posts.length > 0}
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell></TableCell>
                      <TableCell><div className="h-5 w-48 bg-neutral-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-16 bg-neutral-200 rounded animate-pulse"></div></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div></TableCell>
                      <TableCell className="text-right"><div className="h-5 w-16 bg-neutral-200 rounded animate-pulse ml-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : postsData?.posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No blog posts found. Try adjusting your filters or create a new post.
                    </TableCell>
                  </TableRow>
                ) : (
                  postsData?.posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedPosts.includes(post.id)}
                          onCheckedChange={() => handleSelectPost(post.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{post.title}</div>
                      </TableCell>
                      <TableCell>{post.category.name}</TableCell>
                      <TableCell>{post.author.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={
                          post.status === 'published' ? 'default' : 
                          post.status === 'draft' ? 'secondary' : 
                          'outline'
                        }>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{post.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePostsMutation.mutate([post.id])}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {postsData && postsData.totalPages > 1 && (
            <div className="flex items-center justify-center py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: postsData.totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, postsData.totalPages))}
                      className={currentPage === postsData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Edit the details of your blog post.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => {
                  const [excerptViewMode, setExcerptViewMode] = useState<'code' | 'preview'>('code');
                  return (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Excerpt</FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={excerptViewMode === 'code' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setExcerptViewMode('code')}
                          >
                            Code
                          </Button>
                          <Button
                            type="button"
                            variant={excerptViewMode === 'preview' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setExcerptViewMode('preview')}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <div className="space-y-4">
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="border rounded-lg">
                            {excerptViewMode === 'code' ? (
                              <Textarea 
                                placeholder="Short excerpt of the post" 
                                {...field} 
                                rows={4}
                                className="border-none focus:ring-0"
                              />
                            ) : (
                              <div 
                                className="p-4 bg-white prose dark:prose-invert max-w-none" 
                                contentEditable={true}
                                onBlur={(e) => field.onChange(e.currentTarget.textContent)}
                                dangerouslySetInnerHTML={{ __html: field.value || 'No excerpt to preview' }}
                              />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => {
                  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
                  return (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Content</FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={viewMode === 'code' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('code')}
                          >
                            Code
                          </Button>
                          <Button
                            type="button"
                            variant={viewMode === 'preview' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('preview')}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <div className="space-y-4">
                          <div style={{ minHeight: '400px' }}>
                            {viewMode === 'code' ? (
                              <Editor
                               apiKey='g9qza7skbocuxy9nfma4k6pdgd6vb76ljq5f7ymp1mt1tf75'
                                init={{
                                  height: 400,
                                  menubar: true,
                                  branding: false,
                                  promotion: false,
                                   plugins: [
          // Core editing features
          'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
          // Your account includes a free trial of TinyMCE premium features
          // Try the most popular premium features until May 29, 2025:
          'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'editimage', 'advtemplate', 'ai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown','importword', 'exportword', 'exportpdf'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
        tinycomments_mode: 'embedded',
        tinycomments_author: 'Author name',
                                }}
                                value={field.value}
                                onEditorChange={(content) => field.onChange(content)}
                            
                              />
                            ) : (
                              <div className="p-4 border rounded-lg bg-white prose dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: field.value || 'No content to preview' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="hiking, camping, outdoors" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {form.watch("status") === "scheduled" && (
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="submit" disabled={updatePostMutation.isPending}>
                  {updatePostMutation.isPending ? "Updating..." : "Update Post"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for label
const Label = ({ htmlFor, children, className = "" }: { htmlFor: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-neutral-dark mb-1 ${className}`}>
    {children}
  </label>
);

// Helper component for badge
const Badge = ({ variant, children }: { variant: "default" | "secondary" | "outline", children: React.ReactNode }) => {
  const variantClasses = {
    default: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    outline: "bg-transparent border border-neutral-dark text-neutral-dark"
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

export default BlogManagement;