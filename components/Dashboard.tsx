'use client';

import React, { useEffect, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Plus, Coffee, Sun, Moon, Apple, ChevronRight, ChevronDown, LogOut, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteUserLog } from '@/actions/data';
import { Log } from '@/types';

// Dynamic Imports for Heavy Components
const CalorieBudgetRing = dynamic(() => import('@/components/CalorieBudgetRing').then(mod => mod.CalorieBudgetRing), { ssr: false });
const InputDrawer = dynamic(() => import('@/components/InputDrawer').then(mod => mod.InputDrawer), { ssr: false });
const ActivityDrawer = dynamic(() => import('@/components/ActivityDrawer').then(mod => mod.ActivityDrawer), { ssr: false });
const HistoryDrawer = dynamic(() => import('@/components/HistoryDrawer').then(mod => mod.HistoryDrawer), { ssr: false });
const SettingsDialog = dynamic(() => import('@/components/SettingsDialog').then(mod => ({ default: mod.SettingsDialog })), { ssr: false });
const TrendsDrawer = dynamic(() => import('@/components/TrendsDrawer').then(mod => mod.TrendsDrawer), { ssr: false });
const DataSync = dynamic(() => import('@/components/DataSync').then(mod => ({ default: mod.DataSync })), { ssr: false });
const Loader = dynamic(() => import('@/components/ui/Loader').then(mod => mod.Loader), { ssr: false });

import { logout } from '@/app/auth/actions';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { WeekDatePicker } from '@/components/ui/week-date-picker';
import { format } from 'date-fns';

// --- MealSection extracted and memoized so it keeps its own open/close state ---
interface MealSectionProps {
    title: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    icon: React.ComponentType<{ className?: string }>;
    goal: number;
    mealLogs: Log[];
}

