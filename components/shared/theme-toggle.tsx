"use client";

import { IconButton } from "@whop/react/components";
import { Moon20 } from "@frosted-ui/icons";
import { useEffect } from "react";

type ThemeName = "dark" | "light";

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("whop-tasks-theme");
    const nextTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    applyTheme(nextTheme);
  }, []);

  function toggleTheme(): void {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem("whop-tasks-theme", nextTheme);
  }

  return (
    <IconButton
      type="button"
      variant="ghost"
      color="gray"
      size="2"
      aria-label="Toggle color theme"
      onClick={toggleTheme}
    >
      <Moon20 />
    </IconButton>
  );
}
