export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: string;
}

export interface FieldNote {
  id: string;
  text: string;
  timestamp: string;
  ts: number;
}

export interface PhotoEntry {
  id: string;
  dataUrl: string;
  thumb: string;
  name: string;
  size: number;
  capturedAt: string;
  ts: number;
}

export interface PropertyStop {
  id: string;
  address: string;
  workOrderId: string;
  status: 'pending' | 'in-progress' | 'complete';
  checklist: ChecklistItem[];
  notes: FieldNote[];
  photos: PhotoEntry[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export type SyncState = 'idle' | 'saving' | 'saved';

export interface WalkthroughState {
  stops: PropertyStop[];
  inspector: string;
  version: string;
}
