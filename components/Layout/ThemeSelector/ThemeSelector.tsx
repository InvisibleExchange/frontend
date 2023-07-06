import React, { useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";

import { HiMoon, HiSun } from "react-icons/hi2";

export default function ThemeSelector() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <button
      className="flex items-center px-4 text-fg_middle_color"
      // onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <HiSun className="w-5 h-5 hover:text-fg_top_color" />
      ) : (
        <HiMoon className="w-5 h-5 hover:text-fg_top_color" />
      )}
    </button>
  );
}
