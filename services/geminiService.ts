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

const coordinatesSchema = {
  type: Type.OBJECT,
  properties: {
    lat: { type: Type.NUMBER, description: "Latitude of the address" },
    lng: { type: Type.NUMBER, description: "Longitude of the address" },
  },
  required: ["lat", "lng"],
};

export async function getCoordinatesForAddress(address: string): Promise<Coordinates | null> {
  if (!API_KEY || !ai) {
    // This provides a clear error in the UI if the key is missing.
    throw new Error("API Key not found. Please paste your Gemini API Key into the `services/geminiService.ts` file.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide the geographical coordinates for this address: "${address}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: coordinatesSchema,
      },
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
        console.error("Gemini API returned an empty response for address:", address);
        return null;
    }

    const parsed = JSON.parse(jsonString) as Coordinates;
    
    // Basic validation
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && (parsed.lat !== 0 || parsed.lng !== 0) ) {
        return parsed;
    }
    
    console.warn("Received invalid or zero coordinates for address:", address, parsed);
    return null;

  } catch (error) {
    console.error(`Error fetching coordinates for address "${address}":`, error);
    if (error instanceof Error) {
        // Re-throw the error to be caught by the UI
        throw new Error(`Failed to get coordinates. Gemini API Error: ${error.message}`);
    }
    return null;
  }
}
