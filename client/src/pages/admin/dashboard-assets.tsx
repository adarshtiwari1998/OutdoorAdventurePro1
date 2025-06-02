
import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Upload, Link as LinkIcon, Save, Trash2, Eye, CheckCircle, XCircle, Clock } from "lucide-react";

// URL validation component
const URLStatus = ({ url }: { url: string }) => {
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    const validateURL = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        setStatus('valid');
      } catch {
        // Try with a simple img element test for better CORS handling
        const img = new Image();
        img.onload = () => setStatus('valid');
        img.onerror = () => setStatus('invalid');
        img.src = url;
      }
    };

    validateURL();
  }, [url]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Clock className="w-3 h-3 text-yellow-500 animate-pulse" />;
      case 'valid':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-3 h-3 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Checking...';
      case 'valid':
        return 'Valid';
      case 'invalid':
        return 'Invalid URL';
    }
  };

  return (
    <div className="flex items-center gap-1">
      {getStatusIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </div>
  );
};

interface AdminAsset {
  id: string;
  type: 'logo' | 'favicon';
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DashboardAssetsAdmin = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'logo' | 'favicon'>('logo');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetToDelete, setAssetToDelete] = useState<AdminAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin assets from API with real-time updates
  const { data: assets, isLoading, error } = useQuery<AdminAsset[]>({
    queryKey: ['/api/admin/dashboard-assets'],
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });

  // Upload asset mutation
  const uploadAsset = useMutation({
    mutationFn: async ({ type, name, file, url }: { 
      type: 'logo' | 'favicon', 
      name: string, 
      file?: File, 
      url?: string 
    }) => {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('name', name);
      
      if (file) {
        formData.append('file', file);
        formData.append('uploadMethod', 'file');
      } else if (url) {
        formData.append('url', url);
        formData.append('uploadMethod', 'url');
      }

      const response = await fetch('/api/admin/dashboard-assets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload asset');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-assets'] });
      setAssetUrl('');
      setAssetName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Asset uploaded successfully",
        description: "The asset has been saved to Cloudinary.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading the asset.",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    }
  });

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/dashboard-assets/${id}`);
      return await response.json();
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/admin/dashboard-assets'] });

      // Snapshot the previous value
      const previousAssets = queryClient.getQueryData(['/api/admin/dashboard-assets']);

      // Optimistically update to remove the deleted asset
      queryClient.setQueryData(['/api/admin/dashboard-assets'], (old: AdminAsset[] | undefined) => {
        return old?.filter(asset => asset.id !== id) || [];
      });

      // Return context with the previous data
      return { previousAssets };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(['/api/admin/dashboard-assets'], context.previousAssets);
      }
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the asset.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    },
    onSuccess: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-assets'] });
      toast({
        title: "Asset deleted",
        description: "The asset has been removed from both database and Cloudinary.",
      });
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-assets'] });
    }
  });

  // Set active asset mutation
  const setActiveAsset = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'logo' | 'favicon' }) => {
      const response = await apiRequest('PATCH', `/api/admin/dashboard-assets/${id}/activate`, { type });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-assets'] });
      toast({
        title: "Asset activated",
        description: "The asset is now active.",
      });
    },
    onError: (error) => {
      toast({
        title: "Activation failed",
        description: "There was a problem activating the asset.",
        variant: "destructive",
      });
      console.error("Activation error:", error);
    }
  });

  const handleDeleteClick = (asset: AdminAsset) => {
    setAssetToDelete(asset);
  };

  const confirmDelete = () => {
    if (assetToDelete) {
      deleteAsset.mutate(assetToDelete.id);
      setAssetToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadMethod === 'url') {
      if (!assetUrl || !assetName) {
        toast({
          title: "Missing information",
          description: "Please provide both URL and name.",
          variant: "destructive",
        });
        return;
      }
      
      // For URL uploads, use FormData to match server expectations
      const formData = new FormData();
      formData.append('type', activeTab);
      formData.append('name', assetName);
      formData.append('url', assetUrl);
      formData.append('uploadMethod', 'url');

      fetch('/api/admin/dashboard-assets', {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        return response.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-assets'] });
        setAssetUrl('');
        setAssetName('');
        toast({
          title: "Asset uploaded successfully",
          description: "The asset has been saved to Cloudinary.",
        });
      })
      .catch((error) => {
        toast({
          title: "Upload failed",
          description: "There was a problem uploading the asset.",
          variant: "destructive",
        });
        console.error("Upload error:", error);
      });
    } else {
      const file = fileInputRef.current?.files?.[0];
      if (!file || !assetName) {
        toast({
          title: "Missing information",
          description: "Please select a file and provide a name.",
          variant: "destructive",
        });
        return;
      }
      uploadAsset.mutate({ type: activeTab, name: assetName, file });
    }
  };

  const filteredAssets = assets?.filter(asset => asset.type === activeTab) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-6 w-2/3" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-destructive">
          <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard Assets</h2>
          <p>There was a problem loading the data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">Dashboard Assets Management</h1>
        <p className="text-neutral-dark/70">Manage logos, favicons, and other assets for the admin dashboard.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'logo' | 'favicon')} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="logo">Logos</TabsTrigger>
          <TabsTrigger value="favicon">Favicons</TabsTrigger>
        </TabsList>

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Real-time preview updates every 2 seconds
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-assets'] });
              toast({
                title: "Refreshed",
                description: "Asset list has been refreshed.",
              });
            }}
          >
            Refresh Now
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle>Upload New {activeTab === 'logo' ? 'Logo' : 'Favicon'}</CardTitle>
              <CardDescription>
                Upload a new {activeTab} from your computer or provide a URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="asset-name">Asset Name</Label>
                  <Input
                    id="asset-name"
                    placeholder={`Enter ${activeTab} name`}
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Upload Method</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={uploadMethod === 'url' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('url')}
                      className="flex-1"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMethod === 'file' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('file')}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      File Upload
                    </Button>
                  </div>
                </div>

                {uploadMethod === 'url' ? (
                  <div>
                    <Label htmlFor="asset-url">Image URL</Label>
                    <Input
                      id="asset-url"
                      type="url"
                      placeholder="https://example.com/image.png"
                      value={assetUrl}
                      onChange={(e) => setAssetUrl(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="asset-file">Select File</Label>
                    <Input
                      id="asset-file"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      required
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={uploadAsset.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {uploadAsset.isPending ? "Uploading..." : `Upload ${activeTab}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Assets List */}
          <Card>
            <CardHeader>
              <CardTitle>Existing {activeTab === 'logo' ? 'Logos' : 'Favicons'}</CardTitle>
              <CardDescription>
                Manage your uploaded {activeTab}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAssets.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssets.map((asset) => (
                    <div 
                      key={asset.id} 
                      className={`border rounded-lg p-4 ${asset.isActive ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12">
                            <img 
                              src={asset.url} 
                              alt={asset.name}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.error-placeholder')) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'error-placeholder w-12 h-12 bg-red-100 border border-red-300 rounded flex items-center justify-center text-red-500 text-xs';
                                  errorDiv.textContent = 'Error';
                                  parent.appendChild(errorDiv);
                                }
                              }}
                              onLoad={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                const errorDiv = parent?.querySelector('.error-placeholder');
                                if (errorDiv) {
                                  errorDiv.remove();
                                }
                                target.style.display = 'block';
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium">{asset.name}</h4>
                            {asset.isActive && (
                              <span className="text-xs text-primary font-medium">Active</span>
                            )}
                            <URLStatus url={asset.url} />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(asset.url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!asset.isActive && (
                            <Button
                              size="sm"
                              onClick={() => setActiveAsset.mutate({ id: asset.id, type: activeTab })}
                              disabled={setActiveAsset.isPending}
                            >
                              Set Active
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(asset)}
                            disabled={deleteAsset.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{asset.url}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No {activeTab}s uploaded yet</p>
                  <p className="text-sm">Upload your first {activeTab} to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-neutral-light rounded-lg">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Asset Guidelines</h3>
              <ul className="list-disc list-inside text-sm text-neutral-dark/70 mt-2">
                <li><strong>Logos:</strong> Recommended size 120x40px to 300x100px, PNG or SVG format</li>
                <li><strong>Favicons:</strong> 16x16px, 32x32px, or 64x64px, ICO or PNG format</li>
                <li>All assets are automatically saved to Cloudinary under "AdminDashboard_Assets" folder</li>
                <li>Only one logo and one favicon can be active at a time</li>
                <li>Supported formats: PNG, JPG, JPEG, SVG, ICO</li>
              </ul>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{assetToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteAsset.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAsset.isPending ? "Deleting..." : "Delete Asset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardAssetsAdmin;
