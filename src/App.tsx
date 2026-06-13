import { useState, useEffect, useCallback, useRef } from 'react';
import { PropertyStop } from './types';
import { makeChecklist } from './lib/checklist';
import { seedStops } from './seedData';
import { savePhotos, loadPhotos, deleteStopPhotos } from './lib/photoStorage';
import { decodeShareState } from './lib/exportUtils';
import Header from './components/Header';
import StopCard from './components/StopCard';
import AddStopModal from './components/AddStopModal';
import EmptyState from './components/EmptyState';
import ToastStack from './components/ToastStack';
import { useToast } from './hooks/useToast';

const LS_KEY = 'tooensure-v5';
const INSPECTOR_KEY = 'tooensure-inspector-v5';

function stopsWithoutPhotos(stops: PropertyStop[]): PropertyStop[] {
  return stops.map(s => ({ ...s, photos: [] }));
}

export default function App() {
  const [stops, setStops] = useState<PropertyStop[]>([]);
  const [inspector, setInspector] = useState('Shawn');
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { toasts, toast, dismiss } = useToast();
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Keep latest state available to the visibility/pagehide flush below
  // without re-binding the listener on every change.
  const stopsRef = useRef(stops);
  const inspectorRef = useRef(inspector);
  stopsRef.current = stops;
  inspectorRef.current = inspector;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('state');
    if (stateParam) {
      const shared = decodeShareState(stateParam);
      if (shared) {
        setStops(shared.stops);
        setInspector(shared.inspector || 'Shawn');
        setPhotosLoaded(true);
        window.history.replaceState({}, '', window.location.pathname);
        toast('Loaded from shared link', 'info', '🔗');
        return;
      }
    }
    const savedInspector = localStorage.getItem(INSPECTOR_KEY);
    if (savedInspector) setInspector(savedInspector);
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed: PropertyStop[] = JSON.parse(saved);
        Promise.all(parsed.map(async stop => ({
          ...stop,
          photos: await loadPhotos(stop.id),
        }))).then(hydrated => {
          setStops(hydrated);
          setPhotosLoaded(true);
        });
      } catch { setPhotosLoaded(true); }
    } else {
      // First run — no saved data yet, pre-populate with seed stops.
      setStops(seedStops);
      setPhotosLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!photosLoaded) return;
    clearTimeout(syncTimer.current);
    setSyncState('saving');
    syncTimer.current = setTimeout(async () => {
      localStorage.setItem(LS_KEY, JSON.stringify(stopsWithoutPhotos(stops)));
      localStorage.setItem(INSPECTOR_KEY, inspector);
      await Promise.all(stops.map(s => savePhotos(s.id, s.photos)));
      setSyncState('saved');
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => setSyncState('idle'), 4000);
    }, 600);
  }, [stops, inspector, photosLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Force-flush any pending save to localStorage/IndexedDB the instant the
  // page is backgrounded — e.g. the moment the native camera app opens.
  // Android can reclaim a backgrounded tab under memory pressure, which
  // discards anything only held in React state. Flushing here means that
  // if the tab does get killed and restarted on return from the camera,
  // notes/checklist progress up to that point survive even though the
  // in-flight camera capture itself may still be lost by the OS.
  useEffect(() => {
    const flush = () => {
      if (!photosLoaded) return;
      clearTimeout(syncTimer.current);
      const currentStops = stopsRef.current;
      const currentInspector = inspectorRef.current;
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(stopsWithoutPhotos(currentStops)));
        localStorage.setItem(INSPECTOR_KEY, currentInspector);
      } catch (err) {
        console.error('[flush] localStorage write failed', err);
      }
      // Fire-and-forget — IndexedDB writes are async and may not finish
      // before the tab is suspended, but this gives them the best chance.
      Promise.all(currentStops.map(s => savePhotos(s.id, s.photos))).catch(err =>
        console.error('[flush] savePhotos failed', err)
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [photosLoaded]);

  const addStop = useCallback((address: string, workOrderId: string) => {
    const newStop: PropertyStop = {
      id: `stop-${Date.now()}`,
      address, workOrderId,
      status: 'pending',
      checklist: makeChecklist(),
      notes: [], photos: [],
      startedAt: null, completedAt: null,
      createdAt: new Date().toISOString(),
    };
    setStops(prev => [...prev, newStop]);
    setShowAddModal(false);
    toast(`Stop added: ${address}`, 'success', '📍');
  }, [toast]);

  const updateStop = useCallback((updated: PropertyStop) => {
    setStops(prev => prev.map(s => s.id === updated.id ? updated : s));
  }, []);

  const deleteStop = useCallback(async (id: string) => {
    await deleteStopPhotos(id);
    setStops(prev => prev.filter(s => s.id !== id));
    toast('Stop removed', 'info');
  }, []);

  const resetWalk = useCallback(async () => {
    await Promise.all(stops.map(s => deleteStopPhotos(s.id)));
    localStorage.removeItem(LS_KEY);
    setStops([]);
  }, [stops]);

  if (!photosLoaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dark)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--green-dim)', border: '1px solid var(--green-border)' }} />
        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <Header
        stops={stops} inspector={inspector} setInspector={setInspector}
        syncState={syncState} lastSaved={lastSaved}
        onAddStop={() => setShowAddModal(true)}
        onReset={resetWalk} toast={toast}
      />
      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        {stops.length === 0
          ? <EmptyState onAddStop={() => setShowAddModal(true)} />
          : stops.map((stop, i) => (
              <StopCard key={stop.id} stop={stop} index={i}
                onUpdate={updateStop} onDelete={deleteStop} toast={toast} />
            ))
        }
      </main>
      {showAddModal && <AddStopModal onAdd={addStop} onClose={() => setShowAddModal(false)} />}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
