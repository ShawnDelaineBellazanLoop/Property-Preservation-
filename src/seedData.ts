import { PropertyStop } from './types';
import { makeChecklist } from './lib/checklist';

// Seed data migrated from the previous static app version.
// Used to pre-populate the walkthrough when no saved data exists yet.
export const seedStops: PropertyStop[] = [
  {
    id: 'stop_1',
    address: '1769 St Anthony Ave, St. Paul, MN 55104',
    workOrderId: 'Urgent',
    status: 'pending',
    checklist: makeChecklist(),
    notes: [
      {
        id: 'note_1_1',
        text: 'Arrived at St Anthony. Utilities seem cut off. Mailbox overflowing.',
        timestamp: '12:15 PM',
        ts: Date.now(),
      },
      {
        id: 'note_1_2',
        text: 'Priority: HIGH — Delinquent amount: $1,450.00',
        timestamp: '12:15 PM',
        ts: Date.now(),
      },
    ],
    photos: [],
    startedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stop_2',
    address: '1043 Armstrong Ave, St. Paul, MN 55102',
    workOrderId: 'Estate',
    status: 'pending',
    checklist: makeChecklist(),
    notes: [
      {
        id: 'note_2_1',
        text: 'Met with the executor representative briefly. Lawnmower present but driveway needs clearing.',
        timestamp: '1:30 PM',
        ts: Date.now(),
      },
      {
        id: 'note_2_2',
        text: 'Priority: NORMAL — Delinquent amount: $3,210.00. Door knock / contact attempt completed.',
        timestamp: '1:30 PM',
        ts: Date.now(),
      },
    ],
    photos: [],
    startedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
];
