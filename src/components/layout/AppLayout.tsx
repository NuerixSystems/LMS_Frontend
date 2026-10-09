// src/components/layout/AppLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Logo } from "../common/Logo";
import { Footer } from "./Footer";
import { useAuth } from "../../context/AuthContext";

export const AppLayout: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  /**
   * ==========================================
   * SCROLL DETECTION (for navbar shadow)
   * ==========================================
   */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * ==========================================
   * CLOSE MOBILE MENU ON ROUTE CHANGE
   * ==========================================
   */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * ==========================================
   * NAVIGATION LINKS
   * ==========================================
   */
  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Courses", to: "/courses" },
    { label: "My Learning", to: "/my-learning" },
    { label: "Profile", to: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 w-full">

      {/* ==========================================
          STICKY NAVBAR
          ========================================== */}
      <header
        className={`sticky top-0 z-50 w-full 
                    bg-white/95 backdrop-blur-md 
                    transition-all duration-200
                    ${
                      scrolled
                        ? "border-b border-slate-200 shadow-sm"
                        : "border-b border-slate-100"
                    }`}
      >
        <div
          className="w-full max-w-7xl mx-auto 
                     px-4 sm:px-6 lg:px-8 
                     h-14 sm:h-16 
                     flex items-center justify-between gap-4"
        >
          {/* ✅ Logo — left aligned */}
          <Logo size="md" />

          {/* ==========================================
              DESKTOP NAVIGATION (hidden on mobile)
              ========================================== */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium 
                            transition-colors whitespace-nowrap
                            ${
                              isActive(link.to)
                                ? "bg-indigo-50 text-indigo-600"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ==========================================
              USER MENU / ACTIONS (desktop)
              ========================================== */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* User avatar */}
            {user && (
              <div className="flex items-center gap-2">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name || "User"
                    )}&background=4f46e5&color=fff`
                  }
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                />
                <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                  {user.name}
                </span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="px-3 py-2 text-sm font-medium text-slate-600 
                         hover:text-red-600 hover:bg-red-50 
                         rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          {/* ==========================================
              MOBILE MENU BUTTON (hamburger)
              ========================================== */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 
                       hover:bg-slate-100 transition-colors
                       min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              // X icon
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger icon
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ==========================================
            MOBILE MENU (dropdown)
            ========================================== */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-fade-in">
            <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 rounded-lg text-sm font-medium 
                              transition-colors
                              ${
                                isActive(link.to)
                                  ? "bg-indigo-50 text-indigo-600"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* User info + logout in mobile */}
              {user && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || "User"
                        )}&background=4f46e5&color=fff`
                      }
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-2 text-sm font-medium text-red-600 
                               hover:bg-red-50 rounded-lg transition-colors
                               shrink-0"
                  >
                    Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ==========================================
          MAIN CONTENT — full width + centered container
          ========================================== */}
      <main className="flex-1 w-full bg-slate-50">
        <div
          className="w-full max-w-7xl mx-auto 
                     px-4 sm:px-6 lg:px-8 
                     py-6 sm:py-8 lg:py-10"
        >
          <Outlet />
        </div>
      </main>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <Footer />
    </div>
  );
};

export default AppLayout;