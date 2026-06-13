import { PropertyStop } from './types';
import { makeChecklist } from './lib/checklist';

export const seedStops: PropertyStop[] = [
    {
        id: 'seed-1',
        address: '554 Central Ave W, St Paul, MN',
        workOrderId: 'WO-9901',
        status: 'pending',
        phase: 'PLAN',
        earned_constraints: ["Gate code 1234", "Side door access only"],
        checklist: makeChecklist(),
        notes: [],
        photos: [],
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'seed-2',
        address: '1769 St Anthony Ave, St Paul, MN',
        workOrderId: 'WO-9902',
        status: 'pending',
        phase: 'MAKE',
        earned_constraints: ["Beware of dog in rear"],
        checklist: makeChecklist(),
        notes: [],
        photos: [],
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
    }
];