import { createRoot } from "react-dom/client";
import { useLayoutEffect } from "react";
import App from "./App.tsx";
import "./index.css";
import { useThemeStore } from "./stores/themeStore";

// Apply theme immediately before React renders
const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('asterohype-theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.theme || 'default';
    }
  } catch (e) {
    console.error('Error reading theme from localStorage:', e);
  }
  return 'default';
};

const initialTheme = getInitialTheme();
document.documentElement.classList.add(`theme-${initialTheme}`);

const Root = () => {
  const { theme } = useThemeStore();

  useLayoutEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('theme-default', 'theme-hype', 'theme-cute');
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    console.log('Theme applied:', theme, 'Classes:', root.className);
  }, [theme]);

  return <App />;
};

createRoot(document.getElementById("root")!).render(<Root />);