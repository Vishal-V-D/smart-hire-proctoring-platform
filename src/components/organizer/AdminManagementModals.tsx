// src/components/organizer/AdminManagementModals.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaUserPlus, FaTimes, FaShieldAlt, FaCheck, FaTrash, FaPen, FaSearch } from 'react-icons/fa';
import { adminService, CreateAdminData, AccessType, AdminStatus, AdminBase } from '@/api/adminService';
import { assessmentService } from '@/api/assessmentService';
import { contestService } from '@/api/contestService';
import { showToast } from '@/utils/toast';

// --- Create Admin Modal ---
const createAdminSchema = yup.object({
    email: yup.string().email("Invalid email").required("Email is required"),
    fullName: yup.string().required("Full Name is required"),
    accessType: yup.string().oneOf(Object.values(AccessType)).required(),
});

interface CreateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateAdminModal = ({ isOpen, onClose, onSuccess }: CreateAdminModalProps) => {
    const [loading, setLoading] = useState(false);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
    const [accessType, setAccessType] = useState<AccessType>(AccessType.PARTIAL);
    const [searchQuery, setSearchQuery] = useState("");

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(createAdminSchema),
        defaultValues: { accessType: AccessType.PARTIAL }
    });

    useEffect(() => {
        if (isOpen) {
            fetchAssessments();
            reset();
            setSelectedAssessments([]);
            setAccessType(AccessType.PARTIAL);
            setSearchQuery("");
        }
    }, [isOpen, reset]);

    const fetchAssessments = async () => {
        try {
            console.log("DEBUG: fetchAssessments starting with assessmentService.listAssessments...");
            const res = await assessmentService.listAssessments({ limit: 100 });
            console.log("DEBUG: Raw Response res:", res);
            console.log("DEBUG: res.data:", res.data);

            // Try different data paths
            const assessmentsList =
                res.data?.data ||
                res.data?.assessments ||
                (Array.isArray(res.data) ? res.data : []);

            console.log("DEBUG: Final processed list:", assessmentsList);
            setAssessments(assessmentsList);

            // Auto-select first assessment if in partial mode and none selected
            if (accessType === AccessType.PARTIAL && selectedAssessments.length === 0 && assessmentsList.length > 0) {
                console.log("DEBUG: Auto-selecting ID:", assessmentsList[0].id);
                setSelectedAssessments([assessmentsList[0].id]);
            }
        } catch (err) {
            console.error("DEBUG: fetchAssessments Error:", err);
        }
    };

    const filteredAssessments = useMemo(() => {
        if (!searchQuery.trim()) return assessments;
        const q = searchQuery.toLowerCase();
        return assessments.filter(a => a.title.toLowerCase().includes(q));
    }, [assessments, searchQuery]);

    const onSubmit = async (data: any) => {
        if (accessType === AccessType.PARTIAL && selectedAssessments.length === 0) {
            showToast("Please select at least one assessment for partial access.", "error");
            return;
        }

        setLoading(true);
        try {
            await adminService.createAdmin({
                ...data,
                accessType,
                assessmentIds: accessType === AccessType.PARTIAL ? selectedAssessments : undefined
            });
            showToast("Admin created successfully!", "success");
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to create admin.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FaUserPlus size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Add New Team Admin</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                        <FaTimes size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                            <input
                                {...register("fullName")}
                                className="w-full h-12 px-4 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
                                placeholder="e.g. John Doe"
                            />
                            {errors.fullName && <p className="text-red-500 text-xs ml-1">{errors.fullName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Work Email</label>
                            <input
                                {...register("email")}
                                className="w-full h-12 px-4 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
                                placeholder="admin@company.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Assessment Access Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setAccessType(AccessType.PARTIAL)}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${accessType === AccessType.PARTIAL
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-muted/30 hover:bg-muted/50'
                                    }`}
                            >
                                <span className={`font-bold ${accessType === AccessType.PARTIAL ? 'text-primary' : 'text-foreground'}`}>Partial Access</span>
                                <span className="text-xs text-muted-foreground">Can only view SPECIFIC assigned assessments.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAccessType(AccessType.WHOLE)}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${accessType === AccessType.WHOLE
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-muted/30 hover:bg-muted/50'
                                    }`}
                            >
                                <span className={`font-bold ${accessType === AccessType.WHOLE ? 'text-primary' : 'text-foreground'}`}>Whole Access</span>
                                <span className="text-xs text-muted-foreground">Can view ALL current and future assessments.</span>
                            </button>
                        </div>
                    </div>

                    {accessType === AccessType.PARTIAL && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 ml-1">
                                <label className="text-sm font-medium text-muted-foreground">Select Assessments ({selectedAssessments.length})</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search assessments..."
                                            className="h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-muted/20 focus:ring-1 focus:ring-primary outline-none transition-all w-48"
                                        />
                                    </div>
                                    {assessments.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAssessments(selectedAssessments.length === assessments.length ? [] : assessments.map(a => a.id))}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            {selectedAssessments.length === assessments.length ? "Deselect All" : "Select All"}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                                {filteredAssessments.map((a) => (
                                    <div
                                        key={a.id}
                                        onClick={() => {
                                            setSelectedAssessments(prev =>
                                                prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id]
                                            );
                                        }}
                                        className={`px-4 py-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-sm ${selectedAssessments.includes(a.id)
                                            ? 'border-primary/50 bg-primary/5 text-primary'
                                            : 'border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                                            }`}
                                    >
                                        <span className="truncate flex-1">{a.title}</span>
                                        {selectedAssessments.includes(a.id) && <FaCheck size={12} />}
                                    </div>
                                ))}
                                {filteredAssessments.length === 0 && (
                                    <p className="col-span-2 text-center py-8 text-muted-foreground text-xs italic bg-muted/5 rounded-xl border border-dashed border-border">
                                        {searchQuery ? "No matches found for your search." : "No assessments found."}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-muted/10">
                    <button onClick={onClose} disabled={loading} className="px-6 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                    >
                        {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : "Create Admin & Send Link"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Edit Admin / Access Modal ---
interface EditAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    admin: AdminBase | null;
}

export const EditAdminModal = ({ isOpen, onClose, onSuccess, admin }: EditAdminModalProps) => {
    const [loading, setLoading] = useState(false);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
    const [accessType, setAccessType] = useState<AccessType>(AccessType.WHOLE);
    const [fullName, setFullName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen && admin) {
            setFullName(admin.fullName);
            fetchAssessments();
            fetchCurrentAccess();
            setSearchQuery("");
        }
    }, [isOpen, admin]);

    const fetchAssessments = async () => {
        try {
            console.log("DEBUG: EditModal fetchAssessments starting...");
            const res = await assessmentService.listAssessments({ limit: 100 });
            console.log("DEBUG: EditModal Raw Response res:", res);
            console.log("DEBUG: EditModal res.data:", res.data);

            const assessmentsList =
                res.data?.data ||
                res.data?.assessments ||
                (Array.isArray(res.data) ? res.data : []);

            console.log("DEBUG: EditModal Final processed list:", assessmentsList);
            setAssessments(assessmentsList);
        } catch (err) {
            console.error("DEBUG: EditModal fetchAssessments Error:", err);
        }
    };

    const fetchCurrentAccess = async () => {
        if (!admin) return;
        try {
            const res = await adminService.getAccessDetails(admin.id);
            console.log("DEBUG: getAccessDetails response:", res.data);

            const accessData = res.data?.data || res.data;
            if (accessData) {
                setAccessType(accessData.accessType || AccessType.WHOLE);
                const assignedAssessments = accessData.assessments || [];
                setSelectedAssessments(assignedAssessments.map((a: any) => a.id));
            }
        } catch (err) {
            console.error("Failed to fetch current access", err);
        }
    };

    const filteredAssessments = useMemo(() => {
        if (!searchQuery.trim()) return assessments;
        const q = searchQuery.toLowerCase();
        return assessments.filter(a => a.title.toLowerCase().includes(q));
    }, [assessments, searchQuery]);

    const handleUpdate = async () => {
        if (!admin) return;
        setLoading(true);
        try {
            // 1. Update Profile (if name changed)
            if (fullName !== admin.fullName) {
                await adminService.editAdmin(admin.id, { fullName });
            }

            // 2. Update Access
            await adminService.updateAccessType(admin.id, {
                accessType,
                assessmentIds: accessType === AccessType.PARTIAL ? selectedAssessments : undefined
            });

            showToast("Admin updated successfully!", "success");
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to update admin.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !admin) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FaShieldAlt size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Manage Permissions: {admin.fullName}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                            <FaPen className="text-primary text-[10px]" /> Profile Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1">Full Name</label>
                                <input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2 opacity-60">
                                <label className="text-xs font-medium text-muted-foreground ml-1">Email (Immutable)</label>
                                <div className="w-full h-12 px-4 rounded-xl border border-border bg-muted/10 flex items-center text-muted-foreground cursor-not-allowed">
                                    {admin.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Access Selection */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                            <FaShieldAlt className="text-primary text-[10px]" /> Access Control
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setAccessType(AccessType.PARTIAL)}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${accessType === AccessType.PARTIAL
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-muted/30 hover:bg-muted/50'
                                    }`}
                            >
                                <span className={`font-bold ${accessType === AccessType.PARTIAL ? 'text-primary' : 'text-foreground'}`}>Partial Access</span>
                                <span className="text-xs text-muted-foreground">Select specific assessments.</span>
                            </button>
                            <button
                                onClick={() => setAccessType(AccessType.WHOLE)}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${accessType === AccessType.WHOLE
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-muted/30 hover:bg-muted/50'
                                    }`}
                            >
                                <span className={`font-bold ${accessType === AccessType.WHOLE ? 'text-primary' : 'text-foreground'}`}>Whole Access</span>
                                <span className="text-xs text-muted-foreground">All assessments enabled.</span>
                            </button>
                        </div>

                        {accessType === AccessType.PARTIAL && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 ml-1">
                                    <label className="text-sm font-medium text-muted-foreground">Selected Assessments ({selectedAssessments.length})</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search assessments..."
                                                className="h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-muted/20 focus:ring-1 focus:ring-primary outline-none transition-all w-48"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setSelectedAssessments(selectedAssessments.length === assessments.length ? [] : assessments.map(a => a.id))}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            {selectedAssessments.length === assessments.length ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                                    {filteredAssessments.map((a) => (
                                        <div
                                            key={a.id}
                                            onClick={() => {
                                                setSelectedAssessments(prev =>
                                                    prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id]
                                                );
                                            }}
                                            className={`px-4 py-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-sm ${selectedAssessments.includes(a.id)
                                                ? 'border-primary/50 bg-primary/5 text-primary'
                                                : 'border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                                                }`}
                                        >
                                            <span className="truncate flex-1">{a.title}</span>
                                            {selectedAssessments.includes(a.id) && <FaCheck size={12} />}
                                        </div>
                                    ))}
                                    {filteredAssessments.length === 0 && (
                                        <p className="col-span-2 text-center py-8 text-muted-foreground text-xs italic bg-muted/5 rounded-xl border border-dashed border-border">
                                            {searchQuery ? "No matches found for your search." : "No assessments found."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-muted/10">
                    <button onClick={onClose} disabled={loading} className="px-6 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-all">Cancel</button>
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                    >
                        {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};
