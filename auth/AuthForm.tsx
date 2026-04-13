import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { signUp, signIn, signUpSchema, signInSchema } from "@/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { handleGoogleCredentialResponse, initializeGoogleSignIn } from "@/lib/googleAuth";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/LoadingSpinner";

const AuthForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);
  
  // Get redirect destination, but never redirect back to /auth
  const rawFrom = (location.state as { from?: string })?.from;
  const from = rawFrom && rawFrom !== "/auth" ? rawFrom : "/";
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, navigate, from]);

  // Initialize Google Sign-In
  useEffect(() => {
    // Don't initialize if user is already logged in or if already initialized
    if (user || isGoogleInitialized) return;
    
    const clientId = "687746098435-johcljfhraeds3qlju0n7sgkh5n56c9t.apps.googleusercontent.com";
    
    const handleGoogleResponse = async (response: any) => {
      setIsLoading(true);
      try {
        const { error } = await handleGoogleCredentialResponse(response);
        
        if (error) {
          console.error("Google sign-in error:", error);
          toast.error(error.message || "Google sign-in failed");
        } else {
          toast.success("Signed in successfully!");
          // Navigation will happen via the useEffect when user state updates
        }
      } catch (err) {
        console.error("Unexpected Google sign-in error:", err);
        toast.error("Google sign-in failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    // Function to render the Google button
    const renderGoogleButton = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          context: isLogin ? "signin" : "signup",
          ux_mode: "popup",
        });
        
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { 
            theme: "outline", 
            size: "large",
            width: "100%",
            text: isLogin ? "signin_with" : "signup_with",
            shape: "rectangular",
            logo_alignment: "center"
          }
        );
        
        setIsGoogleInitialized(true);
      }
    };

    // Check if Google API is already loaded
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      // Wait for Google script to load
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          renderGoogleButton();
        }
      }, 100);
      
      // Clean up interval after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkGoogle);
        console.warn("Google Sign-In script failed to load");
      }, 10000);
      
      return () => {
        clearInterval(checkGoogle);
        clearTimeout(timeout);
      };
    }
  }, [isLogin, user, isGoogleInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = signInSchema.safeParse(formData);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Signed in successfully!");
        }
      } else {
        const validation = signUpSchema.safeParse(formData);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.displayName
        );
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully! Please check your email to verify.");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      <Card className="glass-strong w-full max-w-md p-8 animate-scale-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to your JZTradeHub account" : "Join the JZTradeHub marketplace"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={isLoading}
                className="glass"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              className="glass"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
              className="glass"
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>{isLogin ? "Sign In" : "Create Account"}</>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In Button Container */}
        <div 
          id="googleSignInButton" 
          ref={googleButtonRef}
          className="w-full flex justify-center min-h-[44px]"
        />

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ email: "", password: "", displayName: "" });
              // Reset Google button initialization flag so it re-renders with correct text
              setIsGoogleInitialized(false);
            }}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AuthForm;