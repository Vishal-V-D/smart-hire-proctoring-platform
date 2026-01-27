import React from "react";

type LoaderProps = {
    fullscreen?: boolean;
    message?: string;
};

const Loader: React.FC<LoaderProps> = ({
    fullscreen = false,
    message,
}) => {
    const containerClasses = fullscreen
        ? "min-h-screen w-full flex items-center justify-center bg-gray-50 flex-col gap-4"
        : "w-full py-10 flex items-center justify-center bg-gray-50 flex-col gap-4";

    return (
        <div className={containerClasses}>
            <div className="loader"></div>
            {message && (
                <p className="text-gray-500 font-medium animate-pulse">{message}</p>
            )}
        </div>
    );
};

export default Loader;
