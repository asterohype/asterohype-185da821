import { createRoot } from "react-dom/client";
import { useEffect, useLayoutEffect } from "react";
import App from "./App.tsx";
import "./index.css";
import { useThemeStore } from "./stores/themeStore";

// Apply theme immediately before React renders
const initialTheme = localStorage.getItem('asterohype-theme');
const parsedTheme = initialTheme ? JSON.parse(initialTheme)?.state?.theme : 'default';
document.documentElement.classList.add(`theme-${parsedTheme || 'default'}`);

const Root = () => {
  const { theme } = useThemeStore();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-default', 'theme-hype', 'theme-cute');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return <App />;
};

createRoot(document.getElementById("root")!).render(<Root />);
