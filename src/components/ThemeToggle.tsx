"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { Theme } from "@/context/ThemeContext";

const themeOptions: { theme: Theme; icon: typeof Sun; label: string }[] = [
    { theme: "light", icon: Sun, label: "ライトモード" },
    { theme: "system", icon: Monitor, label: "システム設定に従う" },
    { theme: "dark", icon: Moon, label: "ダークモード" },
];

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="inline-flex items-center rounded-md border border-border bg-surface shadow-sm">
            {themeOptions.map(({ theme: t, icon: Icon, label }) => (
                <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`inline-flex items-center justify-center h-8 w-8 transition-colors first:rounded-l-md last:rounded-r-md focus:outline-none focus:ring-2 focus:ring-accent/40 focus:z-10 ${theme === t
                            ? "bg-accent text-white"
                            : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                        }`}
                    aria-label={label}
                    title={label}
                    aria-pressed={theme === t}
                >
                    <Icon size={16} strokeWidth={2} />
                </button>
            ))}
        </div>
    );
};
