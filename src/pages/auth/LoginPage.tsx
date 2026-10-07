import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
} from "lucide-react";

import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";

import { useAuth } from "../../context/AuthContext";
import type { User } from "../../types";

/**
 * =========================================================
 * PRODUCTION API CONFIGURATION
 * =========================================================
 *
 * Vite environment variables are injected at BUILD TIME.
 *
 * Production:
 * VITE_API_URL=https://crm-dkc2.onrender.com
 *
 * Local development:
 * VITE_API_URL=http://127.0.0.1:8000
 *
 * IMPORTANT:
 * Do NOT silently fall back to localhost in production.
 */
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://crm-dkc2.onrender.com"
).replace(/\/+$/, "");

/**
 * =========================================================
 * GOOGLE PROFILE DECODER
 * =========================================================
 *
 * Google returns a JWT credential.
 * This function only decodes the payload so we can read
 * basic profile information on the frontend.
 *
 * The backend remains responsible for validating the
 * Google credential.
 */
const getGoogleProfile = (
  credential: string
): Record<string, unknown> => {
  try {
    const parts = credential.split(".");

    if (parts.length < 2) {
      return {};
    }

    const payload = parts[1];

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedPayload =
      normalizedPayload +
      "=".repeat(
        (4 - (normalizedPayload.length % 4)) % 4
      );

    const binary = window.atob(paddedPayload);

    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0)
    );

    return JSON.parse(
      new TextDecoder().decode(bytes)
    ) as Record<string, unknown>;
  } catch (error) {
    console.error(
      "Unable to decode Google credential:",
      error
    );

    return {};
  }
};

/**
 * =========================================================
 * LOGIN PAGE
 * =========================================================
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    completeGoogleLogin,
  } = useAuth();

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /**
   * =======================================================
   * GOOGLE LOGIN
   * =======================================================
   */
  const handleGoogleLogin = async (
    credentialResponse: CredentialResponse
  ) => {
    /**
     * Prevent duplicate requests.
     */
    if (isLoading) {
      return;
    }

    /**
     * Google did not return a credential.
     */
    if (!credentialResponse.credential) {
      setError(
        "Google authentication failed. Please try again."
      );

      return;
    }

    setError("");
    setIsLoading(true);

    try {
      /**
       * ===================================================
       * BACKEND REQUEST
       * ===================================================
       *
       * Production endpoint:
       *
       * https://crm-dkc2.onrender.com/api/lms/auth/google
       *
       * Local endpoint:
       *
       * http://127.0.0.1:8000/api/lms/auth/google
       */
      const response = await fetch(
        "https://crm-dkc2.onrender.com/api/lms/auth/google",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            credential:
              credentialResponse.credential,
          }),
        }
      );

      /**
       * ===================================================
       * READ RESPONSE SAFELY
       * ===================================================
       */
      let data: any = {};

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType
          .toLowerCase()
          .includes("application/json")
      ) {
        try {
          data = await response.json();
        } catch {
          data = {};
        }
      } else {
        const text =
          await response.text();

        data = {
          detail: text,
        };
      }

      console.log(
        "LMS Google Login Response:",
        response.status,
        data
      );

      /**
       * ===================================================
       * API ERROR
       * ===================================================
       */
      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Google login failed (${response.status}).`
        );
      }

      /**
       * ===================================================
       * ACCESS TOKEN
       * ===================================================
       */
      const accessToken =
        data?.access_token;

      if (!accessToken) {
        throw new Error(
          "Login successful, but the LMS server did not return an access token."
        );
      }

      /**
       * ===================================================
       * GOOGLE / STUDENT PROFILE
       * ===================================================
       *
       * Prefer the student object returned by the backend.
       *
       * If the backend does not return one, decode the
       * Google credential as a fallback.
       */
      const profile =
        data?.student ||
        getGoogleProfile(
          credentialResponse.credential
        );

      /**
       * ===================================================
       * EMAIL
       * ===================================================
       */
      const email =
        typeof profile.email === "string"
          ? profile.email
          : "";

      if (!email) {
        throw new Error(
          "Google login succeeded, but no student email was returned."
        );
      }

      /**
       * ===================================================
       * FRONTEND USER OBJECT
       * ===================================================
       */
      const googleUser: User = {
        id: String(
          profile.id ??
            profile.sub ??
            email
        ),

        name:
          typeof profile.name ===
            "string" &&
          profile.name.trim()
            ? profile.name
            : typeof profile.username ===
                "string" &&
              profile.username.trim()
            ? profile.username
            : email.split("@")[0],

        email,

        avatar:
          typeof profile.avatar ===
              "string" &&
            profile.avatar
            ? profile.avatar
            : typeof profile.picture ===
                  "string" &&
                profile.picture
            ? profile.picture
            : undefined,

        role: "student",

        createdAt:
          typeof profile.created_at ===
              "string" &&
            profile.created_at
            ? profile.created_at
            : new Date()
                .toISOString()
                .slice(0, 10),
      };

      /**
       * ===================================================
       * SAVE AUTH STATE
       * ===================================================
       */
      completeGoogleLogin(
        googleUser,
        accessToken
      );

      /**
       * ===================================================
       * SAVE ACCESS TOKEN
       * ===================================================
       */
      localStorage.setItem(
        "access_token",
        accessToken
      );

      localStorage.setItem(
        "token_type",
        data?.token_type || "bearer"
      );

      /**
       * ===================================================
       * SAVE STUDENT PROFILE
       * ===================================================
       */
      localStorage.setItem(
        "student",
        JSON.stringify(profile)
      );

      localStorage.setItem(
        "user_type",
        "student"
      );

      localStorage.setItem(
        "lms_logged_in",
        "true"
      );

      /**
       * ===================================================
       * LOGIN SUCCESS
       * ===================================================
       */
      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: unknown) {
      console.error(
        "LMS Google login error:",
        err
      );

      /**
       * ===================================================
       * NETWORK ERROR
       * ===================================================
       */
      if (
        err instanceof TypeError &&
        err.message
          ?.toLowerCase()
          .includes("fetch")
      ) {
        setError(
          "Unable to connect to the LMS server. Please check your internet connection and backend server."
        );
      } else if (
        err instanceof Error
      ) {
        setError(err.message);
      } else {
        setError(
          "Unable to sign in with Google. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * =======================================================
   * GOOGLE LOGIN ERROR
   * =======================================================
   */
  const handleGoogleError = () => {
    console.error(
      "Google Sign-In failed"
    );

    setError(
      "Google Sign-In was unsuccessful. Please try again."
    );

    setIsLoading(false);
  };

  /**
   * =======================================================
   * UI
   * =======================================================
   */
  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      {/* ===================================================
          LOGO + HEADING
          =================================================== */}
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100">
            <Sparkles className="h-6 w-6" />
          </div>

          <span>
            coursebox
          </span>
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Sign in to continue your learning
          journey
        </p>
      </div>

      {/* ===================================================
          LOGIN CARD
          =================================================== */}
      <div className="mt-8 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          {/* =================================================
              ERROR MESSAGE
              ================================================= */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* =================================================
              GOOGLE LOGIN
              ================================================= */}
          <div className="flex flex-col items-center">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                Sign in with Google
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Use your Gmail account to access
                your courses
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
                  auto_select={false}
                />
              </div>
            )}
          </div>

          {/* =================================================
              SECURITY INFORMATION
              ================================================= */}
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs leading-5 text-slate-500">
              Your Google account is used to
              securely identify your coursebox
              student account.
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
    </main>
  );
};

export default LoginPage;