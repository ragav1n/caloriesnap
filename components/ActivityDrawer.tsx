'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose
} from '@/components/ui/drawer';
import { ActivityLog } from '@/types';
import { useStore } from '@/store/useStore';
import { v4 as uuidv4 } from 'uuid';

export function ActivityDrawer() {
    const [isOpen, setIsOpen] = React.useState(false);
    const profile = useStore((state) => state.profile);

    const { register, handleSubmit, reset } = useForm<ActivityLog>();
    const [submitting, setSubmitting] = React.useState(false);

    const onSubmit = async (data: ActivityLog) => {
        if (!profile?.id) {
            console.error("No user profile found");
            return;
        }
        setSubmitting(true);

        const { addActivityLog } = await import('@/actions/data');

        await addActivityLog({
            id: uuidv4(),
            user_id: profile.id,
            activity_name: data.activity_name,
            calories_burned: Number(data.calories_burned),
            created_at: new Date().toISOString(),
        });

        setSubmitting(false);
        setIsOpen(false);
        reset();
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={false}>
            <DrawerTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0 bg-orange-500 hover:bg-orange-600">
                    <Flame className="h-8 w-8 text-white" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[50vh] flex flex-col" onInteractOutside={(e) => e.stopPropagation()}>
                <DrawerHeader>
                    <DrawerTitle>Log Activity</DrawerTitle>
                    <DrawerDescription>
                        Manually enter your burned calories from exercise.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 px-4 overflow-y-auto overscroll-contain">
                    <div className="p-4">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="activity_name">Activity Name</Label>
                                <Input id="activity_name" {...register('activity_name', { required: true })} placeholder="e.g. Running, Treadmill" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="calories_burned">Calories Burned</Label>
                                <Input id="calories_burned" type="number" step="any" {...register('calories_burned', { required: true, min: 0 })} placeholder="0" />
                            </div>
                            <Button type="submit" className="w-full mt-4" disabled={submitting}>
                                {submitting ? 'Adding...' : 'Add Activity'}
                            </Button>
                        </form>
                    </div>
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
