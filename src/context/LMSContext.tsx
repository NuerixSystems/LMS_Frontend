// src/context/LMSContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

import { Course, Enrollment, LessonProgress } from "../types";

import {
  initialEnrollments,
  initialLessonProgress,
} from "../data/mockCourses";

import { useAuth } from "./AuthContext";
import { LMS_API, readJson } from "../config";

// ============================================================
// TYPES
// ============================================================

interface LMSContextType {
  courses: Course[];
  enrollments: Enrollment[];
  lessonProgress: LessonProgress[];

  loadingCourses: boolean;
  coursesError: string;
  courseContentErrors: Record<string, string>;
  refreshCourses: () => Promise<void>;

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

interface BackendCourse {
  course_id: number;
  tenant_id: number;
  crm_product_id?: number | null;
  title: string;
  description?: string | null;
  price?: number | string | null;
  thumbnail_url?: string | null;
  status?: string | null;
}

interface BackendContent {
  content_id: number;
  course_link_id?: number;
  course_id: number;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  video_url?: string | null;
  display_order?: number | null;
  sort_order?: number | null;
  is_preview?: boolean;
  status?: string | null;
}

interface BackendCourseContentResponse {
  detail?: string;
  course_id?: number;
  tenant_id?: number;
  title?: string;
  description?: string;
  thumbnail_url?: string | null;
  price?: number | string | null;
  status?: string;
  contents?: BackendContent[];
  total_lessons?: number;
}

// ============================================================
// CONTEXT
// ============================================================

export const LMSContext = createContext<LMSContextType | undefined>(undefined);

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error("useLMS must be used within an LMSProvider");
  }
  return context;
};

// ============================================================
// STORAGE KEYS
// ============================================================

const ENROLLMENTS_KEY = "lms_enrollments";
const PROGRESS_KEY = "lms_lesson_progress";
const DEFAULT_COURSE_THUMBNAIL =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";

const getStoredEnrolledCourseIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(ENROLLMENTS_KEY);
    if (!stored) return new Set();

    const enrollments: unknown = JSON.parse(stored);
    if (!Array.isArray(enrollments)) {
      console.error("Stored LMS enrollments must be an array.");
      return new Set();
    }

    return new Set(
      enrollments
        .map((enrollment) => enrollment?.courseId)
        .filter((courseId): courseId is string => typeof courseId === "string")
    );
  } catch (error) {
    console.error("Failed reading stored LMS enrollments:", error);
    return new Set();
  }
};

