'use client';

import React, { useEffect, useState, useContext } from 'react';
import { contestService } from '@/api/contestService';
import { AuthContext } from '@/components/AuthProviderClient';
import {
    Building2,
    Globe,
    Mail,
    Phone,
    Shield,
    CheckCircle,
    Clock,
    Monitor,
    Briefcase
} from 'lucide-react';
import Loader from '@/components/Loader';

export default function CompanyInfo() {
    const auth = useContext(AuthContext);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            try {
                const res = await contestService.getCompanyDetails();
                setCompany(res.data);
            } catch (error) {
                console.error("Failed to fetch company details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyDetails();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader />
                <p className="text-muted-foreground mt-4">Loading company details...</p>
            </div>
        );
    }

    if (!company && !loading) {
        return (
            <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border mx-auto max-w-2xl mt-10">
                <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">Company Information Not Available</h2>
                <p className="text-muted-foreground">
                    We couldn't retrieve the details for your organization. Please contact support if you believe this is an error.
                </p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-900 to-slate-900 p-10 shadow-xl text-white">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                        <Building2 size={40} className="text-indigo-200" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-Inter tracking-tight">{company.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${company.status === 'APPROVED' ? 'bg-green-500/20 border-green-400/30 text-green-300' :
                                'bg-amber-500/20 border-amber-400/30 text-amber-300'
                                }`}>
                                {company.status}
                            </span>
                        </div>
                        <p className="text-indigo-100/70 text-lg max-w-2xl leading-relaxed">
                            {company.description || 'Welcome to your organization profile. Manage your company settings and view details here.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Core Information Card */}
                    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                            <Briefcase className="text-primary" size={20} />
                            Corporate Identity
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Name</label>
                                <p className="text-base font-medium text-foreground">{company.name}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Industry / Sector</label>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-muted rounded-lg text-sm font-medium text-foreground">
                                        {company.industry || company.sector || 'Technology'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website</label>
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:underline text-base"
                                >
                                    <Globe size={16} />
                                    {company.website || 'No website provided'}
                                </a>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                                    {company.description || "No description available for this organization."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                            <Phone className="text-green-500" size={20} />
                            Contact Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                                <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-muted-foreground">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Contact Email</p>
                                    <p className="text-sm font-medium text-foreground break-all">{company.contactEmail}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                                <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-muted-foreground">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Phone Number</p>
                                    <p className="text-sm font-medium text-foreground">{company.contactPhone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Permissions Card */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-foreground">
                            <Shield className="text-amber-500" size={18} />
                            Platform Permissions
                        </h3>

                        <div className="space-y-3">
                            <div className={`flex items-center justify-between p-3 rounded-xl border ${company.permissions?.createAssessment ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-transparent'}`}>
                                <span className="text-sm font-medium">Create Assessment</span>
                                {company.permissions?.createAssessment ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                            </div>

                            <div className={`flex items-center justify-between p-3 rounded-xl border ${company.permissions?.deleteAssessment ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-transparent'}`}>
                                <span className="text-sm font-medium">Delete Assessment</span>
                                {company.permissions?.deleteAssessment ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                            </div>

                            <div className={`flex items-center justify-between p-3 rounded-xl border ${company.permissions?.viewAllAssessments ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-transparent'}`}>
                                <span className="text-sm font-medium">View All Content</span>
                                {company.permissions?.viewAllAssessments ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-gradient-to-br from-muted/50 to-muted/20 border border-border rounded-3xl p-6">
                        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-muted-foreground uppercase tracking-wider">
                            <Clock size={14} />
                            System Metadata
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Joined On</span>
                                <span className="font-mono font-medium">{new Date(company.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span className="font-mono font-medium">{new Date(company.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Company ID</span>
                                <span className="font-mono text-xs text-muted-foreground bg-background px-2 py-1 rounded border border-border" title={company.id}>
                                    {company.id.substring(0, 8)}...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
