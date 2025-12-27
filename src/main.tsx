import { createRoot } from "react-dom/client";
import { useLayoutEffect, useState, useEffect } from "react";
import App from "./App.tsx";
import "./index.css";
import { useThemeStore } from "./stores/themeStore";

// Error Boundary simple para capturar errores de renderizado inicial
const ErrorFallback = ({ error }: { error: any }) => (
  <div style={{ 
    padding: '20px', 
    color: '#ff4444', 
    fontFamily: 'monospace', 
    background: 'black', 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    textAlign: 'center'
  }}>
    <h1 style={{ marginBottom: '20px' }}>💥 Algo salió mal al iniciar la aplicación</h1>
    <pre style={{ background: '#222', padding: '15px', borderRadius: '10px', maxWidth: '80%', overflow: 'auto', marginBottom: '20px' }}>
      {error?.toString()}
    </pre>
    <p style={{ color: '#aaa', marginBottom: '10px' }}>Por favor, intenta recargar la página. Si el problema persiste, vuelve más tarde.</p>
    <p style={{ color: '#666', fontSize: '12px', marginBottom: '30px' }}>Revisa la consola del navegador (F12) para más detalles técnicos.</p>
    <button 
      onClick={() => window.location.reload()} 
      style={{ 
        padding: '12px 24px', 
        borderRadius: '9999px', 
        border: 'none', 
        background: 'white', 
        color: 'black', 
        fontWeight: 'bold', 
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 15px rgba(255,255,255,0.2)'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      Recargar Página
    </button>
  </div>
);

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

try {
  const initialTheme = getInitialTheme();
  document.documentElement.classList.add(`theme-${initialTheme}`);
} catch (e) {
  console.error("Error setting initial theme class", e);
}

const Root = () => {
  const [error, setError] = useState<any>(null);
  const { theme } = useThemeStore();

  useLayoutEffect(() => {
    try {
      const root = document.documentElement;
      // Remove all theme classes
      root.classList.remove('theme-default', 'theme-hype', 'theme-cute');
      // Add current theme class
      root.classList.add(`theme-${theme}`);
      console.log('Theme applied:', theme, 'Classes:', root.className);
    } catch (e) {
      console.error("Error in useLayoutEffect theme application", e);
    }
  }, [theme]);

  if (error) return <ErrorFallback error={error} />;

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
};

// Componente ErrorBoundary de clase para capturar errores en hijos
import React from "react";
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = '<div style="color:red;padding:20px">FATAL: No se encontró el elemento #root en el DOM.</div>';
} else {
  try {
    createRoot(rootElement).render(<Root />);
  } catch (e) {
    console.error("FATAL ERROR during createRoot/render:", e);
    rootElement.innerHTML = `<div style="color:red;padding:20px"><h1>FATAL ERROR</h1><pre>${e}</pre></div>`;
  }
}
