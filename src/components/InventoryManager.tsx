import { useState } from "react";
import { ArrowLeft, Package, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import type { InventoryItem } from "@/types";

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpsert: (id: string, name: string, totalStock: number, minStock?: number) => Promise<void>;
  onRemove: (id: string) => Promise<boolean>;
  onBack: () => void;
}

const defaultChecklistItems = [
  { id: "std-1", name: "Placa 'Homens Trabalhando'" },
  { id: "std-2", name: "Cones" },
  { id: "std-3", name: "Cavaletes" },
  { id: "std-4", name: "Desvio de tráfego" },
  { id: "std-5", name: "Sinalização noturna" },
  { id: "std-6", name: "Placa Estreitamento de Via" },
  { id: "std-7", name: "Placa Vala Aberta" },
  { id: "std-8", name: "Placa Limite de Velocidade" },
  { id: "std-9", name: "Placa PARE/SIGA" },
  { id: "std-10", name: "Placa Institucional" },
  { id: "std-11", name: "Cerquite / Tapume" },
  { id: "std-12", name: "Fita Zebrada" },
  { id: "std-13", name: "Super Cone (750mm)" },
  { id: "std-14", name: "Sinalizador Luminoso" },
  { id: "std-15", name: "Veículo / Caminhão Barreira" },
];

