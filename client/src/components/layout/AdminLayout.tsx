import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LucideIcon, 
  Home, 
  BarChart, 
  FileText, 
  Video, 
  Settings, 
  Menu, 
  Palette,
  LogOut,
  User,
  ChevronDown,
  AlertCircle,
  Loader2,
  Image,
  SlidersHorizontal,
  Type,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { ThemeButton } from "@/components/ui/theme-button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Star } from "lucide-react";

interface AdminMenuItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
}

const AdminMenuItem = ({ icon: Icon, label, href, isActive }: AdminMenuItemProps) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
        isActive 
          ? "bg-[hsl(var(--theme-primary))] text-white hover:bg-[hsl(var(--theme-primary-dark))]" 
          : "text-slate-700 dark:text-slate-300"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
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

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
    { icon: FileText, label: "Blog Management", href: "/admin/blog-management" },
    { icon: Video, label: "YouTube Import", href: "/admin/youtube-import" },
    { icon: SlidersHorizontal, label: "Sliders", href: "/admin/sliders" },
    { icon: Image, label: "Home Blocks", href: "/admin/home-blocks/favorite-destinations" },
    { icon: Settings, label: "Category Headers", href: "/admin/category-headers" },
    { icon: Settings, label: "Header Menus", href: "/admin/header-menus" },
    { icon: Settings, label: "Sidebar Configs", href: "/admin/sidebar-configs" },
    { icon: Settings, label: "Category Colors", href: "/admin/category-colors" },
    { icon: Type, label: "Font Families", href: "/admin/font-families" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
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
          <div className="mb-6">
            <nav className="text-xl font-bold text-[hsl(var(--theme-primary))]">
              Admin Dashboard
            </nav>
          </div>

          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <AdminMenuItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={location.startsWith(item.href)}
              />
            ))}
              <AdminMenuItem
                key="/admin/home-blocks/travelers-choice"
                icon={Star} 
                label="Travelers Choice"
                href="/admin/home-blocks/travelers-choice"
                isActive={location.startsWith("/admin/home-blocks/travelers-choice")}
              />
              <AdminMenuItem
                key="/admin/tips-management"
                icon={Compass}
                label="Tips & Ideas"
                href="/admin/tips-management"
                isActive={location.startsWith("/admin/tips-management")}
              />
          </nav>

          {/* Quick Links Section */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Landing Pages
            </h3>
            <div className="space-y-1">
              <Link 
                href="/outdoors"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                Outdoors
              </Link>
              <Link 
                href="/cruising"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                Cruising
              </Link>
              <Link 
                href="/fishing"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                Fishing
              </Link>
              <Link 
                href="/hiking"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                Hiking
              </Link>
              <Link 
                href="/camping"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                Camping
              </Link>
              <Link 
                href="/four-x-four"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                4x4 Adventures
              </Link>
            </div>
          </div>

          {/* Landing Page Styles */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Landing Page Styles
            </h3>
            <div className="space-y-1">
              <Link 
                href="/admin/styles/home"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Palette size={16} />
                Home Style
              </Link>
              <Link 
                href="/admin/styles/outdoors"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Palette size={16} />
                Outdoors Style
              </Link>
              <Link 
                href="/admin/styles/cruising"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Palette size={16} />
                Cruising Style
              </Link>
              <Link 
                href="/admin/styles/fishing"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Palette size={16} />
                Fishing Style
              </Link>
              <Link 
                href="/admin/styles/hiking"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Palette size={16} />
                Hiking Style
              </Link>
              <Link 
                href="/admin/styles/camping"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Palette size={16} />
                Camping Style
              </Link>
              <Link 
                href="/admin/styles/four-x-four"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Palette size={16} />
                4x4 Style
              </Link>
            </div>
          </div>

          {/* Back to Website Link */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link 
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Home size={18} />
              <span>Back to Website</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <div className="mr-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8" 
                onError={(e) => {
                  // Use a div with styled background instead of placeholder image
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const div = document.createElement('div');
                    div.className = "h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-bold";
                    div.textContent = "OA";
                    parent.replaceChild(div, e.currentTarget);
                  }
                }} 
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeButton variant="ghost" size="sm" />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
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

        <main className="flex-1 p-6">
          {children}
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