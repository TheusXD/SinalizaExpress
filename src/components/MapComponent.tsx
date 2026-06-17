"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { LocateFixed, Loader2, Search, X, Map as MapIcon, Maximize2, Minimize2, Columns } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LocationData } from "@/types";

// Standard Leaflet Marker fix for Next.js/Webpack
const customMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const IGUA_MAP_URL = "https://gis.iguasa.com.br/portal/apps/webappviewer/index.html?id=0d16863d15fa4d0ba5473f0299accdd7";

interface MapComponentProps {
  location: LocationData | null;
  onLocationSelect: (loc: LocationData) => void;
}

// Timeout helper using AbortController
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

function AddressSearch({ onSelect }: { onSelect: (loc: LocationData) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`,
          {
            headers: { 
              "Accept-Language": "pt-BR"
            }
          }
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Address search error:", e);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full z-[1000] mb-3">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Buscar endereço..."
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-3 p-1 text-slate-400 hover:text-slate-600">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
          </button>
        )}
      </div>
      {results.length > 0 && (
        <ul className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden flex flex-col divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {results.map((r: any) => (
            <li 
              key={r.place_id} 
              onClick={() => {
                onSelect({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name });
                setQuery("");
                setResults([]);
              }}
              className="p-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition"
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Sub-component to handle map centering
function ChangeMapView({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
}

// Sub-component to handle map clicks
function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type MapMode = "igua" | "leaflet" | "split";

function LeafletMap({ activeCoords, location, handleLocationUpdate, markerEventHandlers, markerRef, handleUseMyLocation, isLocating, height }: {
  activeCoords: [number, number];
  location: LocationData | null;
  handleLocationUpdate: (lat: number, lng: number) => void;
  markerEventHandlers: any;
  markerRef: any;
  handleUseMyLocation: () => void;
  isLocating: boolean;
  height: string;
}) {
  return (
    <div className={`relative w-full rounded-lg overflow-hidden shadow-md z-0`} style={{ height }}>
      <MapContainer 
        center={activeCoords} 
        zoom={14} 
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler onMapClick={handleLocationUpdate} />
        {location && (
          <>
            <ChangeMapView coords={activeCoords} />
            <Marker
              draggable={true}
              eventHandlers={markerEventHandlers}
              position={activeCoords}
              ref={markerRef}
              icon={customMarkerIcon}
            />
          </>
        )}
      </MapContainer>
      <button
        onClick={handleUseMyLocation}
        disabled={isLocating}
        className="absolute bottom-3 right-3 z-[1000] bg-white text-blue-600 p-2.5 rounded-full shadow-lg hover:bg-gray-100 flex items-center justify-center transition disabled:opacity-80 border border-slate-200"
        title="Usar minha localização"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LocateFixed className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

export default function MapComponent({ location, onLocationSelect }: MapComponentProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("igua");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const markerRef = useRef<any>(null);

  const defaultCoords: [number, number] = [-22.9068, -43.1729];
  const activeCoords: [number, number] = useMemo(() => {
    return location ? [location.lat, location.lng] : defaultCoords;
  }, [location]);

  const handleLocationUpdate = async (lat: number, lng: number) => {
    onLocationSelect({ lat, lng, address: "Buscando endereço..." });
    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data = await res.json();
      onLocationSelect({ lat, lng, address: data.display_name || `Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      onLocationSelect({ lat, lng, address: `Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await handleLocationUpdate(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        alert("Erro ao buscar localização: " + error.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          handleLocationUpdate(latLng.lat, latLng.lng);
        }
      },
    }),
    [location]
  );

  // Fullscreen overlay for IGUA map
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold text-sm">Mapa GIS IGUA — Tela Cheia</span>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <Minimize2 className="w-4 h-4" />
            Sair
          </button>
        </div>
        <iframe
          src={IGUA_MAP_URL}
          title="Mapa GIS IGUA — Tela Cheia"
          className="flex-1 w-full border-0"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Seletor de Mapa */}
      <div className="flex bg-slate-100 rounded-lg p-1 mb-3 border border-slate-200">
        <button
          onClick={() => setMapMode("igua")}
          className={`flex-1 py-2 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
            mapMode === "igua"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          IGUA
        </button>
        <button
          onClick={() => setMapMode("leaflet")}
          className={`flex-1 py-2 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
            mapMode === "leaflet"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <LocateFixed className="w-3.5 h-3.5" />
          Interativo
        </button>
        <button
          onClick={() => setMapMode("split")}
          className={`flex-1 py-2 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
            mapMode === "split"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          Lado a Lado
        </button>
      </div>

      {/* Busca de endereço — nos modos interativo e split */}
      {(mapMode === "leaflet" || mapMode === "split") && (
        <AddressSearch onSelect={onLocationSelect} />
      )}

      {/* Mapa IGUA (iframe) */}
      {mapMode === "igua" && (
        <div className="relative w-full h-[350px] rounded-lg overflow-hidden shadow-md flex-grow border border-slate-200">
          <iframe
            src={IGUA_MAP_URL}
            title="Mapa GIS IGUA"
            className="w-full h-full border-0"
            allowFullScreen
          />
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-lg shadow-md border border-slate-200 transition flex items-center gap-1.5"
            title="Abrir em tela cheia"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-[10px] font-bold hidden sm:inline">Tela Cheia</span>
          </button>
        </div>
      )}

      {/* Mapa Leaflet Interativo */}
      {mapMode === "leaflet" && (
        <LeafletMap
          activeCoords={activeCoords}
          location={location}
          handleLocationUpdate={handleLocationUpdate}
          markerEventHandlers={markerEventHandlers}
          markerRef={markerRef}
          handleUseMyLocation={handleUseMyLocation}
          isLocating={isLocating}
          height="350px"
        />
      )}

      {/* Split View: IGUA + Leaflet stacked */}
      {mapMode === "split" && (
        <div className="flex flex-col gap-2 flex-grow">
          <div className="relative w-full h-[200px] rounded-lg overflow-hidden shadow-md border border-slate-200">
            <iframe
              src={IGUA_MAP_URL}
              title="Mapa GIS IGUA"
              className="w-full h-full border-0"
              allowFullScreen
            />
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-md shadow border border-slate-200 transition"
              title="Abrir IGUA em tela cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <span className="absolute bottom-2 left-2 z-10 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded">
              IGUA — Cadastro de Esgoto
            </span>
          </div>
          <LeafletMap
            activeCoords={activeCoords}
            location={location}
            handleLocationUpdate={handleLocationUpdate}
            markerEventHandlers={markerEventHandlers}
            markerRef={markerRef}
            handleUseMyLocation={handleUseMyLocation}
            isLocating={isLocating}
            height="200px"
          />
        </div>
      )}

      {/* Dica de uso do mapa IGUA */}
      {mapMode === "igua" && (
        <p className="text-[10px] text-slate-400 mt-2 text-center leading-tight">
          Use o mapa da IGUA para consultar o cadastro de esgoto. Para marcar coordenadas, alterne para <strong>Interativo</strong> ou <strong>Lado a Lado</strong>.
        </p>
      )}
    </div>
  );
}
