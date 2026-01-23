// src/api/axiosSubmissionClient.ts
import axios from "axios";

const SUBMISSION_API_URL = process.env.NEXT_PUBLIC_SUBMISSION_SERVICE_URL;
const CONTEST_API_URL = process.env.NEXT_PUBLIC_CONTEST_SERVICE_URL;

console.log('🔧 [Config] Loading Submission Service Client...');
// console.log('🔧 [Config] NEXT_PUBLIC_SUBMISSION_SERVICE_URL:', SUBMISSION_API_URL);

if (!process.env.NEXT_PUBLIC_SUBMISSION_SERVICE_URL || !process.env.NEXT_PUBLIC_CONTEST_SERVICE_URL) {
    console.warn('⚠️ [Config] Missing API URLs in environment variables, using defaults');
}

console.log('✅ [Config] Submission Service URL configured:', SUBMISSION_API_URL);

const axiosSubmissionClient = axios.create({
    baseURL: SUBMISSION_API_URL,
    withCredentials: true, // ✅ Important: Send cookies (Refresh Token)
    headers: {
        "Content-Type": "application/json"
    }
});

// ✅ Helper: Set cookie (to sync with middleware)
const setCookie = (name: string, value: string, days: number = 7) => {
    if (typeof document === 'undefined') return; // SSR guard
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

// ✅ Helper: Remove cookie
const removeCookie = (name: string) => {
    if (typeof document === 'undefined') return; // SSR guard
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

// ✅ Helper: Clear all auth data
const clearAuthData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    removeCookie("token");
    removeCookie("userData");
    console.log("🔐 [Auth] Cleared all auth data");
};

// ✅ Helper: Update token in both localStorage and cookies
const updateToken = (token: string) => {
    localStorage.setItem("token", token);
    setCookie("token", token);
    console.log("✅ [Auth] Token updated in localStorage and cookies");
};

// Request interceptor
axiosSubmissionClient.interceptors.request.use(
    (config) => {
        // Add Authorization Bearer token from localStorage
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`🚀 [SubmissionService] ${config.method?.toUpperCase()} ${config.url} [Auth: ✓]`);
        } else {
            console.warn(`⚠️ [SubmissionService] ${config.method?.toUpperCase()} ${config.url} [Auth: ✗ - No token found]`);
        }

        return config;
    },
    (error) => {
        console.error('❌ [SubmissionService] Request Error:', error);
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor
axiosSubmissionClient.interceptors.response.use(
    (response) => {
        console.log(`✅ [SubmissionService] ${response.config.url}`, response.status);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        console.log(`❌ [SubmissionService] ${originalRequest?.url}`, status);

        // ✅ Handle 403 Forbidden OR 401 Unauthorized (Expired Access Token) -> Try Refresh
        if ((status === 403 || status === 401) && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosSubmissionClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("🔄 [SubmissionService] Access Token expired. Refreshing...");

                // Call refresh endpoint (Cookie is sent automatically)
                const { data } = await axios.post(
                    `${CONTEST_API_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                // Update Access Token in both localStorage AND cookies
                const newToken = data.token;
                updateToken(newToken);
                console.log("✅ [SubmissionService] Token Refreshed!");

                // Update header and retry original request
                axiosSubmissionClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                isRefreshing = false;

                return axiosSubmissionClient(originalRequest);

            } catch (refreshError) {
                console.error("⛔ [SubmissionService] Refresh failed. Logging out...", refreshError);

                processQueue(refreshError, null);
                isRefreshing = false;

                // Clear all auth data & redirect
                clearAuthData();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        // Handle 401 Unauthorized (Invalid Token / Login Required)
        if (status === 401) {
            const hadToken = error.config?.headers?.Authorization;

            if (hadToken) {
                // Token was sent but rejected
                console.error('🔒 [SubmissionService] 401 - Authentication failed');
                console.warn('⚠️ [SubmissionService] Letting component handle auth error - no auto-redirect');
            } else {
                // No token was sent - this is a request issue, not an auth issue
                console.warn('⚠️ [SubmissionService] 401 but no token was sent - possible race condition');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosSubmissionClient;
