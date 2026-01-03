'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Log } from '@/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DailySummary {
    date_log: string;
    total_calories: number;
    log_count: number;
}

export function HistoryDrawer() {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [summaries, setSummaries] = React.useState<Record<string, number>>({});
    const [selectedDayLogs, setSelectedDayLogs] = React.useState<Log[]>([]);
    const [view, setView] = React.useState<'calendar' | 'details'>('calendar');
    const [loading, setLoading] = React.useState(false);

    const profile = useStore((state) => state.profile);
    const removeLog = useStore((state) => state.removeLog); // We might want to remove from history too

    // Fetch monthly summary
    const fetchMonthSummary = async (month: Date) => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();

        const { data, error } = await supabase.rpc('get_monthly_calorie_summary', {
            start_date: start,
            end_date: end,
        });

        if (error) {
            console.error('Error fetching history:', JSON.stringify(error, null, 2));
            console.error('Params:', { start, end });
            return;
        }

        if (data) {
            const map: Record<string, number> = {};
            data.forEach((d: any) => {
                map[d.date_log] = d.total_calories;
            });
            setSummaries(map);
        }
    };

    // Fetch details for a specific day
    const fetchDayDetails = async (day: Date) => {
        setLoading(true);
        // Set range for the whole day
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: true });

        if (data) {
            setSelectedDayLogs(data);
            setView('details');
        }
        setLoading(false);
    };

    const handleMonthChange = (month: Date) => {
        fetchMonthSummary(month);
    };

    // Initial fetch
    React.useEffect(() => {
        fetchMonthSummary(new Date());
    }, []);

    const handleDateSelect = (day: Date | undefined) => {
        if (!day) return;
        setDate(day);
        fetchDayDetails(day);
    };

    // Modifiers for the calendar
    const modifiers = {
        overBudget: (date: Date) => {
            const key = format(date, 'yyyy-MM-dd');
            const total = summaries[key];
            return total > (profile?.daily_calorie_goal || 2000);
        },
        underBudget: (date: Date) => {
            const key = format(date, 'yyyy-MM-dd');
            const total = summaries[key];
            return total !== undefined && total <= (profile?.daily_calorie_goal || 2000);
        }
    };

    const modifiersStyles = {
        overBudget: { color: 'var(--destructive)', fontWeight: 'bold' },
        underBudget: { color: 'var(--primary)', fontWeight: 'bold' }
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-muted shadow-sm hover:bg-background">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[90vh]">
                <DrawerHeader className="text-left px-6 pt-6">
                    <DrawerTitle className="text-2xl font-bold">
                        {view === 'calendar' ? 'History' : format(date!, 'MMMM d')}
                    </DrawerTitle>
                    <DrawerDescription>
                        {view === 'calendar'
                            ? 'Your daily progress overview.'
                            : 'Detailed log for this day.'}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-6 flex flex-col items-center flex-1 overflow-hidden w-full max-w-md mx-auto">
                    {view === 'calendar' ? (
                        <div className="flex flex-col items-center w-full space-y-6">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleDateSelect}
                                onMonthChange={handleMonthChange}
                                className="rounded-xl border-none bg-transparent shadow-none w-full p-0"
                                classNames={{
                                    month: "space-y-4 w-full",
                                    caption: "flex justify-center pt-1 relative items-center mb-4",
                                    caption_label: "text-lg font-bold",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex justify-between w-full mb-2",
                                    head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem] uppercase",
                                    row: "flex w-full mt-2 justify-between",
                                    cell: "h-10 w-10 text-center text-sm p-0 mx-auto relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground",
                                    day_outside: "text-muted-foreground opacity-50",
                                    day_disabled: "text-muted-foreground opacity-50",
                                    day_hidden: "invisible",
                                }}
                                modifiers={modifiers}
                                modifiersClassNames={{
                                    overBudget: "after:content-[''] after:absolute after:bottom-1.5 after:w-1.5 after:h-1.5 after:rounded-full after:bg-destructive",
                                    underBudget: "after:content-[''] after:absolute after:bottom-1.5 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-500"
                                }}
                            />

                            {/* Legend */}
                            <div className="w-full grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
                                    <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                                    <span className="text-sm font-medium">Goal Met</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
                                    <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />
                                    <span className="text-sm font-medium">Over Limit</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex-1 flex flex-col">
                            <Button
                                variant="ghost"
                                className="self-start mb-2 pl-0 gap-1"
                                onClick={() => setView('calendar')}
                            >
                                <ChevronLeft className="h-4 w-4" /> Back to Month
                            </Button>

                            <ScrollArea className="flex-1 w-full pr-4">
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                                ) : selectedDayLogs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No logs for this day.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedDayLogs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                                <div>
                                                    <div className="font-medium text-sm">{log.food_name}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{log.meal_type}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-sm">{log.calories} kcal</div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t mt-4">
                                            <div className="flex justify-between font-bold">
                                                <span>Total</span>
                                                <span>{selectedDayLogs.reduce((acc, l) => acc + l.calories, 0)} kcal</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
