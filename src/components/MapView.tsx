"use client";

import dynamic from "next/dynamic";
import type { LocationData } from "@/types";

// Dynamically import the map component with no SSR because leaflet requires the window object
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-500">
      Carregando mapa...
    </div>
  ),
});

interface MapViewProps {
  location: LocationData | null;
  onLocationSelect: (loc: LocationData) => void;
  onNext: () => void;
}

export default function MapView({ location, onLocationSelect, onNext }: MapViewProps) {
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
              <span className="font-mono text-xs">Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}</span>
            )}
            {location.address && location.address !== "Buscando endereço..." && (
              <span className="block font-mono text-xs text-blue-600 mt-1 opacity-75">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            )}
          </div>
        )}
      </div>

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
