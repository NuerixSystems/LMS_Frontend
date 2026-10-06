
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import {
  Course,
  Enrollment,
  LessonProgress,
} from "../types";

import {
  initialEnrollments,
  initialLessonProgress,
} from "../data/mockCourses";

import { useAuth } from "./AuthContext";
import { LMS_API, readJson } from "../config";

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

  toggleLessonComplete: (
    courseId: string,
    lessonId: string
  ) => void;

  markLessonComplete: (
    courseId: string,
    lessonId: string
  ) => void;

  updateLastAccessedLesson: (
    courseId: string,
    lessonId: string
  ) => void;

  getNextLessonId: (
    courseId: string,
    currentLessonId: string
  ) => string | null;

  getPrevLessonId: (
    courseId: string,
    currentLessonId: string
  ) => string | null;

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

export const LMSContext = createContext<LMSContextType | undefined>(
  undefined
);

export const useLMS = () => {
  const context = useContext(LMSContext);

  if (!context) {
    throw new Error("useLMS must be used within an LMSProvider");
  }

  return context;
};

const ENROLLMENTS_KEY = "lms_enrollments";
const PROGRESS_KEY = "lms_lesson_progress";

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
  course_id: number;
  tenant_id?: number;
  title?: string;
  description?: string;
  thumbnail_url?: string | null;
  price?: number | string | null;
  status?: string;
  contents?: BackendContent[];
  total_lessons?: number;
}

