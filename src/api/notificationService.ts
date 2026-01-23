import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const notificationService = {
    // Get all notifications with pagination
    getNotifications: async (page = 1, limit = 20) => {
        return axios.get(`${API_URL}/notifications?page=${page}&limit=${limit}`, getAuthHeaders());
    },

    // Mark a single notification as read
    markAsRead: async (id: string) => {
        return axios.put(`${API_URL}/notifications/${id}/read`, {}, getAuthHeaders());
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        return axios.put(`${API_URL}/notifications/read-all`, {}, getAuthHeaders());
    },
};
