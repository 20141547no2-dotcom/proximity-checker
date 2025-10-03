
import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const coordinatesSchema = {
  type: Type.OBJECT,
  properties: {
    lat: { type: Type.NUMBER, description: "Latitude of the address" },
    lng: { type: Type.NUMBER, description: "Longitude of the address" },
  },
  required: ["lat", "lng"],
};

export async function getCoordinatesForAddress(address: string): Promise<Coordinates | null> {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    // Return mock data if API key is not available for development
    // In a real app, you would throw an error.
    return { lat: 21.0285, lng: 105.8542 }; // Mock Hanoi coordinates
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
    return null;
  }
}
