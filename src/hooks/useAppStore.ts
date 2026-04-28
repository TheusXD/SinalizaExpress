"use client";

import { useState, useEffect } from "react";
import localforage from "localforage";
import type { PwaState, LocationData, ChecklistData, CustomSign, HistoryItem, InventoryItem, SignageItem } from "@/types";

const STORAGE_KEY = "@controle_placas_state";

const defaultChecklist: ChecklistData = {
  items: [
    { id: "std-1", name: "Placa 'Homens Trabalhando'", quantity: 0, isCustom: false },
    { id: "std-2", name: "Cones", quantity: 0, isCustom: false },
    { id: "std-3", name: "Cavaletes", quantity: 0, isCustom: false },
    { id: "std-4", name: "Desvio de tráfego", quantity: 0, isCustom: false },
    { id: "std-5", name: "Sinalização noturna", quantity: 0, isCustom: false },
    { id: "std-6", name: "Placa Estreitamento de Via", quantity: 0, isCustom: false },
    { id: "std-7", name: "Placa Vala Aberta", quantity: 0, isCustom: false },
    { id: "std-8", name: "Placa Limite de Velocidade", quantity: 0, isCustom: false },
    { id: "std-9", name: "Placa PARE/SIGA", quantity: 0, isCustom: false },
    { id: "std-10", name: "Placa Institucional", quantity: 0, isCustom: false },
    { id: "std-11", name: "Cerquite / Tapume", quantity: 0, isCustom: false },
    { id: "std-12", name: "Fita Zebrada", quantity: 0, isCustom: false },
    { id: "std-13", name: "Super Cone (750mm)", quantity: 0, isCustom: false },
    { id: "std-14", name: "Sinalizador Luminoso", quantity: 0, isCustom: false },
    { id: "std-15", name: "Veículo / Caminhão Barreira", quantity: 0, isCustom: false },
  ],
  observations: "",
};

const initialState: PwaState = {
  location: null,
  checklist: defaultChecklist,
  customSigns: [],
  date: new Date().toISOString(),
  responsible: "",
  croqui: undefined,
};

