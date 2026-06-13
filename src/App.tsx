import React, { useState, useEffect } from 'react';
import { PropertyStop } from './types';
import { defaultStops } from './data';
import { decodeWalkthroughState } from './utils';
import { savePhotos, loadAllPhotos, deletePhotos } from './photoStorage';
import HeaderBar from './components/HeaderBar';
import SummaryStats from './components/SummaryStats';
import PropertyCard from './components/PropertyCard';
import AddStopDialog from './components/AddStopDialog';
import { 
  Building2, 
  Sparkles, 
  Search, 
  MapPin, 
  AlertCircle, 
  CheckCheck,
  ChevronRight,
  Info,
  X,
  RefreshCw,
  Github
} from 'lucide-react';

const STORAGE_KEY_STOPS = 'tooensure_walkthrough_stops';
const STORAGE_KEY_INSPECTOR = 'tooensure_walkthrough_inspector';

/** Strip photos from stops before saving to localStorage — photos live in IndexedDB */
function stopsWithoutPhotos(stops: PropertyStop[]): PropertyStop[] {
  return stops.map(s => ({ ...s, photos: [] }));
}

export default function App() {
  const [stops, setStops] = useState<PropertyStop[]>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [inspectorName, setInspectorName] = useState('Shawn');
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sharedState, setSharedState] = useState<{ stops: PropertyStop[]; inspector: string } | null>(null);
  const [showSharedNotice, setShowSharedNotice] = useState(false);

  // 1. Initial load — stops from localStorage, photos from IndexedDB
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedParam = params.get('state');
    if (sharedParam) {
      const decoded = decodeWalkthroughState(sharedParam);
      if (decoded && decoded.stops && decoded.stops.length > 0) {
        setSharedState(decoded);
        setShowSharedNotice(true);
      }
    }

    const localStops = localStorage.getItem(STORAGE_KEY_STOPS);
    const localInspector = localStorage.getItem(STORAGE_KEY_INSPECTOR);
    if (localInspector) setInspectorName(localInspector);

    let baseStops: PropertyStop[];
    try {
      baseStops = localStops ? JSON.parse(localStops) : defaultStops;
    } catch {
      baseStops = defaultStops;
    }

    // Hydrate photos from IndexedDB
    const stopIds = baseStops.map(s => s.id);
    loadAllPhotos(stopIds).then(photoMap => {
      const hydrated = baseStops.map(s => ({
        ...s,
        photos: photoMap[s.id] ?? [],
      }));
      setStops(hydrated);
      setPhotosLoaded(true);
    });
  }, []);

  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState('Active');

  useEffect(() => {
    if (stops.length === 0 || !photosLoaded) return;
    setSyncState('syncing');
    const timer = setTimeout(() => {
      setSyncState('synced');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(timeStr);
    }, 1200);
    return () => clearTimeout(timer);
  }, [stops, inspectorName]);

  // 2. Save — checklist/notes to localStorage, photos to IndexedDB
  const saveStopsToStorage = (newStops: PropertyStop[]) => {
    setStops(newStops);
    // Save without photos to localStorage (avoid 5MB quota)
    localStorage.setItem(STORAGE_KEY_STOPS, JSON.stringify(stopsWithoutPhotos(newStops)));
    // Save each stop's photos to IndexedDB
    newStops.forEach(stop => {
      savePhotos(stop.id, stop.photos);
    });
  };

  const handleUpdateInspector = (name: string) => {
    setInspectorName(name);
    localStorage.setItem(STORAGE_KEY_INSPECTOR, name);
  };

  const handleUpdateStop = (updatedStop: PropertyStop) => {
    const updated = stops.map(s => s.id === updatedStop.id ? updatedStop : s);
    saveStopsToStorage(updated);
  };

  const handleDeleteStop = (stopId: string) => {
    const updated = stops.filter(s => s.id !== stopId);
    deletePhotos(stopId);
    saveStopsToStorage(updated);
  };

  const handleAddStop = (newStop: PropertyStop) => {
    const updated = [newStop, ...stops];
    saveStopsToStorage(updated);
  };

  const handleResetWalk = () => {
    localStorage.removeItem(STORAGE_KEY_STOPS);
    // Clear photos for all current stops
    stops.forEach(s => deletePhotos(s.id));
    setStops(defaultStops);
    setSearchQuery('');
    setActiveFilter('all');
  };

  const handleImportSharedState = () => {
    if (sharedState) {
      saveStopsToStorage(sharedState.stops);
      handleUpdateInspector(sharedState.inspector);
      setShowSharedNotice(false);
      setSharedState(null);
      window.history.pushState({}, document.title, window.location.pathname);
    }
  };

  const handleDeclineSharedState = () => {
    setShowSharedNotice(false);
    setSharedState(null);
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const filteredStops = stops.filter((stop) => {
    if (activeFilter === 'high' && stop.priority !== 'high') return false;
    if (activeFilter === 'incomplete') {
      const isCompleted = stop.items.length > 0 && stop.items.every(i => i.checked);
      if (isCompleted) return false;
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        stop.address.toLowerCase().includes(query) ||
        stop.cityStateZip.toLowerCase().includes(query) ||
        stop.tag.toLowerCase().includes(query) ||
        (stop.inspectorName || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e2e8f0] flex flex-col selection:bg-emerald-500 selection:text-black font-sans pb-12">
      
      {showSharedNotice && sharedState && (
        <div className="bg-[#0f0f12] border-b border-emerald-500/30 p-4 sticky top-0 z-50 backdrop-blur-md text-white shadow-2xl">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Info className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  📥 Shared Walkthrough State Retrieved
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Shared by <span className="text-white font-bold">{sharedState.inspector || 'Field Agent'}</span> containing <span className="text-white font-bold">{sharedState.stops.length} property stop(s)</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="import-shared-confirm"
                onClick={handleImportSharedState}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-4 py-2 rounded transition-all cursor-pointer shadow-lg"
              >
                Import / Replace State
              </button>
              <button
                id="import-shared-cancel"
                onClick={handleDeclineSharedState}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-2 rounded text-xs font-bold transition-all cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <HeaderBar 
        stops={stops}
        inspectorName={inspectorName}
        setInspectorName={handleUpdateInspector}
        onOpenAddStop={() => setIsAddStopOpen(true)}
        onResetWalk={handleResetWalk}
        syncState={syncState}
        lastSyncTime={lastSyncTime}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 flex-grow w-full">
        
        <SummaryStats 
          stops={stops}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <div className="glass-panel p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center gap-4 border-white/10 shadow-lg select-none">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-walk-input"
              type="text"
              placeholder="Search by address or category tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/30 border border-white/5 hover:border-white/10 rounded pl-9 pr-8 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
            />
            {searchQuery && (
              <button 
                id="clear-search"
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
            <span className="text-[10px] tracking-[0.15em] text-gray-500 font-bold uppercase font-heading">
              Quick Tags:
            </span>
            {['Urgent', 'Estate', 'Standard'].map(keyword => (
              <button
                key={keyword}
                onClick={() => setSearchQuery(keyword)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer ${
                  searchQuery === keyword ? 'text-emerald-400 border-emerald-500/30' : 'text-gray-400'
                }`}
              >
                #{keyword}
              </button>
            ))}
          </div>
        </div>

        {filteredStops.length > 0 ? (
          <div className="space-y-6">
            {filteredStops.map((stop) => (
              <PropertyCard
                key={stop.id}
                stop={stop}
                onUpdateStop={handleUpdateStop}
                onDeleteStop={handleDeleteStop}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#151518] rounded-xl p-16 text-center border-dashed border-white/10 flex flex-col items-center justify-center max-w-xl mx-auto mt-8 animate-in fade-in-60 duration-300">
            <Building2 className="w-12 h-12 text-gray-650 mb-4" />
            <h3 className="font-heading text-lg font-bold text-white mb-2">No Matching Stops Listed</h3>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-6">
              There are no property stops matching the selected filters or search queries in your active walkthrough checklist.
            </p>
            <div className="flex items-center gap-3">
              <button
                id="empty-state-reset"
                onClick={handleResetWalk}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
              >
                Reload Default Stops
              </button>
              <button
                id="empty-state-add"
                onClick={() => setIsAddStopOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded transition-all cursor-pointer"
              >
                Add Custom Address
              </button>
            </div>
          </div>
        )}

      </main>

      <AddStopDialog 
        isOpen={isAddStopOpen}
        onAddStop={handleAddStop}
        onClose={() => setIsAddStopOpen(false)}
      />

      {/* Syncing toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform w-[90%] max-w-sm px-4 ${
        syncState === 'syncing' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}>
        <div className="bg-[#151518]/95 border border-cyan-500/30 text-cyan-400 px-4 py-3 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),_0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-wider leading-none">Saving locally</span>
              <p className="text-white text-[11px] truncate mt-0.5 font-medium leading-tight">Saving walkthrough data...</p>
            </div>
          </div>
          <span className="text-[10px] bg-cyan-950/80 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-400 font-mono">SAVING</span>
        </div>
      </div>

      {/* Saved toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform w-[90%] max-w-sm px-4 ${
        syncState === 'synced' && lastSyncTime !== 'Active' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}>
        <div className="bg-[#151518]/95 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),_0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider leading-none">Saved to device</span>
              <p className="text-white text-[11px] truncate mt-0.5 font-medium leading-tight">Photos + data saved locally</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 font-mono">{lastSyncTime}</span>
        </div>
      </div>

    </div>
  );
}
