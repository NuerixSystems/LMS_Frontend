// src/pages/MyLearningPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useLMS } from "../context/LMSContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

type FilterTab = "all" | "in-progress" | "completed";

export const MyLearningPage: React.FC = () => {
  const { courses, enrollments, getCourseProgress } = useLMS();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const navigate = useNavigate();

  const enrolledCourses = enrollments
    .map((enr) => {
      const course = courses.find((c) => c.id === enr.courseId);
      return course
        ? {
            course,
            enrollment: enr,
            progress: getCourseProgress(course.id),
          }
        : null;
    })
    .filter(Boolean) as {
    course: (typeof courses)[0];
    enrollment: (typeof enrollments)[0];
    progress: number;
  }[];

  const filteredList = enrolledCourses.filter((item) => {
    if (activeTab === "in-progress")
      return item.progress >= 0 && item.progress < 100;
    if (activeTab === "completed") return item.progress === 100;
    return true;
  });

  const handleResumeCourse = (courseId: string, lastLessonId?: string) => {
    const course = courses.find((c) => c.id === courseId);
    const targetId = lastLessonId || course?.modules[0]?.lessons[0]?.id;
    if (targetId) {
      navigate(`/courses/${courseId}/learn/${targetId}`);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Learning
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your ongoing courses, milestones, and completed
            certifications.
          </p>
        </div>

        <Link to="/courses">
          <Button variant="outline" size="sm" className="gap-1.5 self-start">
            <BookOpen className="h-4 w-4" />
            <span>Browse More Courses</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2.5 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "all"
              ? "text-indigo-600 font-semibold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>All Courses</span>
          <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {enrolledCourses.length}
          </span>
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("in-progress")}
          className={`pb-2.5 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "in-progress"
              ? "text-indigo-600 font-semibold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>In Progress</span>
          <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {enrolledCourses.filter((c) => c.progress < 100).length}
          </span>
          {activeTab === "in-progress" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-2.5 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "completed"
              ? "text-indigo-600 font-semibold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Completed</span>
          <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {enrolledCourses.filter((c) => c.progress === 100).length}
          </span>
          {activeTab === "completed" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map(({ course, enrollment, progress }) => (
            <div
              key={course.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600">
                    <BookOpen className="h-14 w-14 text-white/80" />
                  </div>
                )}
                <Badge className="absolute top-3 left-3 bg-white/95 text-slate-800 shadow-xs border-none font-semibold">
                  {course.category}
                </Badge>
                {progress === 100 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[11px] font-semibold shadow-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Completed</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course.duration}</span>
                  </div>
                  <span>•</span>
                  <span>{course.totalLessons} lessons</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                  {course.title}
                </h3>

                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600">Progress</span>
                    <span
                      className={
                        progress === 100 ? "text-emerald-600" : "text-indigo-600"
                      }
                    >
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} size="sm" />
                </div>

                <div className="mt-4 pt-2 flex items-center gap-2">
                  <Button
                    onClick={() =>
                      handleResumeCourse(
                        course.id,
                        enrollment.lastAccessedLessonId
                      )
                    }
                    size="sm"
                    className="flex-1 font-semibold gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>
                      {progress === 100 ? "Review Course" : "Resume Lesson"}
                    </span>
                  </Button>

                  <Link to={`/courses/${course.id}`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            {activeTab === "completed"
              ? "No completed courses yet"
              : activeTab === "in-progress"
              ? "No courses currently in progress"
              : "You haven't enrolled in any courses yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Browse our course catalog to find topics that interest you and
            start learning!
          </p>
          <div className="mt-5">
            <Link to="/courses">
              <Button size="md" className="gap-2">
                <span>Browse All Courses</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLearningPage;