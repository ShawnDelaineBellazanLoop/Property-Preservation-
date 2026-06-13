import React, { useRef, useState } from 'react';
import { PropertyStop, WalkthroughItem, SelectedPhoto } from '../types';
import { getGoogleMapsUrl, getAppleMapsUrl, formatCurrency, formatTimestamp } from '../utils';
import { 
  MapPin, 
  Clock, 
  Camera, 
  Image,
  Trash2, 
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const compressAndResizePhoto = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // Always fall back to original if anything goes wrong
    const fallbackToOriginal = (result?: string) => {
      if (result) { resolve(result); return; }
      const reader2 = new FileReader();
      reader2.onload = (e) => resolve(e.target?.result as string ?? '');
      reader2.onerror = () => resolve('');
      reader2.readAsDataURL(file);
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;
      if (!originalDataUrl) { resolve(''); return; }

      const img = new window.Image();
      img.onload = () => {
        try {
          const maxDim = 1024;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { fallbackToOriginal(originalDataUrl); return; }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);

          // Validate output — some mobile browsers return empty/broken data URLs
          if (!compressed || compressed.length < 100 || compressed === 'data:,') {
            fallbackToOriginal(originalDataUrl);
          } else {
            resolve(compressed);
          }
        } catch {
          fallbackToOriginal(originalDataUrl);
        }
      };
      img.onerror = () => fallbackToOriginal(originalDataUrl);
      img.src = originalDataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

interface PropertyCardProps {
  stop: PropertyStop;
  onUpdateStop: (updatedStop: PropertyStop) => void;
  onDeleteStop: (stopId: string) => void;
}

export default function PropertyCard({ stop, onUpdateStop, onDeleteStop }: PropertyCardProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const totalItems = stop.items.length;
  const checkedItems = stop.items.filter(i => i.checked).length;
  const completionPercentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const isCompleted = completionPercentage === 100;

  const handleToggleItem = (itemId: string) => {
    const updatedItems = stop.items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const hasAllChecked = updatedItems.every(i => i.checked);
    onUpdateStop({
      ...stop,
      items: updatedItems,
      completedAt: hasAllChecked ? formatTimestamp(new Date()) : stop.completedAt,
    });
  };

  const handleNotesChange = (text: string) => onUpdateStop({ ...stop, notes: text });

  const handleInsertTimestamp = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const current = stop.notes || '';
    onUpdateStop({ ...stop, notes: current.trim() ? `${current}\n[${timeStr}] ` : `[${timeStr}] ` });
  };

  const handleClearNotes = () => onUpdateStop({ ...stop, notes: '' });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    setUploadingCount(filesArray.length);

    try {
      // Process one at a time to avoid memory issues on mobile
      const newPhotos: SelectedPhoto[] = [];
      for (const file of filesArray) {
        const dataUrl = await compressAndResizePhoto(file);
        if (dataUrl && dataUrl.length > 100) {
          newPhotos.push({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            dataUrl,
            timestamp: formatTimestamp(new Date()),
          });
        }
      }

      if (newPhotos.length > 0) {
        // Use functional update pattern to avoid stale closure on stop.photos
        onUpdateStop({
          ...stop,
          photos: [...stop.photos, ...newPhotos],
        });
      }
    } catch (err) {
      console.error('Photo upload error:', err);
    } finally {
      setUploadingCount(0);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    onUpdateStop({ ...stop, photos: stop.photos.filter(p => p.id !== photoId) });
  };

  const categories = {
    occupancy: {
      title: 'Occupancy Check Indicators',
      items: stop.items.filter(i => i.category === 'occupancy'),
    },
    exterior: {
      title: 'Exterior Physical Audits',
      items: stop.items.filter(i => i.category === 'exterior'),
    },
    vacancy: {
      title: 'Vacancy & Contact Placements',
      items: stop.items.filter(i => i.category === 'vacancy'),
    },
  };

  return (
    <div className={`glass-panel rounded-xl overflow-hidden border transition-all duration-300 ${
      isCompleted
        ? 'border-emerald-500/40 ring-1 ring-emerald-500/15'
        : stop.priority === 'high'
          ? 'border-rose-500/30'
          : 'border-white/10 hover:border-white/15'
    }`}>

      {/* Top Banner */}
      <div className={`h-1 w-full ${
        isCompleted
          ? 'bg-emerald-500'
          : stop.priority === 'high'
            ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500'
            : 'bg-emerald-500/30'
      }`} />

      {/* Header */}
      <div className="p-5 md:p-6 pb-4 border-b border-white/10 bg-[#0f0f12]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded italic ${
                stop.priority === 'high'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
              }`}>
                {stop.priority === 'high' ? '🔥 Urgent Action' : '⚡ Walk Stop'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-white/5 text-gray-400 border border-white/5">
                🏷️ {stop.tag}
              </span>
              {stop.delinquentAmount && stop.delinquentAmount > 0 ? (
                <span className="text-[10px] font-mono font-bold px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/15 rounded italic">
                  Amount Due: {formatCurrency(stop.delinquentAmount)}
                </span>
              ) : null}
              <span className="text-[10px] text-gray-500 flex items-center gap-1 ml-1 font-semibold uppercase tracking-wider">
                Inspector: <span className="text-gray-300">{stop.inspectorName || 'Shawn'}</span>
              </span>
            </div>

            <h2 className="text-2xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
              {stop.address}
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-bounce" />}
            </h2>
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {stop.cityStateZip}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-between md:justify-end">
            <div className="flex gap-2 w-full md:w-auto">
              <a href={getGoogleMapsUrl(stop.address, stop.cityStateZip)} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded px-4 py-2 text-xs font-bold border border-white/10 transition-all w-1/2 md:w-auto uppercase tracking-wide">
                <span className="text-blue-400 font-extrabold font-mono">G</span> Google Maps
              </a>
              <a href={getAppleMapsUrl(stop.address, stop.cityStateZip)} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded px-4 py-2 text-xs font-bold border border-white/10 transition-all w-1/2 md:w-auto uppercase tracking-wide">
                <AppleLogo className="w-3.5 h-3.5 text-gray-300" /> Apple Maps
              </a>
            </div>
            <button onClick={() => {
              if (window.confirm(`Remove ${stop.address} from this walkthrough?`)) onDeleteStop(stop.id);
            }} className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-white/10 rounded transition-all flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Walk Stop Progress</span>
            <span className={`font-mono font-bold text-xs ${isCompleted ? 'text-emerald-400' : 'text-gray-300'}`}>
              {completionPercentage}% ({checkedItems}/{totalItems} items)
            </span>
          </div>
          <div className="w-full bg-[#0a0a0b] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div style={{ width: `${completionPercentage}%` }}
              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-emerald-500'}`} />
          </div>
          {stop.completedAt && (
            <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 italic">
              <Clock className="w-3.5 h-3.5" /> Completed: {stop.completedAt}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0a0a0b]/40">

        {/* Checklist */}
        <div className="lg:col-span-8 space-y-4">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((catKey) => {
            const cat = categories[catKey];
            const checked = cat.items.filter(i => i.checked).length;
            const pct = cat.items.length > 0 ? Math.round((checked / cat.items.length) * 100) : 0;
            return (
              <div key={catKey} className="bg-[#151518] p-5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{cat.title}</h4>
                  <span className="text-[10px] font-mono bg-black/30 text-emerald-400 border border-white/5 px-2 py-0.5 rounded">
                    {checked}/{cat.items.length} ({pct}%)
                  </span>
                </div>
                <div className="space-y-3">
                  {cat.items.map(item => (
                    <div key={item.id} onClick={() => handleToggleItem(item.id)}
                      className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        item.checked ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-gray-600 hover:border-emerald-500'
                      }`}>
                        {item.checked && (
                          <svg className="w-3 h-3 stroke-[4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm tracking-wide transition-colors ${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes + Photos */}
        <div className="lg:col-span-4 space-y-6">

          {/* Notes */}
          <div className="bg-[#151518] rounded-xl border border-white/5 p-5 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Field Notes</span>
              <div className="flex items-center gap-1.5">
                <button onClick={handleInsertTimestamp}
                  className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter cursor-pointer">
                  + Timestamp
                </button>
                <span className="text-gray-600">|</span>
                <button onClick={handleClearNotes}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-300 uppercase tracking-tighter cursor-pointer">
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={stop.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="State observations, codes, indicators..."
              className="flex-1 bg-black/40 border border-white/5 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          {/* Photos */}
          <div className="bg-[#151518] rounded-xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                Walk Photos ({stop.photos.length})
              </span>
              {uploadingCount > 0 && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Processing {uploadingCount}...
                </span>
              )}
            </div>

            {/* Camera + Gallery buttons */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded">
                <Camera className="w-3.5 h-3.5" /> Camera
              </button>
              <button onClick={() => galleryInputRef.current?.click()}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded border border-white/10">
                <Image className="w-3.5 h-3.5" /> Gallery
              </button>
            </div>

            {/* Camera — forces live camera */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              multiple onChange={handlePhotoUpload} className="hidden" />

            {/* Gallery — photo picker only, no capture */}
            <input ref={galleryInputRef} type="file" accept="image/*"
              multiple onChange={handlePhotoUpload} className="hidden" />

            {/* Loading placeholder while uploading */}
            {uploadingCount > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {Array.from({ length: uploadingCount }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ))}
              </div>
            )}

            {/* Thumbnails */}
            {stop.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {stop.photos.map((photo) => (
                  <div key={photo.id} className="relative group bg-black/60 rounded-lg overflow-hidden border border-white/5 aspect-square">
                    <img
                      src={photo.dataUrl}
                      alt="walk photo"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                      <span className="text-[8px] font-mono text-gray-400 truncate">{photo.timestamp}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemovePhoto(photo.id); }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center border border-white/10">
                      <span className="text-xs leading-none">×</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : uploadingCount === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-6 text-center flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-[11px] text-gray-500 leading-normal max-w-[180px]">
                  Use Camera for live shots or Gallery to attach existing photos.
                </p>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71,19.5C17.88,20.74,17,21.95,15.66,22c-1.31,0-1.73-.8-3.23-.8s-2,.77-3.22.8c-1.37,0-2.32-1.27-3.15-2.47C4.38,17,3.12,12.31,4.87,9.27c.87-1.5,2.42-2.45,4.12-2.48,1.29,0,2.5,1,3.29,1C13.07,7.74,14.53,6.6,16,6.75A4.61,4.61,0,0,1,19.64,8.83a4.52,4.52,0,0,0-2.18,3.83A4.57,4.57,0,0,0,20.25,16,11.23,11.23,0,0,1,18.71,19.5M15.91,4.5a4.34,4.34,0,0,0,1-3,4.42,4.42,0,0,0-2.88,1.48,4.24,4.24,0,0,0-1,3A3.72,3.72,0,0,0,15.91,4.5Z" />
    </svg>
  );
}
