// src/api/adminService.ts

import axiosContestClient from "./axiosContestClient";

export enum AdminStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}

export enum AccessType {
    WHOLE = "WHOLE",
    PARTIAL = "PARTIAL"
}

export type AdminBase = {
    id: string;
    email: string;
    fullName: string;
    status: AdminStatus;
    createdAt: string;
    lastLogin?: string | null;
    accessType?: AccessType;
    assessmentCount?: number | null;
};

export type AdminDetails = {
    admin: AdminBase & { updatedAt: string };
    access: {
        accessType: AccessType;
        assessments: Array<{
            id: string;
            title: string;
            grantedAt?: string;
        }>;
    };
};

export type CreateAdminData = {
    email: string;
    fullName: string;
    accessType: AccessType;
    assessmentIds?: string[];
};

export const adminService = {
    // --- Admin Management ---
    createAdmin: (data: CreateAdminData) =>
        axiosContestClient.post("/organizer/admins", data),

    listAdmins: (params?: { status?: AdminStatus; accessType?: AccessType }) =>
        axiosContestClient.get("/organizer/admins", { params }),

    getAdminDetails: (adminId: string) =>
        axiosContestClient.get(`/organizer/admins/${adminId}`),

    editAdmin: (adminId: string, data: { fullName?: string; email?: string }) =>
        axiosContestClient.put(`/organizer/admins/${adminId}`, data),

    resendLoginLink: (adminId: string) =>
        axiosContestClient.post(`/organizer/admins/${adminId}/resend-link`),

    resetAdminPassword: (adminId: string) =>
        axiosContestClient.post(`/organizer/admins/${adminId}/reset-password`),

    disableAdmin: (adminId: string, disable: boolean) =>
        axiosContestClient.post(`/organizer/admins/${adminId}/disable`, { disable }),

    deleteAdmin: (adminId: string) =>
        axiosContestClient.delete(`/organizer/admins/${adminId}`),

    // --- Access Control ---
    grantAccess: (adminId: string, data: { accessType: AccessType; assessmentIds?: string[] }) =>
        axiosContestClient.post(`/organizer/admins/${adminId}/access`, data),

    getAccessDetails: (adminId: string) =>
        axiosContestClient.get(`/organizer/admins/${adminId}/access`),

    updateAccessType: (adminId: string, data: { accessType: AccessType; assessmentIds?: string[] }) =>
        axiosContestClient.put(`/organizer/admins/${adminId}/access`, data),

    addAssessments: (adminId: string, assessmentIds: string[]) =>
        axiosContestClient.post(`/organizer/admins/${adminId}/access/assessments`, { assessmentIds }),

    removeAssessments: (adminId: string, assessmentIds: string[]) =>
        axiosContestClient.delete(`/organizer/admins/${adminId}/access/assessments`, { data: { assessmentIds } }),

    revokeAllAccess: (adminId: string) =>
        axiosContestClient.delete(`/organizer/admins/${adminId}/access`),
};
