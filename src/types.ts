export interface PhotoEntry {
    id: string;
    dataUrl: string;
    timestamp: number;
}

export interface PropertyStop {
    id: string;
    address: string;
    workOrderId: string;
    status: 'pending' | 'started' | 'completed';

    // PMCRO Lifecycle fields
    phase?: 'PLAN' | 'MAKE' | 'CHECK' | 'REFLECT';
    earned_constraints?: string[];

    checklist: Record<string, boolean>;
    notes: string[];
    photos: PhotoEntry[];
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
}

export interface IdentityInjection {
    inspector_name: string;
    role: string;
    company: string;
}

export interface TemporalOrchestrator {
    runtime: {
        version: string;
        trail_id: string;
        date: string;
    };
    identity: IdentityInjection;
    frames: PropertyStop[];
}