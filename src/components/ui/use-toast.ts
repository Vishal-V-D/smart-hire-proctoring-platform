import * as React from "react";

export type ToastVariant = "default" | "destructive" | "success";

export interface ToastOptions {
    title?: string;
    description?: string;
    variant?: ToastVariant;
}

interface ToastInternal extends ToastOptions {
    id: string;
}

interface ToastContextValue {
    toasts: ToastInternal[];
    toast: (options: ToastOptions) => void;
    dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
    undefined
);

export function ToastProvider({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    const [toasts, setToasts] = React.useState<ToastInternal[]>([]);

    const toast = React.useCallback((options: ToastOptions) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((current) => [...current, { id, ...options }]);
    }, []);

    const dismiss = React.useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    return React.createElement(
        ToastContext.Provider,
        { value: { toasts, toast, dismiss } },
        children
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
