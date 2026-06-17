import { useState } from "react";
import { ArrowLeft, Trash2, Calendar, MapPin, PackageCheck, X } from "lucide-react";
import type { HistoryItem, InventoryItem, CustomSign, WorkStatus } from "@/types";

const STATUS_CONFIG: Record<WorkStatus, { label: string; bg: string; text: string; border: string }> = {
  planejada: { label: "Planejada", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  em_andamento: { label: "Em Andamento", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  concluida: { label: "Concluída", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

interface HistoryViewProps {
  history: HistoryItem[];
  inventory: InventoryItem[];
  customSigns: CustomSign[];
  onRemove: (id: string) => void;
  onReturnInventory: (id: string) => Promise<void>;
  onImportBackup: (backupJson: any) => Promise<void>;
  onSetWorkStatus: (id: string, status: WorkStatus) => Promise<void>;
  onBack: () => void;
}

export default function HistoryView({ 
  history, 
  inventory, 
  customSigns, 
  onRemove, 
  onReturnInventory, 
  onImportBackup, 
  onSetWorkStatus,
  onBack 
}: HistoryViewProps) {
  const [filterResponsible, setFilterResponsible] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [expandedPhotos, setExpandedPhotos] = useState<string | null>(null);

  const handleExportBackup = () => {
    const data = {
      history,
      inventory,
      customSigns
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `sinaliza_express_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (parsed.history || parsed.inventory || parsed.customSigns)) {
            await onImportBackup(parsed);
            alert("Backup restaurado com sucesso!");
          } else {
            alert("Formato de arquivo de backup inválido.");
          }
        } catch (error) {
          alert("Erro ao processar o arquivo de backup.");
        }
      };
    }
  };

  const filteredHistory = history.filter(item => {
    if (filterResponsible.trim()) {
      if (!item.responsible?.toLowerCase().includes(filterResponsible.toLowerCase())) {
        return false;
      }
    }
    if (filterLocation.trim()) {
      const address = item.location?.address || "";
      const latLng = `${item.location?.lat},${item.location?.lng}`;
      if (!address.toLowerCase().includes(filterLocation.toLowerCase()) && !latLng.includes(filterLocation)) {
        return false;
      }
    }
    if (filterStartDate) {
      const start = new Date(filterStartDate + "T00:00:00");
      if (new Date(item.date) < start) {
        return false;
      }
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate + "T23:59:59");
      if (new Date(item.date) > end) {
        return false;
      }
    }
    if (filterStatus) {
      const itemStatus = item.status || "planejada";
      if (itemStatus !== filterStatus) {
        return false;
      }
    }
    return true;
  });

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

      <div className="flex gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-200 justify-between items-center">
        <span className="text-xs font-bold text-slate-700">Backup do Sistema:</span>
        <div className="flex gap-2">
          <button
            onClick={handleExportBackup}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition"
          >
            Exportar JSON
          </button>
          <label className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition cursor-pointer">
            Importar JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">Filtros de Pesquisa</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              {showFilters ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Responsável</label>
                <input
                  type="text"
                  value={filterResponsible}
                  onChange={e => setFilterResponsible(e.target.value)}
                  placeholder="Nome do técnico"
                  className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Local / Endereço</label>
                <input
                  type="text"
                  value={filterLocation}
                  onChange={e => setFilterLocation(e.target.value)}
                  placeholder="Rua, bairro, coordenadas..."
                  className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                >
                  <option value="">Todos os status</option>
                  <option value="planejada">Planejada</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={e => setFilterStartDate(e.target.value)}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={e => setFilterEndDate(e.target.value)}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                  />
                </div>
              </div>
              {(filterResponsible || filterLocation || filterStartDate || filterEndDate || filterStatus) && (
                <button
                  onClick={() => {
                    setFilterResponsible("");
                    setFilterLocation("");
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setFilterStatus("");
                  }}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg transition"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <Calendar className="w-16 h-16 text-slate-400 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum planejamento salvo.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <Calendar className="w-16 h-16 text-slate-400 mb-4" />
          <p className="text-slate-500 font-medium text-center text-sm">Nenhum resultado encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const itemCount = item.checklist.items.reduce((acc, current) => acc + current.quantity, 0);
            const currentStatus = item.status || "planejada";
            const statusCfg = STATUS_CONFIG[currentStatus];
            const itemPhotos = item.photos || [];
            const isPhotosExpanded = expandedPhotos === item.id;

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col gap-2 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-blue-600">
                        {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {item.responsible && <p className="text-sm text-slate-600 font-medium">Resp: {item.responsible}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Status Badge + Selector */}
                    <select
                      value={currentStatus}
                      onChange={(e) => onSetWorkStatus(item.id, e.target.value as WorkStatus)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border appearance-none cursor-pointer ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="planejada">📋 Planejada</option>
                      <option value="em_andamento">🔧 Em Andamento</option>
                      <option value="concluida">✅ Concluída</option>
                    </select>
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
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-700 mt-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2 leading-tight">
                    {item.location?.address && item.location.address !== "Buscando endereço..."
                      ? item.location.address
                      : `Coordenadas: ${item.location?.lat.toFixed(4)}, ${item.location?.lng.toFixed(4)}`}
                  </span>
                </div>

                {/* Network Notes Preview */}
                {item.location?.networkNotes && (
                  <div className="text-xs text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-100 mt-1 line-clamp-2">
                    🔧 {item.location.networkNotes}
                  </div>
                )}
                
                <div className="mt-2 text-sm font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {itemCount} placas/equipamentos registrados.
                </div>

                {item.croqui && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.croqui} alt="Croqui da Obra" className="w-full h-auto object-cover max-h-48" />
                  </div>
                )}

                {/* Photos Gallery */}
                {itemPhotos.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setExpandedPhotos(isPhotosExpanded ? null : item.id)}
                      className="text-xs font-bold text-violet-600 hover:text-violet-800 transition mb-1.5 flex items-center gap-1"
                    >
                      📷 {itemPhotos.length} foto(s)
                      <span className="text-[10px]">{isPhotosExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isPhotosExpanded && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {itemPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="rounded-md overflow-hidden border border-slate-200 aspect-square cursor-pointer hover:opacity-80 transition"
                            onClick={() => setPhotoPreview(photo.dataUrl)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.dataUrl} alt="Foto" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 border-t border-slate-100 pt-3">
                  {item.returnedAt ? (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg flex justify-center items-center">
                      ✓ Devolvido em {new Date(item.returnedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (confirm("Confirmar devolução ao estoque das placas usadas nesta obra?")) {
                          await onReturnInventory(item.id);
                        }
                      }}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Devolver sinalização
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Preview Modal */}
      {photoPreview && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPhotoPreview(null)}
        >
          <div className="relative max-w-lg max-h-[80vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
            <button
              onClick={() => setPhotoPreview(null)}
              className="absolute -top-3 -right-3 bg-white text-slate-800 p-2 rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
