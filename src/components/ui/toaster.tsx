'use client'

import { X } from "lucide-react";

import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
    const { toasts, dismiss } = useToast();

    return (
        <>
            <ToastViewport />
            {toasts.map((toast) => (
                <Toast key={toast.id}>
                    <div className="flex flex-1 flex-col gap-1">
                        {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                        {toast.description && (
                            <ToastDescription>{toast.description}</ToastDescription>
                        )}
                    </div>
                    <ToastClose
                        onClick={() => dismiss(toast.id)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-xs text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </ToastClose>
                </Toast>
            ))}
        </>
    );
}
