import React, { createContext, useContext, useState, useEffect } from "react";
import { Course, Enrollment, LessonProgress } from "../types";
import { initialCourses, initialEnrollments, initialLessonProgress } from "../data/mockCourses";
import { useAuth } from "./AuthContext";

interface LMSContextType {
  courses: Course[];
  enrollments: Enrollment[];
  lessonProgress: LessonProgress[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  
  // Queries & Actions
  isEnrolled: (courseId: string) => boolean;
  enrollCourse: (courseId: string) => void;
  getCourseProgress: (courseId: string) => number;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  toggleLessonComplete: (courseId: string, lessonId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  updateLastAccessedLesson: (courseId: string, lessonId: string) => void;
  getNextLessonId: (courseId: string, currentLessonId: string) => string | null;
  getPrevLessonId: (courseId: string, currentLessonId: string) => string | null;

  // Stats
  totalEnrolledCount: number;
  inProgressCount: number;
  completedCount: number;
  overallProgress: number;
  continueCourse: {
    course: Course;
    enrollment: Enrollment;
    nextLessonId: string;
  } | null;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const ENROLLMENTS_KEY = "lms_enrollments";
const PROGRESS_KEY = "lms_lesson_progress";

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [courses] = useState<Course[]>(initialCourses);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Load from localStorage or initialize
  useEffect(() => {
    try {
      const storedEnr = localStorage.getItem(ENROLLMENTS_KEY);
      const storedProg = localStorage.getItem(PROGRESS_KEY);
      if (storedEnr) {
        setEnrollments(JSON.parse(storedEnr));
      } else {
        setEnrollments(initialEnrollments);
        localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(initialEnrollments));
      }

      if (storedProg) {
        setLessonProgress(JSON.parse(storedProg));
      } else {
        setLessonProgress(initialLessonProgress);
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(initialLessonProgress));
      }
    } catch (e) {
      console.error("Failed loading LMS state from localStorage", e);
      setEnrollments(initialEnrollments);
      setLessonProgress(initialLessonProgress);
    }
  }, []);

