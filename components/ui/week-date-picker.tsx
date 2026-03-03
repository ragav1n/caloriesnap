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
    <div className={cn("flex items-center justify-between w-full max-w-md mx-auto gap-2 overflow-x-auto no-scrollbar", className)}>
      {days.map((date, i) => {
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <button
            key={i}
            onClick={() => onChange(date)}
            className={cn(
              "flex flex-col items-center justify-center w-14 flex-none aspect-[1/1.4] rounded-full transition-all duration-300",
              isSelected 
                ? "bg-slate-900 dark:bg-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] scale-105 transform z-10" 
                : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
            )}
          >
            <span className={cn("text-xs font-medium mb-1", isSelected ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400")}>
              {format(date, 'EE').charAt(0)}
            </span>
            <span className={cn("text-lg font-bold", isSelected ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-slate-200")}>
              {format(date, 'dd')}
            </span>
            {isToday && (
              <div className={cn("w-1 h-1 rounded-full mt-1", isSelected ? "bg-blue-500" : "bg-emerald-500")} />
            )}
          </button>
        );
      })}
    </div>
  );
}
