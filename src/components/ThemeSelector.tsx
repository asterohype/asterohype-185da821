import { useThemeStore, ThemeStyle } from '@/stores/themeStore';
import { Palette, Sparkles, Heart, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    setTheme(themeId);
    // Force immediate DOM update
    const root = document.documentElement;
    root.classList.remove('theme-default', 'theme-hype', 'theme-cute');
    root.classList.add(`theme-${themeId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-secondary transition-colors"
          style={{ 
            background: 'transparent', 
            border: 'none', 
            boxShadow: 'none',
            backdropFilter: 'none'
          }}
        >
          {currentTheme.icon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => handleThemeChange(t.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="flex-shrink-0">{t.icon}</span>
            <div className="flex-1">
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};