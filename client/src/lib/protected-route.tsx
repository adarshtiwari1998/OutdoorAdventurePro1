import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log("User not authenticated, redirecting to /auth");
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // Check if the user is approved for admin routes
  if (path.startsWith('/admin') && !user.isApproved && !user.isAdmin) {
    console.log("User not approved for admin access");
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <h1 className="text-2xl font-bold mb-4">Access Pending</h1>
          <p className="mb-4">Your account is waiting for administrator approval.</p>
          <p>Please check back later or contact an administrator.</p>
        </div>
      </Route>
    );
  }

  // Apply AdminLayout for admin routes
  if (path.startsWith('/admin')) {
    // Extracting title from path
    let title = 'Dashboard';
    
    // Handle style pages with special formatting
    if (path.startsWith('/admin/styles/')) {
      const category = path.split('/').pop() || 'home';
      const displayNames: Record<string, string> = {
        'home': 'Home',
        'outdoors': 'Outdoors',
        'cruising': 'Cruising',
        'fishing': 'Fishing',
        'hiking': 'Hiking',
        'camping': 'Camping',
        'four-x-four': '4x4 Adventures'
      };
      title = `${displayNames[category] || category} Style Settings`;
    } else {
      const pathTitle = path.split('/').pop() || 'Dashboard';
      title = pathTitle.charAt(0).toUpperCase() + pathTitle.slice(1).replace(/-/g, ' ');
    }
    
    return (
      <Route path={path}>
        {() => (
          <AdminLayout title={title}>
            <Component />
          </AdminLayout>
        )}
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}