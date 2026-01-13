"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const shouldStartCollapsed = pathname?.includes('/assessments/create');
    const [isCollapsed, setIsCollapsed] = useState(!!shouldStartCollapsed);

    const setCollapsed = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
    };

    const toggleSidebar = () => {
        setIsCollapsed((prev) => !prev);
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, setCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};
