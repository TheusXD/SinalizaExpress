import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import type { CustomSign } from "@/types";

interface CustomSignsManagerProps {
  customSigns: CustomSign[];
  addCustomSign: (sign: Omit<CustomSign, "id">) => void;
  removeCustomSign: (id: string) => void;
  onClose: () => void;
}

export default function CustomSignsManager({ customSigns, addCustomSign, removeCustomSign, onClose }: CustomSignsManagerProps) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    addCustomSign({
      name: newName.trim(),
      description: newDesc.trim() || undefined,
    });
    
    setNewName("");
    setNewDesc("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition text-slate-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Placas Customizadas</h2>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h3 className="font-semibold text-slate-700 mb-4">Adicionar Nova</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nome da placa *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Placa de Desvio à Esquerda"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Ex: Usar apenas em cruzamentos"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!newName.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Adicionar Placa
          </button>
        </div>
      </form>

      <div>
        <h3 className="font-semibold text-slate-700 mb-3 px-1">Suas Placas</h3>
        {customSigns.length === 0 ? (
          <p className="text-slate-500 text-center py-6 bg-white border border-dashed border-slate-300 rounded-xl">
            Nenhuma placa customizada cadastrada.
          </p>
        ) : (
          <div className="space-y-3">
            {customSigns.map(sign => (
              <div key={sign.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group">
                <div>
                  <p className="font-bold text-slate-800">{sign.name}</p>
                  {sign.description && (
                    <p className="text-sm text-slate-500">{sign.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeCustomSign(sign.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition opacity-80 hover:opacity-100"
                  title="Excluir Placa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
