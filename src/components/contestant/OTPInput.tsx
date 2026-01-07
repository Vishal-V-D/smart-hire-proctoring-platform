'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({
    length = 6,
    value,
    onChange,
    disabled = false
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, digit: string) => {
        if (!/^\d*$/.test(digit)) return;

        const newValue = value.split('');
        newValue[index] = digit;
        const newOTP = newValue.join('').slice(0, length);
        onChange(newOTP);

        // Auto-focus next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            onChange(pastedData);
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground"
                />
            ))}
        </div>
    );
};

export default OTPInput;
