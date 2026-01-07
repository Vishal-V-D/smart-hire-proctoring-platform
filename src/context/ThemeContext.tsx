'use client';

import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname } from 'next/navigation';

export type ThemeMode = "light" | "dark" | "legacy";

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    themes: ThemeMode[];
    isDarkModeAllowed: boolean;
}

const AVAILABLE_THEMES: ThemeMode[] = ["light", "dark", "legacy"];

export const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => { },
    setTheme: () => { },
    themes: AVAILABLE_THEMES,
    isDarkModeAllowed: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname();

    // Pages that MUST be light mode only (contestant-facing registration/lobby pages)
    const lightModeOnlyPaths = [
        '/register',
        '/verify',
        '/otp',
        '/lobby',
        '/setup'
    ];

    // Specific contestant assessment paths that need light mode (lobby/instructions only)
    const isContestantAssessmentLobby =
        pathname?.includes('/contestant/assessment/') &&
        !pathname?.includes('/attempt') &&
        !pathname?.includes('/take') &&
        !pathname?.includes('/coding') &&
        !pathname?.includes('/complete');

    // Check if current path requires forced light mode
    // Only force light mode on registration flows and contestant assessment lobby
    // Organizer pages should ALWAYS allow dark mode
    const isLightModeForced =
        lightModeOnlyPaths.some(path => pathname?.includes(path)) ||
        isContestantAssessmentLobby;

    const [theme, setThemeState] = useState<ThemeMode>(() => {
        if (typeof window === 'undefined') return 'light';
        const stored = localStorage.getItem("theme") as ThemeMode | null;
        return stored && AVAILABLE_THEMES.includes(stored) ? stored : "light";
    });

    // Determine the effective theme to render
    const effectiveTheme = isLightModeForced ? 'light' : theme;

    // Effect to apply theme class
    useEffect(() => {
        document.documentElement.classList.remove("light", "dark", "legacy");
        document.documentElement.classList.add(effectiveTheme);
    }, [effectiveTheme]);

    const setTheme = (mode: ThemeMode) => {
        if (AVAILABLE_THEMES.includes(mode)) {
            setThemeState(mode);
            localStorage.setItem("theme", mode);
        }
    };

    const toggleTheme = () => {
        if (isLightModeForced) return;
        const currentIndex = AVAILABLE_THEMES.indexOf(theme);
        const nextTheme = AVAILABLE_THEMES[(currentIndex + 1) % AVAILABLE_THEMES.length];
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{
            theme: effectiveTheme, // Expose effective theme so components render correctly
            toggleTheme,
            setTheme,
            themes: AVAILABLE_THEMES,
            isDarkModeAllowed: !isLightModeForced
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
