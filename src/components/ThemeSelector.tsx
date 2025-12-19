import { useThemeStore, ThemeStyle } from '@/stores/themeStore';
import { Palette, Sparkles, Heart, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const themes: { id: ThemeStyle; name: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'default',
    name: 'Clean',
    icon: <Palette className="h-4 w-4" />,
    description: 'Minimalista y elegante',
  },
  {
    id: 'hype',
    name: 'Hype',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Urbano y moderno',
  },
  {
    id: 'cute',
    name: 'Cute',
    icon: <Heart className="h-4 w-4" />,
    description: 'Suave y femenino',
  },
];

export const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();
  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  const handleThemeChange = (themeId: ThemeStyle) => {
    console.log('Changing theme to:', themeId);
    // Force immediate DOM update
    const root = document.documentElement;
    root.classList.remove('theme-default', 'theme-hype', 'theme-cute');
    root.classList.add(`theme-${themeId}`);
    // Update store
    setTheme(themeId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button"
          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background hover:bg-secondary transition-colors"
        >
          {currentTheme.icon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((t) => (
          <div
            key={t.id}
            role="menuitem"
            tabIndex={0}
            onClick={() => handleThemeChange(t.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleThemeChange(t.id)}
            className="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-sm hover:bg-accent transition-colors"
          >
            <span className="flex-shrink-0">{t.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};