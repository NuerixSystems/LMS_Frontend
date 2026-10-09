// src/pages/DashboardPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLMS } from "../context/LMSContext";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { courses, enrollments } = useLMS();

  // ==============================
  // ENROLLED COURSES
  // ==============================
  const enrolledCourses = courses.filter((c) =>
    enrollments.some((e) => e.courseId === c.id)
  );

  // ==============================
  // STATS DATA
  // ==============================
  const stats = [
    {
      label: "Enrolled",
      value: enrollments.length,
      icon: "📚",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completed",
      value: enrollments.filter((e) => e.progressPercentage === 100).length,
      icon: "✅",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "In Progress",
      value: enrollments.filter(
        (e) => e.progressPercentage > 0 && e.progressPercentage < 100
      ).length,
      icon: "⏳",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total Hours",
      value: "24",
      icon: "🕐",
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="lms-dashboard-page">

      {/* ==========================================
          WELCOME HEADER
          ========================================== */}
      <header className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Welcome back,{" "}
              <span className="text-indigo-600">
                {user?.name?.split(" ")[0] || "Learner"}
              </span>{" "}
              👋
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1.5">
              Continue your learning journey
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 
                       px-5 py-2.5 
                       bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                       text-white text-sm font-medium rounded-lg
                       transition-colors shadow-sm hover:shadow-md
                       self-start sm:self-auto whitespace-nowrap
                       min-h-[44px]"
          >
            Browse Courses
          </Link>
        </div>
      </header>

      {/* ==========================================
          STATS GRID — 2 cols mobile → 4 cols desktop
          ========================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="lms-stat-card bg-white rounded-xl 
                       border border-slate-100 
                       shadow-sm hover:shadow-md hover:border-slate-200
                       transition-all
                       p-3 sm:p-4 lg:p-5 
                       flex items-center gap-2.5 sm:gap-3 lg:gap-4"
          >
            <div
              className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 
                          rounded-lg 
                          flex items-center justify-center 
                          text-lg sm:text-xl lg:text-2xl 
                          ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 font-medium truncate">
                {stat.label}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-tight mt-0.5">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ==========================================
          ✅ CONTINUE LEARNING — Better Aligned
          ========================================== */}
      <section className="flex flex-col gap-4 sm:gap-5">
        {/* Section header — consistent layout */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              Continue Learning
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
              Pick up where you left off
            </p>
          </div>
          <Link
            to="/my-learning"
            className="inline-flex items-center gap-1 
                       text-xs sm:text-sm font-semibold text-indigo-600 
                       hover:text-indigo-700 hover:gap-1.5
                       transition-all whitespace-nowrap shrink-0"
          >
            View all
            <span aria-hidden>→</span>
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {enrolledCourses.slice(0, 3).map((course) => {
              const enrollment = enrollments.find(
                (e) => e.courseId === course.id
              );
              return (
                <CourseProgressCard
                  key={course.id}
                  course={course}
                  progress={enrollment?.progressPercentage || 0}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          ✅ RECOMMENDED FOR YOU — Better Aligned
          ========================================== */}
      <section className="flex flex-col gap-4 sm:gap-5">
        {/* Section header — same pattern as above */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              Recommended for You
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
              Hand-picked courses based on your interests
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 
                       text-xs sm:text-sm font-semibold text-indigo-600 
                       hover:text-indigo-700 hover:gap-1.5
                       transition-all whitespace-nowrap shrink-0"
          >
            View all
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {courses.slice(0, 3).map((course) => (
            <RecommendedCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
};

/* ==========================================
   COURSE PROGRESS CARD
   ========================================== */
interface CourseProgressCardProps {
  course: any;
  progress: number;
}

const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  course,
  progress,
}) => (
  <Link
    to={`/courses/${course.id}`}
    className="lms-course-card group bg-white rounded-xl 
               border border-slate-100 
               shadow-sm hover:shadow-lg hover:border-slate-200
               transition-all duration-300 overflow-hidden 
               flex flex-col"
  >
    {/* Thumbnail */}
    <div className="relative aspect-video overflow-hidden bg-slate-100">
      <img
        src={course.thumbnail}
        alt={course.title}
        loading="lazy"
        className="w-full h-full object-cover 
                   group-hover:scale-105 
                   transition-transform duration-500"
      />
      {/* Category badge */}
      <span
        className="absolute top-2 left-2 px-1.5 py-0.5 
                   text-[10px] sm:text-xs font-semibold 
                   bg-white/95 backdrop-blur-sm 
                   rounded text-slate-700 shadow-sm
                   uppercase tracking-wide"
      >
        {course.category}
      </span>
    </div>

    {/* Content */}
    <div className="p-2.5 sm:p-4 lg:p-5 flex flex-col gap-2 sm:gap-3 lg:gap-4 flex-1">
      <div className="flex-1 min-w-0">
        <h3
          className="text-xs sm:text-base lg:text-lg font-semibold text-slate-900 
                     line-clamp-2 leading-snug 
                     group-hover:text-indigo-600 transition-colors"
        >
          {course.title}
        </h3>
        <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 
                      mt-1 line-clamp-2 leading-relaxed">
          {course.shortDescription || course.description || "No description available"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-sm">
          <span className="text-slate-500 font-medium">Progress</span>
          <span className="text-indigo-600 font-bold">{progress}%</span>
        </div>
        <div className="w-full h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 
                       rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  </Link>
);

/* ==========================================
   RECOMMENDED CARD
   ========================================== */
const RecommendedCard: React.FC<{ course: any }> = ({ course }) => {
  const instructorName =
    course.instructor ||
    course.instructorName ||
    course.instructor_name ||
    "Instructor";

  const avatarUrl =
    course.instructorAvatar ||
    course.instructor_avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      instructorName
    )}&background=4f46e5&color=fff&bold=true`;

  return (
    <Link
      to={`/courses/${course.id}`}
      className="lms-course-card group bg-white rounded-xl 
                 border border-slate-100 
                 shadow-sm hover:shadow-lg hover:border-slate-200
                 transition-all duration-300 overflow-hidden 
                 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img
          src={course.thumbnail}
          alt={course.title}
          loading="lazy"
          className="w-full h-full object-cover 
                     group-hover:scale-105 
                     transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 lg:p-5 flex flex-col gap-2 sm:gap-3 flex-1">
        <div className="flex-1 min-w-0">
          <h3
            className="text-xs sm:text-base lg:text-lg font-semibold text-slate-900 
                       line-clamp-2 leading-snug 
                       group-hover:text-indigo-600 transition-colors"
          >
            {course.title}
          </h3>
          <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 
                        mt-1 line-clamp-2 leading-relaxed">
            {course.shortDescription || course.description || "No description available"}
          </p>
        </div>

        {/* Instructor + Rating */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between 
                        gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-slate-100">
          {/* Instructor */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <img
              src={avatarUrl}
              alt={instructorName}
              className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full object-cover 
                         shrink-0 ring-2 ring-white"
            />
            <span className="text-[10px] sm:text-xs text-slate-600 
                             truncate font-medium">
              {instructorName}
            </span>
          </div>

          {/* Rating */}
          <span className="text-[10px] sm:text-xs font-semibold text-amber-600 
                           shrink-0 self-start sm:self-auto 
                           inline-flex items-center gap-0.5">
            ⭐ {course.rating || "New"}
          </span>
        </div>
      </div>
    </Link>
  );
};

/* ==========================================
   EMPTY STATE
   ========================================== */
const EmptyState: React.FC = () => (
  <div className="bg-white rounded-xl border border-dashed border-slate-200 
                  p-8 sm:p-12 flex flex-col items-center text-center gap-4">
    <div className="w-16 h-16 rounded-full bg-indigo-50 
                    flex items-center justify-center text-3xl">
      📚
    </div>
    <div className="max-w-sm">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900">
        No courses yet
      </h3>
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
        Start your learning journey by enrolling in your first course.
      </p>
    </div>
    <Link
      to="/courses"
      className="mt-2 px-5 py-2.5 
                 bg-indigo-600 hover:bg-indigo-700 
                 text-white text-sm font-medium rounded-lg 
                 transition-colors shadow-sm hover:shadow-md
                 min-h-[44px] inline-flex items-center"
    >
      Browse Courses
    </Link>
  </div>
);

export default DashboardPage;