const MealSection = memo(function MealSection({ title, type, icon: Icon, goal, mealLogs }: MealSectionProps) {
    const cals = mealLogs.reduce((acc, l) => acc + l.calories, 0);
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="mb-4 border-none shadow-sm bg-card/50">
                <CollapsibleTrigger asChild>
                    <CardContent className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{title}</h3>
                                <p className="text-sm text-muted-foreground">{cals} / {goal} Cal</p>
                            </div>
                        </div>
                        <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 text-muted-foreground" aria-label={isOpen ? 'Collapse' : 'Expand'}>
                            {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                        </Button>
                    </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    {mealLogs.length > 0 ? (
                        <div className="px-4 pb-4 space-y-2">
                            {mealLogs.map(log => (
                                <div key={log.id} className="flex justify-between items-center text-sm pl-16 py-1 border-t border-border/50 first:border-0 group">
                                    <span>{log.food_name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground font-medium">{log.calories}</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Log options"
                                                >
                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl p-1 min-w-[120px]">
                                                <DropdownMenuItem
                                                    className="text-red-500 font-semibold focus:text-red-400 focus:bg-destructive/10 rounded-lg cursor-pointer"
                                                    onClick={() => deleteUserLog(log.id)}
                                                >
                                                    Delete Log
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 pb-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium italic">
                                No {title.toLowerCase()} logged yet
                            </p>
                        </div>
                    )}
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
});

export default function Dashboard() {
    const { logs, activityLogs, profile, isLoading, setProfile } = useStore();
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [loaderMounted, setLoaderMounted] = React.useState(true);

    // Hide loader once data is ready; fade out then unmount
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => setLoaderMounted(false), 700);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // Mock profile setup if no auth (dev/demo fallback)
    useEffect(() => {
        if (!profile) {
            setProfile({
                id: 'user-1',
                email: 'user@example.com',
                full_name: 'User',
                daily_calorie_goal: 2000,
                protein_goal: 150,
                carbs_goal: 250,
                fats_goal: 70,
                breakfast_goal: 500,
                lunch_goal: 700,
                dinner_goal: 600,
                snack_goal: 200,
            });
        }
    }, [profile, setProfile]);

    // Memoized date filtering
    const selectedDateStr = selectedDate.toDateString();

    const todayLogs = useMemo(
        () => logs.filter(log => new Date(log.created_at).toDateString() === selectedDateStr),
        [logs, selectedDateStr]
    );

    const todayActivityLogs = useMemo(
        () => (activityLogs || []).filter(log => new Date(log.created_at).toDateString() === selectedDateStr),
        [activityLogs, selectedDateStr]
    );

    const consumed = useMemo(() => todayLogs.reduce((acc, l) => acc + l.calories, 0), [todayLogs]);
    const burned = useMemo(() => todayActivityLogs.reduce((acc, l) => acc + l.calories_burned, 0), [todayActivityLogs]);

    const macros = useMemo(() =>
        todayLogs.reduce((acc, l) => ({
            p: acc.p + l.protein,
            c: acc.c + l.carbs,
            f: acc.f + l.fats,
        }), { p: 0, c: 0, f: 0 }),
        [todayLogs]
    );

    // Pre-filter meal logs once per render
    const breakfastLogs = useMemo(() => todayLogs.filter(l => l.meal_type === 'breakfast'), [todayLogs]);
    const lunchLogs = useMemo(() => todayLogs.filter(l => l.meal_type === 'lunch'), [todayLogs]);
    const dinnerLogs = useMemo(() => todayLogs.filter(l => l.meal_type === 'dinner'), [todayLogs]);
    const snackLogs = useMemo(() => todayLogs.filter(l => l.meal_type === 'snack'), [todayLogs]);

    if (!profile) return null;

    return (
        <div className="relative min-h-screen">
            <AuroraBackground className="fixed inset-0 z-0" />

            <div vaul-drawer-wrapper="" className="relative z-10 flex flex-col min-h-screen bg-transparent">
                <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-transparent">
                    <div className="flex items-center gap-3">
                        <Image src="/caloriesnap_logo.png" alt="CalorieSnap" width={40} height={40} className="object-cover rounded-full w-10 h-10" />
                        <div>
                            <h1 className="text-3xl font-bold leading-tight">
                                {selectedDate.toDateString() === new Date().toDateString() ? "Today" : format(selectedDate, 'MMM d')}
                            </h1>
                            {profile?.full_name && (
                                <p className="text-sm text-muted-foreground font-medium">
                                    Welcome back, {profile.full_name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendsDrawer />
                        <HistoryDrawer />
                        <SettingsDialog />
                        <form action={logout}>
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-muted shadow-sm hover:bg-destructive/10 hover:text-destructive text-muted-foreground group transition-all duration-300" aria-label="Logout">
                                <span className="sr-only">Logout</span>
                                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            </Button>
                        </form>
                    </div>
                </header>

                <main className="px-4 space-y-6 flex-1 bg-transparent">
                    <WeekDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

                    {/* Summary Card */}
                    <Card className="border-none shadow-md bg-card">
                        <CardContent className="pt-6 pb-8">
                            <CalorieBudgetRing
                                consumed={consumed}
                                burned={burned}
                                goal={profile?.daily_calorie_goal || 2000}
                            />

                            {/* Macro Split */}
                            <div className="mt-8 grid grid-cols-3 gap-4 px-2">
                                <div className="text-center space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Carbs</span>
                                        <span>{Number(macros.c.toFixed(2))}/{profile?.carbs_goal}g</span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, (macros.c / (profile?.carbs_goal || 1)) * 100)}
                                        className="h-2 bg-muted"
                                        indicatorClassName="bg-blue-500"
                                    />
                                    <p className="text-xs font-medium text-muted-foreground pt-1">{Number(macros.c.toFixed(2))}g</p>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Protein</span>
                                        <span>{Number(macros.p.toFixed(2))}/{profile?.protein_goal}g</span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, (macros.p / (profile?.protein_goal || 1)) * 100)}
                                        className="h-2 bg-muted"
                                        indicatorClassName="bg-green-500"
                                    />
                                    <p className="text-xs font-medium text-muted-foreground pt-1">{Number(macros.p.toFixed(2))}g</p>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Fat</span>
                                        <span>{Number(macros.f.toFixed(2))}/{profile?.fats_goal}g</span>
                                    </div>
                                    <Progress
                                        value={Math.min(100, (macros.f / (profile?.fats_goal || 1)) * 100)}
                                        className="h-2 bg-muted"
                                        indicatorClassName="bg-yellow-500"
                                    />
                                    <p className="text-xs font-medium text-muted-foreground pt-1">{Number(macros.f.toFixed(2))}g</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meal List */}
                    <div className="space-y-2">
                        <MealSection title="Breakfast" type="breakfast" icon={Coffee} goal={profile?.breakfast_goal || 500} mealLogs={breakfastLogs} />
                        <MealSection title="Lunch" type="lunch" icon={Sun} goal={profile?.lunch_goal || 700} mealLogs={lunchLogs} />
                        <MealSection title="Dinner" type="dinner" icon={Moon} goal={profile?.dinner_goal || 600} mealLogs={dinnerLogs} />
                        <MealSection title="Snacks" type="snack" icon={Apple} goal={profile?.snack_goal || 200} mealLogs={snackLogs} />
                    </div>
                </main>
            </div>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-4 z-50 pointer-events-none">
                <div className="pointer-events-auto shadow-2xl rounded-full">
                    <ActivityDrawer />
                </div>
                <div className="pointer-events-auto shadow-2xl rounded-full">
                    <InputDrawer />
                </div>
            </div>

            {/* Loader Overlay — tied to real data loading */}
            {loaderMounted && (
                <Loader className={isLoading ? 'opacity-100 transition-opacity duration-500' : 'opacity-0 pointer-events-none transition-opacity duration-500'} />
            )}

            <DataSync />
        </div>
    );
}
