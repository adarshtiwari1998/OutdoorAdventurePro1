import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  ArrowRightIcon, 
  ShoppingBag, 
  FileText, 
  Video, 
  Users, 
  TrendingUp, 
  Activity, 
  LayoutIcon,
  Palette
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
// AdminLayout is already applied by ProtectedRoute, no need to import

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
}

const StatCard = ({ title, value, description, icon, trend, loading }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-7 w-20 mb-1" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      <CardDescription className="flex items-center">
        {trend !== undefined && (
          <span className={`mr-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
        {description}
      </CardDescription>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [statsPeriod, setStatsPeriod] = useState<"7d" | "30d" | "90d">("30d");
  
  const { data: stats, isLoading: statsLoading } = useQuery<{
    orders: number;
    revenue: number;
    ordersTrend: number;
    revenueTrend: number;
    blogPosts: number;
    blogPostsTrend: number;
    videos: number;
    videosTrend: number;
    users: number;
    usersTrend: number;
  }>({
    queryKey: ['/api/admin/stats', { period: statsPeriod }],
  });
  
  const { data: chartData, isLoading: chartLoading } = useQuery<{
    sales: { name: string; revenue: number }[];
    traffic: { name: string; users: number }[];
  }>({
    queryKey: ['/api/admin/charts', { period: statsPeriod }],
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Link href="/admin/blog" className="inline-flex items-center text-primary hover:text-primary-dark">
            Manage Blog <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
          <Link href="/admin/youtube-import" className="inline-flex items-center text-primary hover:text-primary-dark">
            YouTube Import <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="30d" className="w-full" onValueChange={(value) => setStatsPeriod(value as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
          </TabsList>
          
          <TabsContent value="7d" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Orders"
                value={stats?.orders || 0}
                description="Orders this period"
                icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.ordersTrend}
                loading={statsLoading}
              />
              <StatCard
                title="Revenue"
                value={`$${stats?.revenue.toLocaleString() || 0}`}
                description="Revenue this period"
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.revenueTrend}
                loading={statsLoading}
              />
              <StatCard
                title="Blog Posts"
                value={stats?.blogPosts || 0}
                description="New blog posts"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.blogPostsTrend}
                loading={statsLoading}
              />
              <StatCard
                title="YouTube Videos"
                value={stats?.videos || 0}
                description="New videos imported"
                icon={<Video className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.videosTrend}
                loading={statsLoading}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="30d" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Orders"
                value={stats?.orders || 0}
                description="Orders this period"
                icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.ordersTrend}
                loading={statsLoading}
              />
              <StatCard
                title="Revenue"
                value={`$${stats?.revenue.toLocaleString() || 0}`}
                description="Revenue this period"
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.revenueTrend}
                loading={statsLoading}
              />
              <StatCard
                title="Blog Posts"
                value={stats?.blogPosts || 0}
                description="New blog posts"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.blogPostsTrend}
                loading={statsLoading}
              />
              <StatCard
                title="YouTube Videos"
                value={stats?.videos || 0}
                description="New videos imported"
                icon={<Video className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.videosTrend}
                loading={statsLoading}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="90d" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Orders"
                value={stats?.orders || 0}
                description="Orders this period"
                icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.ordersTrend}
                loading={statsLoading}
              />
              <StatCard
                title="Revenue"
                value={`$${stats?.revenue.toLocaleString() || 0}`}
                description="Revenue this period"
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.revenueTrend}
                loading={statsLoading}
              />
              <StatCard
                title="Blog Posts"
                value={stats?.blogPosts || 0}
                description="New blog posts"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.blogPostsTrend}
                loading={statsLoading}
              />
              <StatCard
                title="YouTube Videos"
                value={stats?.videos || 0}
                description="New videos imported"
                icon={<Video className="h-4 w-4 text-muted-foreground" />}
                trend={stats?.videosTrend}
                loading={statsLoading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData?.sales || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Website Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData?.traffic || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Visitors']} />
                  <Bar dataKey="users" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start">
                  <Activity className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium">New blog post published</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ShoppingBag className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium">10 new orders received</p>
                    <p className="text-sm text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Video className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium">New YouTube video imported</p>
                    <p className="text-sm text-muted-foreground">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium">5 new users registered</p>
                    <p className="text-sm text-muted-foreground">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium">Monthly report generated</p>
                    <p className="text-sm text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/blog-management">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <FileText className="h-5 w-5 mr-3 text-primary" />
                    <span>Manage Blog</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/youtube-import">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <Video className="h-5 w-5 mr-3 text-primary" />
                    <span>YouTube Import</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/header-menus">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <LayoutIcon className="h-5 w-5 mr-3 text-primary" />
                    <span>Header & Menus</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/shop">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <ShoppingBag className="h-5 w-5 mr-3 text-primary" />
                    <span>View Shop</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/blog">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <FileText className="h-5 w-5 mr-3 text-primary" />
                    <span>View Blog</span>
                  </CardContent>
                </Card>
              </Link>

              {/* Landing Page Styles */}
              <Link href="/admin/styles/outdoors">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <Palette className="h-5 w-5 mr-3 text-primary" />
                    <span>Outdoors Style</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/styles/cruising">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <Palette className="h-5 w-5 mr-3 text-primary" />
                    <span>Cruising Style</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/styles/fishing">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <Palette className="h-5 w-5 mr-3 text-primary" />
                    <span>Fishing Style</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/styles/hiking">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <Palette className="h-5 w-5 mr-3 text-primary" />
                    <span>Hiking Style</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/styles/camping">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <Palette className="h-5 w-5 mr-3 text-primary" />
                    <span>Camping Style</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/styles/four-x-four">
                <Card className="cursor-pointer hover:bg-neutral-light transition">
                  <CardContent className="flex items-center p-4">
                    <Palette className="h-5 w-5 mr-3 text-primary" />
                    <span>4x4 Style</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
