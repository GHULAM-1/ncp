"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { login, googleAuthUrl } from "@/api/auth/api";
import { toast } from "sonner";
import Icon from "../svg-icon";
import { SocialButton } from "../social-button";
import { LoginInputs } from "@/types/log-in-types";
export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LoginInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInputs) => {
    setIsSubmitting(true);
    try {
      const response = await login(values);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast.success("Login successful");
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    id="email"
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
                    id="password"
                    type="password"
                    placeholder="Enter your password"
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
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-[#33a47d] dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-semibold hover:underline"
          >
            Create one now
          </a>
        </p>
      </div>

      {/* <div className="relative my-6 sm:my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm sm:text-base">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div> */}

      {/* <div className="mt-6 space-y-3 sm:space-y-4">
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
      </div> */}
    </div>
  );
}
