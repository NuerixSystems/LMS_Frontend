// src/pages/CoursesPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Play, Loader2 } from "lucide-react";

import { useLMS } from "../context/LMSContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { courses, getCourseProgress, loadingCourses } = useLMS();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  if (loadingCourses && courses.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Courses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Continue your learning journey.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 font-semibold text-slate-900">
            No courses found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            No LMS courses were returned. A course added in CRM must also be
            synced or linked to the LMS before learners can see its lessons
            here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const progress = getCourseProgress(course.id);
            const totalLessons =
              course.totalLessons ||
              course.modules.reduce((s, m) => s + m.lessons.length, 0);

            return (
              <div
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="relative aspect-video cursor-pointer overflow-hidden bg-slate-100"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
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
                    <Badge className="border-none bg-white/95 text-slate-800">
                      Course
                    </Badge>
                  </div>

                  {progress > 0 && progress < 100 && (
                    <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                      {progress}% complete
                    </div>
                  )}

                  {progress === 100 && (
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                      Completed
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" />
                    LMS Course
                    <span>•</span>
                    <span className="capitalize">Active</span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
                    {course.description || "Start learning this course."}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      {totalLessons}{" "}
                      {totalLessons === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="flex-1 gap-2"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      {progress > 0 ? "Continue" : "Start Course"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;