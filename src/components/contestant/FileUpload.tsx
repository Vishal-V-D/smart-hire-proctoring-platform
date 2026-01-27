'use client';

import React, { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import Loader from '@/components/Loader';

interface FileUploadProps {
    accept: string;
    maxSize?: number; // in MB
    onUpload: (file: File) => Promise<string>;
    label: string;
    description?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    accept,
    maxSize = 5,
    onUpload,
    label,
    description
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = useCallback(async (selectedFile: File) => {
        setError(null);

        // Validate file size
        if (selectedFile.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        setFile(selectedFile);
        setUploading(true);

        try {
            await onUpload(selectedFile);
            setUploaded(true);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            setFile(null);
        } finally {
            setUploading(false);
        }
    }, [maxSize, onUpload]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    const removeFile = () => {
        setFile(null);
        setUploaded(false);
        setError(null);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">{label}</label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}

            <div
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${dragActive
                    ? 'border-primary bg-primary/5'
                    : uploaded
                        ? 'border-green-500 bg-green-500/5'
                        : error
                            ? 'border-destructive bg-destructive/5'
                            : 'border-border hover:border-primary/50'
                    }`}
            >
                {!file ? (
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-foreground mb-1">
                            Drop file here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {accept} • Max {maxSize}MB
                        </p>
                        <input
                            type="file"
                            accept={accept}
                            onChange={handleChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <File className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-sm font-medium text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {uploading && (
                                <div className="scale-50 h-5 w-12 flex items-center justify-center">
                                    <Loader />
                                </div>
                            )}
                            {uploaded && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {!uploading && (
                                <button
                                    onClick={removeFile}
                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
};

export default FileUpload;
