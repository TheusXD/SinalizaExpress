"use client";

import { useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import MapView from "@/components/MapView";
import ChecklistView from "@/components/ChecklistView";
import CroquiView from "@/components/CroquiView";
import SummaryView from "@/components/SummaryView";
import HistoryView from "@/components/HistoryView";
import { ClipboardList } from "lucide-react";

type ViewStage = "map" | "checklist" | "croqui" | "summary" | "history";

export default function Home() {
  const { state, history, isLoaded, actions } = useAppStore();
  const [stage, setStage] = useState<ViewStage>("map");

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        Carregando aplicativo...
      </div>
    );
  }

  return (
    <main className="h-screen w-full max-w-md mx-auto bg-white shadow-xl overflow-hidden flex flex-col relative text-slate-900">
      
      {stage !== "history" && (
        <header className="bg-blue-600 text-white p-4 shadow-sm z-10 relative">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-xl font-black tracking-wide">
              Sinaliza<span className="text-blue-200">Express</span>
            </h1>
            <button
               onClick={() => setStage("history")}
               className="p-2 rounded-full hover:bg-blue-700 transition relative"
               title="Ver Histórico de Obras"
            >
              <ClipboardList className="w-6 h-6" />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-blue-600"></span>
              )}
            </button>
          </div>

          <div className="flex justify-between text-[10px] font-medium text-blue-200 mt-2 px-1">
            <span className={stage === "map" ? "text-white font-bold" : ""}>1. Mapa</span>
            <span className={stage === "checklist" ? "text-white font-bold" : ""}>2. Checklist</span>
            <span className={stage === "croqui" ? "text-white font-bold" : ""}>3. Croqui</span>
            <span className={stage === "summary" ? "text-white font-bold" : ""}>4. Resumo</span>
          </div>
          <div className="h-1.5 bg-blue-800 rounded-full mt-2 overflow-hidden mx-1">
            <div 
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: stage === "map" ? "25%" : stage === "checklist" ? "50%" : stage === "croqui" ? "75%" : "100%" }}
            />
          </div>
        </header>
      )}

      <div className="flex-1 overflow-hidden relative bg-slate-50">
        {stage === "map" && (
          <MapView 
            location={state.location}
            onLocationSelect={actions.setLocation}
            onNext={() => setStage("checklist")}
          />
        )}

        {stage === "checklist" && (
          <ChecklistView
            items={state.checklist.items}
            observations={state.checklist.observations}
            customSigns={state.customSigns}
            addCustomSign={actions.addCustomSign}
            removeCustomSign={actions.removeCustomSign}
            onUpdateQuantity={actions.updateChecklistItem}
            onUpdateObservations={actions.setObservations}
            onNext={() => setStage("croqui")}
            onBack={() => setStage("map")}
          />
        )}

        {stage === "croqui" && (
          <CroquiView
            croqui={state.croqui}
            onSave={actions.setCroqui}
            onNext={() => setStage("summary")}
            onBack={() => setStage("checklist")}
          />
        )}

        {stage === "summary" && (
          <SummaryView
            state={state}
            onUpdateResponsible={actions.setResponsible}
            onSaveHistory={actions.saveToHistory}
            onReset={() => { actions.clearState(); setStage("map"); }}
            onBack={() => setStage("checklist")}
          />
        )}

        {stage === "history" && (
          <HistoryView
            history={history}
            onRemove={actions.removeFromHistory}
            onBack={() => setStage("map")}
          />
        )}
      </div>

    </main>
  );
}
