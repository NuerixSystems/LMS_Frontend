import React from "react";
import { ArrowRight, BookOpen, Clock3, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLMS } from "../context/LMSContext";

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const {
    categories,
    courses,
    getCourseProgress,
    totalEnrolledCount,
    continueCourse,
  } = useLMS();

  const featuredCourses = courses.slice(0, 3);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Learner";
  const featuredCourse = featuredCourses[0];

  return (
    <div className="min-h-screen bg-[#f5f9ff]">
      <header className="border-b border-slate-200 bg-white/90">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <Link to="/" className="flex flex-col leading-tight text-[#123b7a]">
            <span className="font-serif text-xl font-semibold">coursebox</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2f6fed]">Learn. Build. Grow.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/courses" className="hidden text-sm font-medium text-slate-600 hover:text-[#123b7a] sm:inline">
              Courses
            </Link>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#123b7a] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0d47b5]"
            >
              {user ? "Go to dashboard" : "Sign in"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#123b7a] text-white">
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[56%] md:block">
          <img
            src={featuredCourse?.thumbnail}
            alt=""
            className="h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123b7a] via-[#123b7a]/55 to-transparent" />
        </div>

        <div className="relative max-w-2xl px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b9d4ff]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Learn. Build. Grow.
          </div>
          <p className="text-sm font-medium text-white/75">{user ? `Good to see you, ${firstName}.` : "Learn something worth sharing."}</p>
          <h1 className="mt-2 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
            Turn curiosity into real-world skills.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
            Discover focused courses, follow clear lessons, and practice new ideas at your own pace. Whether you are starting from scratch or sharpening what you already know, coursebox helps turn each next step into momentum.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={user ? "/courses" : "/login"}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#dbeafe] px-5 text-sm font-semibold text-[#123b7a] transition-colors hover:bg-white"
            >
              {user ? "Explore courses" : "Sign in with Google"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {user && continueCourse && (
              <Link
                to={user ? `/courses/${continueCourse.course.id}` : "/login"}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Continue learning
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 border-b border-slate-200 pb-9 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f6fed]">A learning journey with direction</p>
          <h2 className="mt-2 max-w-md font-serif text-2xl leading-tight text-slate-900 sm:text-3xl">Knowledge is only the beginning.</h2>
        </div>
        <div className="space-y-4 text-sm leading-6 text-slate-600">
          <p>Real progress comes from pairing clear instruction with time to practice. Explore subjects that interest you, learn from experienced instructors, and build a steady routine that fits into your life.</p>
          <p>Each course gives you a practical next step, so new ideas can grow into useful skills. Start with one lesson, keep experimenting, and make the progress your own.</p>
        </div>
        <div className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-3 md:col-span-2">
          <div>
            <h3 className="font-serif text-xl text-[#123b7a]">Learn</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Build a strong foundation with approachable lessons and clear explanations.</p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-[#123b7a]">Build</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Put new concepts into practice and turn understanding into hands-on experience.</p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-[#123b7a]">Grow</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Keep moving forward with skills you can carry into your next challenge.</p>
          </div>
        </div>
      </section>

      <section aria-label="Your learning overview" className="grid gap-5 border-y border-slate-200 py-5 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#2457a6]">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-semibold text-slate-900">{courses.length}</p>
            <p className="text-xs text-slate-500">Courses to explore</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf2ff] text-[#2457a6]">
            <Play className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-semibold text-slate-900">
              {user ? totalEnrolledCount : categories.filter((category) => category !== "All").length}
            </p>
            <p className="text-xs text-slate-500">{user ? "Courses in your library" : "Subject areas"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f0ff] text-[#2e62b8]">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-semibold text-slate-900">
              {user && continueCourse ? `${getCourseProgress(continueCourse.course.id)}%` : "Anytime"}
            </p>
            <p className="text-xs text-slate-500">{user && continueCourse ? "Progress on your next lesson" : "Learn at your own pace"}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f6fed]">Find your direction</p>
            <h2 className="mt-1 font-serif text-2xl text-slate-900 sm:text-3xl">Start with a subject</h2>
          </div>
            <Link to={user ? "/courses" : "/login"} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#2457a6] hover:text-[#123b7a]">
            All courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.filter((category) => category !== "All").map((category) => (
            <Link
              key={category}
              to={user ? "/courses" : "/login"}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#759862] hover:bg-[#f3f7ef] hover:text-[#36572a]"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f6fed]">A good place to begin</p>
            <h2 className="mt-1 font-serif text-2xl text-slate-900 sm:text-3xl">Explore popular courses</h2>
          </div>
          <Link to={user ? "/courses" : "/login"} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#2457a6] hover:text-[#123b7a] sm:inline-flex">
            Browse catalog <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredCourses.map((course) => (
            <Link
              key={course.id}
              to={user ? "/courses" : "/login"}
              className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                <img
                  src={course.thumbnail}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-[#2f6fed]">{course.category} <span className="px-1 text-slate-300">/</span> {course.level}</p>
                <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-slate-900">{course.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{course.shortDescription}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{course.instructor}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{course.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      </main>
    </div>
  );
};

export default HomePage;