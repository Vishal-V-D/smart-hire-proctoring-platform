'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Client-side auth provider wrapper
import { AuthProviderClient } from './AuthProviderClient'
import { NotificationProvider } from '@/context/NotificationContext'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                refetchOnWindowFocus: false,
                retry: 1
            },
        },
    }))

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProviderClient>
                        <NotificationProvider>
                            <ToastProvider>
                                {children}
                                <ToastContainer
                                    position="top-right"
                                    autoClose={3000}
                                    hideProgressBar={false}
                                    newestOnTop={false}
                                    closeOnClick
                                    rtl={false}
                                    pauseOnFocusLoss
                                    draggable
                                    pauseOnHover
                                    theme="colored"
                                />
                                <Toaster />
                            </ToastProvider>
                        </NotificationProvider>
                    </AuthProviderClient>
                </ThemeProvider>
            </QueryClientProvider>
        </GoogleOAuthProvider>
    )
}
