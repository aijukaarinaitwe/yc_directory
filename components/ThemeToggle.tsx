"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

const THEMES = ["light", "dark", "system"] as const;
type ThemeName = (typeof THEMES)[number];

const ICONS: Record<ThemeName, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="size-9" aria-hidden="true" />;
  }

  const current = (theme as ThemeName) ?? "system";
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const Icon = ICONS[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${current}. Click to switch to ${next}.`}
      title={`Theme: ${current} (click for ${next})`}
      className="flex size-9 items-center justify-center rounded-full border-2 border-black text-black transition-colors dark:border-white dark:text-white"
    >
      <Icon className="size-4" />
    </button>
  );
};

export default ThemeToggle;
