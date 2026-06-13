import React, { useState } from 'react';
import { PropertyStop } from '../types';
import { createDefaultChecklist } from '../data';
import { X, Plus, Home, DollarSign, Tag as TagIcon, Check } from 'lucide-react';

interface AddStopDialogProps {
  onAddStop: (stop: PropertyStop) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStopDialog({ onAddStop, isOpen, onClose }: AddStopDialogProps) {
  const [address, setAddress] = useState('');
  const [cityStateZip, setCityStateZip] = useState('St. Paul, MN');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [tag, setTag] = useState('Standard');
  const [notes, setNotes] = useState('');
  const [delinquentAmount, setDelinquentAmount] = useState('');
  const [inspectorName, setInspectorName] = useState('Shawn');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    const newStop: PropertyStop = {
      id: `stop_${Date.now()}`,
      address: address.trim(),
      cityStateZip: cityStateZip.trim(),
      priority,
      tag: tag.trim() || (priority === 'high' ? 'Urgent' : 'Standard'),
      notes: notes.trim() ? `[Initial] ${notes}` : '',
      photos: [],
      items: createDefaultChecklist(),
      delinquentAmount: delinquentAmount ? parseFloat(delinquentAmount) : 0,
      inspectorName: inspectorName || 'Shawn',
    };

    onAddStop(newStop);

    // Reset Form
    setAddress('');
    setCityStateZip('St. Paul, MN');
    setPriority('normal');
    setTag('Standard');
    setNotes('');
    setDelinquentAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div 
        id="modal-backdrop"
        onClick={onClose} 
        className="absolute inset-0 bg-transparent backdrop-blur-md transition-all duration-300"
        style={{ backgroundColor: 'rgba(5, 5, 6, 0.85)' }}
      />
      
      {/* Dialog box */}
      <div className="relative bg-[#151518] rounded-xl w-full max-w-lg overflow-hidden border border-white/10 shadow-2xl z-10 animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0f0f12]">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-500" />
            <h3 className="font-heading text-lg font-bold text-white">Add Field Walk Stop</h3>
          </div>
          <button 
            id="close-add-stop"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Address input */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">
              Property Address *
            </label>
            <input
              id="new-property-address"
              type="text"
              required
              placeholder="e.g. 1769 St Anthony Ave"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* City State Zip */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">
                City, State, Zip
              </label>
              <input
                id="new-property-city"
                type="text"
                placeholder="St. Paul, MN"
                value={cityStateZip}
                onChange={(e) => setCityStateZip(e.target.value)}
                className="w-full bg-black/30 border border-white/5 rounded px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
              />
            </div>

            {/* Inspector */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">
                Inspector Name
              </label>
              <input
                id="new-property-inspector"
                type="text"
                placeholder="Shawn"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full bg-black/30 border border-white/5 rounded px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tag label */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                <TagIcon className="w-3 h-3 text-emerald-500" /> Stop Category/Tag
              </label>
              <input
                id="new-property-tag"
                type="text"
                placeholder="e.g. REO, Estate, Urgent"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full bg-black/30 border border-white/5 rounded px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
              />
            </div>

            {/* Delinquent amount */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-emerald-500" /> Delinquency Amount ($)
              </label>
              <input
                id="new-property-delinquency"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={delinquentAmount}
                onChange={(e) => setDelinquentAmount(e.target.value)}
                className="w-full bg-black/30 border border-white/5 rounded px-4 py-2 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">
              Walk Priority Rating
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'normal', 'high'] as const).map((level) => {
                const colorMap = {
                  low: 'border-white/5 text-gray-400 hover:bg-white/5',
                  normal: 'border-white/5 text-gray-400 hover:bg-white/5',
                  high: 'border-white/5 text-gray-400 hover:bg-white/5',
                };
                const activeColorMap = {
                  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500',
                  normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500',
                  high: 'bg-red-500/10 text-red-555 border-red-500',
                };
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`border rounded py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      priority === level ? activeColorMap[level] : colorMap[level]
                    }`}
                  >
                    {level === 'high' ? '🔥 High' : level === 'normal' ? '⚡ Normal' : '✓ Low'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preliminary Notes */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">
              Preliminary Field Notes
            </label>
            <textarea
              id="new-property-notes"
              rows={3}
              placeholder="Enter initial details or access codes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none font-sans"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
            <button
              id="cancel-add-stop"
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-add-stop"
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Initialize Stop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
