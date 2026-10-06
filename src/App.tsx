// src/App.tsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { LMSProvider } from "./context/LMSContext";

import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

// ==============================
// Public Pages
// ==============================
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// ==============================
// Protected Pages
// ==============================
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import { CourseDetailsPage } from "./pages/CourseDetailsPage";
import { LearningPage } from "./pages/LearningPage";
import { MyLearningPage } from "./pages/MyLearningPage";
import { ProfilePage } from "./pages/ProfilePage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LMSProvider>
          <Routes>

            {/* =====================================================
                PUBLIC ROUTES
            ====================================================== */}

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomePage />} />

            {/* =====================================================
                PROTECTED APPLICATION ROUTES
            ====================================================== */}

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
              <Route
                path="/courses/:courseId/learn/:lessonId"
                element={<LearningPage />}
              />
              <Route path="/my-learning" element={<MyLearningPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* =====================================================
                FALLBACK
            ====================================================== */}

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </LMSProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;