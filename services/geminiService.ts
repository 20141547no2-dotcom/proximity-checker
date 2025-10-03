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

const batchCoordinatesSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      address: { type: Type.STRING, description: "The original address provided for lookup." },
      lat: { type: Type.NUMBER, description: "Latitude of the address. Can be null if not found." },
      lng: { type: Type.NUMBER, description: "Longitude of the address. Can be null if not found." },
    },
    required: ["address"],
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


/**
 * Fetches coordinates for a list of addresses in a single API call.
 * @param addresses - An array of address strings to geocode.
 * @returns A Map where keys are the original address strings and values are Coordinates objects or null if not found.
 */
export async function getCoordinatesForAddresses(addresses: string[]): Promise<Map<string, Coordinates | null>> {
  if (!API_KEY || !ai) {
    throw new Error("API Key not found. Please paste your Gemini API Key into the `services/geminiService.ts` file.");
  }

  if (addresses.length === 0) {
    return new Map();
  }

  const uniqueAddresses = [...new Set(addresses)];

  const addressList = uniqueAddresses.map((addr, i) => `${i + 1}. "${addr}"`).join('\n');
  const prompt = `Provide the geographical coordinates (latitude and longitude) for the following list of addresses. For each address, return a JSON object with the original address string and its coordinates. If an address cannot be found, return null for its lat and lng values.\n\n${addressList}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: batchCoordinatesSchema,
      },
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
      console.error("Gemini API returned an empty response for batch geocoding.");
      const resultMap = new Map<string, Coordinates | null>();
      uniqueAddresses.forEach(addr => resultMap.set(addr, null));
      return resultMap;
    }

    const parsed = JSON.parse(jsonString) as Array<{ address: string; lat: number | null; lng: number | null }>;
    
    const resultMap = new Map<string, Coordinates | null>();
    uniqueAddresses.forEach(addr => resultMap.set(addr, null)); // Initialize with nulls

    parsed.forEach(item => {
      // The model might slightly alter the address string, so find the original address via case-insensitive matching.
      const originalAddress = uniqueAddresses.find(addr => addr.trim().toLowerCase() === item.address.trim().toLowerCase());
      
      if (originalAddress) {
        if (typeof item.lat === 'number' && typeof item.lng === 'number' && (item.lat !== 0 || item.lng !== 0)) {
          resultMap.set(originalAddress, { lat: item.lat, lng: item.lng });
        }
      } else {
        console.warn(`Could not match returned address "${item.address}" to any original address.`);
      }
    });

    return resultMap;

  } catch (error) {
    console.error(`Error batch fetching coordinates:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to get coordinates. Gemini API Error: ${error.message}`);
    }
    // On failure, return a map with null for all addresses
    const resultMap = new Map<string, Coordinates | null>();
    uniqueAddresses.forEach(addr => resultMap.set(addr, null));
    return resultMap;
  }
}