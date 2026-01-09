// src/api/invitationService.ts

import axiosContestClient from "./axiosContestClient";

// ========== TYPES ==========

export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled';

export interface Invitation {
    id: string;
    assessmentId: string;
    email: string;
    name: string;
    token: string;
    status: InvitationStatus;
    sentAt?: string;
    acceptedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface InvitationStats {
    pending: number;
    sent: number;
    accepted: number;
    expired: number;
    cancelled: number;
    total: number;
}

export interface CreateInvitationData {
    assessmentId: string;
    email: string;
    name?: string;
    sendEmail?: boolean;
}

export interface BulkInviteData {
    assessmentId: string;
    invitations: { email: string; name?: string }[];
    sendEmail?: boolean;
}

export interface BulkInviteResponse {
    sent: number;
    failed: number;
    errors: { email: string; error: string }[];
    invitations: Invitation[];
}

export interface InvitationListParams {
    assessmentId?: string;
    status?: InvitationStatus;
    search?: string;
    page?: number;
    limit?: number;
}

// ========== SERVICE ==========

export const invitationService = {
    /**
     * Create a single invitation
     */
    createInvitation: (data: CreateInvitationData) =>
        axiosContestClient.post<Invitation>("/invitations", data),

    /**
     * Bulk invite multiple users
     */
    bulkInvite: (data: BulkInviteData) =>
        axiosContestClient.post<BulkInviteResponse>("/invitations/bulk", data),

    /**
     * Upload CSV for bulk invites
     */
    uploadCsvInvites: (contestId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosContestClient.post<{
            message: string;
            invitations?: any[];
            errors?: any[];
        }>(`/contest-invite/${contestId}/invite/csv`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    /**
     * List invitations with filters
     */
    listInvitations: (params?: InvitationListParams) => {
        const query = new URLSearchParams(params as any).toString();
        return axiosContestClient.get<{ invitations: Invitation[]; total: number; page: number; totalPages: number }>(
            `/invitations${query ? `?${query}` : ''}`
        );
    },

    /**
     * Get invitation stats for an assessment
     */
    getInvitationStats: (assessmentId: string) =>
        axiosContestClient.get<InvitationStats>(`/invitations/stats/${assessmentId}`),

    /**
     * Get a single invitation by ID
     */
    getInvitation: (id: string) =>
        axiosContestClient.get<Invitation>(`/invitations/${id}`),

    /**
     * Update an invitation
     */
    updateInvitation: (id: string, data: Partial<{ email: string; name: string }>) =>
        axiosContestClient.patch<Invitation>(`/invitations/${id}`, data),

    /**
     * Cancel a single invitation
     */
    cancelInvitation: (id: string) =>
        axiosContestClient.delete(`/invitations/${id}`),

    /**
     * Bulk cancel invitations
     */
    bulkCancelInvitations: (ids: string[]) =>
        axiosContestClient.delete("/invitations/bulk", { data: { ids } }),

    /**
     * Resend invitation email
     */
    resendInvitation: (id: string) =>
        axiosContestClient.post(`/invitations/${id}/resend`),

    /**
     * Verify invitation token (public endpoint)
     */
    verifyToken: (token: string) =>
        axiosContestClient.post<{ valid: boolean; invitation?: Invitation }>("/invitations/verify", { token }),

    /**
     * Accept an invitation (authenticated endpoint)
     */
    acceptInvitation: (id: string) =>
        axiosContestClient.post(`/invitations/${id}/accept`),

    /**
     * Get participants for an assessment (accepted invitations with user data)
     */
    getParticipants: (assessmentId: string, params?: { page?: number; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return axiosContestClient.get<{
            participants: {
                id: string;
                invitationEmail: string;
                invitationName: string;
                acceptedAt: string;
                createdAt: string;
                user: {
                    id: string;
                    email: string;
                    username: string;
                    fullName: string;
                    createdAt: string;
                };
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>(`/invitations/participants/${assessmentId}${query ? `?${query}` : ''}`);
    },
};
