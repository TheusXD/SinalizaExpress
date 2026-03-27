export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export interface SignageItem {
  id: string;
  name: string;
  quantity: number;
  isCustom?: boolean;
}

export interface CustomSign {
  id: string;
  name: string;
  description?: string;
}

export interface ChecklistData {
  items: SignageItem[];
  observations: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  location: LocationData | null;
  checklist: ChecklistData;
  responsible: string;
}

export interface PwaState {
  location: LocationData | null;
  checklist: ChecklistData;
  customSigns: CustomSign[];
  date: string;
  responsible: string;
  croqui?: string;
}
