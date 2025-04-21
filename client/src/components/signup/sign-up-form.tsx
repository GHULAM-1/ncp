"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "../svg-icon";
import { SocialButton } from "../social-button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/api/auth/api";
import { googleAuthUrl } from "@/api/auth/api"; // Import the Google auth URL
import { toast } from "sonner";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    // Get form data
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    // Generating a name from email if not provided
    const name = email.split('@')[0];
  
    try {
      // Call the register API function
      const response = await register({ name, email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.token);
      
      // Optionally store user data
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Show success message
      toast.success("Registration successful");
      
      // Redirect to dashboard or home
      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Failed to register. Please try again.");
      toast.error("Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle Google OAuth
  const handleGoogleSignUp = () => {
    // Store current URL in localStorage before redirecting
    localStorage.setItem('authRedirectUrl', window.location.pathname);
    
    // Redirect to Google OAuth endpoint
    window.location.href = googleAuthUrl;
  };

  return (
    <div
      className={cn(
        "w-full max-w-[830px] mx-auto px-4",
        "sm:px-6 md:px-8",
        className
      )}
      {...props}
    >
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-10 text-gray-900">
        Create Your Account
      </h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 mb-4 rounded-md text-sm">
          {error}
        </div>
      )}

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
            className="w-full h-12 sm:h-14 text-base sm:text-lg px-3 border  rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={isSubmitting}
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
            className="w-full h-12 sm:h-14 text-base sm:text-lg px-3 border  rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 sm:h-14 text-lg sm:text-xl bg-[#33a47d] hover:bg-emerald-700 text-white rounded-md transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Continue"}
        </Button>
      </form>

      <p className="text-center mt-6 sm:mt-8 mb-2 text-base sm:text-lg text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
        >
          Sign in
        </Link>
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
          onClick={handleGoogleSignUp}
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