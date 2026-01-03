'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

export function SettingsDialog() {
    const { profile, setProfile } = useStore();
    const [open, setOpen] = React.useState(false);

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            daily_calorie_goal: profile?.daily_calorie_goal || 2000,
            protein_goal: profile?.protein_goal || 150,
            carbs_goal: profile?.carbs_goal || 250,
            fats_goal: profile?.fats_goal || 70,
            breakfast_goal: profile?.breakfast_goal || 500,
            lunch_goal: profile?.lunch_goal || 700,
            dinner_goal: profile?.dinner_goal || 600,
            snack_goal: profile?.snack_goal || 200,
        }
    });

    // Reset form when profile changes or dialog opens (to ensure fresh data)
    React.useEffect(() => {
        if (open && profile) {
            reset({
                daily_calorie_goal: profile.daily_calorie_goal,
                protein_goal: profile.protein_goal,
                carbs_goal: profile.carbs_goal,
                fats_goal: profile.fats_goal,
                breakfast_goal: profile.breakfast_goal || 500,
                lunch_goal: profile.lunch_goal || 700,
                dinner_goal: profile.dinner_goal || 600,
                snack_goal: profile.snack_goal || 200,
            });
        }
    }, [open, profile, reset]);

    const [error, setError] = React.useState<string | null>(null);

    const onSubmit = async (data: any) => {
        if (!profile) return;

        const total = Number(data.daily_calorie_goal);
        const mealsTotal = Number(data.breakfast_goal) + Number(data.lunch_goal) + Number(data.dinner_goal) + Number(data.snack_goal);

        if (mealsTotal !== total) {
            setError(`Meal goals sum to ${mealsTotal}, but daily total is ${total}. Please adjust.`);
            return;
        }

        setError(null);

        // Dynamic import
        const { updateUserProfile } = await import('@/actions/data');

        try {
            await updateUserProfile(profile.id, {
                daily_calorie_goal: Number(data.daily_calorie_goal),
                protein_goal: Number(data.protein_goal),
                carbs_goal: Number(data.carbs_goal),
                fats_goal: Number(data.fats_goal),
                breakfast_goal: Number(data.breakfast_goal),
                lunch_goal: Number(data.lunch_goal),
                dinner_goal: Number(data.dinner_goal),
                snack_goal: Number(data.snack_goal),
            });
            // Update local store after successful API call
            setProfile({
                ...profile,
                daily_calorie_goal: Number(data.daily_calorie_goal),
                protein_goal: Number(data.protein_goal),
                carbs_goal: Number(data.carbs_goal),
                fats_goal: Number(data.fats_goal),
                breakfast_goal: Number(data.breakfast_goal),
                lunch_goal: Number(data.lunch_goal),
                dinner_goal: Number(data.dinner_goal),
                snack_goal: Number(data.snack_goal),
            });
            setOpen(false); // Close dialog on success
        } catch (err) {
            console.error("Failed to update user profile:", err);
            setError("Failed to save changes. Please try again.");
        }
    };

    const handleAutoDistribute = (e: React.MouseEvent) => {
        e.preventDefault();
        const total = parseInt(document.querySelector<HTMLInputElement>('#daily_calorie_goal')?.value || '2000');

        // Distribution: 25% Breakfast, 35% Lunch, 30% Dinner, 10% Snack
        const b = Math.round(total * 0.25);
        const l = Math.round(total * 0.35);
        const d = Math.round(total * 0.30);
        const s = total - (b + l + d); // Remainder to snacks to ensure exact sum

        reset({
            ...profile,
            daily_calorie_goal: total, // Keep current input
            protein_goal: profile?.protein_goal,
            carbs_goal: profile?.carbs_goal,
            fats_goal: profile?.fats_goal,
            breakfast_goal: b,
            lunch_goal: l,
            dinner_goal: d,
            snack_goal: s
        });
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Goals & Settings</DialogTitle>
                    <DialogDescription>
                        Adjust your daily nutrition targets.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div className="space-y-4">
                        <h4 className="font-medium border-b pb-2">Daily Totals</h4>
                        <div className="grid gap-2">
                            <Label htmlFor="daily_calorie_goal">Daily Calories</Label>
                            <Input id="daily_calorie_goal" type="number" {...register('daily_calorie_goal')} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="grid gap-2">
                                <Label htmlFor="protein_goal" className="text-xs">Protein (g)</Label>
                                <Input id="protein_goal" type="number" {...register('protein_goal')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="carbs_goal" className="text-xs">Carbs (g)</Label>
                                <Input id="carbs_goal" type="number" {...register('carbs_goal')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="fats_goal" className="text-xs">Fats (g)</Label>
                                <Input id="fats_goal" type="number" {...register('fats_goal')} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium border-b pb-2">Meal Goals</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="breakfast_goal">Breakfast</Label>
                                <Input id="breakfast_goal" type="number" {...register('breakfast_goal')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lunch_goal">Lunch</Label>
                                <Input id="lunch_goal" type="number" {...register('lunch_goal')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dinner_goal">Dinner</Label>
                                <Input id="dinner_goal" type="number" {...register('dinner_goal')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="snack_goal">Snacks</Label>
                                <Input id="snack_goal" type="number" {...register('snack_goal')} />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleAutoDistribute} className="flex-1">
                            Auto Distribute
                        </Button>
                        <Button type="submit" className="flex-1">Save Changes</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
