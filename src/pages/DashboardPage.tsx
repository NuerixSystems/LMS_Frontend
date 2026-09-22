import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLMS } from "../context/LMSContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    courses,
    totalEnrolledCount,
    inProgressCount,
    completedCount,
    overallProgress,
    continueCourse,
    getCourseProgress,
    isEnrolled,
  } = useLMS();

  const navigate = useNavigate();

  const stats = [
    {
      title: "Enrolled Courses",
      value: totalEnrolledCount,
      icon: BookOpen,
      iconBg: "bg-blue-50 text-blue-600",
      change: "+1 this month",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600",
      change: "Active learning",
    },
    {
      title: "Completed Courses",
      value: completedCount,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600",
      change: "Great achievement",
    },
    {
      title: "Overall Progress",
      value: `${overallProgress}%`,
      icon: TrendingUp,
      iconBg: "bg-indigo-50 text-indigo-600",
      isProgress: true,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-lg shadow-indigo-200/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md mb-3 text-indigo-100">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome back to LearnPulse</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Hello, {user?.name || "Student"}! 👋
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            You are making steady progress! Continue where you left off or browse new skills to conquer.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/courses">
              <Button variant="secondary" size="md" className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow">
                Explore All Courses
              </Button>
            </Link>
            <Link to="/my-learning">
              <Button variant="outline" size="md" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                View My Courses
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-10 h-48 w-48 rounded-full bg-violet-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                {stat.isProgress ? (
                  <div className="mt-3">
                    <Progress value={overallProgress} size="sm" />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500 font-medium">{stat.change}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Continue Learning Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Continue Learning</h2>
            <p className="text-xs text-slate-500">Pick up right where you left off</p>
          </div>
          <Link
            to="/my-learning"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>All My Learning</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {continueCourse ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Thumbnail with overlay icon */}
              <div className="relative aspect-video w-full md:w-64 shrink-0 overflow-hidden rounded-xl bg-slate-100 group">
                <img
                  src={continueCourse.course.thumbnail}
                  alt={continueCourse.course.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-md">
                    <Play className="h-5 w-5 fill-indigo-600 ml-0.5" />
                  </div>
                </div>
                <Badge className="absolute top-2 left-2 bg-white/90 text-slate-800 backdrop-blur-sm border-none shadow-xs">
                  {continueCourse.course.category}
                </Badge>
              </div>

              {/* Course Info & Progress */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Active Course
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">
                    Instructor: {continueCourse.course.instructor}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-1">
                  {continueCourse.course.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {continueCourse.course.shortDescription}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">Course Completion</span>
                    <span className="text-indigo-600 font-bold">
                      {continueCourse.enrollment.progressPercentage}%
                    </span>
                  </div>
                  <Progress value={continueCourse.enrollment.progressPercentage} size="md" />
                </div>
              </div>

              {/* Action CTA */}
              <div className="md:border-l md:border-slate-100 md:pl-6 shrink-0 flex flex-col justify-center">
                <Button
                  onClick={() =>
                    navigate(
                      `/courses/${continueCourse.course.id}/learn/${continueCourse.nextLessonId}`
                    )
                  }
                  size="lg"
                  className="w-full sm:w-auto font-semibold gap-2 shadow-sm"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Continue Lesson</span>
                </Button>
                <Link
                  to={`/courses/${continueCourse.course.id}`}
                  className="mt-2.5 text-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  View syllabus
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Layers className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">No courses in progress</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Explore our catalog and start learning in-demand skills today!
            </p>
            <div className="mt-4">
              <Link to="/courses">
                <Button size="sm">Explore Catalog</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Courses Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recommended For You
            </h2>
            <p className="text-xs text-slate-500">Popular and highly-rated programs</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 3).map((course) => {
            const enrolled = isEnrolled(course.id);
            const progress = getCourseProgress(course.id);

            return (
              <div
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 left-3 bg-white/95 text-slate-800 shadow-xs border-none backdrop-blur-xs font-semibold">
                    {course.category}
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>{course.duration}</span>
                    <span>•</span>
                    <span>{course.totalLessons} lessons</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{course.level}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h4>

                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.shortDescription}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <img
                        src={course.instructorAvatar}
                        alt={course.instructor}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="truncate font-medium">{course.instructor}</span>
                    </div>
                  </div>

                  {enrolled && (
                    <div className="mt-3">
                      <Progress value={progress} size="sm" showLabel />
                    </div>
                  )}

                  <div className="mt-4 pt-2">
                    <Link to={`/courses/${course.id}`} className="block">
                      <Button
                        variant={enrolled ? "outline" : "primary"}
                        size="sm"
                        className="w-full font-medium"
                      >
                        {enrolled ? "Continue Course" : "View Course Details"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
