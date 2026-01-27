import React from "react";

const AssessmentSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse bg-card border border-border/40 rounded-2xl p-5 flex flex-col gap-3 shadow-sm"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="h-5 w-24 rounded-full bg-muted/40" />
            <div className="h-8 w-8 rounded-full bg-muted/30" />
          </div>
          <div className="h-6 w-2/3 rounded bg-muted/60 mb-1" />
          <div className="h-4 w-1/2 rounded bg-muted/40 mb-2" />
          <div className="h-4 w-full rounded bg-muted/30 mb-2" />
          <div className="flex items-center gap-4 mt-2">
            <div className="h-4 w-16 rounded bg-muted/40" />
            <div className="h-4 w-12 rounded bg-muted/30" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssessmentSkeleton;
