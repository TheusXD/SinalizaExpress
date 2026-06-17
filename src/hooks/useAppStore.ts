"use client";

import { useState, useEffect } from "react";
import localforage from "localforage";
import type { PwaState, LocationData, ChecklistData, CustomSign, HistoryItem, InventoryItem, SignageItem, CroquiElement, NetworkCheckItem, PhotoAttachment, WorkStatus } from "@/types";

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
  currentWorkId: "",
  location: null,
  checklist: defaultChecklist,
  customSigns: [],
  date: new Date().toISOString(),
  responsible: "",
  croqui: undefined,
  croquiElements: [],
  photos: [],
};

export function useAppStore() {
  const [state, setState] = useState<PwaState>(initialState);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state, history and inventory on mount, then run migration
  useEffect(() => {
    const loadAndMigrate = async () => {
      try {
        const historyVal = (await localforage.getItem("sinaliza_history")) as HistoryItem[] || [];
        const inventoryVal = (await localforage.getItem("sinaliza_inventory")) as InventoryItem[] || [];
        const stored = localStorage.getItem(STORAGE_KEY);
        
        let parsedState: PwaState | null = null;
        if (stored) {
          try {
            parsedState = JSON.parse(stored) as PwaState;
          } catch (e) {
            console.error("Failed to parse stored state:", e);
          }
        }

        // Initialize state, generating a currentWorkId if missing
        const activeState = parsedState || {
          ...initialState,
          currentWorkId: crypto.randomUUID(),
        };

        if (!activeState.currentWorkId) {
          activeState.currentWorkId = crypto.randomUUID();
        }

        // --- MIGRATION ROUTINE FOR LEGACY CUSTOM SIGN IDs ---
        let migrated = false;
        const updatedCustomSigns = [...(activeState.customSigns || [])];
        let updatedInventory = [...inventoryVal];
        let updatedHistory = [...historyVal];
        let updatedChecklistItems = [...(activeState.checklist?.items || [])];

        // Match custom signs and inventory items by case-insensitive name and unify IDs
        updatedCustomSigns.forEach((sign) => {
          const invMatch = updatedInventory.find(
            inv => inv.name.toLowerCase() === sign.name.toLowerCase() && inv.id !== sign.id
          );
          if (invMatch) {
            const oldId = invMatch.id;
            const newId = sign.id;

            // Update inventory ID
            updatedInventory = updatedInventory.map(inv => inv.id === oldId ? { ...inv, id: newId } : inv);

            // Update history item checklists and snapshots
            updatedHistory = updatedHistory.map(h => {
              const checklistItems = h.checklist.items.map(item => item.id === oldId ? { ...item, id: newId } : item);
              const snapshot = h.inventorySnapshot?.map(inv => inv.id === oldId ? { ...inv, id: newId } : inv);
              return {
                ...h,
                checklist: { ...h.checklist, items: checklistItems },
                inventorySnapshot: snapshot
              };
            });

            // Update active checklist item ID
            updatedChecklistItems = updatedChecklistItems.map(item => item.id === oldId ? { ...item, id: newId } : item);
            migrated = true;
          }
        });

        // Add missing custom signs to the state if they exist in inventory but not in signs
        updatedInventory.forEach(inv => {
          if (inv.id.startsWith("custom-")) {
            const existsInSigns = updatedCustomSigns.some(sign => sign.id === inv.id);
            if (!existsInSigns) {
              const nameMatch = updatedCustomSigns.find(sign => sign.name.toLowerCase() === inv.name.toLowerCase());
              if (nameMatch) {
                const oldId = inv.id;
                const newId = nameMatch.id;
                updatedInventory = updatedInventory.map(item => item.id === oldId ? { ...item, id: newId } : item);
                updatedHistory = updatedHistory.map(h => {
                  const checklistItems = h.checklist.items.map(item => item.id === oldId ? { ...item, id: newId } : item);
                  const snapshot = h.inventorySnapshot?.map(item => item.id === oldId ? { ...item, id: newId } : item);
                  return {
                    ...h,
                    checklist: { ...h.checklist, items: checklistItems },
                    inventorySnapshot: snapshot
                  };
                });
                updatedChecklistItems = updatedChecklistItems.map(item => item.id === oldId ? { ...item, id: newId } : item);
              } else {
                updatedCustomSigns.push({ id: inv.id, name: inv.name });
                updatedChecklistItems.push({ id: inv.id, name: inv.name, quantity: 0, isCustom: true });
              }
              migrated = true;
            }
          }
        });

        // Ensure standard checklist items are merged correctly
        const mergedItems = [...defaultChecklist.items];
        updatedChecklistItems.forEach(loadedItem => {
          const index = mergedItems.findIndex(i => i.id === loadedItem.id);
          if (index !== -1) {
            mergedItems[index] = loadedItem;
          } else {
            mergedItems.push(loadedItem);
          }
        });

        const finalState = {
          ...initialState,
          ...activeState,
          checklist: {
            ...activeState.checklist,
            items: mergedItems,
          },
          customSigns: updatedCustomSigns,
        };

        setState(finalState);
        setInventory(updatedInventory);
        setHistory(updatedHistory);

        if (migrated) {
          await localforage.setItem("sinaliza_inventory", updatedInventory);
          await localforage.setItem("sinaliza_history", updatedHistory);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalState));
        }
      } catch (error) {
        console.error("Failed loading signaliza local databases:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadAndMigrate();
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

  const setCroqui = (dataUrl: string | null, elements?: CroquiElement[]) => {
    setState(s => ({
      ...s,
      croqui: dataUrl ?? undefined,
      croquiElements: elements ?? []
    }));
  };

  const setNetworkNotes = (notes: string) => {
    setState(s => ({
      ...s,
      location: s.location ? { ...s.location, networkNotes: notes } : null,
    }));
  };

  const setNetworkChecklist = (items: NetworkCheckItem[]) => {
    setState(s => ({
      ...s,
      location: s.location ? { ...s.location, networkChecklist: items } : null,
    }));
  };

  const addPhoto = (photo: PhotoAttachment) => {
    setState(s => ({
      ...s,
      photos: [...(s.photos || []), photo],
    }));
  };

  const removePhoto = (id: string) => {
    setState(s => ({
      ...s,
      photos: (s.photos || []).filter(p => p.id !== id),
    }));
  };

  const addCustomSign = (sign: Omit<CustomSign, "id">) => {
    const id = `custom-${crypto.randomUUID()}`;
    const newSign: CustomSign = {
      ...sign,
      id,
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

    // Auto-upsert into inventory list with 0 stock to preserve ID linkage
    setInventory(prev => {
      if (prev.some(item => item.id === id)) return prev;
      const updated = [...prev, { id, name: newSign.name, totalStock: 0, inUse: 0, minStock: 0 }];
      localforage.setItem("sinaliza_inventory", updated);
      return updated;
    });
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

    // Remove from inventory as well if not actively in use
    setInventory(prev => {
      const updated = prev.filter(item => item.id !== id || item.inUse > 0);
      localforage.setItem("sinaliza_inventory", updated);
      return updated;
    });
  };

  const upsertInventoryItem = async (id: string, name: string, totalStock: number, minStock = 0) => {
    const newInventory = [...inventory];
    const existingIndex = newInventory.findIndex(item => item.id === id);

    if (existingIndex !== -1) {
      const existing = newInventory[existingIndex];
      const updatedStock = Math.max(existing.inUse, totalStock);
      newInventory[existingIndex] = { ...existing, name, totalStock: updatedStock, minStock };
    } else {
      newInventory.push({ id, name, totalStock, inUse: 0, minStock });

      // If created directly in stock manager, register as a custom sign to keep it in checklist
      if (id.startsWith("custom-")) {
        setState(s => {
          if (s.customSigns.some(sign => sign.id === id)) return s;
          const newSign: CustomSign = { id, name };
          return {
            ...s,
            customSigns: [...s.customSigns, newSign],
            checklist: {
              ...s.checklist,
              items: [
                ...s.checklist.items,
                { id, name, quantity: 0, isCustom: true }
              ]
            }
          };
        });
      }
    }

    setInventory(newInventory);
    await localforage.setItem("sinaliza_inventory", newInventory);
  };

  const removeInventoryItem = async (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (item && item.inUse > 0) {
      return false; // Blocks removal if items are in use
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

    // Check available stock limits first
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

    // Apply in-use allocations
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
    const rebuiltChecklist = {
      ...defaultChecklist,
      items: [
        ...defaultChecklist.items,
        ...state.customSigns.map(sign => ({
          id: sign.id,
          name: sign.name,
          quantity: 0,
          isCustom: true
        }))
      ]
    };
    const newState = {
      ...initialState,
      currentWorkId: crypto.randomUUID(), // Regenerate session ID for next plan
      customSigns: state.customSigns,
      checklist: rebuiltChecklist,
      date: new Date().toISOString(),
      photos: [],
    };
    setState(newState);
    setTimeout(() => localStorage.removeItem(STORAGE_KEY), 0);
  };

  const saveToHistory = async () => {
    if (!state.responsible || !state.responsible.trim()) {
      throw new Error("Informe o responsável pela vistoria.");
    }

    // Prevent duplicate entries using workId
    const isDuplicate = history.some(h => h.workId === state.currentWorkId);
    if (isDuplicate) {
      throw new Error("Este planejamento já foi salvo no histórico.");
    }

    // 1. Commit inventory changes
    let currentInventorySnapshot = inventory;
    try {
      currentInventorySnapshot = await commitChecklistToInventory(state.checklist.items);
    } catch (error) {
      throw error;
    }

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      workId: state.currentWorkId,
      date: new Date().toISOString(),
      location: state.location,
      checklist: state.checklist,
      croqui: state.croqui,
      croquiElements: state.croquiElements || [],
      responsible: state.responsible,
      inventorySnapshot: [...currentInventorySnapshot],
      photos: state.photos || [],
      status: "planejada" as WorkStatus,
    };
    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    await localforage.setItem("sinaliza_history", newHistory);
  };

  const removeFromHistory = async (id: string) => {
    // 1. Release inventory first if not already returned
    const historyItem = history.find(h => h.id === id);
    if (historyItem && !historyItem.returnedAt) {
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
    }

    // 2. Remove history record
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    await localforage.setItem("sinaliza_history", newHistory);
  };

  const setWorkStatus = async (historyItemId: string, status: WorkStatus) => {
    const newHistory = history.map(h =>
      h.id === historyItemId ? { ...h, status } : h
    );
    setHistory(newHistory);
    await localforage.setItem("sinaliza_history", newHistory);
  };

  const importDataBackup = async (backupJson: { history: HistoryItem[]; inventory: InventoryItem[]; customSigns: CustomSign[] }) => {
    if (backupJson.inventory) {
      setInventory(backupJson.inventory);
      await localforage.setItem("sinaliza_inventory", backupJson.inventory);
    }
    if (backupJson.history) {
      setHistory(backupJson.history);
      await localforage.setItem("sinaliza_history", backupJson.history);
    }
    if (backupJson.customSigns) {
      const rebuiltChecklist = {
        ...defaultChecklist,
        items: [
          ...defaultChecklist.items,
          ...backupJson.customSigns.map(sign => ({
            id: sign.id,
            name: sign.name,
            quantity: 0,
            isCustom: true
          }))
        ]
      };
      const newState = {
        ...state,
        customSigns: backupJson.customSigns,
        checklist: rebuiltChecklist
      };
      setState(newState);
    }
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
      setNetworkNotes,
      setNetworkChecklist,
      addPhoto,
      removePhoto,
      saveToHistory,
      removeFromHistory,
      clearState,
      upsertInventoryItem,
      removeInventoryItem,
      getAvailable,
      commitChecklistToInventory,
      returnInventory,
      setWorkStatus,
      importDataBackup,
    },
  };
}
