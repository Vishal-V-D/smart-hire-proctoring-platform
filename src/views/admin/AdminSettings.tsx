'use client';

import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '@/components/AuthProviderClient';
import { contestService } from '@/api/contestService';
import { showToast } from '@/utils/toast';
import {
    User,
    Lock,
    Key,
    Shield,
    Mail,
    Clock,
    AlertTriangle,
    CheckCircle,
    Eye,
    EyeOff,
    Sparkles,
    Settings,
    Building,
    Badge
} from 'lucide-react';

const passwordSchema = yup.object({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm password is required'),
});

export default function AdminSettings() {
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(passwordSchema)
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await contestService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            showToast('Password changed successfully', 'success');
            reset();
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!auth?.user) return null;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 min-h-screen">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-8 shadow-2xl">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />

                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                        <Settings className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white mb-1">Account Settings</h1>
                        <p className="text-white/60">Manage your profile and security preferences</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Profile Info */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
                        <div className="px-6 pb-6 -mt-10">
                            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center border-4 border-card shadow-lg overflow-hidden">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user.fullName || auth.user.username)}&background=6366f1&color=fff&size=128&font-size=0.4&bold=true`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-center mt-4">
                                <h2 className="text-xl font-bold text-foreground truncate">{auth.user.fullName || auth.user.username}</h2>
                                <p className="text-sm text-muted-foreground mt-0.5 truncate">{auth.user.email}</p>
                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase">
                                        <Shield size={12} />
                                        {auth.user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                            <Sparkles size={16} className="text-primary" />
                            Account Status
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span className="text-sm font-medium text-foreground">Account Active</span>
                                </div>
                                <span className="text-xs text-green-600 font-bold">Verified</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Member Since</span>
                                </div>
                                <span className="text-xs text-foreground font-medium">
                                    {(auth.user as any).createdAt ? new Date((auth.user as any).createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                                <AlertTriangle size={18} className="text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground text-sm mb-1">Important Notice</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    As an admin, your actions are logged for compliance purposes. Please follow your organization's security guidelines when accessing candidate data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Account Info (Read Only) */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User size={18} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">Account Information</h3>
                                <p className="text-xs text-muted-foreground">Your account details (read-only)</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Email Address</label>
                                    <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl border border-border text-foreground">
                                        <Mail size={18} className="text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate">{auth.user.email}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Username</label>
                                    <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl border border-border text-foreground">
                                        <Badge size={18} className="text-muted-foreground shrink-0" />
                                        <span className="text-sm">{auth.user.username}</span>
                                    </div>
                                </div>
                            </div>
                            {auth.user.organizationName && (
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Organization</label>
                                    <div className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl border border-border text-foreground">
                                        <Building size={18} className="text-muted-foreground shrink-0" />
                                        <span className="text-sm">{auth.user.organizationName}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Lock size={18} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">Change Password</h3>
                                <p className="text-xs text-muted-foreground">Update your account password</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        {...register('currentPassword')}
                                        className="w-full p-3.5 pr-12 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm"
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.currentPassword && <p className="text-red-500 text-xs mt-1.5">{errors.currentPassword.message as string}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            {...register('newPassword')}
                                            className="w-full p-3.5 pr-12 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm"
                                            placeholder="Min 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.newPassword && <p className="text-red-500 text-xs mt-1.5">{errors.newPassword.message as string}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            {...register('confirmPassword')}
                                            className="w-full p-3.5 pr-12 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm"
                                            placeholder="Retype new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message as string}</p>}
                                </div>
                            </div>

                            {/* Password requirements hint */}
                            <div className="bg-muted/30 rounded-xl p-4 border border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Password Requirements:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={12} className="text-green-500" />
                                        At least 8 characters long
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={12} className="text-muted-foreground" />
                                        Mix of uppercase and lowercase letters (recommended)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={12} className="text-muted-foreground" />
                                        Include numbers and special characters (recommended)
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Key size={18} />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
