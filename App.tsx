import React, { useState, useCallback } from 'react';
import { Location, LocationWithDistance } from './types';
import { INITIAL_LOCATIONS } from './constants';
import { getCoordinatesForAddress, getCoordinatesForAddresses } from './services/geminiService';
import { getDistance } from './utils/distance';
import LocationInput from './components/LocationInput';
import LocationList from './components/LocationList';
import { MapPinIcon } from './components/icons';

export default function App(): React.ReactElement {
  // Library locations are now managed solely by the constants file.
  // We use state here to hold geocoded results for the current session.
  const [libraryLocations, setLibraryLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [sortedLocations, setSortedLocations] = useState<LocationWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const findNearest = useCallback(async (userAddress: string) => {
    if (!userAddress.trim()) {
      setError("Please enter a valid address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSortedLocations([]);

    try {
      // 1. Fetch coordinates for the user's address first (fast single request).
      const userCoords = await getCoordinatesForAddress(userAddress);
      if (!userCoords) {
        throw new Error(`Could not find coordinates for "${userAddress}". Please try a more specific address.`);
      }

      let currentLibraryLocations = [...libraryLocations];

      // 2. Check if any library locations need geocoding for this session.
      const locationsToGeocode = currentLibraryLocations.filter(loc => !loc.coordinates);
      if (locationsToGeocode.length > 0) {
        const addressesToFetch = locationsToGeocode.map(loc => loc.address);
        const coordinatesMap = await getCoordinatesForAddresses(addressesToFetch);

        // 3. Map the newly fetched coordinates back to the library locations.
        const updatedLocations = currentLibraryLocations.map(location => {
          if (location.coordinates) {
            return location; // Already has coords
          }
          const foundCoords = coordinatesMap.get(location.address);
          return { ...location, coordinates: foundCoords || null };
        });

        // 4. Update the component state for caching during this session.
        setLibraryLocations(updatedLocations);
        currentLibraryLocations = updatedLocations;
      }
      
      // 5. Calculate distances and sort.
      const locationsWithDistance = currentLibraryLocations
        .filter(location => location.coordinates) // Filter out any we failed to geocode
        .map((location): LocationWithDistance => ({
          ...location,
          distance: getDistance(userCoords, location.coordinates!),
        }));

      locationsWithDistance.sort((a, b) => a.distance - b.distance);
      
      const top5Locations = locationsWithDistance.slice(0, 5);
      setSortedLocations(top5Locations);

    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
      setSortedLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [libraryLocations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-center gap-3">
            <MapPinIcon className="w-10 h-10" />
            Proximity Checker
          </h1>
          <p className="mt-2 text-slate-400 text-lg">
            Find the nearest library locations to any address.
          </p>
        </header>
        
        <main className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700">
          <LocationInput onFind={findNearest} isLoading={isLoading} />

          {error && (
            <div className="mt-6 p-4 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          )}

          <LocationList locations={sortedLocations} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}