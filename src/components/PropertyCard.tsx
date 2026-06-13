import React, { useRef } from 'react';
import { PropertyStop, WalkthroughItem, SelectedPhoto } from '../types';
import { getGoogleMapsUrl, getAppleMapsUrl, formatCurrency, formatTimestamp } from '../utils';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Camera, 
  Trash2, 
  Layers, 
  FileEdit, 
  Calendar, 
  ShieldAlert, 
  X,
  CheckCircle2,
  Lock,
  ChevronDown,
  Eye,
  AlertOctagon
} from 'lucide-react';

interface PropertyCardProps {
  key?: string | number;
  stop: PropertyStop;
  onUpdateStop: (updatedStop: PropertyStop) => void;
  onDeleteStop: (stopId: string) => void;
}

export default function PropertyCard({ stop, onUpdateStop, onDeleteStop }: PropertyCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute item counts
  const totalItems = stop.items.length;
  const checkedItems = stop.items.filter(i => i.checked).length;
  const completionPercentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const isCompleted = completionPercentage === 100;

  // Toggle item status
  const handleToggleItem = (itemId: string) => {
    const updatedItems = stop.items.map(item => {
      if (item.id === itemId) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });

    const hasAllChecked = updatedItems.every(i => i.checked);
    const completedTimestamp = hasAllChecked ? formatTimestamp(new Date()) : stop.completedAt;

    onUpdateStop({
      ...stop,
      items: updatedItems,
      completedAt: completedTimestamp,
    });
  };

  // Update Notes
  const handleNotesChange = (text: string) => {
    onUpdateStop({
      ...stop,
      notes: text,
    });
  };

  // Inject Timestamp into Notes
  const handleInsertTimestamp = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedStamp = `[${timeStr}] `;
    
    // Append timestamp at the end or current position
    const currentNotes = stop.notes || '';
    const updatedNotes = currentNotes.trim() 
      ? `${currentNotes}\n${formattedStamp}`
      : `${formattedStamp}`;

    onUpdateStop({
      ...stop,
      notes: updatedNotes,
    });
  };

  // Clear Notes
  const handleClearNotes = () => {
    onUpdateStop({
      ...stop,
      notes: '',
    });
  };

  // Handle Photo Attachment
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const newPhoto: SelectedPhoto = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            dataUrl: reader.result,
            timestamp: formatTimestamp(new Date()),
          };

          onUpdateStop({
            ...stop,
            photos: [...stop.photos, newPhoto],
          });
        }
      };
      reader.readAsDataURL(file as any);
    });

    // Clear the input value so the same file can be uploaded again
    if (e.target) {
      e.target.value = '';
    }
  };

  // Handle Photo Removal
  const handleRemovePhoto = (photoId: string) => {
    const updatedPhotos = stop.photos.filter((p) => p.id !== photoId);
    onUpdateStop({
      ...stop,
      photos: updatedPhotos,
    });
  };

  // Group items by category.
  const categories = {
    occupancy: {
      title: 'Occupancy Check Indicators',
      items: stop.items.filter(i => i.category === 'occupancy'),
      color: 'text-sky-400',
    },
    exterior: {
      title: 'Exterior Physical Audits',
      items: stop.items.filter(i => i.category === 'exterior'),
      color: 'text-emerald-400',
    },
    vacancy: {
      title: 'Vacancy & Contact Placements',
      items: stop.items.filter(i => i.category === 'vacancy'),
      color: 'text-amber-400',
    },
  };

  return (
    <div className={`glass-panel rounded-xl overflow-hidden border transition-all duration-300 ${
      isCompleted 
        ? 'border-emerald-555/40 ring-1 ring-emerald-500/15' 
        : stop.priority === 'high' 
          ? 'border-rose-500/30'
          : 'border-white/10 hover:border-white/15'
    }`}>
      
      {/* Top Banner (Priority specific colors) */}
      <div className={`h-1 w-full ${
        isCompleted 
          ? 'bg-emerald-500' 
          : stop.priority === 'high'
            ? 'bg-gradient-to-r from-red-650 via-rose-500 to-amber-500'
            : 'bg-emerald-500/30'
      }`} />

      {/* Card Header Body */}
      <div className="p-5 md:p-6 pb-4 border-b border-white/10 bg-[#0f0f12]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          
          {/* Main Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Priority indicator */}
              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded italic ${
                stop.priority === 'high' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
              }`}>
                {stop.priority === 'high' ? '🔥 Urgent Action' : '⚡ Walk Stop'}
              </span>

              {/* Tag indicator */}
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-white/5 text-gray-400 border border-white/5">
                🏷️ {stop.tag}
              </span>

              {/* Delinquency cash */}
              {stop.delinquentAmount && stop.delinquentAmount > 0 ? (
                <span className="text-[10px] font-mono font-bold px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/15 rounded italic">
                  Amount Due: {formatCurrency(stop.delinquentAmount)}
                </span>
              ) : null}

              {/* Inspector info */}
              <span className="text-[10px] text-gray-500 flex items-center gap-1 ml-1 font-semibold uppercase tracking-wider">
                Inspector: <span className="text-gray-300">{stop.inspectorName || 'Shawn'}</span>
              </span>
            </div>

            <h2 className="text-2xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
              {stop.address}
              {isCompleted && (
                <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 flex-shrink-0 animate-bounce" />
              )}
            </h2>
            
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1 font-sans">
              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {stop.cityStateZip}
            </p>
          </div>

          {/* Maps / Directions and Delete */}
          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-between md:justify-end">
            <div className="flex gap-2 w-full md:w-auto">
              {/* Google Maps Button */}
              <a
                href={getGoogleMapsUrl(stop.address, stop.cityStateZip)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded px-4 py-2 text-xs font-bold border border-white/10 transition-all text-center w-1/2 md:w-auto uppercase tracking-wide cursor-pointer"
              >
                <span className="text-blue-400 font-extrabold font-mono">G</span> Google Maps
              </a>

              {/* Apple Maps direct scheme link (perfect for iPhone in-the-field agents) */}
              <a
                href={getAppleMapsUrl(stop.address, stop.cityStateZip)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded px-4 py-2 text-xs font-bold border border-white/10 transition-all text-center w-1/2 md:w-auto uppercase tracking-wide cursor-pointer"
              >
                <AppleLogo className="w-3.5 h-3.5 text-gray-300" />
                Apple Maps
              </a>
            </div>

            {/* Delete button */}
            <button
              id={`delete-stop-${stop.id}`}
              onClick={() => {
                if (window.confirm(`Are you sure you want to remove ${stop.address} from this walkthrough run?`)) {
                  onDeleteStop(stop.id);
                }
              }}
              className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-white/10 rounded transition-all flex-shrink-0 cursor-pointer"
              title="Delete stop"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Progress bar info for the Stop */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Walk Stop Progress</span>
            <span className={`font-mono font-bold ${isCompleted ? 'text-emerald-400' : 'text-gray-300'}`}>
              {completionPercentage}% ({checkedItems}/{totalItems} items completed)
            </span>
          </div>
          
          <div className="w-full bg-[#0a0a0b] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div 
              style={{ width: `${completionPercentage}%` }} 
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted 
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                  : 'bg-emerald-500'
              }`}
            />
          </div>

          {stop.completedAt && (
            <div className="mt-2 text-[10px] text-emerald-450 flex items-center gap-1 italic">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Check completed on stop: {stop.completedAt}
            </div>
          )}
        </div>
      </div>

      {/* Main Checklist Body */}
      <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0a0a0b]/40">
        
        {/* Checklist Rows Grid - Left Column */}
        <div className="lg:col-span-8 space-y-4">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((catKey) => {
            const cat = categories[catKey];
            const catCheckedCount = cat.items.filter(i => i.checked).length;
            const catTotal = cat.items.length;
            const catPercent = catTotal > 0 ? Math.round((catCheckedCount / catTotal) * 100) : 0;
            
            return (
              <div key={catKey} className="bg-[#151518] p-5 rounded-xl border border-white/5">
                {/* Category Header with percentage */}
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                    {cat.title}
                  </h4>
                  <span className="text-[10px] font-mono bg-black/30 text-emerald-400 border border-white/5 px-2 py-0.5 rounded">
                    {catCheckedCount}/{catTotal} Checked ({catPercent}%)
                  </span>
                </div>

                {/* Checklist Rows List */}
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className="flex items-center gap-3 cursor-pointer group no-select"
                    >
                      {/* Interactive Custom Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        item.checked 
                          ? 'border-emerald-555 bg-emerald-500 text-black'
                          : 'border-gray-600 hover:border-emerald-500'
                      }`}>
                        {item.checked && (
                          <svg className="w-3 h-3 stroke-[4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Item label */}
                      <span className={`text-sm tracking-wide transition-colors ${
                        item.checked ? 'text-gray-500 line-through' : 'text-gray-200'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Field Notes & Photo Capture - Right Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Notes Card Box */}
          <div className="bg-[#151518] rounded-xl border border-white/5 p-5 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                Field Notes
              </span>
              
              <div className="flex items-center gap-1.5">
                {/* Timestamp capture tool */}
                <button
                  id={`timestamp-btn-${stop.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsertTimestamp();
                  }}
                  className="text-[10px] font-bold text-emerald-500 hover:text-emerald-420 uppercase tracking-tighter cursor-pointer"
                  title="Drop current time into observations text"
                >
                  + Insert Timestamp
                </button>

                <span className="text-gray-600">|</span>

                {/* Clear tool */}
                <button
                  id={`clear-notes-btn-${stop.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearNotes();
                  }}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-300 uppercase tracking-tighter cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              id={`notes-textarea-${stop.id}`}
              value={stop.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="State observations, codes, indicators..."
              className="flex-1 bg-black/40 border border-white/5 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 resize-none font-sans"
            />
          </div>

          {/* Photo Capture Card Box */}
          <div className="bg-[#151518] rounded-xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                Walk Photos ({stop.photos.length})
              </span>
              
              {/* Trigger device camera or photos picker */}
              <button
                id={`upload-photo-btn-${stop.id}`}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 cursor-pointer rounded"
              >
                <Camera className="w-3.5 h-3.5" /> Capture Photo
              </button>
            </div>

            {/* Hidden native input for mobile cameras */}
            <input
              id={`photo-file-input-${stop.id}`}
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Photo Thumbnails list */}
            {stop.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {stop.photos.map((photo) => (
                  <div key={photo.id} className="relative group bg-black/60 rounded-lg overflow-hidden border border-white/5 aspect-square">
                    <img
                      src={photo.dataUrl}
                      alt="walk checkpoint"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Hover detail background */}
                    <div className="absolute inset-0 bg-[#0a0a0b]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                      <span className="text-[8px] font-mono text-gray-400 truncate">
                        {photo.timestamp.split(',')[1]}
                      </span>
                    </div>

                    {/* Delete button overlying image */}
                    <button
                      id={`delete-photo-${photo.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(photo.id);
                      }}
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer border border-white/10"
                      title="Delete photo"
                    >
                      <span className="text-[10px] text-white">×</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-[11px] text-gray-500 leading-normal max-w-[180px]">
                  Take visual photos of meters, delinquency legal postings, locks, or damages.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

// Minimalist fallback Apple Logo SVG
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="currentColor" 
    >
      <path d="M18.71,19.5C17.88,20.74,17,21.95,15.66,22c-1.31,0-1.73-.8-3.23-.8s-2,.77-3.22.8c-1.37,0-2.32-1.27-3.15-2.47C4.38,17,3.12,12.31,4.87,9.27c.87-1.5,2.42-2.45,4.12-2.48,1.29,0,2.5,1,3.29,1C13.07,7.74,14.53,6.6,16,6.75A4.61,4.61,0,0,1,19.64,8.83a4.52,4.52,0,0,0-2.18,3.83A4.57,4.57,0,0,0,20.25,16,11.23,11.23,0,0,1,18.71,19.5M15.91,4.5a4.34,4.34,0,0,0,1-3,4.42,4.42,0,0,0-2.88,1.48,4.24,4.24,0,0,0-1,3A3.72,3.72,0,0,0,15.91,4.5Z" />
    </svg>
  );
}
