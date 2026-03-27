"use client";

import { useState, useEffect } from "react";
import localforage from "localforage";
import type { PwaState, LocationData, ChecklistData, CustomSign, HistoryItem } from "@/types";

const STORAGE_KEY = "@controle_placas_state";

const defaultChecklist: ChecklistData = {
  items: [
    { id: "std-1", name: "Placa 'Homens Trabalhando'", quantity: 0, isCustom: false },
    { id: "std-2", name: "Cones", quantity: 0, isCustom: false },
    { id: "std-3", name: "Cavaletes", quantity: 0, isCustom: false },
    { id: "std-4", name: "Desvio de tráfego", quantity: 0, isCustom: false },
    { id: "std-5", name: "Sinalização noturna", quantity: 0, isCustom: false },
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localForage
  useEffect(() => {
    localforage.getItem("sinaliza_history").then((val) => {
      if (val) setHistory(val as HistoryItem[]);
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
          date: new Date().toISOString(), // Update to current date on user session restore
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

  const clearState = () => {
    const newState = { ...initialState, customSigns: state.customSigns, date: new Date().toISOString() };
    setState(newState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveToHistory = async () => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      location: state.location,
      checklist: state.checklist,
      responsible: state.responsible,
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
    },
  };
}
