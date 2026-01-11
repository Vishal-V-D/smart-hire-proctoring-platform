'use client'

import { usePathname } from 'next/navigation'

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || ""

    // Hide Navbar on login page for now
    const hideNavbar = pathname.includes('/login')

    return (
        <div className="min-h-screen">
            {/* Navbar can be added here later */}
            {children}
        </div>
    )
}
