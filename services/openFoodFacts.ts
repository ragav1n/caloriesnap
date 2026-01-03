'use server';

import { FoodItem } from '@/types';

export async function searchProducts(query: string): Promise<FoodItem[]> {
    if (!query) return [];

    // Use the 'in' subdomain for faster local routing
    const baseUrl = "https://in.openfoodfacts.org/cgi/search.pl";

    const url = `${baseUrl}?search_terms=${encodeURIComponent(
        query
    )}&search_simple=1&action=process&json=1&page_size=20`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                // OpenFoodFacts requires a user agent
                "User-Agent": "CalorieSnap-PersonalProject/1.0 (contact@example.com)",
                "Accept": "application/json"
            }
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            // Fallback or just log
            console.warn(`API returned status: ${res.status}`);
            return [];
        }

        const data = await res.json();

        if (!data.products) return [];

        return data.products.map((product: any) => ({
            // Mapping to 'food_name' to match existing app types
            food_name: product.product_name || "Unknown Food",
            calories: Math.round(product.nutriments?.["energy-kcal_100g"] || product.nutriments?.["energy-kcal"] || 0),
            protein: Math.round(product.nutriments?.["proteins_100g"] || 0),
            carbs: Math.round(product.nutriments?.["carbohydrates_100g"] || 0),
            fats: Math.round(product.nutriments?.["fat_100g"] || 0),
            confidence: "High" // basic marker
        })).filter((item: FoodItem) => item.calories > 0);

    } catch (error) {
        console.error("OpenFoodFacts Search Error:", error);
        return [];
    }
}
