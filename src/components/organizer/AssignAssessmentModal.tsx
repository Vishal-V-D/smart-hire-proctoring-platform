import React, { useState, useEffect } from 'react';
import { companyService } from '@/api/companyService';
import { showToast } from '@/utils/toast';
import { FaBuilding, FaCheck } from 'react-icons/fa';

export default function AssignAssessmentModal({ isOpen, onClose, assessmentId }: { isOpen: boolean, onClose: () => void, assessmentId: string }) {
    const [companies, setCompanies] = useState<any[]>([]); // Should fetch approved companies
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");

    // Mock fetch for now, or assume we need an endpoint to list all approved companies
    // For now, let's assume getPendingRequests returns everything or we add a new endpoint
    // In reality, we'd need `companyService.getApprovedCompanies()`

    // TEMPORARY: using a placeholder list since we didn't define getApprovedCompanies in the user request specifically
    // but we can infer it or just mock it.

    useEffect(() => {
        if (isOpen) {
            fetchApprovedCompanies();
        }
    }, [isOpen]);

    const fetchApprovedCompanies = async () => {
        setLoading(true);
        try {
            const res = await companyService.getCompanies({ status: 'APPROVED' });
            setCompanies(res.data.companies || res.data || []);
        } catch (err) {
            console.error("Failed to load companies", err);
            showToast("Failed to load partner list", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedCompanyId) return;
        setAssigning(true);
        try {
            await companyService.assignAssessment(assessmentId, selectedCompanyId);
            showToast("Assessment assigned to partner!", "success");
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Assignment failed", "error");
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Assign to Partner</h2>
                    <p className="text-sm text-muted-foreground">Select a partner company to clone this assessment for.</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Select Partner</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">-- Choose Company --</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                        <button
                            onClick={handleAssign}
                            disabled={assigning || !selectedCompanyId}
                            className="px-4 py-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-lg font-bold text-sm disabled:opacity-50"
                        >
                            {assigning ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
