import { API_URL } from "../config";

export const BACKEND_URL = API_URL;

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: any;
}

export interface SignupResponse {
  message?: string;
  user_id?: string | number;
  status?: string;
}

export const apiService = {
  getBackendUrl(): string {
    return BACKEND_URL;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      let errorDetail = "Invalid credentials";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch {}
      throw new Error(errorDetail);
    }

    return response.json();
  },

  async signup(name: string, email: string, password: string): Promise<SignupResponse> {
    const response = await fetch(`${BACKEND_URL}/api/manual-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: name,
        email,
        password,
      }),
    });

    if (!response.ok) {
      let errorDetail = "Failed to create account";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch {}
      throw new Error(errorDetail);
    }

    return response.json();
  },

  async getProfile(token: string): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/get-profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    return response.json();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      let errorDetail = "Failed to send reset link";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch {}
      throw new Error(errorDetail);
    }

    return response.json();
  },

  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    if (!response.ok) {
      let errorDetail = "Failed to change password";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch {}
      throw new Error(errorDetail);
    }

    return response.json();
  },
};
