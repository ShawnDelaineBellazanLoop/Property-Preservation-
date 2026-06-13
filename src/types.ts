/**
 * Types & Interfaces for Tooensure Property Walkthrough
 * Designed for Field Agents and Property Preservation Walkthroughs
 */

export interface WalkthroughItem {
  id: string;
  label: string;
  checked: boolean;
  category: 'occupancy' | 'exterior' | 'vacancy';
}

export interface SelectedPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
}

export interface PropertyStop {
  id: string;
  address: string;
  cityStateZip: string;
  priority: 'high' | 'normal' | 'low';
  tag: string; // "Urgent", "Estate", "Standard", "REO"
  notes: string;
  photos: SelectedPhoto[];
  items: WalkthroughItem[];
  completedAt?: string;
  delinquentAmount?: number; // For delinquency/revenue details
  inspectorName?: string;
}

export interface WalkthroughReport {
  id: string;
  date: string;
  inspector: string;
  stops: PropertyStop[];
}
