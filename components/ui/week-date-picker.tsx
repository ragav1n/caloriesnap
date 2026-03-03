'use client';
import React, { useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekDatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function WeekDatePicker({ selectedDate, onChange, className }: WeekDatePickerProps) {
  const days = useMemo(() => {
    // We can center around selectedDate, or just show the week of selectedDate.
    // Showing the week of selectedDate (starting Monday) matches common calendar apps.
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [selectedDate]);

  return (
    <div className={cn("flex flex-row items-center justify-between w-full max-w-sm mx-auto px-2 gap-1", className)}>
      {days.map((date, i) => {
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        const isFuture = date > new Date();

        return (
          <button
            key={i}
            disabled={isFuture}
            onClick={() => onChange(date)}
            className={cn(
              "relative flex flex-col items-center justify-center flex-1 h-[76px] rounded-full transition-all duration-300",
              isSelected 
                ? "bg-slate-900 dark:bg-slate-100 shadow-[0_8px_20px_rgb(0,0,0,0.15)] scale-105 z-10" 
                : isFuture
                  ? "opacity-20 cursor-not-allowed"
                  : "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <span className={cn("text-[11px] font-semibold mb-1 uppercase tracking-wider", isSelected ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400")}>
              {format(date, 'EE').charAt(0)}
            </span>
            <span className={cn("text-lg font-bold", isSelected ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-slate-200")}>
              {format(date, 'dd')}
            </span>
            {isToday && (
              <div className={cn("absolute bottom-2 w-1 h-1 rounded-full", isSelected ? "bg-blue-500 dark:bg-blue-600" : "bg-emerald-500")} />
            )}
          </button>
        );
      })}
    </div>
  );
}
