// src/components/GoogleAuthButton.tsx
'use client'

import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/components/AuthProviderClient';
import { showToast } from '@/utils/toast';

interface GoogleAuthButtonProps {
    role?: "organizer" | "contestant";
    text?: "signin_with" | "signup_with" | "continue_with";
}

export default function GoogleAuthButton({ role = "contestant", text = "signin_with" }: GoogleAuthButtonProps) {
    const auth = useContext(AuthContext);
    const router = useRouter();

    if (!auth) return null;

    const { loginWithGoogle } = auth;

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        try {
            if (!credentialResponse.credential) {
                showToast('Google login failed: No credential received', 'error');
                return;
            }

            const loggedUser = await loginWithGoogle(credentialResponse.credential, role);
            showToast('Successfully logged in with Google!', 'success');

            console.log("✅ [GoogleAuth] Login successful, user:", loggedUser);

            // Small delay to ensure cookies are fully set
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate based on user role
            if (loggedUser.role === "organizer") {
                console.log("🚀 [GoogleAuth] Navigating to /organizer");
                router.push("/organizer");
            } else {
                console.log("🚀 [GoogleAuth] Navigating to /contestant");
                router.push("/contestant");
            }
        } catch (error: unknown) {
            console.error('Google login failed:', error);
            const axiosError = error as { response?: { status?: number } };
            if (axiosError?.response?.status === 403) {
                showToast('Your email is not verified. Please check your inbox.', 'error');
            } else {
                showToast('Google login failed. Please try again.', 'error');
            }
        }
    };

    const handleError = () => {
        showToast('Google login failed', 'error');
    };

    return (
        <div className="w-full flex justify-center group relative">
            <div className="relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-500 bg-[length:200%_200%] animate-gradient-xy">
                <div className="relative w-full bg-black rounded-full">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        width="100%"
                        text={text}
                        containerProps={{
                            style: { width: '100%', display: 'block' }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
