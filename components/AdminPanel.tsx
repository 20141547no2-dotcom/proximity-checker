import React, { useState } from 'react';
import { PlusCircleIcon } from './icons';
import { Location } from '../types';
import EditableLocationItem from './EditableLocationItem';

interface AdminPanelProps {
  onAddLocation: (name: string, address: string) => void;
  onEditLocation: (id: number, name: string, address: string) => void;
  onDeleteLocation: (id: number) => void;
  locations: Location[];
}

export default function AdminPanel({ onAddLocation, onEditLocation, onDeleteLocation, locations }: AdminPanelProps): React.ReactElement {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setFeedback('Both name and address are required.');
      return;
    }
    onAddLocation(name, address);
    setName('');
    setAddress('');
    setFeedback(`Successfully added "${name}"!`);
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="p-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-slate-100">Admin: Add New Location</h2>
      <form onSubmit={handleAdd} className="space-y-4">
        <div>
          <label htmlFor="location-name" className="block text-sm font-medium text-slate-300 mb-1">Location Name</label>
          <input
            id="location-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Văn phòng Long Biên"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="location-address" className="block text-sm font-medium text-slate-300 mb-1">Full Address</label>
          <input
            id="location-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., 1 Nguyễn Văn Cừ, Long Biên, Hà Nội"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex items-center justify-between">
            <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors duration-200"
            >
                <PlusCircleIcon className="w-5 h-5" />
                Add Location
            </button>
            {feedback && <p className="text-sm text-emerald-400">{feedback}</p>}
        </div>
      </form>
      
      <div className="mt-8 pt-6 border-t border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-slate-200">Current Library Locations ({locations.length})</h3>
        {locations.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {locations.map((location) => (
                    <EditableLocationItem
                        key={location.id}
                        location={location}
                        onUpdate={onEditLocation}
                        onDelete={onDeleteLocation}
                    />
                ))}
            </ul>
        ) : (
            <p className="text-slate-500 text-center py-4">No locations in the library yet.</p>
        )}
      </div>
    </div>
  );
}