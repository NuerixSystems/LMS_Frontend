import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  BookOpen,
  Star,
  CheckCircle2,
  Play,
  ArrowLeft,
  Video,
  Check,
  Award,
  Users,
} from "lucide-react";
import { useLMS } from "../context/LMSContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

export const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const {
    courses,
    isEnrolled,
    enrollCourse,
    getCourseProgress,
    getEnrollment,
    isLessonCompleted,
  } = useLMS();

  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">Course Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The requested course could not be located.
        </p>
        <div className="mt-5">
          <Link to="/courses">
            <Button variant="outline">Browse All Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const enrolled = isEnrolled(course.id);
  const progress = getCourseProgress(course.id);
  const enrollment = getEnrollment(course.id);

  const handleEnrollOrContinue = () => {
    if (!enrolled) {
      enrollCourse(course.id);
      const firstLesson = course.modules[0]?.lessons[0];
      if (firstLesson) {
        navigate(`/courses/${course.id}/learn/${firstLesson.id}`);
      }
    } else {
      const targetLessonId =
        enrollment?.lastAccessedLessonId || course.modules[0]?.lessons[0]?.id;
      if (targetLessonId) {
        navigate(`/courses/${course.id}/learn/${targetLessonId}`);
      }
    }
  };

  const handleLessonClick = (lessonId: string) => {
    if (!enrolled) {
      enrollCourse(course.id);
    }
    navigate(`/courses/${course.id}/learn/${lessonId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to courses</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left / Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="font-medium">
                {course.category}
              </Badge>
              <Badge variant="secondary" className="font-medium">
                {course.level}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold ml-2">
                <Star className="h-4 w-4 fill-amber-400" />
                <span>{course.rating}</span>
                <span className="text-slate-400 font-normal">({course.enrolledCount} students)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {course.description}
            </p>

            {/* Quick Metadata */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-slate-600 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{course.duration} Total Duration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>{course.totalLessons} Lessons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                <span>Self-paced Learning</span>
              </div>
            </div>

            {/* Instructor Details */}
            <div className="flex items-center gap-3 pt-3">
              <img
                src={course.instructorAvatar}
                alt={course.instructor}
                className="h-11 w-11 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{course.instructor}</p>
                <p className="text-xs text-slate-500">{course.instructorTitle}</p>
              </div>
            </div>
          </div>

          {/* Right / Thumbnail & Action Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-200 shadow-inner">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-indigo-600 shadow-md">
                  <Play className="h-6 w-6 fill-indigo-600 ml-0.5" />
                </div>
              </div>
            </div>

            {enrolled && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Your Progress</span>
                  <span className="text-indigo-600">{progress}%</span>
                </div>
                <Progress value={progress} size="md" />
              </div>
            )}

            <Button
              onClick={handleEnrollOrContinue}
              size="lg"
              className="w-full font-semibold shadow-xs"
            >
              <Play className="h-4 w-4 fill-white mr-1.5" />
              <span>{enrolled ? "Continue Learning" : "Enroll Now & Start"}</span>
            </Button>

            <p className="text-center text-[11px] text-slate-400">
              Instant free access to all curriculum modules and lessons.
            </p>
          </div>
        </div>
      </div>

      {/* Curriculum Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Course Curriculum</h2>
            <p className="text-xs text-slate-500">
              {course.modules.length} Modules • {course.totalLessons} Lessons • Click any lesson to watch
            </p>
          </div>
          {enrolled && progress === 100 && (
            <Badge variant="success" className="gap-1">
              <Award className="h-3.5 w-3.5" />
              <span>Course Completed!</span>
            </Badge>
          )}
        </div>

        {/* Modules & Lessons */}
        <div className="space-y-4">
          {course.modules.map((module) => (
            <div
              key={module.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
            >
              {/* Module Header */}
              <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-800">
                  {module.title}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
                </span>
              </div>

              {/* Module Lessons */}
              <div className="divide-y divide-slate-100">
                {module.lessons.map((lesson) => {
                  const completed = isLessonCompleted(course.id, lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.id)}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            completed
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                          }`}
                        >
                          {completed ? (
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium line-clamp-1 ${
                              completed ? "text-slate-700" : "text-slate-900 group-hover:text-indigo-600"
                            }`}
                          >
                            {lesson.title}
                          </p>
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {lesson.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-slate-500 font-mono">
                          {lesson.duration}
                        </span>
                        {completed ? (
                          <Badge variant="success" className="text-[10px] py-0 px-2">
                            Done
                          </Badge>
                        ) : (
                          <span className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Play
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
