import axiosContestClient from "./axiosContestClient";
import { AdminBase } from "./adminService";

export interface Company {
    id: string;
    name: string;
    description?: string;
    website?: string;
    industry: string;
    contactEmail: string;
    contactPhone: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    canCreateAssessments: boolean;
    users?: AdminBase[];
    permissions?: {
        createAssessment: boolean;
        deleteAssessment: boolean;
        viewAllAssessments: boolean;
    };
}

export interface CompanyRegistrationData {
    companyName: string;
    website?: string | null;
    details?: string | null;
    contactEmail: string;
    contactPhone: string;
    adminName: string;
    adminEmail: string;
    // Password is set later via email link
}

export interface SetupPasswordData {
    token: string;
    password: string;
}

export interface AddTeamMemberData {
    name: string;
    email: string;
    password: string;
}

export const companyService = {
    // Public
    register: (data: CompanyRegistrationData) =>
        axiosContestClient.post("/companies/register", data),

    setupPassword: (data: SetupPasswordData) =>
        axiosContestClient.post("/companies/setup-password", data),

    // Organizer
    getPendingRequests: () =>
        axiosContestClient.get("/companies/pending"),

    getCompanies: (params?: { status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) =>
        axiosContestClient.get("/companies", { params }),


    approveCompany: (companyId: string) =>
        axiosContestClient.post(`/companies/${companyId}/approve`),

    approveUser: (userId: string) =>
        axiosContestClient.post(`/companies/users/${userId}/approve`),

    deleteCompany: (companyId: string) =>
        axiosContestClient.delete(`/companies/${companyId}`),

    assignAssessment: (assessmentId: string, targetCompanyId: string) =>
        axiosContestClient.post("/companies/assign-assessment", {
            assessmentId,
            targetCompanyId
        }),

    updatePermissions: (companyId: string, permissions: { createAssessment: boolean; deleteAssessment: boolean; viewAllAssessments: boolean; }) =>
        axiosContestClient.put(`/companies/${companyId}/permissions`, { permissions }),

    // Company Admin
    addTeamMember: (data: AddTeamMemberData) =>
        axiosContestClient.post("/companies/add-admin", data),

    getTeamMembers: () =>
        axiosContestClient.get("/companies/team"),

    // Rejection & History
    rejectCompany: (companyId: string) =>
        axiosContestClient.post(`/companies/${companyId}/reject`),

    rejectUser: (userId: string) =>
        axiosContestClient.post(`/companies/users/${userId}/reject`),

    getCompanyHistory: (companyId: string) =>
        axiosContestClient.get(`/companies/${companyId}/history`),

    // 🆕 NEW: Company Details
    getDetails: () =>
        axiosContestClient.get("/companies/details"),

    getCompanyById: (companyId: string) =>
        axiosContestClient.get(`/companies/${companyId}`),

    removeAdmin: (companyId: string, userId: string) =>
        axiosContestClient.delete(`/companies/${companyId}/users/${userId}`),

    // 🆕 NEW: Organizer adds admin directly to company
    addAdminByOrganizer: (data: { companyId: string; adminName: string; adminEmail: string; }) =>
        axiosContestClient.post("/companies/add-admin-by-organizer", data),
};

