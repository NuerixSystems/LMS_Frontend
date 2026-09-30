import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import {
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../types";

const getGoogleProfile = (credential: string): Record<string, unknown> => {
  const payload = credential.split(".")[1];
  if (!payload) return {};

  try {
    const binary = window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  // =====================================================
  // GOOGLE LOGIN
  // =====================================================

  const handleGoogleLogin = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse.credential) {
      setError(
        "Google authentication failed. Please try again."
      );
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // =================================================
      // IMPORTANT:
      // LMS Google login endpoint
      //
      // main.py:
      // prefix="/api/lms"
      //
      // auth.py:
      // prefix="/auth"
      //
      // @router.post("/google")
      //
      // Final URL:
      // /api/lms/auth/google
      // =================================================

      const response = await fetch(
        `${API_URL}/api/lms/auth/google`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            credential:
              credentialResponse.credential,
          }),
        }
      );

      // =================================================
      // READ RESPONSE
      // =================================================

      let data: any = {};

      const contentType =
        response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json")
      ) {
        try {
          data = await response.json();
        } catch {
          data = {};
        }
      } else {
        const text = await response.text();

        data = {
          detail: text,
        };
      }

      console.log(
        "LMS Google Login Response:",
        response.status,
        data
      );

      // =================================================
      // HANDLE API ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Google login failed (${response.status}).`
        );
      }

      // =================================================
      // ACCESS TOKEN
      // =================================================

      const accessToken =
        data?.access_token;

      if (!accessToken) {
        throw new Error(
          "Login successful, but the LMS server did not return an access token."
        );
      }

      const profile = data?.student || getGoogleProfile(credentialResponse.credential);
      const email = typeof profile.email === "string" ? profile.email : "";
      if (!email) {
        throw new Error("Google login succeeded, but no student email was returned.");
      }

      const googleUser: User = {
        id: String(profile.id ?? profile.sub ?? email),
        name:
          (typeof profile.name === "string" && profile.name) ||
          (typeof profile.username === "string" && profile.username) ||
          email.split("@")[0],
        email,
        avatar:
          (typeof profile.avatar === "string" && profile.avatar) ||
          (typeof profile.picture === "string" && profile.picture) ||
          undefined,
        role: "student",
        createdAt:
          (typeof profile.created_at === "string" && profile.created_at) ||
          new Date().toISOString().slice(0, 10),
      };

      completeGoogleLogin(googleUser, accessToken);

      // =================================================
      // SAVE LMS TOKEN
      // =================================================

      localStorage.setItem(
        "token_type",
        data?.token_type || "bearer"
      );

      // =================================================
      // SAVE STUDENT
      // =================================================

      localStorage.setItem("student", JSON.stringify(profile));

      // =================================================
      // OPTIONAL:
      // Save a separate LMS login marker
      // =================================================

      localStorage.setItem(
        "user_type",
        "student"
      );

      localStorage.setItem(
        "lms_logged_in",
        "true"
      );

      // =================================================
      // LOGIN SUCCESS
      // =================================================

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error(
        "LMS Google login error:",
        err
      );

      // =================================================
      // NETWORK ERROR
      // =================================================

      if (
        err instanceof TypeError &&
        err.message
          ?.toLowerCase()
          .includes("fetch")
      ) {
        setError(
          "Unable to connect to the LMS server. Please make sure the backend is running on port 8000."
        );
      } else {
        setError(
          err?.message ||
            "Unable to sign in with Google. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // GOOGLE LOGIN ERROR
  // =====================================================

  const handleGoogleError = () => {
    console.error(
      "Google Sign-In failed"
    );

    setError(
      "Google Sign-In was unsuccessful. Please try again."
    );

    setIsLoading(false);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">

      {/* =================================================
          LOGO + HEADING
      ================================================= */}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">

        <Link
          to="/"
          className="inline-flex items-center gap-2 font-bold text-slate-900 text-2xl"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100">
            <Sparkles className="h-6 w-6" />
          </div>

          <span>
           Xeno
            <span className="text-indigo-600">
              verse
            </span>
          </span>
        </Link>

        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Sign in to continue your learning journey
        </p>
      </div>

      {/* =================================================
          LOGIN CARD
      ================================================= */}

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* =================================================
              GOOGLE LOGIN
          ================================================= */}

          <div className="flex flex-col items-center">

            <div className="mb-6 text-center">

              <h3 className="text-lg font-semibold text-slate-900">
                Sign in with Google
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Use your Gmail account to access your courses
              </p>

            </div>

            {isLoading ? (
              <div className="flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50">

                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />

                <span className="text-sm font-medium text-slate-600">
                  Signing in...
                </span>

              </div>
            ) : (
              <div className="flex w-full justify-center">

                <GoogleLogin
                  onSuccess={
                    handleGoogleLogin
                  }
                  onError={
                    handleGoogleError
                  }
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="320"
                  useOneTap={false}
                />

              </div>
            )}

          </div>

          {/* =================================================
              SECURITY INFORMATION
          ================================================= */}

          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-center">

            <p className="text-xs leading-5 text-slate-500">
              Your Google account is used to securely
              identify your Xenoverse student account.
            </p>

          </div>

          {/* =================================================
              REGISTER
          ================================================= */}

          <div className="mt-6 text-center text-sm text-slate-500">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Create Account
            </Link>

          </div>

        </div>

        {/* =================================================
            BACK HOME
        ================================================= */}

        <div className="mt-6 text-center">

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
          >
            Back to home

            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;