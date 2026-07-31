import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Theme, ThemeProviderProps } from "./ThemeContext.types";
import { ThemeContext, getInitialTheme, THEME_STORAGE_KEY } from "./ThemeContext.types";

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme: setThemeState,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
