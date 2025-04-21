"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "../svg-icon";
import { SocialButton } from "../social-button";
import { useState } from "react";
import { login } from "@/api/auth/api"; 
import { googleAuthUrl } from "@/api/auth/api"; 
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  //HANDLERS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Get form data
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      // Call the login API function
      const response = await login({ email, password });
      
      // Store token and user data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast.success("Login successful");

      // Redirect to dashboard or home page
      window.location.href = "/";
    } catch (error) {
      toast.success("Login failed");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle Google OAuth
  const handleGoogleSignIn = () => {
    // Store current URL in localStorage
    localStorage.setItem("authRedirectUrl", window.location.pathname);
    
    // Redirect to Google OAuth endpoint
    window.location.href = googleAuthUrl;
  };

  return (
    <div
      className={cn(
        "w-full max-w-[450px] mx-auto px-4",
        "sm:px-6 md:px-8",
        className
      )}
      {...props}
    >
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-10 text-gray-900">
        Welcome back
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label
            htmlFor="email"
            className="text-sm sm:text-base font-medium text-gray-700"
          ></Label>
          <Input
            id="email"
            type="email"
            placeholder="Email address"
            required
            className="w-full h-12 sm:h-14 text-base sm:text-lg px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="password"
            className="text-sm sm:text-base font-medium text-gray-700"
          ></Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            required
            className="w-full h-12 sm:h-14 text-base sm:text-lg px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 sm:h-14 text-lg sm:text-xl bg-[#33a47d] hover:bg-emerald-700 text-white rounded-md transition-colors"
        >
          Continue
        </Button>
      </form>

      <p className="text-center mt-6 sm:mt-8 mb-2 text-base sm:text-lg text-gray-600">
        Don&apos;t have an account?{" "}
        <a
          href="/signup"
          className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
        >
          Sign up
        </a>
      </p>

      <div className="relative my-6 sm:my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm sm:text-base">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>

      <div className="mt-6 space-y-3 sm:space-y-4">
        <SocialButton
          icon={<Icon name="google" alt="Google logo" width={24} height={24} />}
          provider="Google"
          onClick={handleGoogleSignIn}
        />
        <SocialButton
          icon={
            <Icon name="facebook" alt="Facebook logo" width={24} height={24} />
          }
          provider="Facebook"
          onClick={() => console.log("Facebook login")}
        />
      </div>
    </div>
  );
}