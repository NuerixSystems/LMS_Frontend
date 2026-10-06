import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  BookOpen,
  Play,
  Video,
  Loader2,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { API_URL, readJson } from "../config";

// ============================================================
// TYPES
// ============================================================

interface BackendCourse {
  course_id: number;
  tenant_id: number;
  crm_product_id: number | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  status: string;
}

interface CourseContent {
  content_id: number;
  course_id: number;
  title: string;
  description: string | null;
  video_url?: string | null;
  url?: string | null;
  sort_order: number;
  is_preview: boolean;
  status: string;
}

interface CourseWithContent extends BackendCourse {
  contents: CourseContent[];
}

// ============================================================
// HELPERS
// ============================================================

const getToken = (): string | null => {
  return localStorage.getItem("access_token");
};

// ============================================================
// COMPONENT
// ============================================================

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithContent | null>(null);

  const [selectedLesson, setSelectedLesson] =
    useState<CourseContent | null>(null);

  const [completedLessons, setCompletedLessons] =
    useState<number[]>([]);

  const [isVideoPlaying, setIsVideoPlaying] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingContent, setLoadingContent] =
    useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // AUTH ERROR
  // ==========================================================

  const logoutAndRedirect = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("student");
    navigate("/login");
  };

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
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to load courses."
        );
      }

      const courseList: BackendCourse[] =
        Array.isArray(data)
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

      const url =
        `${API_URL}/api/lms/courses/` +
        `${course.course_id}/content`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readJson(response);

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to load course content."
        );
      }

      // Backend can return:
      //
      // {
      //   "contents": [...]
      // }
      //
      // OR:
      //
      // [...]
      //
      const rawContents = Array.isArray(data)
        ? data
        : Array.isArray(data?.contents)
        ? data.contents
        : [];

      const lessonList: CourseContent[] =
        rawContents
          .filter(
            (item: CourseContent) =>
              item.status === "active" ||
              item.status === undefined ||
              item.status === null
          )
          .map((item: CourseContent) => ({
            ...item,
            video_url: item.video_url || item.url || "",
          }))
          .sort(
            (a: CourseContent, b: CourseContent) =>
              Number(a.sort_order || 0) -
              Number(b.sort_order || 0)
          );

      const courseWithContent: CourseWithContent = {
        ...course,
        contents: lessonList,
      };

      setSelectedCourse(courseWithContent);

      // Select first lesson
      if (lessonList.length > 0) {
        setSelectedLesson(lessonList[0]);
      } else {
        setSelectedLesson(null);
      }

      // Important:
      // Do not load YouTube until Play is clicked.
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
  // YOUTUBE VIDEO ID
  // ==========================================================

  const getYouTubeVideoId = (
    value?: string | null
  ): string => {
    if (!value) {
      return "";
    }

    let rawValue = value.trim();

    if (!rawValue) {
      return "";
    }

    // --------------------------------------------------------
    // If DB contains complete iframe HTML
    // --------------------------------------------------------

    if (
      rawValue
        .toLowerCase()
        .includes("<iframe")
    ) {
      const srcMatch = rawValue.match(
        /<iframe[^>]+src=["']([^"']+)["']/i
      );

      if (srcMatch?.[1]) {
        rawValue = srcMatch[1]
          .replace(/&amp;/g, "&")
          .trim();
      }
    }

    rawValue = rawValue.replace(
      /&amp;/g,
      "&"
    );

    try {
      const url = new URL(rawValue, window.location.origin);

      const hostname =
        url.hostname.toLowerCase();

      // youtube.com
      if (
        hostname === "youtube.com" ||
        hostname.endsWith(".youtube.com") ||
        hostname === "youtube-nocookie.com" ||
        hostname.endsWith(".youtube-nocookie.com")
      ) {
        // /embed/VIDEO_ID
        if (
          url.pathname.startsWith("/embed/")
        ) {
          return url.pathname
            .replace("/embed/", "")
            .split("/")[0];
        }

        // /shorts/VIDEO_ID
        if (
          url.pathname.startsWith("/shorts/")
        ) {
          return url.pathname
            .replace("/shorts/", "")
            .split("/")[0];
        }

        if (url.pathname.startsWith("/live/")) {
          return url.pathname
            .replace("/live/", "")
            .split("/")[0];
        }

        // /watch?v=VIDEO_ID
        return (
          url.searchParams.get("v") || ""
        );
      }

      if (hostname === "youtu.be") {
        return url.pathname
          .replace(/^\/+/, "")
          .split("/")[0];
      }
    } catch {
      return "";
    }

    return "";
  };

  const getVideoSource = (
    value?: string | null
  ):
    | { type: "youtube" | "embed" | "file"; src: string }
    | null => {
    if (!value?.trim()) {
      return null;
    }

    const videoId =
      getYouTubeVideoId(value);

    if (videoId) {
      const embedUrl = new URL(
        `https://www.youtube-nocookie.com/embed/${videoId}`
      );
      embedUrl.searchParams.set("autoplay", "1");
      embedUrl.searchParams.set("playsinline", "1");
      embedUrl.searchParams.set("rel", "0");
      embedUrl.searchParams.set("controls", "1");

      return { type: "youtube", src: embedUrl.toString() };
    }

    let sourceUrl = value.trim().replace(/&amp;/g, "&");
    const iframeSource = sourceUrl.match(
      /<iframe[^>]+src=["']([^"']+)["']/i
    )?.[1];
    if (iframeSource) {
      sourceUrl = iframeSource;
    }

    try {
      const url = new URL(sourceUrl, window.location.origin);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }

      const vimeoMatch =
        (url.hostname === "vimeo.com" ||
          url.hostname.endsWith(".vimeo.com"))
        ? url.pathname.match(/\/(?:video\/)?(\d+)/)
        : null;
      if (vimeoMatch?.[1]) {
        return {
          type: "embed",
          src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
        };
      }

      if (/\.(mp4|webm|ogg|ogv|m4v|mov)$/i.test(url.pathname)) {
        return { type: "file", src: url.toString() };
      }

      return { type: "embed", src: url.toString() };
    } catch {
      return null;
    }
  };

  const getYouTubeThumbnailUrl = (value?: string | null): string => {
    const videoId = getYouTubeVideoId(value);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : "";
  };

  // ==========================================================
  // OPEN COURSE
  // ==========================================================

  const handleOpenCourse = async (
    course: BackendCourse
  ) => {
    await loadCourseContent(course);
  };

  // ==========================================================
  // OPEN LESSON
  // ==========================================================

  const handleOpenLesson = (
    content: CourseContent
  ) => {
    setError("");
    setSelectedLesson(content);

    setIsVideoPlaying(false);

    setTimeout(() => {
      document
        .getElementById(
          "lms-video-player"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================================
  // PLAY VIDEO
  // ==========================================================

  const handlePlayVideo = () => {
    if (!selectedLesson) {
      return;
    }

    if (!getVideoSource(selectedLesson.video_url)) {
      setError(
        "This lesson does not have a playable video URL. Add a YouTube link, an embeddable video link, or a supported video file URL."
      );
      return;
    }

    setError("");
    setIsVideoPlaying(true);
  };

  // ==========================================================
  // MARK COMPLETE
  // ==========================================================

  const markLessonCompleted = (
    contentId: number
  ) => {
    setCompletedLessons(
      (current) => {
        if (
          current.includes(contentId)
        ) {
          return current;
        }

        return [
          ...current,
          contentId,
        ];
      }
    );
  };

  // ==========================================================
  // NEXT LESSON
  // ==========================================================

  const handleNextLesson = () => {
    if (
      !selectedCourse?.contents?.length
    ) {
      return;
    }

    const contents =
      selectedCourse.contents;

    const currentIndex =
      selectedLesson
        ? contents.findIndex(
            (lesson) =>
              lesson.content_id ===
              selectedLesson.content_id
          )
        : -1;

    const nextLesson =
      contents[currentIndex + 1];

    if (!nextLesson) {
      return;
    }

    setSelectedLesson(nextLesson);
    setIsVideoPlaying(false);
    setError("");

    setTimeout(() => {
      document
        .getElementById(
          "lms-video-player"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================================
  // PREVIOUS LESSON
  // ==========================================================

  const handlePreviousLesson = () => {
    if (
      !selectedCourse?.contents?.length
    ) {
      return;
    }

    const contents =
      selectedCourse.contents;

    const currentIndex =
      selectedLesson
        ? contents.findIndex(
            (lesson) =>
              lesson.content_id ===
              selectedLesson.content_id
          )
        : 0;

    const previousLesson =
      contents[currentIndex - 1];

    if (!previousLesson) {
      return;
    }

    setSelectedLesson(previousLesson);
    setIsVideoPlaying(false);
    setError("");

    setTimeout(() => {
      document
        .getElementById(
          "lms-video-player"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
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
  // COURSE CONTENT PAGE
  // ==========================================================

  if (selectedCourse) {
    const contents =
      selectedCourse.contents || [];

    const selectedIndex =
      selectedLesson
        ? contents.findIndex(
            (lesson) =>
              lesson.content_id ===
              selectedLesson.content_id
          )
        : -1;

    const completedCount =
      contents.filter(
        (lesson) =>
          completedLessons.includes(
            lesson.content_id
          )
      ).length;

    const progressPercentage =
      contents.length > 0
        ? Math.round(
            (completedCount /
              contents.length) *
              100
          )
        : 0;

    const currentVideoSource =
      selectedLesson
        ? getVideoSource(selectedLesson.video_url)
        : null;

    const currentThumbnailUrl =
      selectedLesson
        ? getYouTubeThumbnailUrl(
            selectedLesson.video_url
          )
        : "";

    return (
      <div className="min-h-screen bg-slate-50">

        {/* COURSE HEADER */}

        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">

            <button
              type="button"
              onClick={() => {
                setSelectedCourse(null);
                setSelectedLesson(null);
                setIsVideoPlaying(false);
                setError("");
              }}
              className="mb-3 text-sm font-medium text-slate-500 hover:text-indigo-600"
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
                    {completedCount}/
                    {contents.length}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-right text-xs text-slate-400">
                  {progressPercentage}%
                  completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LMS */}

        <div className="mx-auto max-w-[1500px] px-0 py-5 sm:px-4 sm:py-6 lg:px-6">

          <div className="grid min-h-[calc(100vh-180px)] grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">

            {/* VIDEO */}

            <main className="min-w-0">

              <div
                id="lms-video-player"
                className="overflow-hidden rounded-2xl bg-slate-950 shadow-xl"
              >
                {selectedLesson ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    {isVideoPlaying && currentVideoSource ? (
                      currentVideoSource.type === "file" ? (
                        <video
                          key={currentVideoSource.src}
                          src={currentVideoSource.src}
                          title={selectedLesson.title}
                          className="h-full w-full"
                          controls
                          autoPlay
                          playsInline
                          onError={() =>
                            setError("This video could not be loaded. Check that the video URL is public and supports browser playback.")
                          }
                        />
                      ) : (
                        <iframe
                          key={currentVideoSource.src}
                          src={currentVideoSource.src}
                          title={selectedLesson.title}
                          className="h-full w-full border-0"
                          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      )
                    ) : (
                      currentVideoSource ? (
                        <button
                          type="button"
                          onClick={handlePlayVideo}
                          className="group relative h-full w-full overflow-hidden text-left"
                        >
                          {currentThumbnailUrl ? (
                            <img
                              src={currentThumbnailUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/10" />
                          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-700 shadow-2xl transition group-hover:scale-110">
                            <Play className="ml-1 h-7 w-7 fill-current" />
                          </span>
                          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                              Lesson {selectedIndex + 1}
                            </p>
                            <h2 className="mt-1 text-lg font-bold text-white sm:text-2xl">
                              {selectedLesson.title}
                            </h2>
                            <p className="mt-2 text-sm text-white/75">
                              Select to start this lesson
                            </p>
                          </div>
                        </button>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-indigo-200">
                            <Video className="h-7 w-7" />
                          </span>
                          <h2 className="mt-4 text-lg font-semibold">
                            {selectedLesson.title}
                          </h2>
                          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                            {selectedLesson.video_url
                              ? "This video link could not be recognized. Use a YouTube, Vimeo, embeddable video, or MP4/WebM URL."
                              : "No video has been added to this lesson yet. You can still read the lesson details and continue through the course."}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center text-white">
                    <BookOpen className="h-10 w-10 text-indigo-300" />
                    <p className="mt-3 text-sm text-slate-300">
                      Select a lesson to start learning
                    </p>
                  </div>
                )}
              </div>

              {/* LESSON INFO */}

              {selectedLesson && (
                <div className="border-b border-slate-200 bg-white p-5 sm:p-7">

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>
                      <div className="flex items-center gap-2">

                        <span className="text-xs font-semibold uppercase text-indigo-600">
                          Lesson{" "}
                          {selectedIndex + 1}
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
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {
                            selectedLesson.description
                          }
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

                  {/* PREVIOUS / NEXT */}

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">

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

                    <span className="text-xs text-slate-400">
                      {selectedIndex + 1} of{" "}
                      {contents.length}
                    </span>

                    <Button
                      type="button"
                      onClick={
                        handleNextLesson
                      }
                      disabled={
                        selectedIndex >=
                        contents.length - 1
                      }
                      className="gap-2"
                    >
                      Next Lesson
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                  </div>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="m-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

            </main>

            {/* SIDEBAR */}

            <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">

                <div className="border-b border-slate-100 bg-slate-50/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                        Learning path
                      </p>
                      <h2 className="mt-1 font-bold text-slate-900">
                        Course lessons
                      </h2>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {contents.length} {contents.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Course progress</span>
                    <span className="font-semibold text-slate-700">{progressPercentage}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {loadingContent ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                ) : contents.length === 0 ? (
                  <div className="p-8 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

                    <h3 className="mt-3 font-semibold">
                      No lessons available
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">

                    {contents.map(
                      (
                        content,
                        index
                      ) => {
                        const isActive =
                          selectedLesson?.content_id ===
                          content.content_id;

                        const isCompleted =
                          completedLessons.includes(
                            content.content_id
                          );

                        return (
                          <button
                            key={
                              content.content_id
                            }
                            type="button"
                            onClick={() =>
                              handleOpenLesson(
                                content
                              )
                            }
                            className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                              isActive
                                ? "bg-indigo-50 shadow-sm"
                                : "hover:bg-slate-50"
                            }`}
                          >

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
                                      : "text-slate-800"
                                  }`}
                                >
                                  {
                                    content.title
                                  }
                                </h3>

                              </div>

                              {content.description && (
                                <p className="mt-1 line-clamp-2 pl-5 text-xs leading-5 text-slate-500">
                                  {
                                    content.description
                                  }
                                </p>
                              )}

                              <div className="mt-2 pl-5">

                                {content.is_preview && (
                                  <span className="mr-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    Preview
                                  </span>
                                )}

                                <span className="text-[10px] text-slate-400">
                                  {content.video_url ? "Video lesson" : "Lesson notes"}
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
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            placeholder="Search courses..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-indigo-600"
          />

        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {filteredCourses.length === 0 ? (

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />

          <h3 className="mt-3 font-semibold text-slate-900">
            No courses found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            There are no active courses available.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {filteredCourses.map(
            (course) => (

              <div
                key={course.course_id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >

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

                </div>

                <div className="flex flex-1 flex-col p-5">

                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" />
                    LMS Course
                    <span>•</span>
                    {course.status}
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
                    {course.description ||
                      "Start learning this course."}
                  </p>

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

export default CoursesPage;
