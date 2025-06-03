import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ThemeButton } from "@/components/ui/theme-button";
import { 
  Home, 
  FileText, 
  Video, 
  SlidersHorizontal, 
  Settings, 
  Type, 
  Menu, 
  User, 
  LogOut,
  Star,
  Compass,
  ChevronDown,
  Palette,
  Upload
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";

interface AdminMenuItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
}

const AdminMenuItem = ({ icon: Icon, label, href, isActive }: AdminMenuItemProps) => {
  return (
    <Link href={href}>
      <a className={cn(
        "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" 
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      )}>
        <Icon size={18} />
        <span>{label}</span>
      </a>
    </Link>
  );
};

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch active dashboard assets with more frequent updates
  const { data: assets } = useQuery({
    queryKey: ['/api/admin/dashboard-assets'],
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true, // Always refetch on mount
  });

  // Get active logo and favicon
  const activeLogo = assets?.find((asset: any) => asset.type === 'logo' && asset.isActive);
  const activeFavicon = assets?.find((asset: any) => asset.type === 'favicon' && asset.isActive);

  // Update favicon dynamically
  useEffect(() => {
    if (activeFavicon) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());

      // Add new favicon
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/x-icon';
      faviconLink.href = activeFavicon.url;
      document.head.appendChild(faviconLink);

      // Also add apple-touch-icon for better mobile support
      const appleTouchLink = document.createElement('link');
      appleTouchLink.rel = 'apple-touch-icon';
      appleTouchLink.href = activeFavicon.url;
      document.head.appendChild(appleTouchLink);
    }
  }, [activeFavicon]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account",
        });
        navigate("/auth");
      }
    });
  };

    const getLinkClasses = (path: string) => {
        return cn(
            "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location === path
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        );
    };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 admin-layout-container">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <ThemeButton
            variant="outline"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Menu size={20} />
          </ThemeButton>
        </div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0 p-4",
        isMobile ? "fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out" : "",
        isMobile && !showSidebar ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="mb-6 relative">
            <div className="flex items-center gap-3">
              {activeLogo ? (
                <img 
                  src={activeLogo.url} 
                  alt={activeLogo.name || "Admin Logo"} 
                  className="h-16 w-auto max-w-[180px]" 
                  key={activeLogo.url} // Force re-render when URL changes
                  onError={(e) => {
                    console.warn(`Failed to load logo: ${activeLogo.url}`);
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const div = document.createElement('div');
                      div.className = "h-16 w-16 bg-blue-600 rounded flex items-center justify-center text-white text-lg font-bold";
                      div.textContent = "OA";
                      parent.replaceChild(div, e.currentTarget);
                    }
                  }} 
                />
              ) : (
                <div className="h-16 w-16 bg-blue-600 rounded flex items-center justify-center text-white text-lg font-bold">
                  OA
                </div>
              )}
              <span className="text-base text-slate-700 dark:text-slate-300 font-semibold">
                admin
              </span>
            </div>
          </div>

          <nav className="space-y-6 flex-1">
            {/* Dashboard */}
            <div>
              <AdminMenuItem
                icon={Home}
                label="Dashboard"
                href="/admin/dashboard"
                isActive={location === '/admin/dashboard'}
              />
            </div>

            {/* Content Management */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Content Management
              </h3>
              <div className="space-y-1">
                <AdminMenuItem
                  icon={FileText}
                  label="Blog Management"
                  href="/admin/blog-management"
                  isActive={location === '/admin/blog-management'}
                />
                <AdminMenuItem
                  icon={Video}
                  label="YouTube Import"
                  href="/admin/youtube-import"
                  isActive={location === '/admin/youtube-import'}
                />
                <AdminMenuItem
                  icon={SlidersHorizontal}
                  label="Sliders"
                  href="/admin/sliders"
                  isActive={location === '/admin/sliders'}
                />
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Navigation
              </h3>
              <div className="space-y-1">
                <AdminMenuItem
                  icon={Upload}
                  label="Dashboard Assets"
                  href="/admin/dashboard-assets"
                  isActive={location === '/admin/dashboard-assets'}
                />
                <AdminMenuItem
                  icon={Settings}
                  label="Category Headers"
                  href="/admin/category-headers"
                  isActive={location === '/admin/category-headers'}
                />
                <AdminMenuItem
                  icon={Menu}
                  label="Header Menus"
                  href="/admin/header-menus"
                  isActive={location === '/admin/header-menus'}
                />
                <AdminMenuItem
                  icon={Settings}
                  label="Sidebar Configs"
                  href="/admin/sidebar-configs"
                  isActive={location === '/admin/sidebar-configs'}
                />
              </div>
            </div>

            {/* Global Design */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Global Design
              </h3>
              <div className="space-y-1">
                <AdminMenuItem
                  icon={Type}
                  label="Font Families"
                  href="/admin/font-families"
                  isActive={location === '/admin/font-families'}
                />
                <AdminMenuItem
                  icon={Palette}
                  label="Category Colors"
                  href="/admin/category-colors"
                  isActive={location === '/admin/category-colors'}
                />
              </div>
            </div>

            {/* Home Page Blocks */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Home Page Blocks
              </h3>
              <div className="space-y-1">
                <AdminMenuItem
                  icon={Compass}
                  label="Favorite Destinations"
                  href="/admin/home-blocks/favorite-destinations"
                  isActive={location === '/admin/home-blocks/favorite-destinations'}
                />
                <AdminMenuItem
                  icon={Star}
                  label="Travelers Choice"
                  href="/admin/home-blocks/travelers-choice"
                  isActive={location === '/admin/home-blocks/travelers-choice'}
                />
                <AdminMenuItem
                  icon={Compass}
                  label="Tips Management"
                  href="/admin/home-blocks/tips-management"
                  isActive={location === '/admin/home-blocks/tips-management'}
                />
              </div>
            </div>

            {/* Page Styling */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Page Styling
              </h3>
              <div className="space-y-1">
                <AdminMenuItem
                  icon={Home}
                  label="Home Style"
                  href="/admin/styles/home"
                  isActive={location === '/admin/styles/home'}
                />
                <AdminMenuItem
                  icon={Compass}
                  label="Outdoors Style"
                  href="/admin/styles/outdoors"
                  isActive={location === '/admin/styles/outdoors'}
                />
                <AdminMenuItem
                  icon={Compass}
                  label="Cruising Style"
                  href="/admin/styles/cruising"
                  isActive={location === '/admin/styles/cruising'}
                />
                <AdminMenuItem
                  icon={Compass}
                  label="Fishing Style"
                  href="/admin/styles/fishing"
                  isActive={location === '/admin/styles/fishing'}
                />
                <AdminMenuItem
                  icon={Compass}
                  label="Hiking Style"
                  href="/admin/styles/hiking"
                  isActive={location === '/admin/styles/hiking'}
                />
                <AdminMenuItem
                  icon={Compass}
                  label="Camping Style"
                  href="/admin/styles/camping"
                  isActive={location === '/admin/styles/camping'}
                />
                <AdminMenuItem
                  icon={Compass}
                  label="4x4 Style"
                  href="/admin/styles/four-x-four"
                  isActive={location === '/admin/styles/four-x-four'}
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Account
              </h3>
              <div className="space-y-1">
                <AdminMenuItem
                  icon={User}
                  label="Profile"
                  href="/admin/profile"
                  isActive={location === '/admin/profile'}
                />
                <AdminMenuItem
                  icon={Settings}
                  label="Settings"
                  href="/admin/settings"
                  isActive={location === '/admin/settings'}
                />
              </div>
            </div>
          </nav>

          {/* Back to Website */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link href="/">
              <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Home size={18} />
                <span>Back to Website</span>
              </a>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {activeLogo ? (
              <img 
                src={activeLogo.url} 
                alt={activeLogo.name || "Admin Logo"} 
                className="h-10 w-auto max-w-[120px]" 
                key={activeLogo.url} // Force re-render when URL changes
                onError={(e) => {
                  console.warn(`Failed to load header logo: ${activeLogo.url}`);
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const div = document.createElement('div');
                    div.className = "h-10 w-10 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold";
                    div.textContent = "OA";
                    parent.replaceChild(div, e.currentTarget);
                  }
                }} 
              />
            ) : (
              <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
                OA
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeButton variant="ghost" size="sm" />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:inline-block">
                  {user?.fullName || user?.username || 'Admin'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout confirmation dialog */}
            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be logged out of your admin account and redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} disabled={logoutMutation.isPending}>
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      "Logout"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <main className="flex-1 p-6 admin-content-container admin-layout-main">
          <div className="max-w-full overflow-x-auto">
            {children}
          </div>
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p>© {new Date().getFullYear()} Outdoor Adventures Admin. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <Link href="/terms" className="hover:text-primary">Terms</Link>
              <Link href="/privacy" className="hover:text-primary">Privacy</Link>
              <Link href="/help" className="hover:text-primary">Help</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
export { AdminLayout };