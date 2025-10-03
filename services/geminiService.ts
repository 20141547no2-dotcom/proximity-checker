
import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from "../types";

// --- ACTION REQUIRED ---
// PASTE YOUR API KEY IN THE LINE BELOW
// You can get a free key from Google AI Studio: https://aistudio.google.com/
const API_KEY = "AIzaSyC78qpYlmTh_jA5Fni4XREOwm-yD6RYAcQ";

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

const singleCoordinateSchema = {
    type: Type.OBJECT,
    properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
    },
};

/**
 * Fetches coordinates for a single address.
 * @param address - The address string to geocode.
 * @returns A Coordinates object or null if not found.
 */
export async function getCoordinatesForAddress(address: string): Promise<Coordinates | null> {
    if (!API_KEY || !ai) {
        throw new Error("API Key not found. Please paste your Gemini API Key into the `services/geminiService.ts` file.");
    }

    const prompt = `Provide the geographical coordinates (latitude and longitude) for the following address: "${address}". If you cannot find the address, return nulls.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: singleCoordinateSchema,
            },
        });
        
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString) as { lat: number | null, lng: number | null };

        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && (parsed.lat !== 0 || parsed.lng !== 0)) {
            return { lat: parsed.lat, lng: parsed.lng };
        }
        return null;

    } catch (error) {
        console.error(`Error fetching coordinates for "${address}":`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to get coordinates for address. Gemini API Error: ${error.message}`);
        }
        return null;
    }
}
