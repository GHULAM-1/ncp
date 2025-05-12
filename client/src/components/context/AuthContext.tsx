"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getCurrentUser, login, logout, register } from "@/api/auth/api";
import { useRouter } from "next/navigation";
import { AuthContextType, User } from "@/types/context/auth-user";

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const res = await getCurrentUser(); // Automatically sends credentials (cookies)
        setUser(res.data);
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
        setError("Session expired. Please login again.");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  // Login function
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await login({ email, password }); // sets cookie from backend
      const res = await getCurrentUser(); // fetch authenticated user
      setUser(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await register({ name, email, password }); // sets cookie from backend
      const res = await getCurrentUser(); // fetch authenticated user
      setUser(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout(); // clears cookie
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
