export interface PhotoEntry {
    id: string;
    dataUrl: string;
    timestamp: number;
}

export type PhaseType = 'PLAN' | 'MAKE' | 'CHECK' | 'REFLECT' | 'ORCHESTRATE';
export type StatusType = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';

export interface Frame {
    frame_id: string;
    property_address: string;
    scheduled_time: string;
    phase: PhaseType;
    status: StatusType;
    earned_constraints: string[];
    notes: string;

    // App-specific field data
    checklist: Record<string, boolean>;
    photos: PhotoEntry[];
    fieldNotes: string;
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
    frames: Frame[];
}