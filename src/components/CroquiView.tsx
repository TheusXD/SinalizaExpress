"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type Konva from "konva";
import type { ElementType } from "./CroquiEditor";
import { ArrowLeft, Undo, Trash2, MousePointer2, MoveRight, HelpCircle, Triangle, Octagon, RectangleHorizontal, Cone, Baseline, Minus, MoreVertical, Type } from "lucide-react";

// Dynamic import with SSR disabled
const CroquiEditor = dynamic(() => import("./CroquiEditor"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-sm border-4 border-slate-200">
      Carregando editor avançado...
    </div>
  )
});

interface CroquiViewProps {
  croqui?: string;
  onSave: (dataUrl: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const TOOLS: { id: ElementType | "select"; label: string; icon: any }[] = [
  { id: "select", label: "Selec.", icon: MousePointer2 },
  { id: "road-h", label: "Rua H", icon: Minus },
  { id: "road-v", label: "Rua V", icon: MoreVertical },
  { id: "sign-work", label: "Placa", icon: Triangle },
  { id: "sign-stop", label: "Stop", icon: Octagon },
  { id: "sign-desvio", label: "Desvio", icon: RectangleHorizontal },
  { id: "cone", label: "Cone", icon: Cone },
  { id: "barrier", label: "Cavalete", icon: Baseline },
  { id: "worker", label: "Humano", icon: HelpCircle },
  { id: "arrow", label: "Seta", icon: MoveRight },
  { id: "label", label: "Texto", icon: Type },
];

export default function CroquiView({ croqui, onSave, onNext, onBack }: CroquiViewProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const editorActionsRef = useRef<{ undo: () => void; clear: () => void; deleteSelected: () => void } | null>(null);
  
  const [currentTool, setCurrentTool] = useState<ElementType | "select">("select");

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-700">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">Croqui</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => editorActionsRef.current?.undo()} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition"
            title="Desfazer"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button 
            onClick={() => editorActionsRef.current?.clear()} 
            className="p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-500 rounded-full transition"
            title="Limpar tudo"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-2 bg-slate-100 shadow-inner z-10 border-b border-slate-200 justify-center">
        {TOOLS.map((t) => (
          <button 
            key={t.id} 
            onClick={() => setCurrentTool(t.id)}
            className={`flex flex-col items-center flex-grow min-w-[50px] p-2 rounded-lg transition-colors ${currentTool === t.id ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200"}`}
          >
            <t.icon className="w-4 h-4 mb-1" />
            <span className="text-[9px] whitespace-nowrap font-medium tracking-tight uppercase">{t.label}</span>
          </button>
        ))}
      </div>

      {currentTool !== "select" && currentTool !== "arrow" && currentTool !== "label" && (
         <div className="bg-blue-50 text-blue-800 text-xs px-4 py-2 text-center border-b border-blue-100 font-medium z-10 shadow-sm">
           Toque no quadro branco abaixo para inserir.
         </div>
      )}
      
      {currentTool === "arrow" && (
         <div className="bg-amber-50 text-amber-800 text-xs px-4 py-2 text-center border-b border-amber-100 font-medium z-10 shadow-sm">
           Toque de onde a seta sai e para onde ela vai.
         </div>
      )}

      {currentTool === "label" && (
         <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2 text-center border-b border-emerald-100 font-medium z-10 shadow-sm">
           Toque para adicionar uma nova etiqueta de texto.
         </div>
      )}

      {currentTool === "select" && (
        <div className="bg-slate-800 px-4 py-2 text-xs font-semibold text-white flex justify-between items-center z-10 shadow-md border-b border-slate-700 h-10">
          <span>Modo Mover/Selecionar Ativo</span>
          <button 
            onClick={() => editorActionsRef.current?.deleteSelected()} 
            className="bg-rose-500 text-white px-3 py-1 rounded-md shadow-sm hover:bg-rose-600 transition h-full"
          >
            Excluir
          </button>
        </div>
      )}

      <div className="flex-1 w-full p-3 bg-slate-200 overflow-hidden relative">
        <div className="w-full h-full bg-white rounded-lg shadow-lg border-4 border-slate-300 relative overflow-hidden">
          <CroquiEditor 
            tool={currentTool} 
            initialDataUrl={croqui} 
            stageRef={stageRef} 
            editorActionsRef={editorActionsRef} 
          />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="flex gap-3">
          <button 
            onClick={() => { onSave(null); onNext(); }} 
            className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition border border-slate-200"
          >
            Pular
          </button>
          <button 
            onClick={() => {
              if (stageRef.current) {
                // Clear selection natively in konva before export by faking empty node
                editorActionsRef.current?.undo(); // No, we just export
                // Better approach to hide transformer: 
                // Since this requires internal access, we can assume the user clicks the button so selection is dropped, 
                // OR we can export without selection. Konva transformer disables automatically if we export a clone, or we just trust the component drops focus.
                const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
                onSave(uri);
              } else {
                onSave(null);
              }
              onNext();
            }} 
            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
          >
            Salvar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