export const LMSProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();

  /**
   * ============================================================
   * COURSES
   * ============================================================
   *
   * IMPORTANT:
   * Do NOT use initialCourses here.
   *
   * Courses are now loaded from the FastAPI LMS backend.
   */
  const [courses, setCourses] = useState<Course[]>([]);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>(
    []
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loadingCourses, setLoadingCourses] = useState(true);

  /**
   * ============================================================
   * AUTH TOKEN
   * ============================================================
   */
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

      if (value) {
        return value;
      }
    }

    return null;
  }, []);

  /**
   * ============================================================
   * API HEADERS
   * ============================================================
   */
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

  /**
   * ============================================================
   * LOAD COURSES + CONTENT
   * ============================================================
   */
  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);

    try {
      /**
       * --------------------------------------------------------
       * STEP 1
       * Get enrolled courses
       *
       * GET /api/lms/courses
       * --------------------------------------------------------
       */
      const coursesResponse = await fetch(
        `${LMS_API}/courses`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const coursesData = await readJson(coursesResponse);

      if (!coursesResponse.ok) {
        console.error(
          "LMS courses API error:",
          coursesResponse.status,
          coursesData
        );

        setCourses([]);
        return;
      }

      /**
       * Backend returns:
       *
       * [
       *   {
       *     course_id,
       *     tenant_id,
       *     title,
       *     ...
       *   }
       * ]
       */
      const backendCourses: BackendCourse[] = Array.isArray(
        coursesData
      )
        ? coursesData
        : Array.isArray(coursesData?.courses)
        ? coursesData.courses
        : [];

      /**
       * --------------------------------------------------------
       * STEP 2
       * Load content for every course
       * --------------------------------------------------------
       */
      const frontendCourses: Course[] = await Promise.all(
        backendCourses.map(async (backendCourse) => {
          let contents: BackendContent[] = [];

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
              console.error(
                `Course content error for course ${backendCourse.course_id}:`,
                contentResponse.status,
                contentData
              );
            } else {
              if (Array.isArray(contentData)) {
                contents = contentData;
              } else if (Array.isArray(contentData?.contents)) {
                contents = contentData.contents;
              }
            }
          } catch (error) {
            console.error(
              `Failed loading content for course ${backendCourse.course_id}`,
              error
            );
          }

          /**
           * ----------------------------------------------------
           * Convert backend contents -> frontend lessons
           * ----------------------------------------------------
           */
          const lessons = contents
            .sort((a, b) => {
              const orderA =
                a.sort_order ??
                a.display_order ??
                0;

              const orderB =
                b.sort_order ??
                b.display_order ??
                0;

              return orderA - orderB;
            })
            .map((content, index) => {
              /**
               * Backend can provide either:
               *
               * video_url
               * OR
               * url
               *
               * Prefer video_url.
               */
              const videoUrl =
                content.video_url ||
                content.url ||
                "";

              return {
                id: String(
                  content.content_id ??
                    content.course_link_id ??
                    `${backendCourse.course_id}-${index + 1}`
                ),

                title:
                  content.title ||
                  `Lesson ${index + 1}`,

                description:
                  content.description || "",

                /**
                 * IMPORTANT:
                 * LearningPage uses currentLesson.videoUrl
                 */
                videoUrl,

                /**
                 * Backend CourseLink does not currently
                 * provide duration.
                 */
                duration: "Video",

                order:
                  content.sort_order ??
                  content.display_order ??
                  index + 1,
              };
            });

          /**
           * ----------------------------------------------------
           * Convert lessons into the existing frontend module
           * structure.
           *
           * Existing pages expect:
           *
           * course.modules[].lessons[]
           * ----------------------------------------------------
           */
          const module = {
            id: `module-${backendCourse.course_id}`,

            title: "Course Content",

            lessons,
          };

          /**
           * ----------------------------------------------------
           * Build Course object expected by your UI.
           * ----------------------------------------------------
           *
           * Some fields such as category, rating, instructor,
           * etc. are not returned by the current backend API.
           *
           * Keep safe defaults so existing UI does not crash.
           */
          const frontendCourse = {
            id: String(backendCourse.course_id),

            title: backendCourse.title || "Untitled Course",

            description:
              backendCourse.description || "",

            thumbnail:
              backendCourse.thumbnail_url ||
              "",

            category: "Course",

            level: "All Levels",

            rating: 0,

            enrolledCount: 0,

            duration: "Self-paced",

            totalLessons: lessons.length,

            instructor: "Nuerix Systems",

            instructorTitle: "Instructor",

            instructorAvatar:
              "https://ui-avatars.com/api/?name=Nuerix+Systems",

            modules: [module],
          } as Course;

          return frontendCourse;
        })
      );

      setCourses(frontendCourses);

      console.log(
        "LMS courses loaded:",
        frontendCourses
      );
    } catch (error) {
      console.error(
        "Failed loading LMS courses:",
        error
      );

      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [getAuthHeaders]);

  /**
   * ============================================================
   * LOAD COURSES WHEN USER IS AVAILABLE
   * ============================================================
   */
  useEffect(() => {
    if (!user) {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }

    loadCourses();
  }, [user, loadCourses]);

  /**
   * ============================================================
   * LOAD LOCAL ENROLLMENTS + PROGRESS
   * ============================================================
   *
   * Keep your existing localStorage logic.
   */
  useEffect(() => {
    try {
      const storedEnrollments =
        localStorage.getItem(ENROLLMENTS_KEY);

      const storedProgress =
        localStorage.getItem(PROGRESS_KEY);

      if (storedEnrollments) {
        setEnrollments(
          JSON.parse(storedEnrollments)
        );
      } else {
        setEnrollments(initialEnrollments);

        localStorage.setItem(
          ENROLLMENTS_KEY,
          JSON.stringify(initialEnrollments)
        );
      }

      if (storedProgress) {
        setLessonProgress(
          JSON.parse(storedProgress)
        );
      } else {
        setLessonProgress(initialLessonProgress);

        localStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify(initialLessonProgress)
        );
      }
    } catch (error) {
      console.error(
        "Failed loading LMS localStorage state:",
        error
      );

      setEnrollments(initialEnrollments);
      setLessonProgress(initialLessonProgress);
    }
  }, []);

  /**
   * ============================================================
   * SAVE ENROLLMENTS
   * ============================================================
   */
  const saveEnrollments = useCallback(
    (updated: Enrollment[]) => {
      setEnrollments(updated);

      localStorage.setItem(
        ENROLLMENTS_KEY,
        JSON.stringify(updated)
      );
    },
    []
  );

  /**
   * ============================================================
   * SAVE PROGRESS
   * ============================================================
   */
  const saveProgress = useCallback(
    (updated: LessonProgress[]) => {
      setLessonProgress(updated);

      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(updated)
      );
    },
    []
  );

  /**
   * ============================================================
   * CATEGORIES
   * ============================================================
   */
  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          courses.map(
            (course) => course.category
          )
        )
      ),
    ];
  }, [courses]);

  /**
   * ============================================================
   * ENROLLMENT
   * ============================================================
   */
  const isEnrolled = useCallback(
    (courseId: string): boolean => {
      return enrollments.some(
        (enrollment) =>
          enrollment.courseId === courseId
      );
    },
    [enrollments]
  );

  const getEnrollment = useCallback(
    (courseId: string) => {
      return enrollments.find(
        (enrollment) =>
          enrollment.courseId === courseId
      );
    },
    [enrollments]
  );

  /**
   * ============================================================
   * ENROLL COURSE
   * ============================================================
   */
  const enrollCourse = useCallback(
    (courseId: string) => {
      if (isEnrolled(courseId)) {
        return;
      }

      const targetCourse = courses.find(
        (course) => course.id === courseId
      );

      const firstLessonId =
        targetCourse?.modules?.[0]?.lessons?.[0]?.id;

      const newEnrollment: Enrollment = {
        id: "enr-" + Date.now(),

        userId:
          user?.id || "user-1",

        courseId,

        enrolledAt:
          new Date()
            .toISOString()
            .split("T")[0],

        lastAccessedLessonId:
          firstLessonId,

        progressPercentage: 0,
      };

      saveEnrollments([
        ...enrollments,
        newEnrollment,
      ]);
    },
    [
      isEnrolled,
      courses,
      user,
      enrollments,
      saveEnrollments,
    ]
  );

  /**
   * ============================================================
   * LESSON COMPLETION
   * ============================================================
   */
  const isLessonCompleted = useCallback(
    (
      courseId: string,
      lessonId: string
    ): boolean => {
      return lessonProgress.some(
        (progress) =>
          progress.courseId === courseId &&
          progress.lessonId === lessonId &&
          progress.isCompleted
      );
    },
    [lessonProgress]
  );

  /**
   * ============================================================
   * RECALCULATE COURSE PROGRESS
   * ============================================================
   */
  const recalculateProgress = useCallback(
    (
      courseId: string,
      updatedProgress: LessonProgress[]
    ) => {
      const course = courses.find(
        (item) => item.id === courseId
      );

      if (!course) {
        return;
      }

      const totalLessons =
        course.modules.reduce(
          (total, module) =>
            total + module.lessons.length,
          0
        );

      if (totalLessons === 0) {
        return;
      }

      const completedLessons =
        updatedProgress.filter(
          (progress) =>
            progress.courseId === courseId &&
            progress.isCompleted
        ).length;

      const percentage = Math.min(
        100,
        Math.round(
          (completedLessons /
            totalLessons) *
            100
        )
      );

      const updatedEnrollments =
        enrollments.map((enrollment) => {
          if (
            enrollment.courseId ===
            courseId
          ) {
            return {
              ...enrollment,
              progressPercentage:
                percentage,
            };
          }

          return enrollment;
        });

      saveEnrollments(
        updatedEnrollments
      );
    },
    [
      courses,
      enrollments,
      saveEnrollments,
    ]
  );

  /**
   * ============================================================
   * TOGGLE LESSON COMPLETE
   * ============================================================
   */
  const toggleLessonComplete =
    useCallback(
      (
        courseId: string,
        lessonId: string
      ) => {
        const existingIndex =
          lessonProgress.findIndex(
            (progress) =>
              progress.courseId ===
                courseId &&
              progress.lessonId ===
                lessonId
          );

        let updated: LessonProgress[];

        if (existingIndex >= 0) {
          updated = [
            ...lessonProgress,
          ];

          const existing =
            updated[existingIndex];

          const nextCompleted =
            !existing.isCompleted;

          updated[existingIndex] = {
            ...existing,

            isCompleted:
              nextCompleted,

            completedAt:
              nextCompleted
                ? new Date().toISOString()
                : undefined,
          };
        } else {
          updated = [
            ...lessonProgress,

            {
              userId:
                user?.id || "user-1",

              courseId,

              lessonId,

              isCompleted: true,

              completedAt:
                new Date().toISOString(),
            },
          ];
        }

        saveProgress(updated);

        recalculateProgress(
          courseId,
          updated
        );
      },
      [
        lessonProgress,
        user,
        saveProgress,
        recalculateProgress,
      ]
    );

  /**
   * ============================================================
   * MARK LESSON COMPLETE
   * ============================================================
   */
  const markLessonComplete =
    useCallback(
      (
        courseId: string,
        lessonId: string
      ) => {
        const existing =
          lessonProgress.find(
            (progress) =>
              progress.courseId ===
                courseId &&
              progress.lessonId ===
                lessonId
          );

        if (existing?.isCompleted) {
          return;
        }

        const updated =
          lessonProgress.filter(
            (progress) =>
              !(
                progress.courseId ===
                  courseId &&
                progress.lessonId ===
                  lessonId
              )
          );

        updated.push({
          userId:
            user?.id || "user-1",

          courseId,

          lessonId,

          isCompleted: true,

          completedAt:
            new Date().toISOString(),
        });

        saveProgress(updated);

        recalculateProgress(
          courseId,
          updated
        );
      },
      [
        lessonProgress,
        user,
        saveProgress,
        recalculateProgress,
      ]
    );

  /**
   * ============================================================
   * LAST ACCESSED LESSON
   * ============================================================
   */
  const updateLastAccessedLesson =
    useCallback(
      (
        courseId: string,
        lessonId: string
      ) => {
        const updated =
          enrollments.map(
            (enrollment) => {
              if (
                enrollment.courseId ===
                courseId
              ) {
                return {
                  ...enrollment,
                  lastAccessedLessonId:
                    lessonId,
                };
              }

              return enrollment;
            }
          );

        saveEnrollments(updated);
      },
      [enrollments, saveEnrollments]
    );

  /**
   * ============================================================
   * GET ALL LESSONS
   * ============================================================
   */
  const getCourseLessons = useCallback(
    (courseId: string) => {
      const course = courses.find(
        (item) => item.id === courseId
      );

      if (!course) {
        return [];
      }

      return course.modules.flatMap(
        (module) => module.lessons
      );
    },
    [courses]
  );

  /**
   * ============================================================
   * NEXT LESSON
   * ============================================================
   */
  const getNextLessonId = useCallback(
    (
      courseId: string,
      currentLessonId: string
    ): string | null => {
      const lessons =
        getCourseLessons(courseId);

      const index =
        lessons.findIndex(
          (lesson) =>
            lesson.id ===
            currentLessonId
        );

      if (
        index >= 0 &&
        index <
          lessons.length - 1
      ) {
        return lessons[index + 1].id;
      }

      return null;
    },
    [getCourseLessons]
  );

  /**
   * ============================================================
   * PREVIOUS LESSON
   * ============================================================
   */
  const getPrevLessonId = useCallback(
    (
      courseId: string,
      currentLessonId: string
    ): string | null => {
      const lessons =
        getCourseLessons(courseId);

      const index =
        lessons.findIndex(
          (lesson) =>
            lesson.id ===
            currentLessonId
        );

      if (index > 0) {
        return lessons[index - 1].id;
      }

      return null;
    },
    [getCourseLessons]
  );

  /**
   * ============================================================
   * COURSE PROGRESS
   * ============================================================
   */
  const getCourseProgress =
    useCallback(
      (courseId: string): number => {
        const enrollment =
          enrollments.find(
            (item) =>
              item.courseId ===
              courseId
          );

        return enrollment
          ? enrollment.progressPercentage
          : 0;
      },
      [enrollments]
    );

  /**
   * ============================================================
   * STATS
   * ============================================================
   */
  const totalEnrolledCount =
    enrollments.length;

  const completedCount =
    enrollments.filter(
      (enrollment) =>
        enrollment.progressPercentage ===
        100
    ).length;

  const inProgressCount =
    enrollments.filter(
      (enrollment) =>
        enrollment.progressPercentage >=
          0 &&
        enrollment.progressPercentage <
          100
    ).length;

  const overallProgress =
    totalEnrolledCount > 0
      ? Math.round(
          enrollments.reduce(
            (total, enrollment) =>
              total +
              enrollment.progressPercentage,
            0
          ) / totalEnrolledCount
        )
      : 0;

  /**
   * ============================================================
   * CONTINUE COURSE
   * ============================================================
   */
  const continueCourse =
    useMemo(() => {
      if (enrollments.length === 0) {
        return null;
      }

      const activeEnrollment =
        enrollments.find(
          (enrollment) =>
            enrollment.progressPercentage >
              0 &&
            enrollment.progressPercentage <
              100
        ) || enrollments[0];

      const course = courses.find(
        (item) =>
          item.id ===
          activeEnrollment.courseId
      );

      if (!course) {
        return null;
      }

      const lessons =
        course.modules.flatMap(
          (module) => module.lessons
        );

      let targetLesson =
        lessons.find(
          (lesson) =>
            !isLessonCompleted(
              course.id,
              lesson.id
            )
        );

      if (
        !targetLesson &&
        activeEnrollment.lastAccessedLessonId
      ) {
        targetLesson =
          lessons.find(
            (lesson) =>
              lesson.id ===
              activeEnrollment.lastAccessedLessonId
          );
      }

      const nextLessonId =
        targetLesson?.id ||
        lessons[0]?.id ||
        "";

      if (!nextLessonId) {
        return null;
      }

      return {
        course,

        enrollment:
          activeEnrollment,

        nextLessonId,
      };
    }, [
      enrollments,
      courses,
      isLessonCompleted,
    ]);

  /**
   * ============================================================
   * PROVIDER
   * ============================================================
   */
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
