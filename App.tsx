import React, { useState, useCallback, useEffect } from 'react';
import { Location, LocationWithDistance } from './types';
import { INITIAL_LOCATIONS } from './constants';
import { getCoordinatesForAddress } from './services/geminiService';
import { getDistance } from './utils/distance';
import LocationInput from './components/LocationInput';
import LocationList from './components/LocationList';
import AdminPanel from './components/AdminPanel';
import { MapPinIcon, WrenchScrewdriverIcon } from './components/icons';

const STORAGE_KEY = 'proximity-checker-locations';

export default function App(): React.ReactElement {
  const [libraryLocations, setLibraryLocations] = useState<Location[]>(() => {
    try {
      const storedLocations = window.localStorage.getItem(STORAGE_KEY);
      if (storedLocations) {
        return JSON.parse(storedLocations);
      }
    } catch (error) {
      console.error("Error parsing locations from localStorage", error);
    }
    return INITIAL_LOCATIONS;
  });
  
  const [sortedLocations, setSortedLocations] = useState<LocationWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(libraryLocations));
    } catch (error) {
        console.error("Error saving locations to localStorage", error);
    }
  }, [libraryLocations]);


  const handleAddLocation = (name: string, address: string) => {
    setLibraryLocations(prevLocations => [
      ...prevLocations,
      {
        id: prevLocations.length > 0 ? Math.max(...prevLocations.map(l => l.id)) + 1 : 1,
        name,
        address,
      }
    ]);
  };

  const handleEditLocation = (idToUpdate: number, newName: string, newAddress: string) => {
    setLibraryLocations(prevLocations =>
      prevLocations.map(location => {
        if (location.id === idToUpdate) {
          // If address changed, invalidate coordinates to force re-fetching
          const coordinates = location.address.trim().toLowerCase() === newAddress.trim().toLowerCase() 
            ? location.coordinates 
            : null;
          return { ...location, name: newName, address: newAddress, coordinates };
        }
        return location;
      })
    );
  };

  const handleDeleteLocation = (idToDelete: number) => {
    setLibraryLocations(prevLocations =>
      prevLocations.filter(location => location.id !== idToDelete)
    );
  };

  const findNearest = useCallback(async (userAddress: string) => {
    if (!userAddress.trim()) {
      setError("Please enter a valid address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSortedLocations([]);

    try {
      const userCoords = await getCoordinatesForAddress(userAddress);
      if (!userCoords) {
        throw new Error(`Could not find coordinates for "${userAddress}". Please try a more specific address.`);
      }

      const locationsWithCoordsPromises = libraryLocations.map(async (location) => {
        if (location.coordinates) {
          return location;
        }
        const coords = await getCoordinatesForAddress(location.address);
        return { ...location, coordinates: coords };
      });

      const locationsWithCoords = await Promise.all(locationsWithCoordsPromises);
      
      // Update library state with newly fetched coordinates for caching
      setLibraryLocations(currentLocations => {
        const newLocations = [...currentLocations];
        locationsWithCoords.forEach(updatedLocation => {
            const index = newLocations.findIndex(l => l.id === updatedLocation.id);
            if (index !== -1 && !newLocations[index].coordinates) {
                newLocations[index] = updatedLocation;
            }
        });
        return newLocations;
      });

      const locationsWithDistance = locationsWithCoords
        .filter(location => location.coordinates) // Filter out any locations we failed to geocode
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
        
        <footer className="mt-8">
           <div className="flex justify-center">
             <button
               onClick={() => setIsAdminPanelOpen(prev => !prev)}
               className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 text-slate-300"
             >
               <WrenchScrewdriverIcon className="w-5 h-5" />
               {isAdminPanelOpen ? 'Close Admin Panel' : 'Open Admin Panel'}
             </button>
           </div>
           {isAdminPanelOpen && (
             <div className="mt-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700">
               <AdminPanel 
                 onAddLocation={handleAddLocation}
                 onEditLocation={handleEditLocation}
                 onDeleteLocation={handleDeleteLocation} 
                 locations={libraryLocations} 
               />
             </div>
           )}
        </footer>
      </div>
    </div>
  );
}