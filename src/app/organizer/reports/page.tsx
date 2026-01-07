'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Construction } from 'lucide-react';

export default function ReportsPage() {
    return (
        <div className="min-h-screen bg-theme-primary flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-theme-secondary p-8 rounded-3xl shadow-2xl border border-theme max-w-md w-full">
                <div className="bg-theme-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={40} className="text-theme-accent" />
                </div>
                <h1 className="text-3xl font-bold text-theme-primary mb-2">Global Reports</h1>
                <p className="text-theme-secondary mb-8">
                    Detailed reporting and analytics across all contests are coming soon.
                    Please use the Submissions Dashboard for current metrics.
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/organizer/submissions"
                        className="w-full py-3 rounded-xl bg-theme-accent text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                        Go to Submissions Dashboard
                    </Link>
                    <Link
                        href="/organizer/assessment-hub"
                        className="w-full py-3 rounded-xl border border-theme text-theme-primary font-semibold hover:bg-theme-tertiary transition-colors"
                    >
                        Back to Assessment Hub
                    </Link>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-theme-secondary/60 text-sm">
                <Construction size={16} />
                <span>Development in progress</span>
            </div>
        </div>
    );
}
