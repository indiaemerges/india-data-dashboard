import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboards", label: "Dashboards" },
    { href: "/explore", label: "Explorer" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">🇮🇳</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              India Data Dashboard
            </span>
          </Link>

          {/* Desktop Navigation + Theme Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <nav className="flex items-center gap-6 mr-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors no-underline ${
                    router.pathname === link.href ||
                    (link.href !== "/" &&
                      router.pathname.startsWith(link.href))
                      ? "text-orange-600"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>

          {/* Mobile: Theme Toggle + Hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-100 dark:border-gray-700 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 text-sm font-medium no-underline ${
                  router.pathname === link.href
                    ? "text-orange-600"
                    : "text-gray-600 dark:text-gray-300"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
