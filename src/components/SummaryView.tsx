import { useState } from "react";
import { MapPin, Share2, ArrowLeft } from "lucide-react";
import type { PwaState } from "@/types";

interface SummaryViewProps {
  state: PwaState;
  onUpdateResponsible: (name: string) => void;
  onSaveHistory: () => Promise<void>;
  onReset: () => void;
  onBack: () => void;
}

export default function SummaryView({ state, onUpdateResponsible, onSaveHistory, onReset, onBack }: SummaryViewProps) {
  const { location, checklist, responsible } = state;
  const [saved, setSaved] = useState(false);
  const selectedItems = checklist.items.filter(item => item.quantity > 0);

  const generateWhatsAppLink = () => {
    let text = `*Planejamento de Sinalização de Obra*\n`;
    text += `Data: ${new Date(state.date).toLocaleDateString("pt-BR")}\n`;
    if (responsible) {
      text += `Responsável: ${responsible}\n`;
    }
    text += `\n`;
    
    if (location) {
      text += `*🗺️ Localização:*\n`;
      if (location.address && location.address !== "Buscando endereço...") {
        text += `${location.address}\n`;
      }
      text += `https://www.google.com/maps?q=${location.lat},${location.lng}\n\n`;
    }

    text += `*📋 Itens Necessários:*\n`;
    if (selectedItems.length === 0) {
      text += `Nenhum item selecionado.\n`;
    } else {
      selectedItems.forEach(item => {
        text += `- ${item.quantity}x ${item.name}\n`;
      });
    }

    if (checklist.observations) {
      text += `\n*📝 Observações:*\n${checklist.observations}\n`;
    }

    if (state.croqui) {
      text += `\n📐 Croqui de sinalização em anexo.\n`;
    }

    const encodedText = encodeURIComponent(text);
    return `https://wa.me/?text=${encodedText}`;
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
        <h2 className="text-2xl font-bold text-slate-800">3. Resumo</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="text-blue-600" />
          Local da Obra
        </h3>
        {location ? (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-600">
            {location.address && location.address !== "Buscando endereço..." && (
              <p className="mb-2 font-medium text-slate-800 leading-tight">{location.address}</p>
            )}
            <p className="font-mono text-xs opacity-75 mt-1">Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}</p>
            <a 
               href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="mt-3 inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
               Ver no Google Maps ↗
            </a>
          </div>
        ) : (
          <p className="text-slate-500 italic">Localização não definida</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Sinalizações Selecionadas</h3>
        {selectedItems.length === 0 ? (
          <p className="text-slate-500 italic">Nenhum item adicionado ao checklist.</p>
        ) : (
          <ul className="space-y-3">
            {selectedItems.map(item => (
              <li key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-medium text-slate-700">
                  {item.name}
                  {item.isCustom && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Custom</span>}
                </span>
                <span className="font-bold text-lg text-slate-800 bg-white px-3 py-1 rounded-md shadow-sm">
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {checklist.observations && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Observações</h3>
          <p className="text-slate-600 whitespace-pre-wrap">{checklist.observations}</p>
        </div>
      )}

      {state.croqui && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-3">Croqui de Sinalização</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.croqui} alt="Croqui" className="w-full rounded-lg border border-slate-200" />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Responsável</h3>
        <input
          type="text"
          value={responsible}
          onChange={(e) => onUpdateResponsible(e.target.value)}
          placeholder="Nome do técnico/encarregado"
          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        <a
          href={generateWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 bg-green-500 hover:bg-green-600 shadow-md text-white font-bold rounded-xl text-lg flex justify-center items-center gap-2 transition"
        >
          <Share2 className="w-6 h-6" />
          Compartilhar 
        </a>

        <div className="flex gap-2 w-full mt-2">
          {!saved ? (
             <button
               onClick={async () => { await onSaveHistory(); setSaved(true); }}
               className="flex-1 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center justify-center transition hover:bg-blue-200"
             >
               Salvar no Histórico
             </button>
          ) : (
             <div className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center justify-center">
               Salvo ✓
             </div>
          )}

          <button
            onClick={onReset}
            className="flex-1 py-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition"
          >
            Nova Obra
          </button>
        </div>
      </div>
    </div>
  );
}
