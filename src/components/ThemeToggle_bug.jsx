import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Cek apakah ada setelan di localStorage
    const savedTheme = localStorage.getItem("theme");

    // LOGIKA DEFAULT: Jika belum pernah setting, default ke DARK
    // Jika savedTheme === 'light', maka light. Jika tidak (null atau 'dark'), maka dark.
    const shouldBeDark = savedTheme !== "light";

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 transition-colors"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
