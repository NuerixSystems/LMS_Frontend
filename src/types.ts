// src/types.ts

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  order: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  rating: number;
  enrolledCount: number;
  duration: string;
  totalLessons?: number;
  instructor: string;
  instructorTitle: string;
  instructorAvatar: string;
  modules: Module[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  lastAccessedLessonId?: string;
  progressPercentage: number;
}

export interface LessonProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  bio?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}