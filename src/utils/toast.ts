// src/utils/toast.ts
import { toast } from 'react-toastify';
import type { TypeOptions } from 'react-toastify';

export const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' | 'default') => {
    toast(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        type: type as TypeOptions,
        theme: "colored", // Use "colored" for theme consistency
    });
};
