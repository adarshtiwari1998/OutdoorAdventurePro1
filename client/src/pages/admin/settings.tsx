import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Settings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const saveSettings = () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the admin dashboard looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-mode">Dark Mode</Label>
                  <Switch id="theme-mode" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for the admin interface.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <Label>Sidebar Width</Label>
                <div className="px-1">
                  <Slider defaultValue={[64]} max={100} step={1} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Adjust the width of the sidebar.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="dense-mode" />
                  <Label htmlFor="dense-mode">Dense Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Use compact spacing throughout the interface.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="animations" defaultChecked />
                  <Label htmlFor="animations">Enable Animations</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Show animations for UI transitions.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Preferences</CardTitle>
              <CardDescription>
                Configure your dashboard experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Widgets to Display</Label>
                <div className="grid gap-2 mt-2">
                  {["Revenue Stats", "Blog Metrics", "Recent Posts", "Traffic Overview", "Popular Content"].map((widget) => (
                    <div key={widget} className="flex items-center space-x-2">
                      <Checkbox id={`widget-${widget}`} defaultChecked />
                      <Label htmlFor={`widget-${widget}`}>{widget}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-refresh">Auto-refresh Dashboard</Label>
                  <Switch id="auto-refresh" defaultChecked />
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh dashboard data every few minutes.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced features and options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="developer-mode">Developer Mode</Label>
                  <Switch id="developer-mode" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable additional debugging tools and information.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-logging">API Request Logging</Label>
                  <Switch id="api-logging" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Log API requests for debugging purposes.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="experimental" />
                  <Label htmlFor="experimental">Enable Experimental Features</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Try out features that are still in development.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}