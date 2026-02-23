import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

type ThemeOption = "system" | "light" | "dark";

const CYCLE: Record<ThemeOption, ThemeOption> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABELS: Record<ThemeOption, string> = {
  system: "System theme",
  light: "Light mode",
  dark: "Dark mode",
};

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const ICONS: Record<ThemeOption, React.ReactNode> = {
  system: <MonitorIcon />,
  light: <SunIcon />,
  dark: <MoonIcon />,
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Avoid hydration mismatch: don't render the real button until client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder with same dimensions to avoid layout shift
    return <div className="w-9 h-9" />;
  }

  const current = (theme as ThemeOption) ?? "system";

  return (
    <button
      onClick={() => setTheme(CYCLE[current])}
      className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={LABELS[current]}
      title={LABELS[current]}
    >
      {ICONS[current]}
    </button>
  );
}