// ============================================================
// PROVIDER
// ============================================================

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [courseContentErrors, setCourseContentErrors] = useState<
    Record<string, string>
  >({});
  const coursesRequestRef = useRef<Promise<void> | null>(null);

  // ----------------------------------------------------------
  // AUTH TOKEN
  // ----------------------------------------------------------

  const getToken = useCallback((): string | null => {
    const possibleKeys = [
      "lms_auth_token",
      "token",
      "access_token",
      "accessToken",
      "auth_token",
      "jwt",
      "lms_token",
    ];

    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }

    return null;
  }, []);

  // ----------------------------------------------------------
  // API HEADERS
  // ----------------------------------------------------------

  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = getToken();

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, [getToken]);

  // ----------------------------------------------------------
  // LOAD COURSES + CONTENT FROM BACKEND
  // ----------------------------------------------------------

  const loadCoursesRequest = useCallback(async () => {
    setCoursesError("");
    setCourseContentErrors({});
    setLoadingCourses(true);

    try {
      // -------- STEP 1: Fetch all courses --------
      const coursesResponse = await fetch(`${LMS_API}/courses`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const coursesData = await readJson(coursesResponse);

      if (!coursesResponse.ok) {
        console.error(
          "LMS courses API error:",
          coursesResponse.status,
          coursesData
        );
        setCoursesError(
          coursesData?.detail ||
            `Failed to load LMS courses (${coursesResponse.status}).`
        );
        setCourses([]);
        return;
      }

      const backendCourses: BackendCourse[] = Array.isArray(coursesData)
        ? coursesData
        : Array.isArray(coursesData?.courses)
        ? coursesData.courses
        : [];
      const enrolledCourseIds = getStoredEnrolledCourseIds();
      const contentErrors: Record<string, string> = {};

      // -------- STEP 2: Fetch protected content for enrolled courses only --------
      const frontendCourses: Course[] = await Promise.all(
        backendCourses.map(async (backendCourse) => {
          let contents: BackendContent[] = [];

          if (enrolledCourseIds.has(String(backendCourse.course_id))) {
            try {
              const contentResponse = await fetch(
                `${LMS_API}/courses/${backendCourse.course_id}/content`,
                {
                  method: "GET",
                  headers: getAuthHeaders(),
                }
              );

              const contentData: BackendCourseContentResponse =
                await readJson(contentResponse);

              if (!contentResponse.ok) {
                contentErrors[String(backendCourse.course_id)] =
                  contentData?.detail ||
                  `Unable to load course content (${contentResponse.status}).`;
                console.error(
                  `Course content error for course ${backendCourse.course_id}:`,
                  contentResponse.status,
                  contentData
                );
              } else {
                // Backend can return either:
                //   [ ... ]  OR  { contents: [ ... ] }  OR  { links: [ ... ] }
                if (Array.isArray(contentData)) {
                  contents = contentData as unknown as BackendContent[];
                } else if (
                  contentData &&
                  Array.isArray(contentData.contents)
                ) {
                  contents = contentData.contents;
                } else if (
                  contentData &&
                  Array.isArray((contentData as any).links)
                ) {
                  contents = (contentData as any).links;
                }
              }
            } catch (error) {
              contentErrors[String(backendCourse.course_id)] =
                error instanceof Error
                  ? error.message
                  : "Unable to connect while loading course content.";
              console.error(
                `Failed loading content for course ${backendCourse.course_id}`,
                error
              );
            }
          }

          // -------- Convert backend contents -> frontend lessons --------
          const sortedContents = [...contents].sort((a, b) => {
            const orderA = a.sort_order ?? a.display_order ?? 0;
            const orderB = b.sort_order ?? b.display_order ?? 0;
            return orderA - orderB;
          });

          const lessons = sortedContents.map((content, index) => {
            const videoUrl = content.video_url || content.url || "";

            const lessonId = String(
              content.content_id ??
                content.course_link_id ??
                `${backendCourse.course_id}-${index + 1}`
            );

            return {
              id: lessonId,
              title: content.title || `Lesson ${index + 1}`,
              description: content.description || "",
              videoUrl,
              duration: "Video",
              order:
                content.sort_order ?? content.display_order ?? index + 1,
            };
          });

          // -------- Build module --------
          const module = {
            id: `module-${backendCourse.course_id}`,
            title: "Course Content",
            lessons,
          };

          // -------- Build frontend Course --------
          const frontendCourse: Course = {
            id: String(backendCourse.course_id),
            title: backendCourse.title || "Untitled Course",
            description: backendCourse.description || "",
            shortDescription: backendCourse.description || "",
            thumbnail:
              backendCourse.thumbnail_url || DEFAULT_COURSE_THUMBNAIL,
            category: "Course",
            level: "All Levels",
            rating: 0,
            enrolledCount: 0,
            duration: "Self-paced",
            totalLessons: lessons.length,
            status: backendCourse.status,
            instructor: "Jayakumar",
            instructorTitle: "Instructor",
            instructorAvatar:
              "https://ui-avatars.com/api/?name=Jayakumar",
            modules: [module],
          };

          return frontendCourse;
        })
      );

      setCourses(frontendCourses);
      setCourseContentErrors(contentErrors);

      console.log("LMS courses loaded:", frontendCourses);
    } catch (error) {
      console.error("Failed loading LMS courses:", error);
      setCoursesError(
        error instanceof Error
          ? error.message
          : "Unable to load LMS courses."
      );
      setCourseContentErrors({});
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [getAuthHeaders]);

  const loadCourses = useCallback(() => {
    if (coursesRequestRef.current) {
      return coursesRequestRef.current;
    }

    const sharedRequest = loadCoursesRequest().finally(() => {
      if (coursesRequestRef.current === sharedRequest) {
        coursesRequestRef.current = null;
      }
    });
    coursesRequestRef.current = sharedRequest;
    return sharedRequest;
  }, [loadCoursesRequest]);

  // ----------------------------------------------------------
  // LOAD COURSES WHEN USER IS AVAILABLE
  // ----------------------------------------------------------

  useEffect(() => {
    if (!user) {
      setCourses([]);
      setCoursesError("");
      setLoadingCourses(false);
      return;
    }

    loadCourses();
  }, [user, loadCourses]);

  // ----------------------------------------------------------
  // LOAD LOCAL ENROLLMENTS + PROGRESS
  // ----------------------------------------------------------

  useEffect(() => {
    try {
      const storedEnrollments = localStorage.getItem(ENROLLMENTS_KEY);
      const storedProgress = localStorage.getItem(PROGRESS_KEY);

      if (storedEnrollments) {
        setEnrollments(JSON.parse(storedEnrollments));
      } else {
        setEnrollments(initialEnrollments);
        localStorage.setItem(
          ENROLLMENTS_KEY,
          JSON.stringify(initialEnrollments)
        );
      }

      if (storedProgress) {
        setLessonProgress(JSON.parse(storedProgress));
      } else {
        setLessonProgress(initialLessonProgress);
        localStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify(initialLessonProgress)
        );
      }
    } catch (error) {
      console.error("Failed loading LMS localStorage state:", error);
      setEnrollments(initialEnrollments);
      setLessonProgress(initialLessonProgress);
    }
  }, []);

  // ----------------------------------------------------------
  // SAVE HELPERS
  // ----------------------------------------------------------

  const saveEnrollments = useCallback((updated: Enrollment[]) => {
    setEnrollments(updated);
    localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(updated));
  }, []);

  const saveProgress = useCallback((updated: LessonProgress[]) => {
    setLessonProgress(updated);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  }, []);

  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(courses.map((course) => course.category))),
    ];
  }, [courses]);

  // ----------------------------------------------------------
  // ENROLLMENT QUERIES
  // ----------------------------------------------------------

  const isEnrolled = useCallback(
    (courseId: string): boolean => {
      return enrollments.some((enrollment) => enrollment.courseId === courseId);
    },
    [enrollments]
  );

  const getEnrollment = useCallback(
    (courseId: string) => {
      return enrollments.find((enrollment) => enrollment.courseId === courseId);
    },
    [enrollments]
  );

  // ----------------------------------------------------------
  // ENROLL COURSE
  // ----------------------------------------------------------

  const enrollCourse = useCallback(
    (courseId: string) => {
      if (isEnrolled(courseId)) return;

      const targetCourse = courses.find((course) => course.id === courseId);
      const firstLessonId = targetCourse?.modules?.[0]?.lessons?.[0]?.id;

      const newEnrollment: Enrollment = {
        id: "enr-" + Date.now(),
        userId: user?.id || "user-1",
        courseId,
        enrolledAt: new Date().toISOString().split("T")[0],
        lastAccessedLessonId: firstLessonId,
        progressPercentage: 0,
      };

      const pendingCoursesRequest = coursesRequestRef.current;
      saveEnrollments([...enrollments, newEnrollment]);

      if (pendingCoursesRequest) {
        void pendingCoursesRequest.then(() => loadCourses());
      } else {
        void loadCourses();
      }
    },
    [isEnrolled, courses, user, enrollments, saveEnrollments, loadCourses]
  );

  // ----------------------------------------------------------
  // LESSON COMPLETION QUERY
  // ----------------------------------------------------------

  const isLessonCompleted = useCallback(
    (courseId: string, lessonId: string): boolean => {
      return lessonProgress.some(
        (progress) =>
          progress.courseId === courseId &&
          progress.lessonId === lessonId &&
          progress.isCompleted
      );
    },
    [lessonProgress]
  );

  // ----------------------------------------------------------
  // RECALCULATE COURSE PROGRESS
  // ----------------------------------------------------------

  const recalculateProgress = useCallback(
    (courseId: string, updatedProgress: LessonProgress[]) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) return;

      const totalLessons = course.modules.reduce(
        (total, module) => total + module.lessons.length,
        0
      );

      if (totalLessons === 0) return;

      const completedLessons = updatedProgress.filter(
        (progress) =>
          progress.courseId === courseId && progress.isCompleted
      ).length;

      const percentage = Math.min(
        100,
        Math.round((completedLessons / totalLessons) * 100)
      );

      const updatedEnrollments = enrollments.map((enrollment) => {
        if (enrollment.courseId === courseId) {
          return {
            ...enrollment,
            progressPercentage: percentage,
          };
        }
        return enrollment;
      });

      saveEnrollments(updatedEnrollments);
    },
    [courses, enrollments, saveEnrollments]
  );

  // ----------------------------------------------------------
  // TOGGLE LESSON COMPLETE
  // ----------------------------------------------------------

  const toggleLessonComplete = useCallback(
    (courseId: string, lessonId: string) => {
      const existingIndex = lessonProgress.findIndex(
        (progress) =>
          progress.courseId === courseId && progress.lessonId === lessonId
      );

      let updated: LessonProgress[];

      if (existingIndex >= 0) {
        updated = [...lessonProgress];
        const existing = updated[existingIndex];
        const nextCompleted = !existing.isCompleted;

        updated[existingIndex] = {
          ...existing,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
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
    },
    [lessonProgress, user, saveProgress, recalculateProgress]
  );

  // ----------------------------------------------------------
  // MARK LESSON COMPLETE (idempotent)
  // ----------------------------------------------------------

  const markLessonComplete = useCallback(
    (courseId: string, lessonId: string) => {
      const existing = lessonProgress.find(
        (progress) =>
          progress.courseId === courseId && progress.lessonId === lessonId
      );

      if (existing?.isCompleted) return;

      const updated = lessonProgress.filter(
        (progress) =>
          !(
            progress.courseId === courseId && progress.lessonId === lessonId
          )
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
    },
    [lessonProgress, user, saveProgress, recalculateProgress]
  );

  // ----------------------------------------------------------
  // UPDATE LAST ACCESSED LESSON
  // ----------------------------------------------------------

  const updateLastAccessedLesson = useCallback(
    (courseId: string, lessonId: string) => {
      const currentEnrollment = enrollments.find(
        (enrollment) => enrollment.courseId === courseId
      );

      if (
        !currentEnrollment ||
        currentEnrollment.lastAccessedLessonId === lessonId
      ) {
        return;
      }

      const updated = enrollments.map((enrollment) => {
        if (enrollment.courseId === courseId) {
          return {
            ...enrollment,
            lastAccessedLessonId: lessonId,
          };
        }
        return enrollment;
      });

      saveEnrollments(updated);
    },
    [enrollments, saveEnrollments]
  );

  // ----------------------------------------------------------
  // GET ALL LESSONS FOR A COURSE
  // ----------------------------------------------------------

  const getCourseLessons = useCallback(
    (courseId: string) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) return [];
      return course.modules.flatMap((module) => module.lessons);
    },
    [courses]
  );

  // ----------------------------------------------------------
  // NEXT LESSON
  // ----------------------------------------------------------

  const getNextLessonId = useCallback(
    (courseId: string, currentLessonId: string): string | null => {
      const lessons = getCourseLessons(courseId);
      const index = lessons.findIndex(
        (lesson) => lesson.id === currentLessonId
      );

      if (index >= 0 && index < lessons.length - 1) {
        return lessons[index + 1].id;
      }

      return null;
    },
    [getCourseLessons]
  );

  // ----------------------------------------------------------
  // PREVIOUS LESSON
  // ----------------------------------------------------------

  const getPrevLessonId = useCallback(
    (courseId: string, currentLessonId: string): string | null => {
      const lessons = getCourseLessons(courseId);
      const index = lessons.findIndex(
        (lesson) => lesson.id === currentLessonId
      );

      if (index > 0) {
        return lessons[index - 1].id;
      }

      return null;
    },
    [getCourseLessons]
  );

  // ----------------------------------------------------------
  // COURSE PROGRESS
  // ----------------------------------------------------------

  const getCourseProgress = useCallback(
    (courseId: string): number => {
      const enrollment = enrollments.find(
        (item) => item.courseId === courseId
      );
      return enrollment ? enrollment.progressPercentage : 0;
    },
    [enrollments]
  );

  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  const totalEnrolledCount = enrollments.length;

  const completedCount = enrollments.filter(
    (enrollment) => enrollment.progressPercentage === 100
  ).length;

  const inProgressCount = enrollments.filter(
    (enrollment) =>
      enrollment.progressPercentage > 0 &&
      enrollment.progressPercentage < 100
  ).length;

  const overallProgress =
    totalEnrolledCount > 0
      ? Math.round(
          enrollments.reduce(
            (total, enrollment) => total + enrollment.progressPercentage,
            0
          ) / totalEnrolledCount
        )
      : 0;

  // ----------------------------------------------------------
  // CONTINUE COURSE
  // ----------------------------------------------------------

  const continueCourse = useMemo(() => {
    if (enrollments.length === 0) return null;

    const activeEnrollment =
      enrollments.find(
        (enrollment) =>
          enrollment.progressPercentage > 0 &&
          enrollment.progressPercentage < 100
      ) || enrollments[0];

    const course = courses.find(
      (item) => item.id === activeEnrollment.courseId
    );

    if (!course) return null;

    const lessons = course.modules.flatMap((module) => module.lessons);

    let targetLesson = lessons.find(
      (lesson) => !isLessonCompleted(course.id, lesson.id)
    );

    if (!targetLesson && activeEnrollment.lastAccessedLessonId) {
      targetLesson = lessons.find(
        (lesson) => lesson.id === activeEnrollment.lastAccessedLessonId
      );
    }

    const nextLessonId = targetLesson?.id || lessons[0]?.id || "";

    if (!nextLessonId) return null;

    return {
      course,
      enrollment: activeEnrollment,
      nextLessonId,
    };
  }, [enrollments, courses, isLessonCompleted]);

  // ----------------------------------------------------------
  // PROVIDER
  // ----------------------------------------------------------

  return (
    <LMSContext.Provider
      value={{
        courses,
        enrollments,
        lessonProgress,

        loadingCourses,
        coursesError,
        courseContentErrors,
        refreshCourses: loadCourses,

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