import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "@/components/layout/MainLayout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Outdoors from "@/pages/outdoors";
import Cruising from "@/pages/cruising";
import Fishing from "@/pages/fishing";
import Hiking from "@/pages/hiking";
import Camping from "@/pages/camping";
import FourXFour from "@/pages/four-x-four";
import Blog from "@/pages/blog";
import Shop from "@/pages/shop";
import AdminDashboard from "@/pages/admin/dashboard";
import BlogManagement from "@/pages/admin/blog-management";
import YoutubeImport from "@/pages/admin/youtube-import";
import CategoryHeaders from "@/pages/admin/category-headers";
import HeaderMenus from "@/pages/admin/header-menus";
import SidebarConfigs from "@/pages/admin/sidebar-configs";
import CategoryColors from "@/pages/admin/category-colors";
import FontFamilies from "@/pages/admin/font-families";
import Sliders from "@/pages/admin/sliders";
import LandingPageStyle from "@/pages/admin/styles/landing-page-style";
import AdminAuth from "@/pages/admin/auth";
import Profile from "@/pages/admin/profile";
import Settings from "@/pages/admin/settings";
import FavoriteDestinations from "@/pages/admin/home-blocks/favorite-destinations";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeManager";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ReactNode, useEffect, useState } from "react";
import TravelersChoice from "./components/sections/TravelersChoice";
// No need to import QueryClient or QueryClientProvider here as they are used in main.tsx

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/outdoors" component={Outdoors} />
      <Route path="/cruising" component={Cruising} />
      <Route path="/fishing" component={Fishing} />
      <Route path="/hiking" component={Hiking} />
      <Route path="/camping" component={Camping} />
      <Route path="/four-x-four" component={FourXFour} />
      <Route path="/blog" component={Blog} />
      <Route path="/shop" component={Shop} />

      {/* Authentication route */}
      <Route path="/auth" component={AdminAuth} />

      {/* Protected admin routes */}
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/admin/blog-management" component={BlogManagement} />
      <ProtectedRoute path="/admin/youtube-import" component={YoutubeImport} />
      <ProtectedRoute path="/admin/category-headers" component={CategoryHeaders} />
      <ProtectedRoute path="/admin/header-menus" component={HeaderMenus} />
      <ProtectedRoute path="/admin/sidebar-configs" component={SidebarConfigs} />
      <ProtectedRoute path="/admin/category-colors" component={CategoryColors} />
      <ProtectedRoute path="/admin/font-families" component={FontFamilies} />
      <ProtectedRoute path="/admin/sliders" component={Sliders} />
      <ProtectedRoute path="/admin/profile" component={Profile} />
      <ProtectedRoute path="/admin/settings" component={Settings} />
      <ProtectedRoute path="/admin/home-blocks/favorite-destinations" component={FavoriteDestinations} />

      <ProtectedRoute path="/admin/home-blocks/travelers-choices" component={TravelersChoice} />
      {/* Landing page style routes */}
      <ProtectedRoute path="/admin/styles/home" component={LandingPageStyle} />
      <ProtectedRoute path="/admin/styles/outdoors" component={LandingPageStyle} />
      <ProtectedRoute path="/admin/styles/cruising" component={LandingPageStyle} />
      <ProtectedRoute path="/admin/styles/fishing" component={LandingPageStyle} />
      <ProtectedRoute path="/admin/styles/hiking" component={LandingPageStyle} />
      <ProtectedRoute path="/admin/styles/camping" component={LandingPageStyle} />
      <ProtectedRoute path="/admin/styles/four-x-four" component={LandingPageStyle} />

      <Route component={NotFound} />
    </Switch>
  );
}

// AppLayout component to conditionally render layouts based on route
function AppLayout({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(window.location.pathname);

  // Update pathname when location changes
  useEffect(() => {
    const handleRouteChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);

    // Also listen for clicks on Link components since wouter doesn't trigger popstate
    const handleClick = () => {
      // Delay to ensure the URL has been updated
      setTimeout(() => {
        setPathname(window.location.pathname);
      }, 0);
    };

    document.addEventListener('click', handleClick);

    // Clean up
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Check if the current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin');

  // Don't apply any layout for the auth page
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  // Skip MainLayout for admin routes to avoid the header
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Apply MainLayout for all other routes
  return <MainLayout>{children}</MainLayout>;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GlobalThemeProvider>
          <AppLayout>
            <Router />
          </AppLayout>
          <Toaster />
        </GlobalThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;