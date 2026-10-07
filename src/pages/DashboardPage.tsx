import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Play,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { useLMS } from "../context/LMSContext";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { API_URL } from "../config";

interface DashboardCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalLessons: number;
}

const getImageUrl = (url?: string | null): string => {
  if (!url) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const DashboardPage: React.FC = () => {
  const {
    courses,
    loadingCourses,
    coursesError,
    isEnrolled,
    getCourseProgress,
  } = useLMS();

  const dashboardCourses: DashboardCourse[] = useMemo(() => {
    return courses
      .filter(
        (course) =>
          !course.status ||
          course.status.toLowerCase() === "active"
      )
      .map((course) => {
        return {
          id: String(course.id),
          title: course.title,
          description:
            course.description ||
            "Explore this course and start learning.",
          thumbnail: getImageUrl(course.thumbnail),
          totalLessons: course.totalLessons ?? 0,
        };
      });
  }, [courses]);

  const visibleCourses = dashboardCourses;

  /*
   * ============================================================
   * STATISTICS
   * ============================================================
   */

  const enrolledCourses = visibleCourses.filter((course) =>
    isEnrolled(course.id)
  );

  const completedCourses = enrolledCourses.filter(
    (course) =>
      getCourseProgress(course.id) === 100
  );

  const inProgressCourses = enrolledCourses.filter(
    (course) => {
      const progress = getCourseProgress(course.id);

      return progress > 0 && progress < 100;
    }
  );

  /*
   * ============================================================
   * CONTINUE LEARNING
   * ============================================================
   */

  const continueCourse =
    inProgressCourses[0] ||
    enrolledCourses.find(
      (course) => getCourseProgress(course.id) < 100
    );

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loadingCourses) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />

          <p className="text-sm text-slate-500">
            Loading your courses...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * DASHBOARD
   * ============================================================
   */

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Continue learning and explore your LMS courses.
        </p>
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {coursesError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div>
            <p className="text-sm font-semibold text-red-800">
              Unable to load backend courses
            </p>

            <p className="mt-1 text-xs text-red-700">
              {coursesError}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          STAT CARDS
      ======================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Available Courses
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {visibleCourses.length}
              </p>
            </div>

            <div className="rounded-lg bg-indigo-50 p-3">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Enrolled
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {enrolledCourses.length}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                In Progress
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inProgressCourses.length}
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 p-3">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {completedCourses.length}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTINUE LEARNING
      ======================================================= */}

      {continueCourse && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Continue Learning
              </h2>

              <p className="text-xs text-slate-500">
                Pick up where you left off.
              </p>
            </div>

            <Link
              to="/my-learning"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              My Learning
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
              <img
                src={continueCourse.thumbnail}
                alt={continueCourse.title}
                className="h-full min-h-[180px] w-full object-cover"
              />

              <div className="flex flex-col justify-center p-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {continueCourse.title}
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                  {continueCourse.description}
                </p>

                <div className="mt-5 max-w-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Your progress
                    </span>

                    <span className="text-xs font-bold text-indigo-600">
                      {getCourseProgress(
                        continueCourse.id
                      )}
                      %
                    </span>
                  </div>

                  <Progress
                    value={getCourseProgress(
                      continueCourse.id
                    )}
                    size="sm"
                  />
                </div>

                <div className="mt-5">
                  <Link
                    to={`/courses/${continueCourse.id}`}
                  >
                    <Button
                      size="sm"
                      className="gap-2 font-semibold"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Continue Course
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          COURSES FROM BACKEND
      ======================================================= */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Available Courses
            </h2>

            <p className="text-xs text-slate-500">
              Courses available from the LMS backend.
            </p>
          </div>

          <Link
            to="/courses"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {visibleCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No courses available
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              There are currently no active LMS courses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.slice(0, 6).map((course) => {
              const enrolled = isEnrolled(course.id);
              const progress = getCourseProgress(
                course.id
              );

              const lessonCount = course.totalLessons;

              return (
                <div
                  key={course.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link
                    to={`/courses/${course.id}`}
                    className="block"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {enrolled && (
                        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                          {progress}% complete
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-5">
                    <Link
                      to={`/courses/${course.id}`}
                    >
                      <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-indigo-600">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {course.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />

                        <span>
                          {lessonCount}{" "}
                          {lessonCount === 1
                            ? "lesson"
                            : "lessons"}
                        </span>
                      </div>
                    </div>

                    {enrolled && (
                      <div className="mt-4">
                        <Progress
                          value={progress}
                          size="sm"
                          showLabel
                        />
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/courses/${course.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full gap-1.5 font-semibold"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />

                          {enrolled
                            ? "Continue"
                            : "View Course"}
                        </Button>
                      </Link>

                      <Link
                        to={`/courses/${course.id}`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================
          CONTENT STATUS
      ======================================================= */}

    </div>
  );
};

export default DashboardPage;