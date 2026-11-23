
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
import { API_URL } from "../../config";

const ADMIN_ROLES = [
  "admin",
  "administrator",
  "superadmin",
  "super_admin",
  "owner",
];

const getGoogleProfile = (
  credential: string
): Record<string, any> => {
  try {
    const parts = credential.split(".");

    if (parts.length < 2) return {};

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedPayload =
      payload +
      "=".repeat((4 - (payload.length % 4)) % 4);

    const binary = window.atob(paddedPayload);

    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0)
    );

    return JSON.parse(
      new TextDecoder().decode(bytes)
    );
  } catch (error) {
    console.error(
      "Unable to decode Google credential:",
      error
    );

    return {};
  }
};

const readResponse = async (response: Response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  const text = await response.text();

  return { detail: text };
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const { completeGoogleLogin } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async (
    credentialResponse: CredentialResponse
  ) => {
    if (isLoading) return;

    const credential = credentialResponse.credential;

    if (!credential) {
      setError(
        "Google authentication failed. Please try again."
      );
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // -----------------------------------------------
      // STEP 1: Authenticate with LMS.
      // -----------------------------------------------
      const lmsResponse = await fetch(
        `${API_URL}/api/lms/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ credential }),
        }
      );

      const lmsData = await readResponse(lmsResponse);

      console.log(
        "LMS Google Login Status:",
        lmsResponse.status
      );

      if (!lmsResponse.ok) {
        throw new Error(
          lmsData?.detail ||
            lmsData?.message ||
            `LMS Google login failed (${lmsResponse.status}).`
        );
      }

      const lmsToken = lmsData?.access_token;

      if (!lmsToken) {
        throw new Error(
          "LMS server did not return an access token."
        );
      }

      // -----------------------------------------------
      // STEP 2: Get the Google/student profile.
      // -----------------------------------------------
      const googleProfile =
        getGoogleProfile(credential);

      const profile =
        lmsData?.student || googleProfile;

      const email = String(
        profile?.email ||
          googleProfile?.email ||
          ""
      ).trim();

      if (!email) {
        throw new Error(
          "Google login succeeded, but no email was returned."
        );
      }

      // -----------------------------------------------
      // STEP 3: Authenticate the same Google user with CRM.
      // CRM login is optional for LMS student access.
      // -----------------------------------------------
      let crmAdminToken: string | null = null;
      let isCrmAdmin = false;

      try {
        const crmResponse = await fetch(
          `${API_URL}/api/google-signin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ credential }),
          }
        );

        const crmData = await readResponse(crmResponse);

        console.log(
          "CRM Google Login Status:",
          crmResponse.status
        );

        if (crmResponse.ok) {
          const crmUser = crmData?.user;

          const crmRole = String(
            crmUser?.role || ""
          )
            .trim()
            .toLowerCase();

          const crmEmail = String(
            crmUser?.emailid ||
              crmUser?.email ||
              crmData?.email ||
              ""
          )
            .trim()
            .toLowerCase();

          const sameAccount =
            crmEmail === email.toLowerCase();

          const isAllowedAdminRole =
            ADMIN_ROLES.includes(crmRole);

          if (
            sameAccount &&
            isAllowedAdminRole &&
            crmData?.access_token
          ) {
            crmAdminToken = crmData.access_token;
            isCrmAdmin = true;
          }
        } else {
          console.warn(
            "CRM login unavailable. Continuing with LMS login.",
            crmData?.detail || crmResponse.status
          );
        }
      } catch (crmError) {
        console.warn(
          "CRM authentication failed. Continuing with LMS login.",
          crmError
        );
      }

      // -----------------------------------------------
      // STEP 4: Build the frontend user.
      // Admin role is granted only after CRM confirmation.
      // -----------------------------------------------
      const googleUser: User = {
        id: String(
          profile?.id ??
            profile?.student_id ??
            profile?.sub ??
            email
        ),

        name:
          profile?.name ||
          profile?.username ||
          googleProfile?.name ||
          email.split("@")[0],

        email,

        avatar:
          profile?.avatar ||
          profile?.picture ||
          googleProfile?.picture ||
          undefined,

        role: isCrmAdmin ? "admin" : "student",

        createdAt:
          profile?.created_at ||
          new Date().toISOString().slice(0, 10),
      };

      // -----------------------------------------------
      // STEP 5: Save separate LMS and CRM tokens.
      // -----------------------------------------------
      completeGoogleLogin(
        googleUser,
        lmsToken,
        crmAdminToken
      );

      // Maintain compatibility with existing LMS code.
      localStorage.setItem("access_token", lmsToken);
      localStorage.setItem(
        "token_type",
        lmsData?.token_type || "bearer"
      );
      localStorage.setItem(
        "student",
        JSON.stringify(profile)
      );
      localStorage.setItem("user_type", "student");
      localStorage.setItem("lms_logged_in", "true");

      console.log(
        "CourseBox login completed:",
        isCrmAdmin ? "CRM Admin + LMS" : "LMS Student"
      );

      // -----------------------------------------------
      // STEP 6: Navigate after login.
      // -----------------------------------------------
      navigate(
        isCrmAdmin ? "/admin/live-classes" : "/dashboard",
        { replace: true }
      );
    } catch (err: unknown) {
      console.error("Google login error:", err);

      if (
        err instanceof TypeError &&
        err.message.toLowerCase().includes("fetch")
      ) {
        setError(
          "Unable to connect to the server. Please check your internet connection and backend server."
        );
      } else if (err instanceof Error) {
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

  const handleGoogleError = () => {
    console.error("Google Sign-In failed");

    setError(
      "Google Sign-In was unsuccessful. Please try again."
    );

    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100">
            <Sparkles className="h-6 w-6" />
          </div>

          <span>coursebox</span>
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Sign in to continue your learning journey
        </p>
      </div>

      <div className="mt-8 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col items-center">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                Sign in with Google
              </h2>

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
                  onSuccess={handleGoogleLogin}
                  onError={handleGoogleError}
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

          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs leading-5 text-slate-500">
              Your Google account is used to securely identify
              your CourseBox account.
            </p>
          </div>

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
