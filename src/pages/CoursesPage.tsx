import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Play,
  Pause,
  Maximize2,
  Loader2,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

// ============================================================
// TYPES
// ============================================================

interface BackendCourse {
  course_id: number;
  tenant_id: number;
  crm_product_id: number | null;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number | null;
  status: string;
}

interface CourseContent {
  content_id: number;
  course_id: number;
  title: string;
  description: string;
  video_url: string;
  sort_order: number;
  is_preview: boolean;
  status: string;
}

interface CourseWithContent extends BackendCourse {
  contents?: CourseContent[];
}

// ============================================================
// API URL
// ============================================================

import { API_URL, readJson } from "../config";

// ============================================================
// HELPER
// ============================================================

const getToken = (): string | null => {
  return localStorage.getItem("access_token");
};

// ============================================================
// COURSES PAGE
// ============================================================

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithContent | null>(null);

  const [selectedLesson, setSelectedLesson] =
    useState<CourseContent | null>(null);

  const [completedLessons, setCompletedLessons] =
    useState<number[]>([]);

  // Keep the YouTube iframe completely unloaded until the
  // student presses the normal LMS Play button.
  const [isVideoPlaying, setIsVideoPlaying] =
    useState(false);

  const [isPlayerPaused, setIsPlayerPaused] =
    useState(false);

  const videoIframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD COURSES
  // ==========================================================

  const loadCourses = async () => {
    setLoadingCourses(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/lms/courses`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readJson(response);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("student");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to load courses."
        );
      }

      // ------------------------------------------------------
      // Backend may return:
      //
      // [
      //   {...},
      //   {...}
      // ]
      //
      // OR:
      //
      // {
      //   courses: [...]
      // }
      // ------------------------------------------------------

      const courseList: BackendCourse[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.courses)
        ? data.courses
        : [];

      setCourses(courseList);
    } catch (err: any) {
      console.error("Load courses error:", err);

      setError(
        err?.message ||
          "Unable to connect to the LMS server."
      );
    } finally {
      setLoadingCourses(false);
    }
  };

  // ==========================================================
  // LOAD COURSE CONTENT
  // ==========================================================

  const loadCourseContent = async (
    course: BackendCourse
  ) => {
    setLoadingContent(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/lms/courses/${course.course_id}/content`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readJson(response);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("student");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to load course content."
        );
      }

      console.log(
        "Course content response:",
        data
      );

      const lessonList: CourseContent[] = Array.isArray(data?.contents)
        ? [...data.contents].sort(
            (a, b) =>
              (a.sort_order || 0) - (b.sort_order || 0)
          )
        : [];

      setSelectedCourse({
        ...course,
        contents: lessonList,
      });

      // Select the first lesson, but do NOT load the YouTube iframe.
      // The custom LMS poster/play button is shown first.
      setSelectedLesson(lessonList[0] || null);
      setIsVideoPlaying(false);
    } catch (err: any) {
      console.error(
        "Load course content error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load course lessons."
      );
    } finally {
      setLoadingContent(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadCourses();
  }, []);

  // ==========================================================
  // FILTER COURSES
  // ==========================================================

  const filteredCourses = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return courses;
    }

    return courses.filter((course) => {
      return (
        course.title
          ?.toLowerCase()
          .includes(query) ||
        course.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [courses, searchQuery]);

  // ==========================================================
  // OPEN COURSE
  // ==========================================================

  const handleOpenCourse = async (
    course: BackendCourse
  ) => {
    await loadCourseContent(course);
  };

  // ==========================================================
  // YOUTUBE HELPERS
  // ==========================================================

  /**
   * The database currently contains the complete iframe HTML.
   * We extract only the YouTube video ID.
   *
   * IMPORTANT:
   * This function does NOT create an iframe. Therefore YouTube
   * cannot show an initialization screen before the student clicks
   * our normal LMS Play button.
   */
  const getYouTubeVideoId = (
    value?: string | null
  ): string => {
    if (!value) {
      return "";
    }

    const rawValue = value.trim();

    if (!rawValue) {
      return "";
    }

    let sourceUrl = "";

    // Database value can be the complete iframe HTML.
    if (rawValue.toLowerCase().includes("<iframe")) {
      const srcMatch = rawValue.match(
        /<iframe[^>]+src=["']([^"']+)["']/i
      );

      if (srcMatch?.[1]) {
        sourceUrl = srcMatch[1].replace(/&amp;/g, "&");
      }
    } else {
      sourceUrl = rawValue;
    }

    if (!sourceUrl) {
      return "";
    }

    try {
      const url = new URL(sourceUrl);
      let videoId = "";

      if (
        url.hostname === "www.youtube.com" ||
        url.hostname === "youtube.com" ||
        url.hostname === "m.youtube.com"
      ) {
        if (url.pathname.startsWith("/embed/")) {
          videoId = url.pathname
            .split("/embed/")[1]
            .split("/")[0];
        } else {
          videoId = url.searchParams.get("v") || "";
        }
      }

      if (url.hostname === "youtu.be") {
        videoId = url.pathname
          .replace(/^\//, "")
          .split("/")[0];
      }

      return videoId;
    } catch {
      return "";
    }
  };

  /**
   * Build the YouTube iframe URL only after Play is clicked.
   */
  const getYouTubeEmbedUrl = (
    value?: string | null
  ): string => {
    const videoId = getYouTubeVideoId(value);

    if (!videoId) {
      return "";
    }

    const embedUrl = new URL(
      `https://www.youtube-nocookie.com/embed/${videoId}`
    );

    // Hide YouTube's own player controls. The LMS provides its own
    // Play/Pause and Fullscreen controls below the video.
    embedUrl.searchParams.set("autoplay", "1");
    embedUrl.searchParams.set("playsinline", "1");
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("iv_load_policy", "3");
    embedUrl.searchParams.set("controls", "0");
    embedUrl.searchParams.set("disablekb", "1");
    embedUrl.searchParams.set("fs", "0");
    embedUrl.searchParams.set("cc_load_policy", "0");
    embedUrl.searchParams.set("enablejsapi", "1");
    embedUrl.searchParams.set(
      "origin",
      window.location.origin
    );

    return embedUrl.toString();
  };

  /**
   * Show a normal LMS poster before YouTube is loaded.
   */
  const getYouTubeThumbnailUrl = (
    value?: string | null
  ): string => {
    const videoId = getYouTubeVideoId(value);

    if (!videoId) {
      return "";
    }

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  // ==========================================================
  // OPEN LESSON
  // ==========================================================

  const handleOpenLesson = (
    content: CourseContent
  ) => {
    if (!content.video_url) {
      setError("This lesson does not have a video link.");
      return;
    }

    const embedUrl = getYouTubeEmbedUrl(
      content.video_url
    );

    if (!embedUrl) {
      setError(
        "The video link for this lesson is invalid or unsupported."
      );
      return;
    }

    setError("");
    setSelectedLesson(content);

    // Every newly selected lesson starts with the normal LMS
    // thumbnail and Play button. The iframe is not mounted yet.
    setIsVideoPlaying(false);
    setIsPlayerPaused(false);

    // Scroll the player into view on mobile/desktop.
    window.setTimeout(() => {
      document
        .getElementById("lms-video-player")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const handlePlayVideo = () => {
    if (!selectedLesson) {
      return;
    }

    const videoId = getYouTubeVideoId(
      selectedLesson.video_url
    );

    if (!videoId) {
      setError(
        "The video link for this lesson is invalid or unsupported."
      );
      return;
    }

    setError("");
    setIsPlayerPaused(false);
    setIsVideoPlaying(true);
  };

  // ==========================================================
  // CUSTOM LMS VIDEO CONTROLS
  // ==========================================================

  const sendYouTubeCommand = (command: string) => {
    const iframe = videoIframeRef.current;

    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: command,
        args: [],
      }),
      "*"
    );
  };

  const toggleVideoPlayPause = () => {
    if (!isVideoPlaying) {
      return;
    }

    if (isPlayerPaused) {
      sendYouTubeCommand("playVideo");
      setIsPlayerPaused(false);
    } else {
      sendYouTubeCommand("pauseVideo");
      setIsPlayerPaused(true);
    }
  };

  const handleVideoFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await videoContainerRef.current?.requestFullscreen();
    } catch (fullscreenError) {
      console.error(
        "Fullscreen error:",
        fullscreenError
      );
    }
  };

  const markLessonCompleted = (
    contentId: number
  ) => {
    setCompletedLessons((current) =>
      current.includes(contentId)
        ? current
        : [...current, contentId]
    );
  };

  const handleNextLesson = () => {
    if (!selectedCourse?.contents?.length) {
      return;
    }

    const sortedContents = [
      ...selectedCourse.contents,
    ].sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );

    const currentIndex = selectedLesson
      ? sortedContents.findIndex(
          (lesson) =>
            lesson.content_id ===
            selectedLesson.content_id
        )
      : -1;

    const nextLesson =
      sortedContents[currentIndex + 1];

    if (nextLesson) {
      setSelectedLesson(nextLesson);
      setIsVideoPlaying(false);
      setIsPlayerPaused(false);
      window.setTimeout(() => {
        document
          .getElementById("lms-video-player")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 50);
    }
  };

  const handlePreviousLesson = () => {
    if (!selectedCourse?.contents?.length) {
      return;
    }

    const sortedContents = [
      ...selectedCourse.contents,
    ].sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );

    const currentIndex = selectedLesson
      ? sortedContents.findIndex(
          (lesson) =>
            lesson.content_id ===
            selectedLesson.content_id
        )
      : 0;

    const previousLesson =
      sortedContents[currentIndex - 1];

    if (previousLesson) {
      setSelectedLesson(previousLesson);
      setIsVideoPlaying(false);
      setIsPlayerPaused(false);
      window.setTimeout(() => {
        document
          .getElementById("lms-video-player")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 50);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loadingCourses) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />

          <p className="text-sm text-slate-500">
            Loading courses...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // COURSE CONTENT VIEW
  // ==========================================================

  if (selectedCourse) {
    const contents = [...(selectedCourse.contents || [])].sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );

    const selectedIndex = selectedLesson
      ? contents.findIndex(
          (lesson) =>
            lesson.content_id ===
            selectedLesson.content_id
        )
      : -1;

    const completedCount = contents.filter(
      (lesson) =>
        completedLessons.includes(
          lesson.content_id
        )
    ).length;

    const progressPercentage =
      contents.length > 0
        ? Math.round(
            (completedCount / contents.length) *
              100
          )
        : 0;

    const currentEmbedUrl =
      selectedLesson && isVideoPlaying
        ? getYouTubeEmbedUrl(
            selectedLesson.video_url
          )
        : "";

    const currentThumbnailUrl =
      selectedLesson
        ? getYouTubeThumbnailUrl(
            selectedLesson.video_url
          )
        : "";

    return (
      <div className="min-h-screen bg-slate-50">
        {/* ====================================================
            TOP COURSE HEADER
            ==================================================== */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setIsVideoPlaying(false);
                setIsPlayerPaused(false);
                setSelectedLesson(null);
                setSelectedCourse(null);
              }}
              className="mb-3 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            >
              ← Back to Courses
            </button>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Course</Badge>

                  <Badge className="bg-emerald-100 text-emerald-700">
                    {selectedCourse.status}
                  </Badge>
                </div>

                <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                  {selectedCourse.title}
                </h1>

                {selectedCourse.description && (
                  <p className="mt-1 max-w-4xl text-sm text-slate-500">
                    {selectedCourse.description}
                  </p>
                )}
              </div>

              <div className="w-full shrink-0 lg:w-64">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Your Progress</span>
                  <span>
                    {completedCount}/{contents.length}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-right text-xs text-slate-400">
                  {progressPercentage}% completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            LMS PLAYER LAYOUT
            ==================================================== */}
        <div className="mx-auto max-w-[1500px] px-0 sm:px-4 lg:px-6">
          <div className="grid min-h-[calc(100vh-180px)] grid-cols-1 lg:grid-cols-[1fr_360px] lg:gap-5">
            {/* ==================================================
                MAIN VIDEO AREA
                ================================================== */}
            <main className="min-w-0">
              <div
                id="lms-video-player"
                className="bg-black"
              >
                {selectedLesson ? (
                  <div
                    ref={videoContainerRef}
                    className="group relative aspect-video w-full overflow-hidden bg-black"
                  >
                    {isVideoPlaying && currentEmbedUrl ? (
                      <>
                      {/*
                        The YouTube iframe is mounted only after the
                        student clicks our custom Play button.
                      */}
                      <iframe
                        ref={videoIframeRef}
                        key={currentEmbedUrl}
                        src={currentEmbedUrl}
                        title={selectedLesson.title}
                        className="h-full w-full border-0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />

                      {/* =================================================
                          CUSTOM LMS CONTROLS
                          YouTube controls are disabled in the iframe.
                          These are the only controls shown to students.
                          ================================================= */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                        <div className="pointer-events-auto flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <button
                              type="button"
                              onClick={toggleVideoPlayPause}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                              aria-label={
                                isPlayerPaused
                                  ? "Play video"
                                  : "Pause video"
                              }
                            >
                              {isPlayerPaused ? (
                                <Play className="h-5 w-5 fill-current" />
                              ) : (
                                <Pause className="h-5 w-5 fill-current" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-white">
                                {selectedLesson.title}
                              </p>
                              <p className="text-[11px] text-white/60">
                                LMS Video Player
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleVideoFullscreen}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                            aria-label="Fullscreen"
                          >
                            <Maximize2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      </>
                    ) : (
                      /* Custom LMS poster - no iframe exists yet. */
                      <button
                        type="button"
                        onClick={handlePlayVideo}
                        className="group relative h-full w-full cursor-pointer overflow-hidden text-left"
                        aria-label={`Play ${selectedLesson.title}`}
                      >
                        {currentThumbnailUrl ? (
                          <img
                            src={currentThumbnailUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="eager"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
                        )}

                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/40" />

                        {/* Normal LMS play button */}
                        <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl transition duration-200 group-hover:scale-110 group-hover:bg-indigo-500 sm:h-24 sm:w-24">
                          <Play className="ml-1 h-9 w-9 fill-current sm:h-11 sm:w-11" />
                        </span>

                        {/* Lesson title */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-5 pt-12 sm:px-7 sm:pb-7">
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                            Lesson {Math.max(selectedIndex + 1, 1)}
                          </p>

                          <h2 className="mt-1 text-lg font-bold text-white sm:text-2xl">
                            {selectedLesson.title}
                          </h2>

                          <p className="mt-1 text-xs text-white/70">
                            Click Play to start the lesson
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-slate-950 px-6 text-center">
                    <div>
                      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl">
                        <Play className="ml-1 h-9 w-9 fill-current" />
                      </span>

                      <h2 className="mt-5 text-lg font-semibold text-white">
                        Select a lesson to start
                      </h2>

                      <p className="mt-1 text-sm text-white/60">
                        Choose a lesson from the course curriculum.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Current lesson information */}
              {selectedLesson && (
                <div className="border-b border-slate-200 bg-white">
                  <div className="p-5 sm:p-7">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                            Lesson{" "}
                            {selectedIndex >= 0
                              ? selectedIndex + 1
                              : ""}
                          </span>

                          {selectedLesson.is_preview && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              Preview
                            </Badge>
                          )}

                          {completedLessons.includes(
                            selectedLesson.content_id
                          ) && (
                            <Badge className="gap-1 bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Completed
                            </Badge>
                          )}
                        </div>

                        <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                          {selectedLesson.title}
                        </h2>

                        {selectedLesson.description && (
                          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
                            {selectedLesson.description}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={() =>
                          markLessonCompleted(
                            selectedLesson.content_id
                          )
                        }
                        disabled={completedLessons.includes(
                          selectedLesson.content_id
                        )}
                        className="shrink-0 gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />

                        {completedLessons.includes(
                          selectedLesson.content_id
                        )
                          ? "Completed"
                          : "Mark Complete"}
                      </Button>
                    </div>

                    {/* Previous / Next */}
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          handlePreviousLesson
                        }
                        disabled={
                          selectedIndex <= 0
                        }
                      >
                        ← Previous
                      </Button>

                      <span className="hidden text-xs text-slate-400 sm:block">
                        {Math.max(
                          selectedIndex + 1,
                          1
                        )}{" "}
                        of {contents.length}
                      </span>

                      <Button
                        type="button"
                        onClick={
                          handleNextLesson
                        }
                        disabled={
                          selectedIndex ===
                            contents.length - 1 ||
                          selectedIndex < 0
                        }
                        className="gap-2"
                      >
                        Next Lesson
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="m-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </main>

            {/* ==================================================
                COURSE CURRICULUM SIDEBAR
                ================================================== */}
            <aside className="border-t border-slate-200 bg-white lg:border-l lg:border-t-0">
              <div className="sticky top-0 max-h-screen overflow-y-auto">
                <div className="border-b border-slate-200 p-5">
                  <h2 className="font-bold text-slate-900">
                    Course Content
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {contents.length}{" "}
                    {contents.length === 1
                      ? "lesson"
                      : "lessons"}
                  </p>
                </div>

                {loadingContent ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                      Loading lessons...
                    </div>
                  </div>
                ) : contents.length === 0 ? (
                  <div className="p-8 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

                    <h3 className="mt-3 font-semibold text-slate-900">
                      No lessons available
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      No course links have been
                      added to this course yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {contents.map(
                      (content, index) => {
                        const isActive =
                          selectedLesson?.content_id ===
                          content.content_id;

                        const isCompleted =
                          completedLessons.includes(
                            content.content_id
                          );

                        return (
                          <button
                            key={content.content_id}
                            type="button"
                            onClick={() =>
                              handleOpenLesson(
                                content
                              )
                            }
                            className={`group flex w-full items-start gap-3 p-4 text-left transition ${
                              isActive
                                ? "bg-indigo-50"
                                : "bg-white hover:bg-slate-50"
                            }`}
                          >
                            {/* Lesson number/status */}
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isActive
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                index + 1
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <Play
                                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                                    isActive
                                      ? "fill-indigo-600 text-indigo-600"
                                      : "fill-slate-400 text-slate-400"
                                  }`}
                                />

                                <h3
                                  className={`text-sm font-semibold leading-5 ${
                                    isActive
                                      ? "text-indigo-700"
                                      : "text-slate-800 group-hover:text-indigo-600"
                                  }`}
                                >
                                  {content.title}
                                </h3>
                              </div>

                              {content.description && (
                                <p className="mt-1 line-clamp-2 pl-5 text-xs leading-5 text-slate-500">
                                  {content.description}
                                </p>
                              )}

                              <div className="mt-2 flex items-center gap-2 pl-5">
                                {content.is_preview && (
                                  <span className="text-[10px] font-semibold text-emerald-600">
                                    Preview
                                  </span>
                                )}

                                <span className="text-[10px] text-slate-400">
                                  Video lesson
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // COURSES LIST
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Courses
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Continue your learning journey.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">

          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            placeholder="Search courses..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() =>
                setSearchQuery("")
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* No courses */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />

          <h3 className="mt-3 font-semibold text-slate-900">
            No courses found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            There are no active courses available.
          </p>

          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() =>
                setSearchQuery("")
              }
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {filteredCourses.map(
            (course) => (
              <div
                key={course.course_id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >

                {/* Thumbnail */}
                <div
                  className="relative aspect-video cursor-pointer overflow-hidden bg-slate-100"
                  onClick={() =>
                    handleOpenCourse(
                      course
                    )
                  }
                >

                  {course.thumbnail_url ? (
                    <img
                      src={
                        course.thumbnail_url
                      }
                      alt={
                        course.title
                      }
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

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                    <div className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white text-indigo-600 opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">

                  {/* Course information */}
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" />

                    <span>
                      LMS Course
                    </span>

                    <span>•</span>

                    <span>
                      {course.status}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
                    {course.description ||
                      "Start learning this course."}
                  </p>

                  {/* Price */}
                  {course.price !==
                    null &&
                    course.price !==
                      undefined && (
                      <div className="mt-4 text-sm font-semibold text-slate-800">
                        ₹
                        {Number(
                          course.price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </div>
                    )}

                  {/* Action */}
                  <div className="mt-5 flex gap-2">

                    <Button
                      type="button"
                      onClick={() =>
                        handleOpenCourse(
                          course
                        )
                      }
                      className="flex-1 gap-2"
                    >
                      <Play className="h-4 w-4 fill-current" />

                      Start Course
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        handleOpenCourse(
                          course
                        )
                      }
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default CoursesPage;