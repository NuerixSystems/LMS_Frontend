// src/components/layout/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "../common/Logo";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="md" theme="light" />
            <p className="text-sm text-slate-400 mt-3 max-w-xs leading-relaxed">
              Learn anytime, anywhere. Master new skills with expert-led
              courses on CourseBox.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Dashboard", to: "/dashboard" },
                { label: "Courses", to: "/courses" },
                { label: "My Learning", to: "/my-learning" },
                { label: "Profile", to: "/profile" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About Us", "Careers", "Blog", "Contact"].map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {["Help Center", "Terms of Service", "Privacy Policy", "FAQ"].map(
                (label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
            © {currentYear} CourseBox. All rights reserved.
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            Made with ❤️ for learners
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;