'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { FoodItem } from '@/types';

// Initialize with your existing key
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Using the confirmed working model
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function searchFoodAI(query: string): Promise<FoodItem[]> {
  if (!query) return [];

  // If no API Key, return empty
  if (!apiKey) {
    console.warn("Gemini API key missing for text search");
    return [];
  }

  try {
    const prompt = `
      I ate "${query}". 
      Identify the food items and estimate the calories and macros.
      If the quantity is not specified, assume a standard serving.
      
      Return a JSON array with this exact structure (no markdown, just raw JSON):
      [
        {
          "food_name": "Food Name",
          "calories": number,
          "protein": number, 
          "carbs": number,
          "fats": number
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if Gemini adds them (e.g. ```json ... ```)
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("AI Search Error:", error);
    return [];
  }
}
