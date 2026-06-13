import { useState, useEffect, useCallback, useRef } from 'react';
import { PropertyStop, TemporalOrchestrator, IdentityInjection } from './types';
import { makeChecklist } from './lib/checklist';
import { seedStops } from './seedData';
import { savePhotos, loadPhotos, deleteStopPhotos } from './lib/photoStorage';
import { decodeShareState } from './lib/exportUtils';
import { generateTextReport } from './lib/reportGenerator';
import Header from './components/Header';
import StopCard from './components/StopCard';
import AddStopModal from './components/AddStopModal';
import EmptyState from './components/EmptyState';
import ToastStack from './components/ToastStack';
import { useToast } from './hooks/useToast';

const LS_KEY = 'tooensure-v5';
const IDENTITY_KEY = 'tooensure-identity-v5';

function stopsWithoutPhotos(stops: PropertyStop[]): PropertyStop[] {
    return stops.map(s => ({ ...s, photos: [] }));
}

export default function App() {
    const [stops, setStops] = useState<PropertyStop[]>([]);

    // Identity Injection
    const [identity, setIdentity] = useState<IdentityInjection>({
        inspector_name: 'Shawn',
        role: 'A10 CR (Field Operator)',
        company: 'Tooensure LLC'
    });

    const [photosLoaded, setPhotosLoaded] = useState(false);
    const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [lastSaved, setLastSaved] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const { toasts, toast, dismiss } = useToast();
    const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const stateParam = params.get('state');

        if (stateParam) {
            const shared = decodeShareState(stateParam);
            if (shared) {
                setStops(shared.stops);
                setIdentity(prev => ({ ...prev, inspector_name: shared.inspector || 'Shawn' }));
                setPhotosLoaded(true);
                window.history.replaceState({}, '', window.location.pathname);
                toast('Loaded from shared link', 'info', '🔗');
                return;
            }
        }

        const savedId = localStorage.getItem(IDENTITY_KEY);
        if (savedId) setIdentity(JSON.parse(savedId));

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
            setStops(seedStops);
            setPhotosLoaded(true);
        }
    }, [toast]);

    useEffect(() => {
        if (!photosLoaded) return;
        clearTimeout(syncTimer.current);
        setSyncState('saving');

        syncTimer.current = setTimeout(async () => {
            localStorage.setItem(LS_KEY, JSON.stringify(stopsWithoutPhotos(stops)));
            localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
            await Promise.all(stops.map(s => savePhotos(s.id, s.photos)));
            setSyncState('saved');
            setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setTimeout(() => setSyncState('idle'), 4000);
        }, 600);
    }, [stops, identity, photosLoaded]);

    const addStop = useCallback((address: string, workOrderId: string) => {
        const newStop: PropertyStop = {
            id: `stop-${Date.now()}`,
            address, workOrderId,
            status: 'pending',
            phase: 'PLAN',
            checklist: makeChecklist(),
            notes: [], photos: [],
            startedAt: null, completedAt: null,
            createdAt: new Date().toISOString(),
        };
        setStops(prev => [...prev, newStop]);
        setShowAddModal(false);
        toast(`Frame added: ${address}`, 'success', '📍');
    }, [toast]);

    const updateStop = useCallback((updated: PropertyStop) => {
        setStops(prev => prev.map(s => s.id === updated.id ? updated : s));
    }, []);

    const deleteStop = useCallback(async (id: string) => {
        if (!confirm("Remove this stop?")) return;
        await deleteStopPhotos(id);
        setStops(prev => prev.filter(s => s.id !== id));
        toast('Frame removed', 'info');
    }, [toast]);

    const resetWalk = useCallback(async () => {
        if (!confirm("CRITICAL: Wipe all data and photos?")) return;
        await Promise.all(stops.map(s => deleteStopPhotos(s.id)));
        localStorage.removeItem(LS_KEY);
        setStops([]);
        toast('Data wiped', 'info');
    }, [stops, toast]);

    // ACTION: High-Fidelity Text Report
    const downloadTextReport = useCallback(() => {
        const reportText = generateTextReport(stops, identity);
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report-${identity.inspector_name}-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        toast('Text Report Downloaded', 'success', '📄');
    }, [stops, identity, toast]);

    // ACTION: JSON Cognitive Asset
    const exportAsset = useCallback(() => {
        const asset: TemporalOrchestrator = {
            runtime: { version: "2.0.0", trail_id: `TRAIL-${Date.now()}`, date: new Date().toISOString() },
            identity,
            frames: stops
        };
        const blob = new Blob([JSON.stringify(asset, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Asset-${identity.inspector_name}.json`;
        a.click();
        toast('Cognitive Asset Exported', 'success', '💾');
    }, [identity, stops, toast]);

    if (!photosLoaded) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dark)' }}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--green-dim)', border: '1px solid var(--green-border)' }} />
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Syncing Trail...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
            <Header
                stops={stops}
                inspector={identity.inspector_name}
                setInspector={(name) => setIdentity(prev => ({ ...prev, inspector_name: name }))}
                syncState={syncState}
                lastSaved={lastSaved}
                onAddStop={() => setShowAddModal(true)}
                onReset={resetWalk}
                onExportAsset={exportAsset}
                onDownloadReport={downloadTextReport}
                toast={toast}
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