'use client'

import { usePathname } from 'next/navigation'

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || ""

    // Hide Navbar on login/register pages for now
    const hideNavbar =
        pathname.includes('/login') ||
        pathname.includes('/register')

    return (
        <div className="min-h-screen">
            {/* Navbar can be added here later */}
            {children}
        </div>
    )
}
