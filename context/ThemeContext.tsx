import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeColors = {
  backgroundColor: string;
  borderColor: string;
  foregroundColorBelowColor: string;
  foregroundColorMiddleColor: string;
  foregroundAboveColor: string;
  foregroundTopColor: string;
  primaryColor: string;
  titleColor: string;
};

export const themes: Record<Theme, ThemeColors> = {
  light: {
    backgroundColor: "#fff",
    borderColor: "#e0e3eb",
    foregroundColorBelowColor: "#4a4a4a",
    foregroundColorMiddleColor: "#758696",
    foregroundAboveColor: "#f5f9fc",
    foregroundTopColor: "#007bff",
    primaryColor: "#121212",
    titleColor: "#f5f9fc",
  },
  dark: {
    backgroundColor: "#131722",
    borderColor: "#2a2e39",
    foregroundColorBelowColor: "#4f5966",
    foregroundColorMiddleColor: "##4f5966",
    foregroundAboveColor: "#1c2030",
    foregroundTopColor: "#fff",
    primaryColor: "#fff",
    titleColor: "#1c2030",
  },
};

type ThemeContextType = {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
});

interface Props {
  children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // let backgroundColor: string
    // let borderColor: string
    // let foregroundColorBelowColor: string
    // let foregroundColorMiddleColor: string
    // let foregroundAboveColor: string
    // let foregroundTopColor: string
    // let primaryColor: string

    // switch (theme) {
    //   case "dark":
    //     backgroundColor = "var(--black)"
    //     borderColor = "var(--gray_darker)"
    //     foregroundColorBelowColor = "var(--gray_dark)"
    //     foregroundColorMiddleColor = "var(--gray)"
    //     foregroundAboveColor = "var(--gray_light)"
    //     foregroundTopColor = "var(--gray_lighter)"
    //     primaryColor = "var(--white)"
    //     break
    //   case "light":
    //     backgroundColor = "var(--white)"
    //     borderColor = "var(--gray_lighter)"
    //     foregroundColorBelowColor = "var(--gray_light)"
    //     foregroundColorMiddleColor = "var(--gray)"
    //     foregroundAboveColor = "var(--gray_dark)"
    //     foregroundTopColor = "var(--gray_darker)"
    //     primaryColor = "var(--black)"
    //     break
    // }

    // document.documentElement.style.setProperty("--bg_color", backgroundColor)
    // document.documentElement.style.setProperty("--border_color", borderColor)
    // document.documentElement.style.setProperty("--fg_below_color", foregroundColorBelowColor)
    // document.documentElement.style.setProperty("--fg_middle_color", foregroundColorMiddleColor)
    // document.documentElement.style.setProperty("--fg_above_color", foregroundAboveColor)
    // document.documentElement.style.setProperty("--fg_top_color", foregroundTopColor)
    // document.documentElement.style.setProperty("--primary_color", primaryColor)

    const themeColors = themes[theme];
    document.documentElement.style.setProperty(
      "--bg_color",
      themeColors.backgroundColor
    );
    document.documentElement.style.setProperty(
      "--border_color",
      themeColors.borderColor
    );
    document.documentElement.style.setProperty(
      "--fg_below_color",
      themeColors.foregroundColorBelowColor
    );
    document.documentElement.style.setProperty(
      "--fg_middle_color",
      themeColors.foregroundColorMiddleColor
    );
    document.documentElement.style.setProperty(
      "--fg_above_color",
      themeColors.foregroundAboveColor
    );
    document.documentElement.style.setProperty(
      "--fg_top_color",
      themeColors.foregroundTopColor
    );
    document.documentElement.style.setProperty(
      "--primary_color",
      themeColors.primaryColor
    );
    document.documentElement.style.setProperty(
      "--title_color",
      themeColors.titleColor
    );
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
