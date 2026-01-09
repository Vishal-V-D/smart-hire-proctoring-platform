'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';

export default function NetworkMonitor() {
    const [status, setStatus] = useState<'online' | 'offline' | 'poor'>('online');
    const [details, setDetails] = useState<string>('');

    useEffect(() => {
        // Initial status
        updateNetworkStatus();

        // Listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Optional: Check connection quality periodically if supported
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        let changeListener: any;

        if (connection) {
            changeListener = () => updateConnectionQuality(connection);
            connection.addEventListener('change', changeListener);
            updateConnectionQuality(connection);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (connection && changeListener) {
                connection.removeEventListener('change', changeListener);
            }
        };
    }, []);

    const handleOnline = () => {
        console.log('🌐 Network is ONLINE');
        setStatus('online');
        // Re-check quality
        const connection = (navigator as any).connection;
        if (connection) {
            updateConnectionQuality(connection);
        }
    };

    const handleOffline = () => {
        console.log('❌ Network is OFFLINE');
        setStatus('offline');
    };

    const updateConnectionQuality = (connection: any) => {
        if (!navigator.onLine) {
            setStatus('offline');
            return;
        }

        const { effectiveType, rtt, downlink } = connection;
        console.log('📡 Network Quality:', { effectiveType, rtt, downlink });

        // Criteria for "poor" connection
        // - effectiveType is '2g' or 'slow-2g'
        // - rtt (Round Trip Time) > 500ms
        // - downlink < 1Mbps
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || (rtt && rtt > 500) || (downlink && downlink < 1)) {
            setStatus('poor');
            setDetails(`Signal: ${effectiveType?.toUpperCase() || 'Weak'} (${downlink} Mbps)`);
        } else {
            setStatus('online');
        }
    };

    if (status === 'online') return null;

    if (status === 'offline') {
        return (
            <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <WifiOff className="w-10 h-10 text-red-600 dark:text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">No Internet Connection</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                    We lost connection to the server. Please check your internet connection.
                    Your progress is saved locally and will sync when you are back online.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (status === 'poor') {
        return (
            <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-md animate-in slide-in-from-top duration-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                    Unstable Internet Connection. {details && <span className="opacity-90 text-xs ml-1">[{details}]</span>}
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-auto sm:ml-0">
                    Proctoring Active
                </span>
            </div>
        );
    }

    return null;
}

const updateNetworkStatus = () => {
    // Helper helper to initially set logic if needed, but mostly handled by events
    if (!navigator.onLine) {
        // Force update if initially offline
    }
};
