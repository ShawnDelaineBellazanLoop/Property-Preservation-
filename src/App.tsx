import React, { useState, useEffect } from 'react';
import { PropertyStop } from './types';
import { defaultStops } from './data';
import { decodeWalkthroughState } from './utils';
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
  X
} from 'lucide-react';

const STORAGE_KEY_STOPS = 'tooensure_walkthrough_stops';
const STORAGE_KEY_INSPECTOR = 'tooensure_walkthrough_inspector';

export default function App() {
  const [stops, setStops] = useState<PropertyStop[]>([]);
  const [inspectorName, setInspectorName] = useState('Shawn');
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // URL Share incoming state management
  const [sharedState, setSharedState] = useState<{ stops: PropertyStop[]; inspector: string } | null>(null);
  const [showSharedNotice, setShowSharedNotice] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    // A. Check for shared state in URL first
    const params = new URLSearchParams(window.location.search);
    const sharedParam = params.get('state');
    
    if (sharedParam) {
      const decoded = decodeWalkthroughState(sharedParam);
      if (decoded && decoded.stops && decoded.stops.length > 0) {
        setSharedState(decoded);
        setShowSharedNotice(true);
      }
    }

    // B. Load active local session
    const localStops = localStorage.getItem(STORAGE_KEY_STOPS);
    const localInspector = localStorage.getItem(STORAGE_KEY_INSPECTOR);

    if (localStops) {
      try {
        setStops(JSON.parse(localStops));
      } catch (err) {
        setStops(defaultStops);
      }
    } else {
      setStops(defaultStops);
    }

    if (localInspector) {
      setInspectorName(localInspector);
    }
  }, []);

  // 2. Persistent saves across modifications
  const saveStopsToStorage = (newStops: PropertyStop[]) => {
    setStops(newStops);
    localStorage.setItem(STORAGE_KEY_STOPS, JSON.stringify(newStops));
  };

  const handleUpdateInspector = (name: string) => {
    setInspectorName(name);
    localStorage.setItem(STORAGE_KEY_INSPECTOR, name);
  };

  // 3. User operations handlers
  const handleUpdateStop = (updatedStop: PropertyStop) => {
    const updated = stops.map(s => s.id === updatedStop.id ? updatedStop : s);
    saveStopsToStorage(updated);
  };

  const handleDeleteStop = (stopId: string) => {
    const updated = stops.filter(s => s.id !== stopId);
    saveStopsToStorage(updated);
  };

  const handleAddStop = (newStop: PropertyStop) => {
    const updated = [newStop, ...stops];
    saveStopsToStorage(updated);
  };

  const handleResetWalk = () => {
    // Empty local Storage & reload defaults
    localStorage.removeItem(STORAGE_KEY_STOPS);
    setStops(defaultStops);
    setSearchQuery('');
    setActiveFilter('all');
  };

  // 4. Shared State Operations
  const handleImportSharedState = () => {
    if (sharedState) {
      saveStopsToStorage(sharedState.stops);
      handleUpdateInspector(sharedState.inspector);
      setShowSharedNotice(false);
      setSharedState(null);
      // Clean query parameter from URL to prevent infinite loading notices
      window.history.pushState({}, document.title, window.location.pathname);
    }
  };

  const handleDeclineSharedState = () => {
    setShowSharedNotice(false);
    setSharedState(null);
    window.history.pushState({}, document.title, window.location.pathname);
  };

  // 5. Query Searching and Filtering
  const filteredStops = stops.filter((stop) => {
    // A. Apply standard priority filters
    if (activeFilter === 'high' && stop.priority !== 'high') {
      return false;
    }
    if (activeFilter === 'incomplete') {
      const isCompleted = stop.items.length > 0 && stop.items.every(i => i.checked);
      if (isCompleted) return false;
    }

    // B. Search Query filter (address, priority or tag keyword matches)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchAddress = stop.address.toLowerCase().includes(query);
      const matchCity = stop.cityStateZip.toLowerCase().includes(query);
      const matchTag = stop.tag.toLowerCase().includes(query);
      const matchInspector = (stop.inspectorName || '').toLowerCase().includes(query);
      
      return matchAddress || matchCity || matchTag || matchInspector;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e2e8f0] flex flex-col selection:bg-emerald-500 selection:text-black font-sans pb-12">
      
      {/* Shared Walk Import banner */}
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

      {/* Corporate sticky header */}
      <HeaderBar 
        stops={stops}
        inspectorName={inspectorName}
        setInspectorName={handleUpdateInspector}
        onOpenAddStop={() => setIsAddStopOpen(true)}
        onResetWalk={handleResetWalk}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 flex-grow w-full">
        
        {/* Dynamic Aggregations Cards */}
        <SummaryStats 
          stops={stops}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {/* Action Panel: Search Filter bar */}
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

        {/* Property cards dynamic container stack */}
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

      {/* Add stop custom drawer dialog overlay */}
      <AddStopDialog 
        isOpen={isAddStopOpen}
        onAddStop={handleAddStop}
        onClose={() => setIsAddStopOpen(false)}
      />

    </div>
  );
}
