import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useLMS } from "../../context/LMSContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { searchQuery, setSearchQuery, courses, enrollments } = useLMS();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ============================================================
  // STUDENT INFORMATION
  // ============================================================

  const studentName =
    user?.name ||
    (user as any)?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";

  const studentEmail = user?.email || "";

  const studentAvatar =
    (user as any)?.avatar ||
    (user as any)?.picture ||
    "";

  const avatarLetter = studentName
    .trim()
    .charAt(0)
    .toUpperCase();

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const notifications = enrollments.slice(0, 3).flatMap((enrollment) => {
    const course = courses.find((item) => item.id === enrollment.courseId);
    if (!course) return [];

    const isComplete = enrollment.progressPercentage >= 100;
    const isStarted = enrollment.progressPercentage > 0;

    return [{
      id: enrollment.id,
      title: isComplete ? "Course completed" : isStarted ? "Keep your momentum" : "Ready when you are",
      desc: isComplete
        ? `You completed ${course.title}. Choose another course to keep growing.`
        : isStarted
          ? `${enrollment.progressPercentage}% complete in ${course.title}. Continue with your next lesson.`
          : `Start learning ${course.title} with its first lesson.`,
      time: isComplete ? "Completed" : "In your learning plan",
      icon: isComplete ? CheckCircle2 : BookOpen,
      to: `/courses/${course.id}`,
    }];
  });

  if (notifications.length === 0) {
    courses.slice(0, 2).forEach((course) => {
      notifications.push({
        id: course.id,
        title: "Explore a course",
        desc: `Discover lessons and start learning ${course.title}.`,
        time: "Course catalog",
        icon: BookOpen,
        to: "/courses",
      });
    });
  }

  const unreadCount = notificationsRead ? 0 : notifications.length;

  // ============================================================
  // CLOSE NOTIFICATION DROPDOWN
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    navigate("/courses");
  };

  // ============================================================
  // CLEAR SEARCH
  // ============================================================

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // ============================================================
  // LOGOUT SAFETY
  // ============================================================

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-16
        w-full
        items-center
        justify-between
        border-b
        border-slate-200
        bg-white/95
        px-4
        backdrop-blur
        sm:px-6
        lg:px-8
      "
    >
      {/* ======================================================
          LEFT SIDE
      ======================================================= */}

      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Mobile menu */}

        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="
              rounded-lg
              p-2
              text-slate-600
              hover:bg-slate-100
              lg:hidden
            "
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Search */}

        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full max-w-md"
        >
          <Search
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            type="text"
            placeholder="Search courses, lessons, topics..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            className="
              h-10
              w-full
              rounded-lg
              border
              border-slate-200
              bg-slate-50
              pl-9
              pr-16
              text-sm
              text-slate-900
              placeholder-slate-400
              transition-colors
              focus:border-indigo-600
              focus:bg-white
              focus:outline-none
              focus:ring-1
              focus:ring-indigo-600
            "
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-xs
                font-semibold
                text-slate-400
                hover:text-slate-600
              "
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* ======================================================
          RIGHT SIDE
      ======================================================= */}

      <div className="flex items-center gap-3 sm:gap-4">

        {/* ====================================================
            NOTIFICATIONS
        ===================================================== */}

        <div
          className="relative"
          ref={dropdownRef}
        >
          <button
            type="button"
            onClick={() => {
              const nextValue = !showNotifications;

              setShowNotifications(nextValue);

              if (nextValue) {
                setNotificationsRead(true);
              }
            }}
            className="
              relative
              rounded-full
              p-2
              text-slate-600
              transition-colors
              hover:bg-slate-100
            "
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
              <span
                className="
                  absolute
                  right-1.5
                  top-1.5
                  flex
                  h-2
                  w-2
                  rounded-full
                  bg-indigo-600
                  ring-2
                  ring-white
                  animate-pulse
                "
              />
            )}
          </button>

          {/* Notification dropdown */}

          {showNotifications && (
            <div
              className="
                absolute
                right-0
                z-50
                mt-2
                w-80
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                shadow-xl
                sm:w-96
              "
            >
              {/* Header */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-100
                  pb-3
                "
              >
                <h4 className="text-sm font-semibold text-slate-900">
                  Course updates
                </h4>

                <button
                  type="button"
                  onClick={() => setNotificationsRead(true)}
                  className="
                    text-xs
                    font-medium
                    text-indigo-600
                    hover:underline
                  "
                >
                  Mark all as read
                </button>
              </div>

              {/* Notification list */}

              <div
                className="
                  mt-3
                  max-h-80
                  space-y-2.5
                  overflow-y-auto
                "
              >
                {notifications.map((notification) => {
                  const Icon = notification.icon;

                  return (
                    <Link
                      key={notification.id}
                      to={notification.to}
                      onClick={() => setShowNotifications(false)}
                      className="
                        flex
                        items-start
                        gap-3
                        rounded-lg
                        p-2.5
                        transition-colors
                        hover:bg-slate-50
                      "
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-indigo-50
                          text-indigo-600
                        "
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900">
                          {notification.title}
                        </p>

                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                          {notification.desc}
                        </p>

                        <span className="mt-1 block text-[10px] text-slate-400">
                          {notification.time}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}

        <div className="h-6 w-px bg-slate-200" />

        {/* ====================================================
            STUDENT PROFILE
        ===================================================== */}

        <button
          type="button"
          onClick={handleProfileClick}
          className="
            flex
            items-center
            gap-2.5
            rounded-full
            p-1
            pl-1.5
            pr-2.5
            transition-colors
            hover:bg-slate-100
          "
        >
          {/* Avatar */}

          {studentAvatar ? (
            <img
              src={studentAvatar}
              alt={studentName}
              className="
                h-8
                w-8
                rounded-full
                border
                border-slate-200
                object-cover
              "
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-indigo-100
                text-xs
                font-semibold
                text-indigo-700
              "
            >
              {avatarLetter}
            </div>
          )}

          {/* Student information */}

          <div className="hidden text-left sm:block">
            <p
              className="
                max-w-[150px]
                truncate
                text-sm
                font-medium
                text-slate-700
              "
            >
              {studentName}
            </p>

            {studentEmail && (
              <p
                className="
                  max-w-[150px]
                  truncate
                  text-[10px]
                  text-slate-400
                "
              >
                {studentEmail}
              </p>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;