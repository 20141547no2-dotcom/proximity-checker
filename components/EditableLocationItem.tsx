import React, { useState } from 'react';
import { Location } from '../types';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface EditableLocationItemProps {
    location: Location;
    onUpdate: (id: number, name: string, address: string) => void;
    onDelete: (id: number) => void;
}

export default function EditableLocationItem({ location, onUpdate, onDelete }: EditableLocationItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(location.name);
    const [address, setAddress] = useState(location.address);

    const handleSave = () => {
        if (name.trim() && address.trim()) {
            onUpdate(location.id, name.trim(), address.trim());
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setName(location.name);
        setAddress(location.address);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
            onDelete(location.id);
        }
    };

    if (isEditing) {
        return (
            <li className="bg-slate-700/80 p-3 rounded-lg border border-sky-500 flex flex-col gap-3 transition-all duration-300">
                <div className="space-y-2">
                    <div>
                        <label htmlFor={`edit-name-${location.id}`} className="sr-only">Location Name</label>
                        <input
                            id={`edit-name-${location.id}`}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="Location Name"
                        />
                    </div>
                    <div>
                        <label htmlFor={`edit-address-${location.id}`} className="sr-only">Full Address</label>
                        <input
                            id={`edit-address-${location.id}`}
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-md px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="Full Address"
                        />
                    </div>
                </div>
                <div className="flex justify-end items-center gap-2">
                    <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1 text-sm text-slate-400 hover:bg-slate-600 rounded-md transition-colors">
                        <XCircleIcon className="w-4 h-4" />
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 text-sm bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 transition-colors">
                        <CheckCircleIcon className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </li>
        );
    }

    return (
        <li className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 flex justify-between items-center group transition-all duration-300">
            <div className="overflow-hidden mr-2">
                <p className="font-semibold text-slate-100 truncate">{location.name}</p>
                <p className="text-sm text-slate-400 truncate">{location.address}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 rounded-full text-slate-400 hover:bg-sky-500/20 hover:text-sky-400 transition-colors"
                    aria-label={`Edit ${location.name}`}>
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleDelete} 
                    className="p-2 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    aria-label={`Delete ${location.name}`}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </li>
    );
}
