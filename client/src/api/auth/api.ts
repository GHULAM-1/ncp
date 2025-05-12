interface UserData {
  name: string;
  email: string;
  password: string;
}

interface Credentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

interface AuthResponse {
  success: boolean;
  token: string; // still returned, but unused on frontend
  user: User;
}

interface UserResponse {
  success: boolean;
  data: User;
}

interface UsersResponse {
  success: boolean;
  count: number;
  data: User[];
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    msg: string;
    param: string;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

<<<<<<< HEAD
// Shared fetch options
=======
>>>>>>> stagging
const authFetchOptions = {
  credentials: "include" as RequestCredentials,
  headers: {
    "Content-Type": "application/json",
  },
};

const apiRequest = async <T>(
  url: string,
  options: RequestInit,
  errorMessage: string
): Promise<T> => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ErrorResponse).message || errorMessage);
    }

    return data as T;
  } catch (error) {
    console.error(`API error (${url}):`, error);
    throw error;
  }
};

// Register
export const register = async (userData: UserData): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>(
    `${API_URL}/auth/register`,
    {
      ...authFetchOptions,
      method: "POST",
      body: JSON.stringify(userData),
    },
    "Registration failed"
  );
};

// Login
export const login = async (
  credentials: Credentials
): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>(
    `${API_URL}/auth/login`,
    {
      ...authFetchOptions,
      method: "POST",
      body: JSON.stringify(credentials),
    },
    "Login failed"
  );
};

// Current user
export const getCurrentUser = async (): Promise<UserResponse> => {
  return apiRequest<UserResponse>(
    `${API_URL}/auth/me`,
    {
      method: "GET",
      credentials: "include",
    },
    "Failed to fetch current user"
  );
};

// Logout
export const logout = async (): Promise<{ success: boolean; data: {} }> => {
  return apiRequest<{ success: boolean; data: {} }>(
    `${API_URL}/auth/logout`,
    {
      method: "GET",
      credentials: "include",
    },
    "Logout failed"
  );
};

// OAuth
export const googleAuthUrl = `${API_URL}/auth/google`;

// Admin: secured with token (you can switch to cookie-secured if backend supports it)
const withAuth = (token: string, options: RequestInit = {}): RequestInit => ({
  ...options,
  headers: {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  },
});

export const getAllUsers = async (token: string): Promise<UsersResponse> => {
  return apiRequest<UsersResponse>(
    `${API_URL}/users`,
    withAuth(token, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
    "Failed to get users"
  );
};

export const getUserById = async (
  token: string,
  userId: string
): Promise<UserResponse> => {
  return apiRequest<UserResponse>(
    `${API_URL}/users/${userId}`,
    withAuth(token, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
    "Failed to get user"
  );
};

export const updateUser = async (
  token: string,
  userId: string,
  userData: Partial<UserData>
): Promise<UserResponse> => {
  return apiRequest<UserResponse>(
    `${API_URL}/users/${userId}`,
    withAuth(token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    }),
    "Failed to update user"
  );
};

export const deleteUser = async (
  token: string,
  userId: string
): Promise<{ success: boolean; data: {} }> => {
  return apiRequest<{ success: boolean; data: {} }>(
    `${API_URL}/users/${userId}`,
    withAuth(token, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }),
    "Failed to delete user"
  );
};
