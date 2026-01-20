'use client'

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
    useCallback,
    useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { contestService } from "@/api/contestService";
import axiosContestClient from "@/api/axiosContestClient";
import Cookies from "js-cookie";

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    username: string;
    role: "organizer" | "contestant" | "admin" | "company";
    password: string;
    organizationName?: string;
}

interface User {
    id: string;
    email: string;
    username: string;
    role: "organizer" | "contestant" | "admin" | "company";
    organizationName?: string;
    avatarUrl?: string;
    fullName?: string;
    requiresPasswordSetup?: boolean;
    assignedOrganizerId?: string;
    // Company fields for admins
    companyId?: string;
    companyName?: string;
    companyWebsite?: string;
    companyDetails?: string;
    companyIndustry?: string;
    companyContactEmail?: string;
    companyContactPhone?: string;
    companyStatus?: string;
    companyPermissions?: {
        createAssessment: boolean;
        deleteAssessment: boolean;
        viewAllAssessments: boolean;
    };
    company?: {
        id: string;
        name: string;
        description: string;
        website: string;
        industry: string;
        contactEmail: string;
        contactPhone: string;
        status: string;
        permissions: {
            createAssessment: boolean;
            deleteAssessment: boolean;
            viewAllAssessments: boolean;
        };
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: LoginData) => Promise<User>;
    magicLogin: (token: string) => Promise<User>;
    loginWithGoogle: (token: string, role: "organizer" | "contestant") => Promise<User>;
    logout: () => Promise<void>;
    registerUser: (data: RegisterData) => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper: Save auth data to both localStorage AND cookies
const saveAuthData = (token: string, userData: User) => {
    if (!token || !userData) {
        console.error("❌ [Auth] Attempted to save invalid auth data", { tokenPrefix: token?.substring(0, 5), user: userData });
        return;
    }

    // 1. LocalStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    // 2. Cookies (Robust Fallback)
    const cookieOptions = { expires: 7, path: '/', sameSite: 'Lax' as const };
    Cookies.set("token", token, cookieOptions);
    Cookies.set("userData", JSON.stringify(userData), cookieOptions);

    console.log(`✅ [Auth] Auth data saved for user: ${userData.username} (${userData.role})`);
    console.log("DEBUG: Current User Role:", userData.role);
};

// Helper: Clear auth data from both localStorage AND cookies
const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Cookies.remove("token", { path: '/' });
    Cookies.remove("userData", { path: '/' });
    console.log("🔐 [Auth] Cleared token and user from both localStorage and cookies");
};

export const AuthProviderClient = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load active user on mount
    useEffect(() => {
        const loadUser = async () => {
            let token = localStorage.getItem("token");

            // Fallback: recover from Cookies if localStorage empty
            if (!token) {
                const cookieToken = Cookies.get("token");
                if (cookieToken) {
                    console.log("⚠️ [AuthProvider] Token missing in localStorage but found in Cookie. Restoring...");
                    token = cookieToken;
                    localStorage.setItem("token", token);

                    const cookieUser = Cookies.get("userData");
                    if (cookieUser) {
                        try {
                            const parsedUser = JSON.parse(cookieUser);
                            localStorage.setItem("user", cookieUser);
                            setUser(parsedUser);
                        } catch { /* ignore */ }
                    }
                }
            }

            if (!token) {
                console.log("🔐 [AuthProvider] No token found, skipping user load");
                setUser(null);
                setLoading(false);
                return;
            }

            // Sync cookies on page load
            const existingUser = localStorage.getItem("user");
            if (existingUser) {
                try {
                    Cookies.set("token", token, { expires: 7, path: '/', sameSite: 'Lax' });
                    Cookies.set("userData", existingUser, { expires: 7, path: '/', sameSite: 'Lax' });
                    console.log("🔄 [AuthProvider] Synced existing auth data to cookies");
                } catch {
                    // Invalid JSON, continue to fetch from server
                }
            }

            try {
                console.log("🔐 [AuthProvider] Loading user from token...");
                const res = await contestService.getMe();
                const loadedUser = res.data.user;
                console.log("✅ [AuthProvider] User loaded:", loadedUser);
                setUser(loadedUser);
                saveAuthData(token, loadedUser);
            } catch (error) {
                console.error("❌ [AuthProvider] Failed to load user:", error);
                setUser(null);
                clearAuthData();
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    // REFRESH USER
    const refreshUser = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            console.log("🔄 [AuthProvider] Refreshing user data...");
            const res = await contestService.getMe();
            const loadedUser = res.data.user;
            setUser(loadedUser);
            saveAuthData(token, loadedUser);
        } catch (error) {
            console.error("❌ [AuthProvider] Failed to refresh user:", error);
        }
    }, []);

    // REGISTER USER
    const registerUser = useCallback(async (data: RegisterData) => {
        if (data.role === "organizer") {
            await contestService.registerOrganizer({
                username: data.username,
                email: data.email,
                password: data.password,
                organizationName: data.organizationName,
            });
        } else {
            await contestService.registerContestant({
                username: data.username,
                email: data.email,
                password: data.password,
            });
        }
    }, []);

    // LOGIN WITH GOOGLE
    const loginWithGoogle = useCallback(async (token: string, role: "organizer" | "contestant"): Promise<User> => {
        clearAuthData();

        const res = await axiosContestClient.post("/auth/google", { token, role });

        const loggedUser: User = res.data.user;
        const accessToken = res.data.token;

        saveAuthData(accessToken, loggedUser);
        setUser(loggedUser);

        return loggedUser;
    }, []);

    // LOGIN
    const login = useCallback(async (data: LoginData): Promise<User> => {
        clearAuthData();

        const res = await contestService.login(data);
        const loggedUser: User = res.data.user;
        const token = res.data.token;

        saveAuthData(token, loggedUser);
        setUser(loggedUser);

        return loggedUser;
    }, []);

    // MAGIC LOGIN
    const magicLogin = useCallback(async (token: string): Promise<User> => {
        clearAuthData();

        const res = await contestService.magicLogin(token);
        const loggedUser: User = res.data.user;
        const accessToken = res.data.token;
        const requiresPasswordSetup = res.data.requiresPasswordSetup;

        // Ensure the flag is on the user object for convenience
        if (requiresPasswordSetup !== undefined) {
            loggedUser.requiresPasswordSetup = requiresPasswordSetup;
        }

        saveAuthData(accessToken, loggedUser);
        setUser(loggedUser);

        return loggedUser;
    }, []);

    // LOGOUT
    const logout = useCallback(async () => {
        try {
            setUser(null);
            clearAuthData();
            router.push("/");
            await axiosContestClient.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [router]);

    const contextValue = useMemo(() => ({
        user,
        loading,
        registerUser,
        login,
        magicLogin,
        loginWithGoogle,
        logout,
        refreshUser
    }), [user, loading, registerUser, login, magicLogin, loginWithGoogle, logout, refreshUser]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="initial-loader"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
