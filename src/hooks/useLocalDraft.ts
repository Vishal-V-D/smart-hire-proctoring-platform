
import { useState, useEffect, useCallback } from 'react';

export function useLocalDraft<T>(key: string, data: T, shouldSave: boolean = true, debounceMs: number = 1000) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Load draft on mount
    const loadDraft = useCallback(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    data: parsed.data as T,
                    timestamp: new Date(parsed.timestamp)
                };
            }
        } catch (e) {
            console.error("Failed to load local draft:", e);
        }
        return null;
    }, [key]);

    // Save draft on change (debounced)
    useEffect(() => {
        if (!shouldSave) return;

        const timer = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify({
                    data,
                    timestamp: new Date().toISOString()
                }));
                setLastSaved(new Date());
                // console.log("💾 [Local Draft] Saved to localStorage:", key);
            } catch (e) {
                console.error("Failed to save local draft:", e);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [data, key, shouldSave, debounceMs]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(key);
    }, [key]);

    return { loadDraft, clearDraft, lastSaved };
}
