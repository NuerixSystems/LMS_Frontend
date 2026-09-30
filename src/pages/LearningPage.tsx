import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Video,
  Check,
  Award,
} from "lucide-react";
import { useLMS } from "../context/LMSContext";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { formatYouTubeEmbedUrl } from "../lib/utils";

export const LearningPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const {
    courses,
    isEnrolled,
    enrollCourse,
    isLessonCompleted,
    toggleLessonComplete,
    updateLastAccessedLesson,
    getCourseProgress,
    getNextLessonId,
    getPrevLessonId,
  } = useLMS();

  const course = courses.find((c) => c.id === courseId);

  // Auto enroll if accessing directly
  useEffect(() => {
    if (courseId && !isEnrolled(courseId)) {
      enrollCourse(courseId);
    }
  }, [courseId, isEnrolled, enrollCourse]);

  // Find current lesson
  const allLessons = course?.modules.flatMap((m) => m.lessons) || [];
  const currentLesson =
    allLessons.find((l) => l.id === lessonId) || allLessons[0];

  // Sync last accessed
  useEffect(() => {
    if (courseId && currentLesson?.id) {
      updateLastAccessedLesson(courseId, currentLesson.id);
    }
  }, [courseId, currentLesson?.id, updateLastAccessedLesson]);

  if (!course || !currentLesson) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">Lesson Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">The lesson or course requested does not exist.</p>
        <div className="mt-5">
          <Link to="/courses">
            <Button variant="outline">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = isLessonCompleted(course.id, currentLesson.id);
  const nextLessonId = getNextLessonId(course.id, currentLesson.id);
  const prevLessonId = getPrevLessonId(course.id, currentLesson.id);
  const courseProgress = getCourseProgress(course.id);

  const handleNext = () => {
    if (nextLessonId) {
      navigate(`/courses/${course.id}/learn/${nextLessonId}`);
    }
  };

  const handlePrev = () => {
    if (prevLessonId) {
      navigate(`/courses/${course.id}/learn/${prevLessonId}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link
            to={`/courses/${course.id}`}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Course Details</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-xs">{course.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32 hidden sm:block">
            <Progress value={courseProgress} size="sm" />
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {courseProgress}% Complete
          </span>
          {courseProgress === 100 && (
            <Badge variant="success" className="text-[10px] py-0 px-2 gap-1">
              <Award className="h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Main Grid: Left Video Player, Right Sidebar Curriculum */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player & Lesson info */}
        <div className="lg:col-span-8 space-y-5">
          {/* Responsive Video Container */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">
            <iframe
              src={formatYouTubeEmbedUrl(currentLesson.videoUrl)}
              title={currentLesson.title}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Controls & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <Button
              onClick={() => toggleLessonComplete(course.id, currentLesson.id)}
              variant={isCompleted ? "secondary" : "primary"}
              size="md"
              className="gap-2 font-medium"
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Completed (Click to Undo)</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Mark as Complete</span>
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrev}
                disabled={!prevLessonId}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <Button
                onClick={handleNext}
                disabled={!nextLessonId}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lesson Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentLesson.title}
              </h1>
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Duration: {currentLesson.duration}
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {currentLesson.description}
            </p>

            {/* Instructor snippet */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <img
                src={course.instructorAvatar}
                alt={course.instructor}
                className="h-9 w-9 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900">{course.instructor}</p>
                <p className="text-[11px] text-slate-400">{course.instructorTitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Curriculum Sidebar */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden sticky top-20">
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Course Curriculum</h3>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{allLessons.length} lessons</span>
              <span>{courseProgress}% completed</span>
            </div>
            <div className="mt-2">
              <Progress value={courseProgress} size="sm" />
            </div>
          </div>

          {/* Lesson List with Modules */}
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto divide-y divide-slate-100">
            {course.modules.map((module) => (
              <div key={module.id} className="py-2">
                <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {module.title}
                </div>
                <div>
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLesson.id;
                    const completed = isLessonCompleted(course.id, lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => navigate(`/courses/${course.id}/learn/${lesson.id}`)}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs transition-colors ${
                          isActive
                            ? "bg-indigo-50/80 font-semibold text-indigo-900 border-l-4 border-indigo-600"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              completed
                                ? "bg-emerald-100 text-emerald-600"
                                : isActive
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {completed ? (
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            ) : (
                              <Video className="h-3 w-3" />
                            )}
                          </div>
                          <span className="truncate">{lesson.title}</span>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {lesson.duration}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
