// src/pages/DashboardPage.tsx
import React from "react";
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
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

export const DashboardPage: React.FC = () => {
  const {
    courses,
    isEnrolled,
    getCourseProgress,
    totalEnrolledCount,
    inProgressCount,
    completedCount,
    continueCourse,
    loadingCourses,
  } = useLMS();

  if (loadingCourses && courses.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Continue learning and explore your LMS courses.
          </p>
        </div>
        <Link to="/courses">
          <Button variant="outline" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Courses
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Available Courses
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {courses.length}
              </p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Enrolled</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalEnrolledCount}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">In Progress</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inProgressCount}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {completedCount}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* CONTINUE LEARNING */}
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

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
              {continueCourse.course.thumbnail ? (
                <img
                  src={continueCourse.course.thumbnail}
                  alt={continueCourse.course.title}
                  className="aspect-video h-full w-full object-cover md:aspect-auto md:min-h-[220px]"
                />
              ) : (
                <div className="flex aspect-video h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 md:aspect-auto md:min-h-[220px]">
                  <BookOpen className="h-14 w-14 text-white/80" />
                </div>
              )}

              <div className="flex flex-col justify-center p-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {continueCourse.course.title}
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                  {continueCourse.course.description}
                </p>

                <div className="mt-5 max-w-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Your progress
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      {getCourseProgress(continueCourse.course.id)}%
                    </span>
                  </div>
                  <Progress
                    value={getCourseProgress(continueCourse.course.id)}
                    size="sm"
                  />
                </div>

                <div className="mt-5">
                  <Link
                    to={`/courses/${continueCourse.course.id}/learn/${continueCourse.nextLessonId}`}
                  >
                    <Button size="sm" className="gap-2 font-semibold">
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

      {/* AVAILABLE COURSES */}
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

        {courses.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => {
              const enrolled = isEnrolled(course.id);
              const progress = getCourseProgress(course.id);
              const totalLessons =
                course.totalLessons ||
                course.modules.reduce((s, m) => s + m.lessons.length, 0);

              return (
                <div
                  key={course.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link to={`/courses/${course.id}`} className="block">
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600">
                          <BookOpen className="h-14 w-14 text-white/80" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3">
                        <Badge className="border-none bg-white/95 text-slate-800 shadow-sm">
                          Course
                        </Badge>
                      </div>
                      {enrolled && (
                        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                          {progress}% complete
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      LMS Course
                      <span>•</span>
                      <span className="capitalize">Active</span>
                    </div>

                    <Link to={`/courses/${course.id}`}>
                      <h3 className="line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-indigo-600">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
                      {course.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>
                          {totalLessons}{" "}
                          {totalLessons === 1 ? "lesson" : "lessons"}
                        </span>
                      </div>
                    </div>

                    {enrolled && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <Progress value={progress} size="sm" showLabel />
                      </div>
                    )}

                    <div className="mt-5 flex gap-2">
                      <Link to={`/courses/${course.id}`} className="flex-1">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full gap-1.5 font-semibold"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          {enrolled ? "Continue" : "View Course"}
                        </Button>
                      </Link>

                      <Link to={`/courses/${course.id}`}>
                        <Button variant="outline" size="sm">
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
    </div>
  );
};

export default DashboardPage;