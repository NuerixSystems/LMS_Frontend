// src/data/mockCourses.ts
import { Course, Enrollment, LessonProgress, User } from "../types";

// ============================================================
// DEMO USER
// ============================================================

export const initialUser: User = {
  id: "user-1",
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  role: "student",
  bio: "Lifelong learner on coursebox.",
  createdAt: "2024-01-15",
};

// ============================================================
// INITIAL STATE — EMPTY (backend will populate courses)
// ============================================================

export const initialCourses: Course[] = [];

export const initialEnrollments: Enrollment[] = [];

export const initialLessonProgress: LessonProgress[] = [];

// ============================================================
// LEGACY ALIASES (compatibility)
// ============================================================

export const mockCourses: Course[] = [];
export const mockEnrollments: Enrollment[] = [];
export const mockLessonProgress: LessonProgress[] = [];