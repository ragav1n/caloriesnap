'use client';
import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
    className?: string;
}

export const Loader = ({ className }: LoaderProps) => {
    return (
        // 1. Full screen overlay with dark background
        <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-700 ease-in-out", className)}>
            {/* 2. Container to control size (Lottie files can be huge otherwise) */}
            <div className="w-48 h-48">
                <DotLottieReact
                    src="https://lottie.host/7ada594d-f64b-4cba-a1e0-3dc862c3c6d7/YHe6hUxtOB.lottie"
                    loop
                    autoplay
                />
            </div>
        </div>
    );
};
