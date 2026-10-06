export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  bio?: string;
  createdAt: string;
}

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  duration: string; // e.g., '12:45'
  videoUrl: string; // YouTube embed URL
  description: string;
  order: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  instructor: string;
  instructorTitle: string;
  instructorAvatar: string;
  thumbnail: string;
  duration: string;
  totalLessons: number;
  category: string;
  level: CourseLevel;
  rating: number;
  enrolledCount: number;
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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
