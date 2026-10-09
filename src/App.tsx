// src/App.tsx
import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { LMSProvider } from "./context/LMSContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

// ✅ Logo loader import
import { LogoLoader } from "./components/common/LogoLoader";

// ==============================
// Public Pages
// ==============================
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// ==============================
// Protected Pages (lazy loaded)
// ==============================
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetailsPage = lazy(() =>
  import("./pages/CourseDetailsPage").then((m) => ({
    default: m.CourseDetailsPage,
  }))
);
const LearningPage = lazy(() =>
  import("./pages/LearningPage").then((m) => ({ default: m.LearningPage }))
);
const MyLearningPage = lazy(() =>
  import("./pages/MyLearningPage").then((m) => ({ default: m.MyLearningPage }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);

// ✅ Single PageLoader definition
const PageLoader = () => <LogoLoader />;

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LMSProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* PUBLIC */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<HomePage />} />

              {/* PROTECTED */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route
                  path="/courses/:courseId"
                  element={<CourseDetailsPage />}
                />
                <Route
                  path="/courses/:courseId/learn/:lessonId"
                  element={<LearningPage />}
                />
                <Route path="/my-learning" element={<MyLearningPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* FALLBACK */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </LMSProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;