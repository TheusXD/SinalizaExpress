"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Camera, X, FileText, CheckSquare } from "lucide-react";
import type { LocationData, NetworkCheckItem, PhotoAttachment } from "@/types";

// Dynamically import the map component with no SSR because leaflet requires the window object
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-500">
      Carregando mapa...
    </div>
  ),
});

const defaultNetworkChecklist: NetworkCheckItem[] = [
  { id: "nc-1", label: "Verificou PVs (poços de visita) próximos?", checked: false },
  { id: "nc-2", label: "Há travessia de rede na via?", checked: false },
  { id: "nc-3", label: "Profundidade da rede conferida?", checked: false },
  { id: "nc-4", label: "Há rede de água na mesma via?", checked: false },
  { id: "nc-5", label: "Verificou cadastro no mapa IGUA?", checked: false },
  { id: "nc-6", label: "Há ligações domiciliares na área?", checked: false },
];

interface MapViewProps {
  location: LocationData | null;
  onLocationSelect: (loc: LocationData) => void;
  onNext: () => void;
  networkNotes: string;
  networkChecklist: NetworkCheckItem[];
  photos: PhotoAttachment[];
  onSetNetworkNotes: (notes: string) => void;
  onSetNetworkChecklist: (items: NetworkCheckItem[]) => void;
  onAddPhoto: (photo: PhotoAttachment) => void;
  onRemovePhoto: (id: string) => void;
}

export { defaultNetworkChecklist };

export default function MapView({
  location,
  onLocationSelect,
  onNext,
  networkNotes,
  networkChecklist,
  photos,
  onSetNetworkNotes,
  onSetNetworkChecklist,
  onAddPhoto,
  onRemovePhoto,
}: MapViewProps) {
  const [showNetworkSection, setShowNetworkSection] = useState(false);
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChecklist = networkChecklist.length > 0 ? networkChecklist : defaultNetworkChecklist;
  const checkedCount = activeChecklist.filter(c => c.checked).length;

  const handleToggleCheckItem = (id: string) => {
    const updated = activeChecklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onSetNetworkChecklist(updated);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB for localStorage safety
    if (file.size > 2 * 1024 * 1024) {
      alert("A foto é muito grande (máx. 2MB). Tente uma foto menor ou com qualidade reduzida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newPhoto: PhotoAttachment = {
          id: crypto.randomUUID(),
          dataUrl,
          caption: "",
          timestamp: new Date().toISOString(),
        };
        onAddPhoto(newPhoto);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="flex flex-col min-h-full items-center p-4 pb-24">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex-grow flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-2">1. Local da Obra</h2>
        <p className="text-sm text-slate-500 mb-4">
          Toque no mapa ou use sua localização atual para definir onde será a sinalização.
        </p>

        <MapComponent location={location} onLocationSelect={onLocationSelect} />
        
        {location && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4 border border-blue-100 shadow-inner">
            <strong className="flex items-center gap-1 mb-1">📍 Local selecionado:</strong>
            {location.address ? (
              <span className="block font-medium">{location.address}</span>
            ) : (
              <span className="font-mono text-xs">Lat: {location.lat?.toFixed(5) || "-"}, Lng: {location.lng?.toFixed(5) || "-"}</span>
            )}
            {location.address && location.address !== "Buscando endereço..." && (
              <span className="block font-mono text-xs text-blue-600 mt-1 opacity-75">
                {location.lat?.toFixed(5) || "-"}, {location.lng?.toFixed(5) || "-"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Seção: Rede de Esgoto */}
      {location && (
        <div className="w-full max-w-md mt-4">
          <button
            onClick={() => setShowNetworkSection(!showNetworkSection)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition text-left ${
              showNetworkSection
                ? "bg-teal-50 border-teal-200 text-teal-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${showNetworkSection ? "bg-teal-100" : "bg-slate-100"}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">Rede de Esgoto</span>
                <span className="text-[11px] opacity-70">
                  {checkedCount > 0 ? `${checkedCount}/${activeChecklist.length} verificações` : "Observações e verificações"}
                </span>
              </div>
            </div>
            <span className="text-lg">{showNetworkSection ? "▲" : "▼"}</span>
          </button>

          {showNetworkSection && (
            <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-4 space-y-4 -mt-1">
              {/* Observações de Rede */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Observações sobre a Rede
                </label>
                <textarea
                  value={networkNotes}
                  onChange={(e) => onSetNetworkNotes(e.target.value)}
                  placeholder="Ex: PV existente na esquina, rede de 200mm na rua principal, profundidade 1.5m..."
                  rows={3}
                  className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none text-slate-900 bg-slate-50"
                />
              </div>

              {/* Checklist de Interferências */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                  Checklist de Interferências
                </label>
                <div className="space-y-1.5">
                  {activeChecklist.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition border ${
                        item.checked
                          ? "bg-teal-50 border-teal-200"
                          : "bg-white border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleCheckItem(item.id)}
                        className="w-4 h-4 accent-teal-600 rounded"
                      />
                      <span className={`text-sm ${item.checked ? "text-teal-800 font-medium" : "text-slate-700"}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seção: Fotos */}
      {location && (
        <div className="w-full max-w-md mt-3">
          <button
            onClick={() => setShowPhotoSection(!showPhotoSection)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition text-left ${
              showPhotoSection
                ? "bg-violet-50 border-violet-200 text-violet-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${showPhotoSection ? "bg-violet-100" : "bg-slate-100"}`}>
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">Fotos do Local</span>
                <span className="text-[11px] opacity-70">
                  {photos.length > 0 ? `${photos.length} foto(s) anexada(s)` : "Capturar ou anexar fotos"}
                </span>
              </div>
            </div>
            <span className="text-lg">{showPhotoSection ? "▲" : "▼"}</span>
          </button>

          {showPhotoSection && (
            <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-4 -mt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition mb-3"
              >
                <Camera className="w-4 h-4" />
                Tirar Foto / Escolher da Galeria
              </button>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption || "Foto do local"}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPhotoPreview(photo.dataUrl)}
                      />
                      <button
                        onClick={() => onRemovePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">
                        {new Date(photo.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">
                  Nenhuma foto anexada. Toque acima para capturar.
                </p>
              )}
            </div>
          )}
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

      <div className="w-full max-w-md mt-4">
        <button
          onClick={onNext}
          disabled={!location}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            location 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform hover:scale-[1.02]' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Avançar para Checklist
        </button>
      </div>
    </div>
  );
}
