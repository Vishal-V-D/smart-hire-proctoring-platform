/**
 * User ID Utility
 * Handles extraction of userId from various storage locations
 */

/**
 * Get userId from localStorage or sessionStorage
 * Tries multiple sources and parses user object if needed
 */
export function getUserId(): string | null {
    console.log('🔍 [GET-USER-ID] Searching for userId...');

    if (typeof window === 'undefined') return null;

    // Try direct userId keys
    let userId = localStorage.getItem('userId') ||
        localStorage.getItem('user_id') ||
        sessionStorage.getItem('userId') ||
        sessionStorage.getItem('user_id');

    if (userId) {
        console.log('✅ [GET-USER-ID] Found userId directly:', userId);
        return userId;
    }

    // Try parsing user object from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            userId = user.id || user.userId || user._id || user.user_id;

            if (userId) {
                console.log('✅ [GET-USER-ID] Extracted userId from user object:', userId);
                return userId;
            }

            console.warn('⚠️ [GET-USER-ID] User object exists but no id field found:', user);
        } catch (e) {
            console.error('❌ [GET-USER-ID] Failed to parse user object:', e);
        }
    }

    // Try parsing user object from sessionStorage
    const sessionUserStr = sessionStorage.getItem('user');
    if (sessionUserStr) {
        try {
            const user = JSON.parse(sessionUserStr);
            userId = user.id || user.userId || user._id || user.user_id;

            if (userId) {
                console.log('✅ [GET-USER-ID] Extracted userId from sessionStorage user object:', userId);
                return userId;
            }
        } catch (e) {
            console.error('❌ [GET-USER-ID] Failed to parse sessionStorage user object:', e);
        }
    }

    console.error('❌ [GET-USER-ID] No userId found in any storage location');

    return null;
}

/**
 * Get user object from storage
 */
export function getUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Failed to parse user object:', e);
        }
    }
    return null;
}
