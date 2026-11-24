
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import type { User, AuthState } from "../types";
import { initialUser } from "../data/mockCourses";
import { apiService } from "../services/api";

interface AuthContextType extends AuthState {
  token: string | null;
  adminToken: string | null;

  completeGoogleLogin: (
    user: User,
    accessToken: string,
    crmAdminToken?: string | null
  ) => void;

  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;

  logout: () => void;

  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;

  updateProfile: (
    data: Partial<Pick<User, "name" | "email" | "bio" | "avatar">>
  ) => void;

  changePassword: (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const AUTH_STORAGE_KEY = "lms_auth_user";
const AUTH_TOKEN_KEY = "lms_auth_token";
const ADMIN_TOKEN_KEY = "crm_admin_token";

const normalizeRole = (value: unknown): string => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

const isAdminRole = (value: unknown): boolean => {
  return [
    "admin",
    "superadmin",
    "super_admin",
    "administrator",
  ].includes(normalizeRole(value));
};

// Read role from common backend profile response structures.
const getProfileRole = (profile: any): string => {
  const candidates = [
    profile?.role,
    profile?.user_role,
    profile?.user_type,
    profile?.account_type,
    profile?.user?.role,
    profile?.user?.user_role,
    profile?.user?.user_type,
    profile?.data?.role,
    profile?.data?.user_role,
    profile?.data?.user?.role,
  ];

  return candidates.find(
    (value) => typeof value === "string" && value.trim()
  ) || "student";
};

// Only use an admin token explicitly returned by the backend.
const getCRMAdminToken = (
  loginResponse: any,
  profile: any
): string | null => {
  const candidates = [
    loginResponse?.crm_admin_token,
    loginResponse?.admin_token,
    loginResponse?.data?.crm_admin_token,
    loginResponse?.data?.admin_token,
    loginResponse?.user?.crm_admin_token,
    profile?.crm_admin_token,
    profile?.admin_token,
    profile?.data?.crm_admin_token,
    profile?.user?.crm_admin_token,
  ];

  const value = candidates.find(
    (item) => typeof item === "string" && item.trim()
  );

  return value || null;
};

const getUserName = (profile: any, email: string): string => {
  return (
    profile?.username ||
    profile?.name ||
    profile?.firstname ||
    profile?.user?.username ||
    profile?.user?.name ||
    email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase())
  );
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authentication when application loads.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

      if (stored && storedToken) {
        const storedUser = JSON.parse(stored) as User;

        if (
          storedUser.id === initialUser.id &&
          storedUser.email === initialUser.email
        ) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        } else {
          const restoredUser: User = {
            ...storedUser,
            role:
              storedAdminToken && isAdminRole(storedUser.role)
                ? "admin"
                : "student",
          };

          setUser(restoredUser);
          setToken(storedToken);

          if (
            storedAdminToken &&
            isAdminRole(storedUser.role)
          ) {
            setAdminToken(storedAdminToken);
          } else {
            setAdminToken(null);
            localStorage.removeItem(ADMIN_TOKEN_KEY);

            localStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify(restoredUser)
            );
          }
        }
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    } catch (error) {
      console.error("Failed to restore authentication:", error);

      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Email/password login.
  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      setUser(null);
      setToken(null);
      setAdminToken(null);

      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);

      const data = await apiService.login(email, password);
      const accessToken = data.access_token;

      if (!accessToken) {
        throw new Error(
          "Backend did not return an access token."
        );
      }

      const profile = await apiService.getProfile(accessToken);

      console.log("LMS PROFILE RESPONSE:", profile);

      const backendRole = getProfileRole(profile);
      const crmAdminToken = getCRMAdminToken(data, profile);

      const adminAccess =
        isAdminRole(backendRole) && Boolean(crmAdminToken);

      const userName = getUserName(profile, email);

      const remoteUser: User = {
        id: String(
          profile?.id ??
            profile?.user_id ??
            profile?.user?.id ??
            email
        ),
        name: userName,
        email: profile?.email || profile?.emailid || email,
        avatar:
          profile?.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            email
          )}`,
        role: adminAccess ? "admin" : "student",
        bio: profile?.bio || "Learning on CourseBox.",
        createdAt:
          profile?.createdAt ||
          new Date().toISOString().split("T")[0],
      };

      setToken(accessToken);
      setUser(remoteUser);
      setAdminToken(adminAccess ? crmAdminToken : null);

      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);

        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(remoteUser)
        );

        if (adminAccess && crmAdminToken) {
          localStorage.setItem(
            ADMIN_TOKEN_KEY,
            crmAdminToken
          );
        }
      }

      setIsLoading(false);

      return { success: true };
    } catch (error: any) {
      console.error("Login failed:", error);

      setUser(null);
      setToken(null);
      setAdminToken(null);

      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);

      setIsLoading(false);

      return {
        success: false,
        error:
          error?.message ||
          "Login failed. Please check your email and password.",
      };
    }
  };

  // Student registration.
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      setUser(null);
      setToken(null);
      setAdminToken(null);

      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);

      await apiService.signup(name, email, password);

      const loginRes = await apiService.login(email, password);
      const accessToken = loginRes.access_token;

      if (!accessToken) {
        throw new Error(
          "Registration login did not return a token."
        );
      }

      const registeredUser: User = {
        id: "user-" + Date.now(),
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          name
        )}`,
        role: "student",
        bio: "Newly registered student on CourseBox.",
        createdAt: new Date().toISOString().split("T")[0],
      };

      setToken(accessToken);
      setUser(registeredUser);
      setAdminToken(null);

      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(registeredUser)
      );

      setIsLoading(false);

      return { success: true };
    } catch (error: any) {
      console.error("Registration failed:", error);

      setIsLoading(false);

      return {
        success: false,
        error: error?.message || "Registration failed.",
      };
    }
  };

  // Complete Google LMS + optional CRM authentication.
  const completeGoogleLogin = (
    googleUser: User,
    accessToken: string,
    crmAdminToken?: string | null
  ) => {
    const adminAccess =
      isAdminRole(googleUser.role) && Boolean(crmAdminToken);

    const finalUser: User = {
      ...googleUser,
      role: adminAccess ? "admin" : "student",
    };

    setUser(finalUser);
    setToken(accessToken);
    setAdminToken(adminAccess ? crmAdminToken! : null);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(finalUser)
    );

    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);

    if (adminAccess && crmAdminToken) {
      localStorage.setItem(
        ADMIN_TOKEN_KEY,
        crmAdminToken
      );
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  };

  // Logout from LMS and CRM sessions.
  const logout = () => {
    setUser(null);
    setToken(null);
    setAdminToken(null);

    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);

    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("student");
    localStorage.removeItem("user_type");
    localStorage.removeItem("lms_logged_in");
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.forgotPassword(email);

      return {
        success: true,
        message:
          response.message ||
          "If this account exists, password reset instructions have been sent.",
      };
    } catch (error) {
      console.error("Password reset error:", error);

      return {
        success: true,
        message:
          "If this account exists, password reset instructions have been sent.",
      };
    }
  };

  const updateProfile = (
    data: Partial<Pick<User, "name" | "email" | "bio" | "avatar">>
  ) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };

    setUser(updatedUser);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(updatedUser)
    );
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!token) {
      return {
        success: false,
        error: "Please log in again.",
      };
    }

    try {
      await apiService.changePassword(
        token,
        oldPassword,
        newPassword,
        confirmPassword
      );

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Password change failed.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        adminToken,
        isAuthenticated: !!user,
        isLoading,
        completeGoogleLogin,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};
