import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemeId, ThemeOption } from '../types';

export const THEMES: ThemeOption[] = [
  { id: 'dark', name: 'Dark Developer', hint: 'Deep charcoal + indigo/cyan' },
  { id: 'light', name: 'Light Developer', hint: 'Clean IDE light mode' },
  { id: 'midnight', name: 'Midnight Blue', hint: 'Ocean dark + blue/teal' },
  { id: 'violet', name: 'Cyber Violet', hint: 'Purple dark + pink accents' },
  { id: 'forest', name: 'Forest Terminal', hint: 'Green terminal vibes' },
];

const STORAGE_KEY = 'devforge.theme';

const isValidTheme = (v: string | null): v is ThemeId =>
  !!v && THEMES.some((t) => t.id === v);

const getInitialTheme = (): ThemeId => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(stored)) return stored;
  } catch {
    /* localStorage unavailable */
  }
  return 'dark';
};

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore quota/private-mode errors */
    }
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => setThemeState(t), []);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
