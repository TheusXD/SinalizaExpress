export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  networkNotes?: string;
  networkChecklist?: NetworkCheckItem[];
}

export interface NetworkCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface PhotoAttachment {
  id: string;
  dataUrl: string;
  caption?: string;
  timestamp: string;
}

export type WorkStatus = "planejada" | "em_andamento" | "concluida";

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
  category?: string;
}

export interface ChecklistData {
  items: SignageItem[];
  observations: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  totalStock: number;
  inUse: number;
  minStock?: number; // for low stock alerts
}

export interface CroquiElement {
  id: string;
  type: string;
  x: number;
  y: number;
  points?: number[];
  text?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  xPercent?: number;
  yPercent?: number;
}

export interface HistoryItem {
  id: string;
  workId?: string; // unique ID of the planning session to prevent duplicates
  date: string;
  location: LocationData | null;
  checklist: ChecklistData;
  responsible: string;
  croqui?: string; // Static PNG preview dataurl
  croquiElements?: CroquiElement[]; // Serialized Konva elements for re-editing
  inventorySnapshot?: InventoryItem[];
  returnedAt?: string;
  photos?: PhotoAttachment[];
  status?: WorkStatus;
}

export interface PwaState {
  currentWorkId: string; // Persistent ID for the current active work draft
  location: LocationData | null;
  checklist: ChecklistData;
  customSigns: CustomSign[];
  date: string;
  responsible: string;
  croqui?: string; // Static PNG preview dataurl
  croquiElements?: CroquiElement[]; // Serialized Konva elements
  photos?: PhotoAttachment[];
}
