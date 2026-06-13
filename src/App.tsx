import React, { useState, useEffect } from 'react';
import { Map, Clock, CheckCircle, ArrowLeft, Save, Download, AlertTriangle } from 'lucide-react';
import PhotoGrid from './components/PhotoGrid';
import { TemporalOrchestrator, Frame, PhotoEntry } from './types';
import { getSeedData } from './seedData';

// Checklist definitions mapped to your preservation standards
const CHECKLIST_GROUPS = [
    {
        title: "Exterior Assessment",
        items: [
            { id: "exterior_front", label: "Front of Property (Clear view)" },
            { id: "exterior_rear", label: "Rear of Property" },
            { id: "roof_condition", label: "Roof Condition / Damages" },
            { id: "yard_debris", label: "Yard Debris / Hazards Checked" }
        ]
    },
    {
        title: "Interior & Securing",
        items: [
            { id: "lockbox_installed", label: "Lockbox Installed / Verified" },
            { id: "doors_secured", label: "All Doors & Windows Secured" },
            { id: "water_shutoff", label: "Water Shutoff Verified" },
            { id: "winterization", label: "Winterization Confirmed" }
        ]
    }
];

export default function App() {
    // Load the Trail from LocalStorage or inject Seed Data
    const [trailState, setTrailState] = useState<TemporalOrchestrator>(() => {
        const saved = localStorage.getItem('pmcro-trail-state');
        return saved ? JSON.parse(saved) : getSeedData();
    });

    const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

    // Auto-save TrailState to localStorage on change (The PageHide/Visibility fix from earlier)
    useEffect(() => {
        const saveState = () => {
            localStorage.setItem('pmcro-trail-state', JSON.stringify(trailState));
        };

        saveState(); // Save on every state change normally

        // Safety flush for when camera app backgrounds the browser
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveState();
        });
        window.addEventListener('pagehide', saveState);

        return () => {
            document.removeEventListener('visibilitychange', saveState);
            window.removeEventListener('pagehide', saveState);
        };
    }, [trailState]);

    // Update a specific Frame's data within the Trail
    const updateActiveFrame = (updates: Partial<Frame>) => {
        if (!selectedFrameId) return;
        setTrailState(prev => ({
            ...prev,
            frames: prev.frames.map(frame =>
                frame.frame_id === selectedFrameId ? { ...frame, ...updates } : frame
            )
        }));
    };

    const activeFrame = trailState.frames.find(f => f.frame_id === selectedFrameId);

    // Download the JSON trail (Cognitive Asset backup)
    const downloadTrailBackup = () => {
        const blob = new Blob([JSON.stringify(trailState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trailState.runtime.trail_id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // ================= VIEW: TRAIL DASHBOARD ================= //
    if (!selectedFrameId) {
        return (
            <div className="min-h-screen bg-[#0A0A0F] text-white p-4 md:p-8 font-sans">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Identity Header */}
                    <header className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h1 className="text-2xl font-bold text-[#00FF87] mb-2">{trailState.identity.company}</h1>
                        <p className="text-gray-400">Inspector: <span className="text-white">{trailState.identity.inspector_name}</span></p>
                        <p className="text-gray-400">Role: <span className="text-white">{trailState.identity.role}</span></p>
                        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                            <span className="text-sm font-mono text-gray-500">{trailState.runtime.trail_id}</span>
                            <button onClick={downloadTrailBackup} className="text-[#00FF87] hover:underline text-sm flex items-center gap-1">
                                <Download className="w-4 h-4" /> Export Trail
                            </button>
                        </div>
                    </header>

                    <h2 className="text-xl font-bold border-b border-gray-800 pb-2">Today's Trail</h2>

                    {/* Frame List */}
                    <div className="space-y-4">
                        {trailState.frames.map((frame) => (
                            <div
                                key={frame.frame_id}
                                onClick={() => setSelectedFrameId(frame.frame_id)}
                                className={`p-5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${frame.status === 'COMPLETED' ? 'bg-gray-900 border-green-900/50 opacity-70' :
                                        frame.status === 'IN_PROGRESS' ? 'bg-gray-800 border-[#00FF87]' :
                                            'bg-gray-900 border-gray-800 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg">{frame.property_address}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${frame.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400' :
                                            frame.status === 'IN_PROGRESS' ? 'bg-[#00FF87]/20 text-[#00FF87]' :
                                                'bg-gray-800 text-gray-400'
                                        }`}>
                                        {frame.phase} • {frame.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {frame.scheduled_time}</span>
                                    <span className="flex items-center gap-1"><Map className="w-4 h-4" /> {frame.frame_id}</span>
                                </div>

                                {frame.earned_constraints.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-800/50 flex items-start gap-2 text-yellow-500/80 text-sm">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div>
                                            <strong>Constraints:</strong> {frame.earned_constraints.join(" | ")}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ================= VIEW: ACTIVE FRAME (INSPECTION) ================= //
    if (!activeFrame) return null;

    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white p-4 md:p-8 font-sans pb-32">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Frame Navigation Header */}
                <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md pt-4 pb-4 border-b border-gray-800 flex items-center justify-between">
                    <button
                        onClick={() => setSelectedFrameId(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Trail
                    </button>

                    <button
                        onClick={() => updateActiveFrame({ status: 'COMPLETED', phase: 'CHECK' })}
                        className="flex items-center gap-2 bg-[#00FF87] text-black px-4 py-2 rounded-lg font-bold hover:bg-[#00cc6a]"
                    >
                        <CheckCircle className="w-5 h-5" /> Mark Complete
                    </button>
                </header>

                {/* Frame Meta */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h1 className="text-2xl font-bold mb-2">{activeFrame.property_address}</h1>
                    <p className="text-gray-400 text-sm">Frame ID: {activeFrame.frame_id} | Scheduled: {activeFrame.scheduled_time}</p>

                    {activeFrame.earned_constraints.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
                            <h3 className="text-yellow-500 font-bold flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5" /> Frame Constraints (EC-007)
                            </h3>
                            <ul className="list-disc list-inside text-yellow-200/70 text-sm space-y-1">
                                {activeFrame.earned_constraints.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Checklist */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-[#00FF87]">Inspection Checklist</h2>
                    {CHECKLIST_GROUPS.map((group, idx) => (
                        <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-4 text-gray-300">{group.title}</h3>
                            <div className="space-y-3">
                                {group.items.map((item) => (
                                    <label key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors border border-transparent hover:border-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={!!activeFrame.checklist[item.id]}
                                            onChange={(e) => updateActiveFrame({
                                                checklist: { ...activeFrame.checklist, [item.id]: e.target.checked }
                                            })}
                                            className="mt-1 w-5 h-5 rounded border-gray-600 text-[#00FF87] focus:ring-[#00FF87] focus:ring-offset-gray-900 bg-gray-800"
                                        />
                                        <span className={`text-lg ${activeFrame.checklist[item.id] ? 'text-gray-400 line-through' : 'text-white'}`}>
                                            {item.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Field Notes */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-[#00FF87]">Field Notes</h2>
                    <textarea
                        value={activeFrame.fieldNotes}
                        onChange={(e) => updateActiveFrame({ fieldNotes: e.target.value })}
                        placeholder="Enter condition remarks, damages, or lockbox codes here..."
                        className="w-full h-32 bg-gray-900 border border-gray-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#00FF87] focus:border-transparent placeholder-gray-600 resize-none"
                    />
                </section>

                {/* Photo Capture (Integrates with your PhotoGrid & CameraCapture components) */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-[#00FF87]">Property Documentation</h2>
                    <PhotoGrid
                        photos={activeFrame.photos}
                        onAddPhoto={(photo: PhotoEntry) => updateActiveFrame({ photos: [...activeFrame.photos, photo] })}
                        onRemovePhoto={(id: string) => updateActiveFrame({ photos: activeFrame.photos.filter(p => p.id !== id) })}
                    />
                </section>

            </div>
        </div>
    );
}