export default function InventoryManager({
  inventory,
  onUpsert,
  onRemove,
  onBack
}: InventoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number | "">(0);
  const [editMinStock, setEditMinStock] = useState<number | "">(0);
  
  // For new items
  const [newItemType, setNewItemType] = useState<"standard" | "custom">("standard");
  const [selectedStdId, setSelectedStdId] = useState(defaultChecklistItems[0].id);
  const [customName, setCustomName] = useState("");
  const [newStock, setNewStock] = useState<number | "">(1);
  const [newMinStock, setNewMinStock] = useState<number | "">(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableStandardItems = defaultChecklistItems.filter(
    std => !inventory.find(inv => inv.id === std.id)
  );

  const handleSaveEdit = async (item: InventoryItem) => {
    const parsedStock = typeof editStock === "number" ? editStock : parseInt(editStock as string) || 0;
    const parsedMinStock = typeof editMinStock === "number" ? editMinStock : parseInt(editMinStock as string) || 0;
    
    if (parsedStock < 0) {
      alert("O estoque total não pode ser negativo.");
      return;
    }
    if (parsedMinStock < 0) {
      alert("O alerta de estoque mínimo não pode ser negativo.");
      return;
    }
    if (parsedStock < item.inUse) {
      alert(`O estoque total não pode ser menor que a quantidade já em uso (${item.inUse}).`);
      return;
    }
    await onUpsert(item.id, item.name, parsedStock, parsedMinStock);
    setEditingId(null);
  };

  const handleRemove = async (item: InventoryItem) => {
    if (item.inUse > 0) {
      alert(`Não é possível remover "${item.name}" porque há ${item.inUse} unidade(s) em uso. Devolva a sinalização antes de remover este item.`);
      return;
    }
    if (confirm(`Deseja realmente remover "${item.name}" do controle de estoque?`)) {
      await onRemove(item.id);
    }
  };

  const handleAddItem = async () => {
    const parsedStock = typeof newStock === "number" ? newStock : parseInt(newStock as string) || 0;
    const parsedMinStock = typeof newMinStock === "number" ? newMinStock : parseInt(newMinStock as string) || 0;
    
    if (parsedStock < 1) {
      alert("A quantidade em estoque deve ser pelo menos 1.");
      return;
    }
    if (parsedMinStock < 0) {
      alert("O estoque mínimo não pode ser negativo.");
      return;
    }

    setIsSubmitting(true);
    if (newItemType === "standard") {
      const stdItem = defaultChecklistItems.find(i => i.id === selectedStdId);
      if (stdItem) {
        await onUpsert(stdItem.id, stdItem.name, parsedStock, parsedMinStock);
      }
    } else {
      if (!customName.trim()) {
        alert("Por favor, insira o nome do item.");
        setIsSubmitting(false);
        return;
      }
      const newId = `custom-${Date.now()}`;
      await onUpsert(newId, customName.trim(), parsedStock, parsedMinStock);
      setCustomName("");
    }
    
    setNewStock(1);
    setNewMinStock(0);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition text-slate-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Estoque
        </h2>
      </div>

      <div className="space-y-4 mb-8">
        {inventory.length === 0 ? (
          <div className="text-center py-8 opacity-60">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Nenhum item controlado no estoque.</p>
          </div>
        ) : (
          inventory.map((item) => {
            const available = item.totalStock - item.inUse;
            const isLowStock = item.minStock !== undefined && item.minStock > 0 && available <= item.minStock;
            const badgeColor = isLowStock
              ? "bg-rose-100 text-rose-800 animate-pulse border border-rose-300"
              : available > 3 ? "bg-emerald-100 text-emerald-800" 
              : available > 0 ? "bg-amber-100 text-amber-800" 
              : "bg-rose-100 text-rose-800";
            
            return (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative overflow-hidden group">
                {editingId === item.id ? (
                  <div className="flex flex-col gap-3">
                    <p className="font-semibold text-slate-700">{item.name}</p>
                    
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium text-slate-600">Estoque Total:</label>
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setEditStock(prev => Math.max(item.inUse, (typeof prev === "number" ? prev : 0) - 1))}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          min={item.inUse}
                          value={editStock === "" ? "" : editStock}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : parseInt(e.target.value);
                            setEditStock(val === "" ? "" : Math.max(item.inUse, val));
                          }}
                          className="w-16 p-1 text-center font-bold focus:outline-none border-none text-slate-900 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditStock(prev => (typeof prev === "number" ? prev : 0) + 1)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium text-slate-600">Estoque Mínimo:</label>
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setEditMinStock(prev => Math.max(0, (typeof prev === "number" ? prev : 0) - 1))}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          min="0"
                          value={editMinStock === "" ? "" : editMinStock}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : parseInt(e.target.value);
                            setEditMinStock(val === "" ? "" : Math.max(0, val));
                          }}
                          className="w-16 p-1 text-center font-bold focus:outline-none border-none text-slate-900 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditMinStock(prev => (typeof prev === "number" ? prev : 0) + 1)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleSaveEdit(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 leading-tight pr-12">{item.name}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${badgeColor}`}>
                        {available} disp.
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-500 font-medium">
                      Total: {item.totalStock} | Em campo: <span className={item.inUse > 0 ? "text-blue-600" : ""}>{item.inUse}</span>
                      {item.minStock !== undefined && item.minStock > 0 && (
                        <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded ${isLowStock ? "bg-rose-100 text-rose-800 font-bold" : "bg-slate-100 text-slate-600"}`}>
                          Min: {item.minStock}
                        </span>
                      )}
                    </p>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(item.id); setEditStock(item.totalStock); setEditMinStock(item.minStock || 0); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Editar estoque"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemove(item)}
                        disabled={item.inUse > 0}
                        className={`p-1.5 rounded-md transition ${item.inUse > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                        title={item.inUse > 0 ? "Em uso, não é possível remover" : "Remover do estoque"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Adicionar ao Estoque
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
              <button 
                onClick={() => setNewItemType("standard")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${newItemType === "standard" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Padrão
              </button>
              <button 
                onClick={() => setNewItemType("custom")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${newItemType === "custom" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Customizado
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do item</label>
            {newItemType === "standard" ? (
              <select 
                value={selectedStdId}
                onChange={(e) => setSelectedStdId(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                {availableStandardItems.length === 0 ? (
                  <option disabled>Todos os itens padrão já controlados</option>
                ) : (
                  availableStandardItems.map(std => (
                    <option key={std.id} value={std.id}>{std.name}</option>
                  ))
                )}
              </select>
            ) : (
              <input 
                type="text" 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Cone grande especial..."
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <label className="text-sm font-semibold text-slate-700">Quantidade Total:</label>
            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setNewStock(prev => Math.max(1, (typeof prev === "number" ? prev : 1) - 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600 focus:outline-none"
              >
                -
              </button>
              <input 
                type="number"
                min="1"
                value={newStock === "" ? "" : newStock}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : parseInt(e.target.value);
                  setNewStock(val === "" ? "" : Math.max(1, val));
                }}
                className="w-16 p-1.5 text-center font-bold focus:outline-none border-none text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setNewStock(prev => (typeof prev === "number" ? prev : 1) + 1)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mb-2">
            <label className="text-sm font-semibold text-slate-700">Alerta de Estoque Mínimo:</label>
            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setNewMinStock(prev => Math.max(0, (typeof prev === "number" ? prev : 0) - 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600 focus:outline-none"
              >
                -
              </button>
              <input 
                type="number"
                min="0"
                value={newMinStock === "" ? "" : newMinStock}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : parseInt(e.target.value);
                  setNewMinStock(val === "" ? "" : Math.max(0, val));
                }}
                className="w-16 p-1.5 text-center font-bold focus:outline-none border-none text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setNewMinStock(prev => (typeof prev === "number" ? prev : 0) + 1)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold transition text-slate-600"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddItem}
            disabled={isSubmitting || (newItemType === "standard" && availableStandardItems.length === 0)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-sm transition-colors"
          >
            Confirmar Adição
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm leading-relaxed border border-blue-100">
        <p className="font-semibold mb-1">💡 Como funciona o estoque?</p>
        <p>Itens com ID correspondente ao checklist padrão (std-1 a std-15) são vinculados automaticamente. Para sincronizar um item customizado que o técnico cria na hora do checklist, o ideal é criá-lo lá no checklist primeiro e depois vir aqui e adicionar exatamente com o mesmo nome para ter o vínculo manual.</p>
      </div>
    </div>
  );
}
