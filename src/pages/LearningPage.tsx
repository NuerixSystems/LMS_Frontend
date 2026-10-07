import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Check,
  Award,
  Loader2,
  Play,
  Maximize,
  Minimize,
} from "lucide-react";

import { useLMS } from "../context/LMSContext";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  formatYouTubeEmbedUrl,
  isYouTubeVideoUrl,
} from "../lib/utils";

export const LearningPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();

  const navigate = useNavigate();

  const {
    courses,
    enrollments,
    markLessonComplete,
    loadingCourses,
  } = useLMS();

  const [videoError, setVideoError] = useState(false);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     ROUTES
     Must match your router config (the app URL is
     /courses/:courseId/learn/:lessonId).
  ========================================================= */

  const coursesPath = "/courses";
  const coursePath = `/courses/${courseId}`;
  const lessonPath = (id: string | number) =>
    `/courses/${courseId}/learn/${id}`;

  /* =========================================================
     FULLSCREEN (maximize / minimize)
  ========================================================= */

  useEffect(() => {
    const handleChange = () => {
      const doc = document as any;
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
            doc.webkitFullscreenElement
        )
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleChange
    );
    document.addEventListener(
      "webkitfullscreenchange",
      handleChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleChange
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleChange
      );
    };
  }, []);

  const toggleFullscreen = async () => {
    const element = playerContainerRef.current as any;
    const doc = document as any;

    try {
      if (
        document.fullscreenElement ||
        doc.webkitFullscreenElement
      ) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
      } else if (element) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen failed:", error);
    }
  };

  /* =========================================================
     COURSE
  ========================================================= */

  const course = useMemo(() => {
    if (!Array.isArray(courses)) {
      return null;
    }

    return courses.find(
      (item: any) =>
        String(item.id) === String(courseId) ||
        String(item.course_id) === String(courseId)
    );
  }, [courses, courseId]);

  /* =========================================================
     ALL LESSONS
  ========================================================= */

  const allLessons = useMemo(() => {
    if (!course) {
      return [];
    }

    const modules = Array.isArray((course as any).modules)
      ? (course as any).modules
      : [];

    return modules.flatMap((module: any) => {
      if (!Array.isArray(module.lessons)) {
        return [];
      }

      return module.lessons;
    });
  }, [course]);

  /* =========================================================
     CURRENT LESSON
  ========================================================= */

  const currentLesson = useMemo(() => {
    if (!allLessons.length) {
      return null;
    }

    return (
      allLessons.find(
        (lesson: any) =>
          String(lesson.id) === String(lessonId) ||
          String(lesson.lesson_id) === String(lessonId) ||
          String(lesson.content_id) === String(lessonId)
      ) || null
    );
  }, [allLessons, lessonId]);

  /* =========================================================
     CURRENT LESSON INDEX
  ========================================================= */

  const currentLessonIndex = useMemo(() => {
    if (!currentLesson) {
      return -1;
    }

    return allLessons.findIndex(
      (lesson: any) =>
        String(lesson.id) ===
          String(currentLesson.id) ||
        String(lesson.lesson_id) ===
          String(currentLesson.lesson_id) ||
        String(lesson.content_id) ===
          String(currentLesson.content_id)
    );
  }, [allLessons, currentLesson]);

  /* =========================================================
     PREVIOUS / NEXT
  ========================================================= */

  const previousLesson =
    currentLessonIndex > 0
      ? allLessons[currentLessonIndex - 1]
      : null;

  const nextLesson =
    currentLessonIndex >= 0 &&
    currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  /* =========================================================
     ENROLLMENT
  ========================================================= */

  const enrollment = useMemo(() => {
    if (!courseId || !Array.isArray(enrollments)) {
      return null;
    }

    return (
      enrollments.find((item: any) => {
        return (
          String(item.courseId) === String(courseId) ||
          String(item.course_id) === String(courseId)
        );
      }) || null
    );
  }, [enrollments, courseId]);

  /* =========================================================
     COMPLETED LESSONS
  ========================================================= */

  const completedLessons = useMemo(() => {
    const enrollmentData = enrollment as any;

    const completed =
      enrollmentData?.completedLessons ??
      enrollmentData?.completed_lessons ??
      enrollmentData?.completedLessonIds ??
      enrollmentData?.completed_lesson_ids ??
      [];

    return Array.isArray(completed) ? completed : [];
  }, [enrollment]);

  /* =========================================================
     CHECK COMPLETED
  ========================================================= */

  const isLessonCompleted = useMemo(() => {
    if (!currentLesson) {
      return false;
    }

    const lessonIdValue =
      currentLesson.id ??
      currentLesson.lesson_id ??
      currentLesson.content_id;

    return completedLessons.some(
      (id: any) =>
        String(id) === String(lessonIdValue)
    );
  }, [completedLessons, currentLesson]);

  /* =========================================================
     COURSE PROGRESS
  ========================================================= */

  const courseProgress = useMemo(() => {
    if (!allLessons.length) {
      return 0;
    }

    const completedCount = allLessons.filter(
      (lesson: any) => {
        const id =
          lesson.id ??
          lesson.lesson_id ??
          lesson.content_id;

        return completedLessons.some(
          (completedId: any) =>
            String(completedId) === String(id)
        );
      }
    ).length;

    return Math.round(
      (completedCount / allLessons.length) * 100
    );
  }, [allLessons, completedLessons]);

  /* =========================================================
     RESET VIDEO ERROR WHEN LESSON CHANGES
  ========================================================= */

  useEffect(() => {
    setVideoError(false);
    setIsYouTubePlaying(false);
  }, [lessonId]);

  /* =========================================================
     VIDEO URL
  ========================================================= */

  const rawVideoUrl = String(
    currentLesson?.videoUrl ??
      currentLesson?.video_url ??
      currentLesson?.url ??
      ""
  ).trim();

  /*
   * YouTube content stays embedded in the lesson player.
   */

  const isYouTubeVideo = rawVideoUrl
    ? isYouTubeVideoUrl(rawVideoUrl)
    : false;
  const youtubeEmbedUrl = isYouTubeVideo
    ? formatYouTubeEmbedUrl(rawVideoUrl)
    : "";
  const youtubePlaybackUrl = useMemo(() => {
    if (!youtubeEmbedUrl || !isYouTubePlaying) {
      return "";
    }

    const embedUrl = new URL(youtubeEmbedUrl);
    embedUrl.searchParams.set("autoplay", "1");
    return embedUrl.toString();
  }, [youtubeEmbedUrl, isYouTubePlaying]);

  /*
   * Only direct video URLs are passed to <video>.
   */

  const playableVideoUrl =
    rawVideoUrl && !isYouTubeVideo
      ? rawVideoUrl
      : "";

  /* =========================================================
     VIDEO ERROR
  ========================================================= */

  const handleVideoError = (
    event: React.SyntheticEvent<HTMLVideoElement>
  ) => {
    console.error(
      "Video failed to load:",
      playableVideoUrl
    );

    console.error(
      "Video element error:",
      event.currentTarget.error
    );

    setVideoError(true);
  };

  /* =========================================================
     MARK COMPLETE
  ========================================================= */

  const handleMarkComplete = async () => {
    if (!currentLesson || isCompleting) {
      return;
    }

    const lessonIdValue =
      currentLesson.id ??
      currentLesson.lesson_id ??
      currentLesson.content_id;

    if (!lessonIdValue) {
      console.error(
        "Cannot complete lesson: lesson ID missing"
      );
      return;
    }

    try {
      setIsCompleting(true);

      await markLessonComplete(
        String(courseId),
        String(lessonIdValue)
      );
    } catch (error) {
      console.error(
        "Failed to mark lesson complete:",
        error
      );
    } finally {
      setIsCompleting(false);
    }
  };

  /* =========================================================
     NAVIGATE TO LESSON
  ========================================================= */

  const goToLesson = (lesson: any) => {
    if (!lesson) {
      return;
    }

    const targetLessonId =
      lesson.id ??
      lesson.lesson_id ??
      lesson.content_id;

    if (!targetLessonId) {
      return;
    }

    navigate(lessonPath(targetLessonId));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loadingCourses) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />

          <p className="text-sm text-muted-foreground">
            Loading lesson...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     COURSE NOT FOUND
  ========================================================= */

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />

          <h1 className="mt-4 text-xl font-semibold">
            Course not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The requested course could not be found.
          </p>

          <Button
            className="mt-5"
            onClick={() => navigate(coursesPath)}
          >
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  /* =========================================================
     LESSON NOT FOUND
  ========================================================= */

  if (!currentLesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />

          <h1 className="mt-4 text-xl font-semibold">
            Lesson not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This lesson does not exist or is no longer available.
          </p>

          <Button
            className="mt-5"
            onClick={() => navigate(coursePath)}
          >
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-background">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(coursePath)}
            aria-label="Back to course"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                to={coursesPath}
                className="hover:text-foreground"
              >
                Courses
              </Link>

              <span>/</span>

              <span className="truncate">
                {(course as any).title ||
                  (course as any).name ||
                  "Course"}
              </span>
            </div>

            <h1 className="truncate text-sm font-semibold">
              {currentLesson.title}
            </h1>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-muted-foreground">
              {courseProgress}% complete
            </span>

            <Progress
              value={courseProgress}
              className="w-24"
            />
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <div className="min-w-0">
            {/* =================================================
                VIDEO PLAYER
            ================================================= */}

            <div
              ref={playerContainerRef}
              className={`relative aspect-video overflow-hidden bg-black shadow-lg ${
                isFullscreen ? "rounded-none" : "rounded-xl"
              }`}
            >
              {videoError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#173e39] px-6 text-center text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <AlertCircle className="h-8 w-8 text-[#c5e7a7]" />
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Video could not be loaded
                  </p>

                  <p className="mt-2 max-w-md text-xs leading-5 text-white/75">
                    Please check that this lesson has a valid
                    direct MP4, WebM, or HLS video URL.
                  </p>
                </div>
              ) : playableVideoUrl ? (
                /*
                 * =================================================
                 * NATIVE VIDEO PLAYER
                 * =================================================
                 *
                 * This does NOT use YouTube.
                 */

                <video
                  key={playableVideoUrl}
                  src={playableVideoUrl}
                  className="absolute inset-0 h-full w-full bg-black object-contain"
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  playsInline
                  preload="metadata"
                  onError={handleVideoError}
                >
                  Your browser does not support video playback.
                </video>
              ) : isYouTubeVideo && youtubePlaybackUrl ? (
                /*
                 * =================================================
                 * EMBEDDED YOUTUBE PLAYER
                 * =================================================
                 *
                 * The iframe is intentionally taller than its
                 * container (80px extra on the top and bottom).
                 * The parent has overflow-hidden, so YouTube's
                 * channel/title bar (top) and "Watch on YouTube"
                 * button (bottom) are clipped away, while the
                 * 16:9 video stays centered and fully visible.
                 *
                 * If anything still peeks through, increase both
                 * values together, e.g. -top-24 + 100%+12rem.
                 */
                <>
                  <iframe
                    key={youtubePlaybackUrl}
                    src={youtubePlaybackUrl}
                    title={currentLesson.title}
                    className="absolute -top-20 left-0 h-[calc(100%+10rem)] w-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />

                  {/* Maximize / Minimize (YouTube controls are hidden) */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-black/60 text-white transition hover:bg-black/80"
                    aria-label={
                      isFullscreen
                        ? "Exit fullscreen"
                        : "Enter fullscreen"
                    }
                    title={
                      isFullscreen
                        ? "Minimize"
                        : "Maximize"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </button>
                </>
              ) : isYouTubeVideo && youtubeEmbedUrl ? (
                <button
                  type="button"
                  onClick={() => setIsYouTubePlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black text-white"
                  aria-label={`Play ${currentLesson.title}`}
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform hover:scale-110">
                    <Play className="ml-1 h-8 w-8 fill-current" />
                  </span>
                </button>
              ) : isYouTubeVideo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#173e39] px-6 text-center text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <AlertCircle className="h-8 w-8 text-[#c5e7a7]" />
                  </div>
                  <p className="mt-4 text-sm font-semibold">
                    Invalid YouTube video link
                  </p>
                  <p className="mt-2 max-w-md text-xs leading-5 text-white/75">
                    This lesson’s YouTube URL could not be converted to an embeddable video.
                  </p>
                </div>
              ) : (
                /*
                 * =================================================
                 * NO VIDEO
                 * =================================================
                 */

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#173e39] px-6 text-center text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <Play className="h-8 w-8 text-[#c5e7a7]" />
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Video lesson coming soon
                  </p>

                  <p className="mt-2 max-w-md text-xs leading-5 text-white/75">
                    Video content is not available for this
                    lesson yet.
                  </p>
                </div>
              )}
            </div>

            {/* =================================================
                LESSON HEADER
            ================================================= */}

            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Lesson {currentLessonIndex + 1}
                </Badge>

                {isLessonCompleted && (
                  <Badge className="gap-1">
                    <Check className="h-3 w-3" />
                    Completed
                  </Badge>
                )}

                {currentLesson.isPreview && (
                  <Badge variant="outline">
                    Preview
                  </Badge>
                )}
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                {currentLesson.title}
              </h2>

              {currentLesson.description && (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {currentLesson.description}
                </p>
              )}
            </div>

            {/* =================================================
                COMPLETE + NAVIGATION
            ================================================= */}

            <div className="mt-6 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant={
                  isLessonCompleted
                    ? "secondary"
                    : "primary"
                }
                disabled={
                  isLessonCompleted ||
                  isCompleting
                }
                onClick={handleMarkComplete}
                className="gap-2"
              >
                {isCompleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLessonCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                {isCompleting
                  ? "Saving..."
                  : isLessonCompleted
                    ? "Lesson Completed"
                    : "Mark as Complete"}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!previousLesson}
                  onClick={() =>
                    goToLesson(previousLesson)
                  }
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  disabled={!nextLesson}
                  onClick={() =>
                    goToLesson(nextLesson)
                  }
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* =================================================
                LESSON DETAILS
            ================================================= */}

            <div className="mt-8 rounded-xl border bg-card p-5">
              <h3 className="font-semibold">
                About this lesson
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Lesson
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {currentLessonIndex + 1} of{" "}
                    {allLessons.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {isLessonCompleted
                      ? "Completed"
                      : "In progress"}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                COURSE COMPLETED
            ================================================= */}

            {courseProgress === 100 &&
              allLessons.length > 0 && (
                <div className="mt-6 flex items-center gap-4 rounded-xl border bg-card p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Course completed!
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      You have completed all lessons in this
                      course.
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* =================================================
              RIGHT - CURRICULUM
          ================================================= */}

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-xl border bg-card">
              {/* Curriculum Header */}
              <div className="border-b p-4">
                <h3 className="font-semibold">
                  Course Content
                </h3>

                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {allLessons.length} lessons
                    </span>

                    <span>
                      {courseProgress}%
                    </span>
                  </div>

                  <Progress
                    value={courseProgress}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Curriculum List */}
              <div className="max-h-[70vh] overflow-y-auto">
                {Array.isArray(
                  (course as any).modules
                ) &&
                (course as any).modules.length > 0 ? (
                  (course as any).modules.map(
                    (
                      module: any,
                      moduleIndex: number
                    ) => (
                      <div
                        key={
                          module.id ??
                          module.module_id ??
                          moduleIndex
                        }
                        className="border-b last:border-b-0"
                      >
                        {/* Module Header */}
                        <div className="bg-muted/40 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Module {moduleIndex + 1}
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {module.title ||
                              module.name ||
                              `Module ${
                                moduleIndex + 1
                              }`}
                          </p>
                        </div>

                        {/* Lessons */}
                        <div className="p-2">
                          {Array.isArray(
                            module.lessons
                          ) &&
                          module.lessons.length > 0 ? (
                            module.lessons.map(
                              (
                                lesson: any,
                                lessonIndex: number
                              ) => {
                                const lessonIdValue =
                                  lesson.id ??
                                  lesson.lesson_id ??
                                  lesson.content_id;

                                const currentId =
                                  currentLesson.id ??
                                  currentLesson.lesson_id ??
                                  currentLesson.content_id;

                                const active =
                                  String(
                                    lessonIdValue
                                  ) ===
                                  String(currentId);

                                const completed =
                                  completedLessons.some(
                                    (id: any) =>
                                      String(id) ===
                                      String(
                                        lessonIdValue
                                      )
                                  );

                                return (
                                  <button
                                    key={
                                      lessonIdValue ??
                                      lessonIndex
                                    }
                                    type="button"
                                    onClick={() =>
                                      goToLesson(
                                        lesson
                                      )
                                    }
                                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition ${
                                      active
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                    }`}
                                  >
                                    {/* Icon */}
                                    <div className="mt-0.5 shrink-0">
                                      {completed ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : active ? (
                                        <Play className="h-4 w-4 fill-current" />
                                      ) : (
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full border text-[9px]">
                                          {lessonIndex +
                                            1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Lesson Info */}
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`text-sm leading-5 ${
                                          active
                                            ? "font-semibold"
                                            : "font-medium"
                                        }`}
                                      >
                                        {lesson.title ||
                                          lesson.name ||
                                          `Lesson ${
                                            lessonIndex +
                                            1
                                          }`}
                                      </p>

                                      {lesson.duration && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {
                                            lesson.duration
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                );
                              }
                            )
                          ) : (
                            <p className="px-3 py-3 text-xs text-muted-foreground">
                              No lessons available.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    No course content available.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default LearningPage;