// src/api/axiosContestClient.ts

import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_CONTEST_SERVICE_URL;

console.log('🔧 [Config] Loading Contest Service Client...');
console.log('🔧 [Config] NEXT_PUBLIC_CONTEST_SERVICE_URL:', API_BASE_URL);

if (!API_BASE_URL) {
    console.error('❌ [Config] Missing NEXT_PUBLIC_CONTEST_SERVICE_URL in environment variables');
    // We strictly require the env var now, but to avoid crash during build time we might leave undefined, 
    // effectively causing requests to fail if not set, which is desired.
}

const axiosContestClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Helper: Clear all auth data
const clearAuthData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    Cookies.remove("token", { path: '/' });
    Cookies.remove("userData", { path: '/' });
    console.log("🔐 [Auth] Cleared all auth data");
};

// Helper: Update token in both localStorage and cookies
const updateToken = (token: string) => {
    localStorage.setItem("token", token);
    Cookies.set("token", token, { expires: 7, path: '/', sameSite: 'Lax' });
    console.log("✅ [Auth] Token updated in localStorage and cookies");
};

// --- Request Interceptor ---
axiosContestClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;

            // 🔍 DEBUG: Log token details for contestant endpoints
            if (config.url?.includes('/contestant/')) {
                console.log(`🔍 [DEBUG] Contestant Request Details:`, {
                    url: config.url,
                    method: config.method?.toUpperCase(),
                    tokenPreview: `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
                    authHeader: config.headers.Authorization
                });

                // Decode JWT to see role
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    console.log(`🔍 [DEBUG] Token Payload:`, {
                        role: payload.role,
                        email: payload.email,
                        exp: new Date(payload.exp * 1000).toISOString()
                    });
                } catch (e) {
                    console.error('❌ Failed to decode token:', e);
                }
            }

            // 🔍 DEBUG: Log for admin-related endpoints to trace 401 issues
            if (config.url?.startsWith('/assessments') || config.url?.startsWith('/organizer') || config.url?.startsWith('/admin')) {
                console.log(`🔐 [AUTH] Authenticating admin/organizer request to: ${config.method?.toUpperCase()} ${config.url}`);
                console.log(`🔐 [AUTH] Token present: ${!!token}, Length: ${token?.length}`);
            }

            console.log(`🚀 [ContestService] ${config.method?.toUpperCase()} ${config.url} [Auth: ✓]`);
        } else {
            console.warn(`⚠️ [ContestService] ${config.method?.toUpperCase()} ${config.url} [Auth: ✗ - No token found]`);
            // Try to get token from cookies as fallback
            const cookieToken = Cookies.get('token');
            if (cookieToken) {
                config.headers.Authorization = `Bearer ${cookieToken}`;
                console.log(`🍪 [ContestService] Using token from cookies as fallback`);
                localStorage.setItem('token', cookieToken);
            }
        }

        return config;
    },
    (error) => {
        console.error('❌ [ContestService] Request Error:', error);
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue: { resolve: (value: string | null) => void; reject: (error: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// --- Response Interceptor ---
axiosContestClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Skip token refresh for auth endpoints and contestant endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/signup') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh-token') ||
            originalRequest.url?.includes('/auth/magic-login') ||
            originalRequest.url?.includes('/auth/password-reset') ||
            originalRequest.url?.includes('/auth/change-password') ||
            originalRequest.url?.includes('/auth/set-password') ||
            originalRequest.url?.includes('/auth/google');

        // Skip for contestant-specific endpoints (they use invitation-based auth)
        const isContestantEndpoint = originalRequest.url?.includes('/contestant/') ||
            originalRequest.url?.includes('/invitations/');

        // Handle 401 Unauthorized (Expired) -> Try Refresh.
        // We do NOT treat 403 as expiry anymore because it causes loops when user has valid token but no permission.
        if (status === 401 && !originalRequest._retry && !isAuthEndpoint && !isContestantEndpoint) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosContestClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("🔄 [ContestService] Access Token expired. Refreshing...");

                const { data } = await axios.post(
                    `${API_BASE_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const newToken = data.token;
                updateToken(newToken);
                console.log("✅ [ContestService] Token Refreshed!");

                axiosContestClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                isRefreshing = false;

                return axiosContestClient(originalRequest);

            } catch (refreshError) {
                console.error("⛔ [ContestService] Refresh failed.");

                processQueue(refreshError, null);
                isRefreshing = false;

                clearAuthData();

                // Only redirect to login for organizer paths
                const currentPath = window.location.pathname;
                if (currentPath.startsWith('/organizer')) {
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                }
                // For contestant paths, just log the error - they use invitation links
                else if (currentPath.startsWith('/contestant')) {
                    console.warn('⚠️ [ContestService] Contestant auth failed - awaiting re-authentication via invitation');
                }

                return Promise.reject(refreshError);
            }
        }

        // For contestant endpoints that fail auth, just reject without redirecting
        if ((status === 403 || status === 401) && isContestantEndpoint) {
            console.warn('⚠️ [ContestService] Contestant endpoint auth failed:', originalRequest.url);

            // 🔍 DEBUG: Log backend error response
            console.error('🔍 [DEBUG] Backend Error Details:', {
                status,
                statusText: error.response?.statusText,
                message: error.response?.data?.message || error.response?.data?.error,
                fullResponse: error.response?.data
            });
        }

        return Promise.reject(error);
    }
);

export default axiosContestClient;
