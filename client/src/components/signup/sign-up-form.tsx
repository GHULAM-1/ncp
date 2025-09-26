"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { register, googleAuthUrl } from "@/api/auth/api";
import { SocialButton } from "../social-button";
import Icon from "../svg-icon";
import { useForm } from "react-hook-form";
import { SignUpInputs } from "@/types/sign-up-types";
export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignUpInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: SignUpInputs) => {
    setIsSubmitting(true);
    setError(null);

    const { email, password } = values;
    const name = email.split("@")[0];

    try {
      const response = await register({ name, email, password });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      toast.success("Registration successful");
      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to register. Please try again."
      );
      toast.error("Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    localStorage.setItem("authRedirectUrl", window.location.pathname);
    window.location.href = googleAuthUrl;
  };

  return (
    <div
      className={cn(
        "w-full",
        className
      )}
      {...props}
    >
      {error && (
        <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 mb-6 rounded-xl text-sm font-medium backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block"
                >
                  Email Address
                </Label>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                    className="w-full h-12 px-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#33a47d] dark:focus:border-emerald-400 focus:ring-0 transition-all duration-200"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block"
                >
                  Password
                </Label>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Create a strong password"
                    disabled={isSubmitting}
                    className="w-full h-12 px-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#33a47d] dark:focus:border-emerald-400 focus:ring-0 transition-all duration-200"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-[#33a47d] hover:bg-emerald-700 text-white rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#33a47d] dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-semibold hover:underline"
          >
            Sign in instead
          </Link>
        </p>
      </div>

      {/* <div className="relative my-6 sm:my-8">
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
      </div> */}
    </div>
  );
}
