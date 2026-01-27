'use client';

import React, { useState, useEffect, useContext } from 'react';
import {
    FaUserPlus, FaUserShield, FaSearch, FaEllipsisV,
    FaEnvelope, FaTrashAlt, FaTimes
} from 'react-icons/fa';
import { companyService } from '@/api/companyService';
import { showToast } from '@/utils/toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '@/components/AuthProviderClient';
import { motion, AnimatePresence } from 'framer-motion';

const addMemberSchema = yup.object({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 chars").required("Password is required"),
});

export default function CompanyTeamManagement() {
    const auth = useContext(AuthContext);
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // History State
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);



    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await companyService.getTeamMembers();
            setTeam(res.data.users || []);
            setError(null);
        } catch (err: any) {
            console.error("Failed to load team", err);
            if (err.response?.status === 403) {
                setError("You don't have permission to view team members.");
            } else {
                setError("Failed to load team members.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [auth?.user]);



    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                        <FaUserShield size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
                        <p className="text-muted-foreground mt-1">Manage your company's administrators and their access.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground hover:bg-gradient-to-br from-indigo-600 to-violet-600/90 px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                    >
                        <FaUserPlus />
                        <span>Add Member</span>
                    </button>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Member</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center">Loading team...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={3} className="p-8 text-center text-red-500">{error}</td></tr>
                        ) : team.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No team members found.</td></tr>
                        ) : (
                            team.map((member) => (
                                <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {member.fullName?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{member.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${member.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Member Modal */}
            {isAddModalOpen && (
                <AddMemberModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        fetchTeam();
                    }}
                />
            )}


        </div>
    );
}

function AddMemberModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(addMemberSchema)
    });

    const onSubmit = async (data: any) => {
        try {
            await companyService.addTeamMember(data);
            showToast("Team member added! Waiting for organizer approval.", "success");
            onSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to add member", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Add Team Member</h2>
                    <p className="text-sm text-muted-foreground">New members require organizer approval before logging in.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Full Name</label>
                        <input
                            {...register("name")}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email Address</label>
                        <input
                            {...register("email")}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                            placeholder="john@company.com"
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Initial Password</label>
                        <input
                            type="password"
                            {...register("password")}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                            placeholder="••••••"
                        />
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-lg font-bold text-sm">
                            {isSubmitting ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
