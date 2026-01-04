import { z } from 'zod';

export const AuthSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const FoodLogSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    food_name: z.string().min(2, { message: "Food name is required" }).max(100),
    calories: z.number().min(0, { message: "Calories cannot be negative" }).max(5000),
    protein: z.number().min(0).max(1000).optional().default(0),
    carbs: z.number().min(0).max(1000).optional().default(0),
    fats: z.number().min(0).max(1000).optional().default(0),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    created_at: z.string().datetime(),
});

export type AuthInput = z.infer<typeof AuthSchema>;
export type FoodLogInput = z.infer<typeof FoodLogSchema>;
