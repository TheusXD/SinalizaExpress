import { ArrowLeft, Trash2, Calendar, MapPin } from "lucide-react";
import type { HistoryItem } from "@/types";

interface HistoryViewProps {
  history: HistoryItem[];
  onRemove: (id: string) => void;
  onBack: () => void;
}

export default function HistoryView({ history, onRemove, onBack }: HistoryViewProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition text-slate-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Histórico de Obras</h2>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <Calendar className="w-16 h-16 text-slate-400 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum planejamento salvo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const itemCount = item.checklist.items.reduce((acc, current) => acc + current.quantity, 0);
            return (
              <div 
                key={item.id} 
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col gap-2 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-blue-600">
                      {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {item.responsible && <p className="text-sm text-slate-600 font-medium">Resp: {item.responsible}</p>}
                  </div>
                  <button
                    onClick={() => {
                       if(confirm("Deseja realmente excluir este planejamento do histórico?")) {
                         onRemove(item.id);
                       }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                    title="Excluir do histórico"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-700 mt-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2 leading-tight">
                    {item.location?.address && item.location.address !== "Buscando endereço..."
                      ? item.location.address
                      : `Coordenadas: ${item.location?.lat.toFixed(4)}, ${item.location?.lng.toFixed(4)}`}
                  </span>
                </div>
                
                <div className="mt-2 text-sm font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {itemCount} placas/equipamentos registrados.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
