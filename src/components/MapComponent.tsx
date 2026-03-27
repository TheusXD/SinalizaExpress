"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2, Search, X } from "lucide-react";
import type { LocationData } from "@/types";

// Fix for default marker icon in Leaflet + Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapComponentProps {
  location: LocationData | null;
  onLocationSelect: (loc: LocationData) => void;
}

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
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`, {
          headers: { "Accept-Language": "pt-BR" }
        });
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error("Address search error:", e);
      } finally {
        setIsLoading(false);
      }
    }, 400);

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

function LocationMarker({ location, onLocationSelect }: MapComponentProps) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng, address: "Buscando endereço..." });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        onLocationSelect({ lat, lng, address: data.display_name });
      } catch (err) {
        onLocationSelect({ lat, lng });
      }
    },
  });

  return location ? <Marker position={[location.lat, location.lng]} /> : null;
}

// MapFlyTo prevents interference with user's manual navigation
function MapFlyTo({ location }: { location: LocationData | null }) {
  const map = useMap();
  const prevTarget = useRef<string | null>(null);
  
  useEffect(() => {
    if (location) {
      const currentTarget = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
      if (prevTarget.current !== currentTarget) {
        map.flyTo([location.lat, location.lng], 16, { duration: 1.5 });
        prevTarget.current = currentTarget;
      }
    }
  }, [location, map]);
  return null;
}

export default function MapComponent({ location, onLocationSelect }: MapComponentProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect({ lat: latitude, lng: longitude, address: "Buscando endereço..." });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          onLocationSelect({ lat: latitude, lng: longitude, address: data.display_name });
        } catch (err) {
          onLocationSelect({ lat: latitude, lng: longitude });
        }
        
        setIsLocating(false);
      },
      (error) => {
        alert("Erro ao buscar localização: " + error.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const initialCenter: [number, number] = [-23.550520, -46.633308]; // Default to São Paulo if no location exists

  return (
    <div className="flex flex-col h-full w-full">
      <AddressSearch onSelect={onLocationSelect} />
      
      <div className="relative w-full h-[350px] rounded-lg overflow-hidden shadow-md flex-grow z-0">
        <MapContainer 
          center={location ? [location.lat, location.lng] : initialCenter} 
          zoom={15} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker location={location} onLocationSelect={onLocationSelect} />
          <MapFlyTo location={location} />
        </MapContainer>

        <button
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 z-[400] bg-white text-blue-600 p-3 rounded-full shadow-lg hover:bg-gray-100 flex items-center justify-center transition disabled:opacity-80"
          title="Usar minha localização"
        >
          {isLocating ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <LocateFixed className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
