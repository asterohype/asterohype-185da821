import { Smartphone, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function MobileSimulator() {
  const [isMobileMode, setIsMobileMode] = useState(false);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    if (isMobileMode) {
      root.style.maxWidth = '375px';
      root.style.margin = '0 auto';
      root.style.border = '8px solid #333';
      root.style.borderRadius = '24px';
      root.style.height = 'calc(100vh - 40px)';
      root.style.marginTop = '20px';
      root.style.overflow = 'hidden';
      root.style.position = 'relative';
      root.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
      document.body.style.backgroundColor = '#f0f0f0';
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    } else {
      root.style.maxWidth = '';
      root.style.margin = '';
      root.style.border = '';
      root.style.borderRadius = '';
      root.style.height = '';
      root.style.marginTop = '';
      root.style.overflow = '';
      root.style.position = '';
      root.style.boxShadow = '';
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
    }

    // Force resize event to update components that depend on window width
    window.dispatchEvent(new Event('resize'));

    return () => {
      // Cleanup when unmounting (although this component likely won't unmount)
      root.style.maxWidth = '';
      root.style.margin = '';
      root.style.border = '';
      root.style.borderRadius = '';
      root.style.height = '';
      root.style.marginTop = '';
      root.style.overflow = '';
      root.style.position = '';
      root.style.boxShadow = '';
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
    };
  }, [isMobileMode]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] hidden md:block print:hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsMobileMode(!isMobileMode)}
            size="icon"
            variant={isMobileMode ? "destructive" : "default"}
            className="h-12 w-12 rounded-full shadow-xl transition-all hover:scale-110"
          >
            {isMobileMode ? <Monitor className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMobileMode ? 'Volver a Escritorio' : 'Simular Móvil'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