export function useAppStore() {
  const [state, setState] = useState<PwaState>(initialState);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history and inventory from localForage
  useEffect(() => {
    localforage.getItem("sinaliza_history").then((val) => {
      if (val) setHistory(val as HistoryItem[]);
    });
    localforage.getItem("sinaliza_inventory").then((val) => {
      if (val) setInventory(val as InventoryItem[]);
    });
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored) as PwaState;
        
        // Merge missing standard items if the data structure changed
        const loadedItems = parsedState.checklist?.items || [];
        const mergedItems = [...defaultChecklist.items];
        
        loadedItems.forEach(loadedItem => {
          const index = mergedItems.findIndex(i => i.id === loadedItem.id);
          if (index !== -1) {
            mergedItems[index] = loadedItem;
          } else {
            mergedItems.push(loadedItem);
          }
        });

        setState({
          ...initialState,
          ...parsedState,
          date: parsedState.date || new Date().toISOString(), // Preserve original date
          checklist: {
            ...parsedState.checklist,
            items: mergedItems,
          }
        });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Actions
  const setLocation = (location: LocationData) => {
    setState(s => ({ ...s, location }));
  };

  const updateChecklistItem = (id: string, quantity: number) => {
    setState(s => ({
      ...s,
      checklist: {
        ...s.checklist,
        items: s.checklist.items.map(item =>
          item.id === id ? { ...item, quantity } : item
        ),
      },
    }));
  };

  const setObservations = (obs: string) => {
    setState(s => ({
      ...s,
      checklist: {
        ...s.checklist,
        observations: obs,
      },
    }));
  };

  const setResponsible = (name: string) => {
    setState(s => ({ ...s, responsible: name }));
  };

  const setCroqui = (dataUrl: string | null) => {
    setState(s => ({ ...s, croqui: dataUrl ?? undefined }));
  };

  const addCustomSign = (sign: Omit<CustomSign, "id">) => {
    const newSign: CustomSign = {
      ...sign,
      id: `custom-${crypto.randomUUID()}`,
    };
    
    setState(s => ({
      ...s,
      customSigns: [...s.customSigns, newSign],
      checklist: {
        ...s.checklist,
        items: [
          ...s.checklist.items,
          { id: newSign.id, name: newSign.name, quantity: 0, isCustom: true }
        ]
      }
    }));
  };

  const removeCustomSign = (id: string) => {
    setState(s => ({
      ...s,
      customSigns: s.customSigns.filter(sign => sign.id !== id),
      checklist: {
        ...s.checklist,
        items: s.checklist.items.filter(item => item.id !== id),
      }
    }));
  };

  const upsertInventoryItem = async (id: string, name: string, totalStock: number) => {
    const newInventory = [...inventory];
    const existingIndex = newInventory.findIndex(item => item.id === id);

    if (existingIndex !== -1) {
      const existing = newInventory[existingIndex];
      // never reduce below inUse
      const updatedStock = Math.max(existing.inUse, totalStock);
      newInventory[existingIndex] = { ...existing, name, totalStock: updatedStock };
    } else {
      newInventory.push({ id, name, totalStock, inUse: 0 });
    }

    setInventory(newInventory);
    await localforage.setItem("sinaliza_inventory", newInventory);
  };

  const removeInventoryItem = async (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (item && item.inUse > 0) {
      return false; // blocks removal
    }
    const newInventory = inventory.filter(i => i.id !== id);
    setInventory(newInventory);
    await localforage.setItem("sinaliza_inventory", newInventory);
    return true;
  };

  const getAvailable = (id: string): number => {
    const item = inventory.find(i => i.id === id);
    if (!item) return Infinity;
    return item.totalStock - item.inUse;
  };

  const commitChecklistToInventory = async (items: SignageItem[]) => {
    const newInventory = [...inventory];
    let hasChanges = false;

    // Check availability first
    for (const item of items) {
      if (item.quantity > 0) {
        const invItem = newInventory.find(i => i.id === item.id);
        if (invItem) {
          const available = invItem.totalStock - invItem.inUse;
          if (available < item.quantity) {
            throw new Error(`Estoque insuficiente para: ${item.name}. Disponível: ${available}, Solicitado: ${item.quantity}`);
          }
        }
      }
    }

    // Apply changes
    for (const item of items) {
      if (item.quantity > 0) {
        const invIndex = newInventory.findIndex(i => i.id === item.id);
        if (invIndex !== -1) {
          newInventory[invIndex] = {
            ...newInventory[invIndex],
            inUse: newInventory[invIndex].inUse + item.quantity
          };
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      setInventory(newInventory);
      await localforage.setItem("sinaliza_inventory", newInventory);
    }
    return newInventory;
  };

  const returnInventory = async (historyItemId: string) => {
    const historyItemIndex = history.findIndex(h => h.id === historyItemId);
    if (historyItemIndex === -1) return;
    const historyItem = history[historyItemIndex];

    if (historyItem.returnedAt) return; // already returned

    const newInventory = [...inventory];
    let hasChanges = false;

    historyItem.checklist.items.forEach(item => {
      if (item.quantity > 0) {
        const invIndex = newInventory.findIndex(i => i.id === item.id);
        if (invIndex !== -1) {
          newInventory[invIndex] = {
            ...newInventory[invIndex],
            inUse: Math.max(0, newInventory[invIndex].inUse - item.quantity)
          };
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setInventory(newInventory);
      await localforage.setItem("sinaliza_inventory", newInventory);
    }

    const newHistory = [...history];
    newHistory[historyItemIndex] = {
      ...historyItem,
      returnedAt: new Date().toISOString()
    };
    setHistory(newHistory);
    await localforage.setItem("sinaliza_history", newHistory);
  };

  const clearState = () => {
    const newState = { ...initialState, customSigns: state.customSigns, date: new Date().toISOString() };
    setState(newState);
    setTimeout(() => localStorage.removeItem(STORAGE_KEY), 0);
  };

  const saveToHistory = async () => {
    // 1. Commit inventory changes
    let currentInventorySnapshot = inventory;
    try {
      currentInventorySnapshot = await commitChecklistToInventory(state.checklist.items);
    } catch (error) {
      throw error; // Let the caller handle it
    }

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      location: state.location,
      checklist: state.checklist,
      croqui: state.croqui,
      responsible: state.responsible,
      inventorySnapshot: [...currentInventorySnapshot],
    };
    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    await localforage.setItem("sinaliza_history", newHistory);
  };

  const removeFromHistory = async (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    await localforage.setItem("sinaliza_history", newHistory);
  };

  return {
    state,
    history,
    inventory,
    isLoaded,
    actions: {
      setLocation,
      updateChecklistItem,
      setObservations,
      addCustomSign,
      removeCustomSign,
      setResponsible,
      setCroqui,
      saveToHistory,
      removeFromHistory,
      clearState,
      upsertInventoryItem,
      removeInventoryItem,
      getAvailable,
      commitChecklistToInventory,
      returnInventory,
    },
  };
}
