import React from 'react';
import { LocationWithDistance } from '../types';
import { MapPinIcon } from './icons';

interface LocationListProps {
  locations: LocationWithDistance[];
  isLoading: boolean;
}

const LocationItem = ({ item }: { item: LocationWithDistance }) => (
  <li className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 hover:border-sky-500 hover:bg-slate-700/50 transition-all duration-200 flex items-start gap-4">
    <div className="flex-shrink-0 mt-1 text-sky-400">
      <MapPinIcon className="w-6 h-6" />
    </div>
    <div className="flex-grow">
      <h3 className="font-semibold text-lg text-slate-100">{item.name}</h3>
      <p className="text-slate-400 text-sm">{item.address}</p>
    </div>
    <div className="flex-shrink-0 text-right">
      <p className="font-bold text-sky-400 text-lg whitespace-nowrap">~ {item.distance.toFixed(2)} km</p>
      <p className="text-slate-500 text-sm">away</p>
    </div>
  </li>
);

const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 animate-pulse flex gap-4">
        <div className="w-6 h-6 bg-slate-600 rounded-full mt-1"></div>
        <div className="flex-grow space-y-2">
            <div className="h-5 bg-slate-600 rounded w-3/4"></div>
            <div className="h-4 bg-slate-600 rounded w-full"></div>
        </div>
        <div className="w-24 h-10 bg-slate-600 rounded"></div>
      </div>
    ))}
  </div>
);

export default function LocationList({ locations, isLoading }: LocationListProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-300">Calculating distances...</h2>
        <SkeletonLoader />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="mt-8 text-center py-12 px-6 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
        <h2 className="text-xl font-semibold text-slate-400">No results to display</h2>
        <p className="text-slate-500 mt-1">Enter an address above to find the nearest locations.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-slate-100">Top 10 Nearby Locations</h2>
      <ul className="space-y-4">
        {locations.map(item => <LocationItem key={item.id} item={item} />)}
      </ul>
    </div>
  );
}