import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AdminAuth() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { loginMutation, registerMutation, user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // If user is already logged in, redirect appropriately
  useEffect(() => {
    if (user) {
      // Check if user is an admin or approved to access admin
      if (user.isAdmin || user.isApproved) {
        navigate("/admin/dashboard");
      } else {
        // Regular users get redirected to the home page
        navigate("/");
      }
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    console.log("Login form submitted with data:", data);
    try {
      loginMutation.mutate(data, {
        onSuccess: (userData) => {
          console.log("Login successful, waiting for session to be established");
          
          // Add a small delay to ensure session cookie is properly set before navigating
          setTimeout(() => {
            console.log("Session should be established now, navigating...");
            
            // Redirect based on user type and approval status
            if (userData.isAdmin || userData.isApproved) {
              toast({
                title: "Login successful",
                description: "Welcome to the admin dashboard!",
                variant: "default",
              });
              navigate("/admin/dashboard");
            } else {
              toast({
                title: "Login successful",
                description: "Your account does not have administrative access yet.",
                variant: "default",
              });
              // Regular users or unapproved users to homepage
              navigate("/");
            }
          }, 500);
        },
        onError: (error) => {
          console.error("Login mutation error:", error);
          toast({
            title: "Login failed",
            description: error.message || "Invalid username or password. Please try again.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Error submitting login form:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    registerMutation.mutate(data, {
      onSuccess: (userData) => {
        // Display approval message for new users
        if (userData.isAdmin) {
          toast({
            title: "Account created successfully",
            description: "Welcome to the admin dashboard!",
            variant: "default",
          });
          
          setTimeout(() => {
            navigate("/admin/dashboard");
          }, 500);
        } else {
          toast({
            title: "Account created successfully",
            description: "Your account is pending approval for administrative access. You can still browse the site as a regular user.",
            duration: 6000,
          });
          
          setTimeout(() => {
            // Navigate to home page with approval pending notification
            navigate("/");
          }, 500);
        }
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.message || "An error occurred during registration. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Account Access</CardTitle>
            <CardDescription>
              Sign in or create your account for Outdoor Adventures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full mb-2" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full" 
                      onClick={async () => {
                        const credentials = {
                          username: "admin",
                          password: "password123"
                        };
                        console.log("Direct login with:", credentials);
                        try {
                          // Use the loginMutation from useAuth which will properly
                          // update the React Query cache
                          loginMutation.mutate(credentials, {
                            onSuccess: (userData) => {
                              console.log("Login successful via mutation:", userData);
                              // Force a refresh of the user query
                              setTimeout(() => {
                                console.log("Session should be established now, navigating...");
                                // Redirect based on user type and approval status
                                if (userData.isAdmin || userData.isApproved) {
                                  toast({
                                    title: "Direct login successful",
                                    description: "Welcome to the admin dashboard!",
                                    variant: "default",
                                  });
                                  navigate("/admin/dashboard");
                                } else {
                                  toast({
                                    title: "Login successful",
                                    description: "Your account does not have administrative access yet.",
                                    variant: "default",
                                  });
                                  // Regular users or unapproved users to homepage
                                  navigate("/");
                                }
                              }, 500);
                            },
                            onError: (error) => {
                              console.error("Login mutation error:", error);
                              toast({
                                title: "Login failed",
                                description: error.message || "Invalid username or password. Please try again.",
                                variant: "destructive",
                              });
                            }
                          });
                        } catch (error) {
                          console.error("Login error:", error);
                          toast({
                            title: "Login failed",
                            description: "An unexpected error occurred. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Direct Login (Test)
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              This area is restricted to authorized personnel only.
            </p>
          </CardFooter>
        </Card>

        <div className="hidden md:flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Outdoor Adventures</h1>
          <p className="text-lg mb-6">
            Your gateway to exploring the world of outdoor activities - from hiking and camping to fishing and off-roading.
          </p>
          <div className="bg-primary/10 p-5 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2">Account Benefits:</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="mr-2 text-primary">✓</span> Access to exclusive content and guides
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-primary">✓</span> Stay updated with the latest adventure tips
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-primary">✓</span> Save favorite activities and create trip plans
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-primary">✓</span> Join the community of outdoor enthusiasts
              </li>
            </ul>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <span className="font-medium">Note:</span> New registrations require approval for administrative access.
          </p>
        </div>
      </div>
    </div>
  );
}