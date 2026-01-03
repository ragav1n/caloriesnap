export interface Profile {
    id: string;
    email: string | null;
    daily_calorie_goal: number;
    protein_goal: number;
    carbs_goal: number;
    fats_goal: number;
    breakfast_goal?: number;
    lunch_goal?: number;
    dinner_goal?: number;
    snack_goal?: number;
}

export interface Log {
    id: string;
    user_id: string;
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    created_at: string;
}

export interface FoodItem {
    food_name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    confidence?: string;
}
