import { PropertyStop, WalkthroughItem } from './types';

export const createDefaultChecklist = (): WalkthroughItem[] => [
  // Category 1: Occupancy Check
  { id: 'occ_1', label: 'Check for newspaper/mail pile-up or flyers on door handle', checked: false, category: 'occupancy' },
  { id: 'occ_2', label: 'Verify utilities active status (electric meter active, water supply)', checked: false, category: 'occupancy' },
  { id: 'occ_3', label: 'Check window coverings (open, closed, blinds damaged, empty look)', checked: false, category: 'occupancy' },
  { id: 'occ_4', label: 'Perform door knock and contact attempt (verify quiet/active tenancy)', checked: false, category: 'occupancy' },
  { id: 'occ_5', label: 'Confirm presence of personal property or vehicles in driveway', checked: false, category: 'occupancy' },

  // Category 2: Exterior Check
  { id: 'ext_1', label: 'Lawn yard maintenance status (excessive height, citations risk)', checked: false, category: 'exterior' },
  { id: 'ext_2', label: 'Debris/accumulation on driveway, porch, or yards', checked: false, category: 'exterior' },
  { id: 'ext_3', label: 'Verify windows are fully intact, locks intact, doors secure', checked: false, category: 'exterior' },
  { id: 'ext_4', label: 'Exterior building damage check (roof sagging, siding loose, gutters)', checked: false, category: 'exterior' },
  { id: 'ext_5', label: 'Inspect secondary outbuildings (sheds, garages, barns secure)', checked: false, category: 'exterior' },

  // Category 3: Vacancy Indicators & Postings
  { id: 'vac_1', label: 'Check lockbox presence or verify contractor door access code', checked: false, category: 'vacancy' },
  { id: 'vac_2', label: 'Place required door hanger or informational calling card', checked: false, category: 'vacancy' },
  { id: 'vac_3', label: 'Attempt neighbor inquiry for confirmation updates (take notes)', checked: false, category: 'vacancy' },
  { id: 'vac_4', label: 'Locate or check for posted legal delinquency/winterization tags', checked: false, category: 'vacancy' },
  { id: 'vac_5', label: 'Check for safety hazards (odor, water leaks, mold, insect infestation)', checked: false, category: 'vacancy' },
];

export const defaultStops: PropertyStop[] = [
  {
    id: 'stop_1',
    address: '1769 St Anthony Ave',
    cityStateZip: 'St. Paul, MN 55104',
    priority: 'high',
    tag: 'Urgent',
    notes: '[12:15 PM] Arrived at St Anthony. Utilities seem cut off. Mailbox overflowing.',
    photos: [],
    items: createDefaultChecklist(),
    delinquentAmount: 1450.00,
    inspectorName: 'Shawn',
  },
  {
    id: 'stop_2',
    address: '1043 Armstrong Ave',
    cityStateZip: 'St. Paul, MN 55102',
    priority: 'normal',
    tag: 'Estate',
    notes: '[1:30 PM] Met with the executor executor representative briefly. Lawnmower present but driveway needs clearing.',
    photos: [],
    items: createDefaultChecklist().map(item => 
      item.id === 'occ_4' ? { ...item, checked: true } : item
    ),
    delinquentAmount: 3210.00,
    inspectorName: 'Shawn',
  }
];
