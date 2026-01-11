"use client";

import SharedLayout from "@/components/SharedLayout";

export default function CreateAssessmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SharedLayout permission="createAssessment">
            {children}
        </SharedLayout>
    );
}
