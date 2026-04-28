import { useState } from "react";
import type { SignageItem, CustomSign, InventoryItem } from "@/types";
import { Plus, Minus, Settings2, AlertTriangle } from "lucide-react";
import CustomSignsManager from "./CustomSignsManager";

interface ChecklistViewProps {
  items: SignageItem[];
  observations: string;
  customSigns: CustomSign[];
  inventory: InventoryItem[];
  addCustomSign: (sign: Omit<CustomSign, "id">) => void;
  removeCustomSign: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateObservations: (obs: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ChecklistView({
  items,
  observations,
  customSigns,
  inventory,
  addCustomSign,
  removeCustomSign,
  onUpdateQuantity,
  onUpdateObservations,
  onNext,
  onBack,
}: ChecklistViewProps) {
  const [showManager, setShowManager] = useState(false);

  if (showManager) {
    return (
      <CustomSignsManager 
        customSigns={customSigns}
        addCustomSign={addCustomSign}
        removeCustomSign={removeCustomSign}
        onClose={() => setShowManager(false)} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 pb-24 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">2. Itens de Sinalização</h2>
          <p className="text-sm text-slate-500">Selecione as quantidades necessárias</p>
        </div>
        
        <button
          onClick={() => setShowManager(true)}
          className="p-2 bg-white rounded-full shadow-sm text-blue-600 border border-slate-200 hover:bg-slate-100 transition"
          title="Gerenciar Placas Personalizadas"
        >
          <Settings2 className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => {
          const invItem = inventory.find(i => i.id === item.id);
          const isControlled = !!invItem;
          const available = isControlled ? invItem.totalStock - invItem.inUse : Infinity;
          const overLimit = isControlled && item.quantity > available;

          return (
            <div 
              key={item.id} 
              className={`flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border ${overLimit ? 'border-rose-300 bg-rose-50' : 'border-slate-100'}`}
            >
              <div className="flex-1">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  {item.name}
                  {item.isCustom && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Custom
                    </span>
                  )}
                </span>
                {isControlled && (
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Disponível: {available}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  disabled={item.quantity === 0}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition
                    ${item.quantity > 0 
                      ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Minus className="w-5 h-5" />
                </button>
                
                <span className={`w-6 flex shrink-0 justify-center text-lg font-bold ${overLimit ? 'text-rose-600' : 'text-slate-800'} relative`}>
                  {item.quantity}
                  {overLimit && <AlertTriangle className="w-3 h-3 absolute -top-2 -right-3 text-rose-500" />}
                </span>

                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={isControlled && item.quantity >= available}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition
                    ${isControlled && item.quantity >= available 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Observações Adicionais</label>
        <textarea
          value={observations}
          onChange={(e) => onUpdateObservations(e.target.value)}
          placeholder="Ex: Cuidado com cabos aéreos no local..."
          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"
        />
      </div>

      <div className="flex gap-3 mt-auto">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-xl font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
        >
          Voltar
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-4 rounded-xl font-bold text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition"
        >
          Resumo
        </button>
      </div>
    </div>
  );
}
