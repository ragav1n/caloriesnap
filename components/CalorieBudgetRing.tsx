'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Flame, Utensils } from 'lucide-react';

interface CalorieBudgetRingProps {
    consumed: number;
    goal: number;
    size?: number;
    strokeWidth?: number;
}

export function CalorieBudgetRing({
    consumed,
    goal,
    size = 220,
    strokeWidth = 15, // Thinner stroke for modern look
}: CalorieBudgetRingProps) {
    // SVG Circle properties
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // Safety check div by zero
    const safeGoal = goal > 0 ? goal : 1;
    const remaining = Math.max(0, goal - consumed);
    const percentage = Math.min(100, Math.max(0, (consumed / safeGoal) * 100));

    // Stroke Dash Offset for Circle:
    // offset = circumference - (percent / 100) * circumference
    const dashoffset = circumference - (percentage / 100) * circumference;

    // Rotate to start at top (-90deg)
    const rotation = -90;

    let colorClass = 'text-primary';
    if (percentage >= 100) colorClass = 'text-destructive';
    else if (percentage >= 90) colorClass = 'text-orange-500';

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform transition-all duration-300"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/10"
                />
                {/* Progress Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                    className={cn('transition-all duration-1000 ease-out', colorClass)}
                />
            </svg>

            {/* Center Content - Un-rotate to display text correctly */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pb-4">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-5xl font-bold tracking-tighter">
                        {remaining}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                        Remaining
                    </span>
                </div>
            </div>

            {/* Stats Below Ring */}
            <div className="absolute -bottom-2 w-full flex justify-between px-8 text-sm font-medium">
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground">Eaten</span>
                    <span className="text-xl">{consumed}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground">Burned</span>
                    <span className="text-xl">0</span>
                </div>
            </div>
        </div>
    );
}
