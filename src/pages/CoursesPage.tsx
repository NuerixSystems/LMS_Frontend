import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Clock, BookOpen, Star, Play, CheckCircle2 } from "lucide-react";
import { useLMS } from "../context/LMSContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

export const CoursesPage: React.FC = () => {
  const {
    courses,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isEnrolled,
    getCourseProgress,
    getEnrollment,
    enrollCourse,
  } = useLMS();

  const navigate = useNavigate();

  // Filter courses based on search query and category
  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCourseAction = (courseId: string) => {
    if (isEnrolled(courseId)) {
      const enr = getEnrollment(courseId);
      const course = courses.find((c) => c.id === courseId);
      const targetLessonId =
        enr?.lastAccessedLessonId || course?.modules[0]?.lessons[0]?.id;
      navigate(`/courses/${courseId}/learn/${targetLessonId}`);
    } else {
      enrollCourse(courseId);
      const course = courses.find((c) => c.id === courseId);
      const firstLessonId = course?.modules[0]?.lessons[0]?.id;
      navigate(`/courses/${courseId}/learn/${firstLessonId}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore Courses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse our catalog of modern development and design masterclasses.
          </p>
        </div>

        {/* Search bar inside courses page */}
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const progress = getCourseProgress(course.id);

            return (
              <div
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all duration-200"
              >
                {/* Thumbnail */}
                <Link to={`/courses/${course.id}`} className="relative aspect-video w-full overflow-hidden bg-slate-100 block">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 left-3 bg-white/95 text-slate-800 shadow-xs border-none font-semibold backdrop-blur-xs">
                    {course.category}
                  </Badge>
                  {enrolled && progress === 100 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[11px] font-semibold shadow-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Completed</span>
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{course.totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>

                  <Link to={`/courses/${course.id}`}>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                  </Link>

                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                    {course.shortDescription}
                  </p>

                  {/* Instructor */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2.5">
                    <img
                      src={course.instructorAvatar}
                      alt={course.instructor}
                      className="h-7 w-7 rounded-full object-cover border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{course.instructor}</p>
                      <p className="text-[11px] text-slate-400 truncate">{course.instructorTitle}</p>
                    </div>
                  </div>

                  {/* Progress bar if enrolled */}
                  {enrolled && (
                    <div className="mt-3">
                      <Progress value={progress} size="sm" showLabel />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-1 flex items-center gap-2">
                    <Button
                      onClick={() => handleCourseAction(course.id)}
                      variant={enrolled ? "primary" : "primary"}
                      size="sm"
                      className="flex-1 font-semibold gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{enrolled ? "Continue" : "Start Course"}</span>
                    </Button>
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
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No courses match your criteria</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query or selecting a different category.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
