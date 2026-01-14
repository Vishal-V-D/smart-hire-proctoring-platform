'use client';

import React, { useState } from 'react';
import { X, UserPlus, Mail, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddAdminToCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { adminName: string; adminEmail: string }) => Promise<void>;
    companyName: string;
    isLoading?: boolean;
}

export default function AddAdminToCompanyModal({
    isOpen,
    onClose,
    onSubmit,
    companyName,
    isLoading = false
}: AddAdminToCompanyModalProps) {
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    const validate = () => {
        const newErrors: { name?: string; email?: string } = {};

        if (!adminName.trim()) {
            newErrors.name = 'Admin name is required';
        }

        if (!adminEmail.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            await onSubmit({ adminName, adminEmail });
            // Reset form
            setAdminName('');
            setAdminEmail('');
            setErrors({});
        } catch (error) {
            // Error handling is done in parent component
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setAdminName('');
            setAdminEmail('');
            setErrors({});
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card rounded-2xl shadow-2xl max-w-md w-full border border-border"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <UserPlus className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Add Admin</h2>
                                        <p className="text-sm text-muted-foreground">to {companyName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Admin Name */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        <User size={16} className="inline mr-2" />
                                        Admin Name
                                    </label>
                                    <input
                                        type="text"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        disabled={isLoading}
                                        placeholder="John Doe"
                                        className={`w-full px-4 py-3 bg-background border ${errors.name ? 'border-destructive' : 'border-input'
                                            } rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50`}
                                    />
                                    {errors.name && (
                                        <p className="text-destructive text-sm mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {/* Admin Email */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        <Mail size={16} className="inline mr-2" />
                                        Admin Email
                                    </label>
                                    <input
                                        type="email"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        disabled={isLoading}
                                        placeholder="john@company.com"
                                        className={`w-full px-4 py-3 bg-background border ${errors.email ? 'border-destructive' : 'border-input'
                                            } rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50`}
                                    />
                                    {errors.email && (
                                        <p className="text-destructive text-sm mt-1">{errors.email}</p>
                                    )}
                                </div>

                                {/* Info Box */}
                                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                                    <p className="text-sm text-primary">
                                        ✉️ The admin will receive an email with a password setup link (valid for 24 hours).
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={18} />
                                                Add Admin
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
