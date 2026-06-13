import { TemporalOrchestrator } from './types';

export const getSeedData = (): TemporalOrchestrator => ({
    runtime: {
        version: "2.0.0",
        trail_id: "TRAIL-2026-06-13-A10CR",
        date: "2026-06-13"
    },
    identity: {
        inspector_name: "Shawn",
        role: "A10 CR (Field Operator)",
        company: "Tooensure LLC"
    },
    frames: [
        {
            frame_id: "FRAME-001",
            property_address: "554 Central Ave W",
            scheduled_time: "09:00 AM",
            phase: "CHECK",
            status: "COMPLETED",
            earned_constraints: ["Gate code is 1234", "Use side door"],
            notes: "Initial plan validated. Prep completed.",
            checklist: { "exterior_front": true, "exterior_rear": true, "roof_condition": true },
            photos: [],
            fieldNotes: "Property secured. No issues found during morning check."
        },
        {
            frame_id: "FRAME-002",
            property_address: "1769 St Anthony Ave",
            scheduled_time: "10:30 AM",
            phase: "MAKE",
            status: "IN_PROGRESS",
            earned_constraints: ["Beware of dog in backyard - confirm secured"],
            notes: "Field data collection active.",
            checklist: {},
            photos: [],
            fieldNotes: ""
        },
        {
            frame_id: "FRAME-003",
            property_address: "1280 Suburbia Ln",
            scheduled_time: "01:00 PM",
            phase: "PLAN",
            status: "PENDING",
            earned_constraints: ["Winterization photos required per client"],
            notes: "Awaiting arrival.",
            checklist: {},
            photos: [],
            fieldNotes: ""
        }
    ]
});