"use client";

import { IconButton } from "@whop/react/components";
import { Moon20, Sun20 } from "@frosted-ui/icons";
import { useEffect, useState } from "react";

type ThemeName = "dark" | "light";

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("whop-tasks-theme");
    const nextTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    applyTheme(nextTheme);
    setTheme(nextTheme);
  }, []);

  function toggleTheme(): void {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    window.localStorage.setItem("whop-tasks-theme", nextTheme);
  }

  return (
    <IconButton
      type="button"
      variant="ghost"
      color="gray"
      size="2"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onClick={toggleTheme}
    >
      <span className="relative grid size-5 place-items-center">
        <Moon20
          aria-hidden="true"
          className={`absolute transition-[opacity,transform,filter] duration-200 ${
            theme === "light"
              ? "scale-100 opacity-100 blur-0"
              : "scale-25 opacity-0 blur-[4px]"
          }`}
        />
        <Sun20
          aria-hidden="true"
          className={`absolute transition-[opacity,transform,filter] duration-200 ${
            theme === "dark"
              ? "scale-100 opacity-100 blur-0"
              : "scale-25 opacity-0 blur-[4px]"
          }`}
        />
      </span>
    </IconButton>
  );
}
