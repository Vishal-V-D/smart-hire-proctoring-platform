import * as React from "react";
import { cn } from "@/lib/utils";

export const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "pointer-events-none fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:top-auto sm:flex-col md:max-w-[420px]",
                className
            )}
            {...props}
        />
    )
);
ToastViewport.displayName = "ToastViewport";

export const Toast = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "pointer-events-auto relative mb-2 flex w-full items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 px-3 py-2.5 text-sm shadow-[0_18px_45px_-24px_rgba(15,23,42,1)]",
                className
            )}
            {...props}
        />
    )
);
Toast.displayName = "Toast";

export const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
    )
);
ToastTitle.displayName = "ToastTitle";

export const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
    )
);
ToastDescription.displayName = "ToastDescription";

export const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                "absolute right-2 top-2 rounded-md p-1 text-foreground/50 hover:text-foreground",
                className
            )}
            type="button"
            {...props}
        />
    )
);
ToastClose.displayName = "ToastClose";
