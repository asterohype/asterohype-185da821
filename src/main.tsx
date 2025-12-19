import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import App from "./App.tsx";
import "./index.css";
import { useThemeStore } from "./stores/themeStore";

const Root = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-default', 'theme-hype', 'theme-cute');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return <App />;
};

createRoot(document.getElementById("root")!).render(<Root />);
