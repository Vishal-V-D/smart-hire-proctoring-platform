'use client';

import React, { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { AuthContext } from '@/components/AuthProviderClient';
import { contestService } from '@/api/contestService';
import { motion } from 'framer-motion';
import { Moon, Sun, Settings, Monitor, ChevronRight, Bell, Shield, User, Lock, Key } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const passwordSchema = yup.object({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm password is required'),
});

const SecuritySettings = () => {
    const [loading, setLoading] = React.useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(passwordSchema)
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // @ts-ignore
            const { showToast } = await import('@/utils/toast');

            await contestService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            showToast('Password changed successfully', 'success');
            reset();
        } catch (err: any) {
            console.error(err);
            // @ts-ignore
            const { showToast } = await import('@/utils/toast');
            showToast(err.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                    <Lock size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Security</h2>
                    <p className="text-sm text-muted-foreground">Update your password and security settings.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Current Password</label>
                    <input
                        type="password"
                        {...register('currentPassword')}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        placeholder="Enter current password"
                    />
                    {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message as string}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
                        <input
                            type="password"
                            {...register('newPassword')}
                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            placeholder="Min 8 chars"
                        />
                        {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message as string}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                        <input
                            type="password"
                            {...register('confirmPassword')}
                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            placeholder="Retype password"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
                    </div>
                </div>
                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : <><Key size={16} /> Update Password</>}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

const SettingsPage = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const auth = useContext(AuthContext);
    const [profileForm, setProfileForm] = React.useState({
        username: '',
        organizationName: '',
        avatarUrl: ''
    });
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (auth?.user) {
            setProfileForm({
                username: auth.user.username || '',
                organizationName: auth.user.organizationName || '',
                avatarUrl: auth.user.avatarUrl || ''
            });
        }
    }, [auth?.user]);

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        try {
            // @ts-ignore - Importing dynamically to avoid issues if file doesn't exist yet in strict checks
            const { showToast } = await import('@/utils/toast');

            await contestService.updateProfile(profileForm);
            showToast('Profile updated successfully!', 'success');
            if (auth?.refreshUser) {
                await auth.refreshUser();
            }
        } catch (error: any) {
            console.error(error);
            // @ts-ignore
            const { showToast } = await import('@/utils/toast');
            showToast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Settings</h1>
                <p className="text-muted-foreground">Manage your workspace preferences and appearance.</p>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl space-y-8"
            >
                {/* --- COMPANY INFORMATION SECTION (For Admins) --- */}
                {auth?.user?.companyId && (
                    <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Company Information</h2>
                                <p className="text-sm text-muted-foreground">Details about your organization.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Company Name</label>
                                    <div className="p-3 rounded-xl border border-border bg-background/50">
                                        <p className="font-medium">{auth.user.companyName || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Website</label>
                                    <div className="p-3 rounded-xl border border-border bg-background/50">
                                        {auth.user.companyWebsite ? (
                                            <a
                                                href={auth.user.companyWebsite}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                {auth.user.companyWebsite}
                                                <ChevronRight size={14} className="rotate-[-45deg]" />
                                            </a>
                                        ) : (
                                            <p className="text-muted-foreground">N/A</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">About Company</label>
                                <div className="p-3 rounded-xl border border-border bg-background/50 min-h-[80px]">
                                    <p className="text-sm leading-relaxed">{auth.user.companyDetails || 'No description available'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-muted/30 rounded-xl border border-border/50">
                            <p className="text-xs text-muted-foreground">
                                <strong>Note:</strong> Company information is managed by the company owner. Contact your company administrator to update these details.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* --- PROFILE SECTION --- */}
                <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Profile</h2>
                            <p className="text-sm text-muted-foreground">Manage your personal information.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Username</label>
                            <input
                                type="text"
                                value={profileForm.username}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Organization Name</label>
                            <input
                                type="text"
                                value={profileForm.organizationName}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, organizationName: e.target.value }))}
                                placeholder="e.g. Acme Corp"
                                className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold">Avatar URL</label>
                            <input
                                type="text"
                                value={profileForm.avatarUrl}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                                placeholder="https://example.com/avatar.png"
                                className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>

                {/* --- APPEARANCE SECTION --- */}
                <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Monitor size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Appearance</h2>
                            <p className="text-sm text-muted-foreground">Customize how the dashboard looks and feels.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Light Mode Option */}
                        <button
                            onClick={() => setTheme('light')}
                            className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="aspect-video bg-gray-100 rounded-xl mb-4 relative overflow-hidden shadow-inner flex items-center justify-center">
                                <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-orange-500' : 'text-gray-400'}`} />
                                <div className="absolute inset-0 bg-white/50 mix-blend-overlay"></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`font-bold ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Light Mode</span>
                                {theme === 'light' && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                            </div>
                        </button>

                        {/* Dark Mode Option */}
                        <button
                            onClick={() => setTheme('dark')}
                            className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="aspect-video bg-[#0a0a0a] rounded-xl mb-4 relative overflow-hidden shadow-inner flex items-center justify-center">
                                <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-indigo-400' : 'text-gray-600'}`} />
                                <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`font-bold ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`}>Dark Mode</span>
                                {theme === 'dark' && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                            </div>
                        </button>

                        {/* Legacy Mode Option (Optional, keeping consistent with context) */}
                        <button
                            onClick={() => setTheme('legacy')}
                            className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left ${theme === 'legacy' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="aspect-video bg-slate-900 rounded-xl mb-4 relative overflow-hidden shadow-inner flex items-center justify-center">
                                <Settings className={`w-8 h-8 ${theme === 'legacy' ? 'text-emerald-400' : 'text-gray-600'}`} />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`font-bold ${theme === 'legacy' ? 'text-primary' : 'text-muted-foreground'}`}>Legacy Mode</span>
                                {theme === 'legacy' && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                            </div>
                        </button>
                    </div>
                </motion.div>

                {/* --- SECURITY SECTION (Change Password) --- */}
                <SecuritySettings />

                {/* --- NOTIFICATIONS SECTION (Placeholder) --- */}
                <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-sm opacity-60 pointer-events-none grayscale">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Notifications</h2>
                                <p className="text-sm text-muted-foreground">Manage alerts and email preferences.</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground uppercase">Coming Soon</span>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default SettingsPage;
