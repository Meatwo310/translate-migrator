"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolveTheme = (theme: Theme): ResolvedTheme => {
    if (theme === "system") return getSystemTheme();
    return theme;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored && ["system", "light", "dark"].includes(stored)) {
            setThemeState(stored);
        }
        setMounted(true);
    }, []);

    // Update resolved theme and apply to DOM
    useEffect(() => {
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);
        document.documentElement.setAttribute("data-theme", resolved);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            const resolved = resolveTheme("system");
            setResolvedTheme(resolved);
            document.documentElement.setAttribute("data-theme", resolved);
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    }, []);

    const cycleTheme = useCallback(() => {
        const order: Theme[] = ["light", "system", "dark"];
        const currentIndex = order.indexOf(theme);
        const nextIndex = (currentIndex + 1) % order.length;
        setTheme(order[nextIndex]);
    }, [theme, setTheme]);

    const value = useMemo(
        () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
        [theme, resolvedTheme, setTheme, cycleTheme]
    );

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