  const saveEnrollments = (updated: Enrollment[]) => {
    setEnrollments(updated);
    localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(updated));
  };

  const saveProgress = (updated: LessonProgress[]) => {
    setLessonProgress(updated);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  };

  const categories = ["All", ...Array.from(new Set(courses.map((c) => c.category)))];

  const isEnrolled = (courseId: string): boolean => {
    return enrollments.some((e) => e.courseId === courseId);
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find((e) => e.courseId === courseId);
  };

  const enrollCourse = (courseId: string) => {
    if (isEnrolled(courseId)) return;
    const targetCourse = courses.find((c) => c.id === courseId);
    const firstLessonId = targetCourse?.modules[0]?.lessons[0]?.id;

    const newEnrollment: Enrollment = {
      id: "enr-" + Date.now(),
      userId: user?.id || "user-1",
      courseId,
      enrolledAt: new Date().toISOString().split("T")[0],
      lastAccessedLessonId: firstLessonId,
      progressPercentage: 0,
    };

    const updated = [...enrollments, newEnrollment];
    saveEnrollments(updated);
  };

  const isLessonCompleted = (courseId: string, lessonId: string): boolean => {
    return lessonProgress.some(
      (p) => p.courseId === courseId && p.lessonId === lessonId && p.isCompleted
    );
  };

  const recalculateProgress = (courseId: string, updatedProgress: LessonProgress[]) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    if (totalLessons === 0) return;

    const completedLessons = updatedProgress.filter(
      (p) => p.courseId === courseId && p.isCompleted
    ).length;

    const percentage = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

    const updatedEnrollments = enrollments.map((e) => {
      if (e.courseId === courseId) {
        return { ...e, progressPercentage: percentage };
      }
      return e;
    });

    saveEnrollments(updatedEnrollments);
  };

  const toggleLessonComplete = (courseId: string, lessonId: string) => {
    const existingIndex = lessonProgress.findIndex(
      (p) => p.courseId === courseId && p.lessonId === lessonId
    );

    let updated: LessonProgress[];
    if (existingIndex >= 0) {
      updated = [...lessonProgress];
      updated[existingIndex] = {
        ...updated[existingIndex],
        isCompleted: !updated[existingIndex].isCompleted,
        completedAt: !updated[existingIndex].isCompleted ? new Date().toISOString() : undefined,
      };
    } else {
      updated = [
        ...lessonProgress,
        {
          userId: user?.id || "user-1",
          courseId,
          lessonId,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        },
      ];
    }

    saveProgress(updated);
    recalculateProgress(courseId, updated);
  };

  const markLessonComplete = (courseId: string, lessonId: string) => {
    const existing = lessonProgress.find(
      (p) => p.courseId === courseId && p.lessonId === lessonId
    );
    if (existing?.isCompleted) return;

    const updated = lessonProgress.filter(
      (p) => !(p.courseId === courseId && p.lessonId === lessonId)
    );
    updated.push({
      userId: user?.id || "user-1",
      courseId,
      lessonId,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });

    saveProgress(updated);
    recalculateProgress(courseId, updated);
  };

  const updateLastAccessedLesson = (courseId: string, lessonId: string) => {
    const updated = enrollments.map((e) => {
      if (e.courseId === courseId) {
        return { ...e, lastAccessedLessonId: lessonId };
      }
      return e;
    });
    saveEnrollments(updated);
  };

  const getCourseLessons = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return [];
    return course.modules.flatMap((m) => m.lessons);
  };

  const getNextLessonId = (courseId: string, currentLessonId: string): string | null => {
    const lessons = getCourseLessons(courseId);
    const index = lessons.findIndex((l) => l.id === currentLessonId);
    if (index >= 0 && index < lessons.length - 1) {
      return lessons[index + 1].id;
    }
    return null;
  };

  const getPrevLessonId = (courseId: string, currentLessonId: string): string | null => {
    const lessons = getCourseLessons(courseId);
    const index = lessons.findIndex((l) => l.id === currentLessonId);
    if (index > 0) {
      return lessons[index - 1].id;
    }
    return null;
  };

  const getCourseProgress = (courseId: string): number => {
    const enr = enrollments.find((e) => e.courseId === courseId);
    return enr ? enr.progressPercentage : 0;
  };

  // Stats calculation
  const totalEnrolledCount = enrollments.length;
  const completedCount = enrollments.filter((e) => e.progressPercentage === 100).length;
  const inProgressCount = enrollments.filter(
    (e) => e.progressPercentage >= 0 && e.progressPercentage < 100
  ).length;

  const overallProgress =
    totalEnrolledCount > 0
      ? Math.round(
          enrollments.reduce((acc, curr) => acc + curr.progressPercentage, 0) /
            totalEnrolledCount
        )
      : 0;

  // Most relevant course to continue
  const continueCourse = (() => {
    if (enrollments.length === 0) return null;
    // Prefer in-progress course, or first enrolled
    const activeEnr =
      enrollments.find((e) => e.progressPercentage > 0 && e.progressPercentage < 100) ||
      enrollments[0];
    const course = courses.find((c) => c.id === activeEnr.courseId);
    if (!course) return null;

    const lessons = course.modules.flatMap((m) => m.lessons);
    // Find first uncompleted lesson, or last accessed, or first lesson
    let targetLesson = lessons.find(
      (l) => !isLessonCompleted(course.id, l.id)
    );
    if (!targetLesson && activeEnr.lastAccessedLessonId) {
      targetLesson = lessons.find((l) => l.id === activeEnr.lastAccessedLessonId);
    }
    const nextLessonId = targetLesson ? targetLesson.id : lessons[0]?.id || "";

    return {
      course,
      enrollment: activeEnr,
      nextLessonId,
    };
  })();

  return (
    <LMSContext.Provider
      value={{
        courses,
        enrollments,
        lessonProgress,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        categories,
        isEnrolled,
        enrollCourse,
        getCourseProgress,
        getEnrollment,
        isLessonCompleted,
        toggleLessonComplete,
        markLessonComplete,
        updateLastAccessedLesson,
        getNextLessonId,
        getPrevLessonId,
        totalEnrolledCount,
        inProgressCount,
        completedCount,
        overallProgress,
        continueCourse,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error("useLMS must be used within an LMSProvider");
  }
  return context;
};
