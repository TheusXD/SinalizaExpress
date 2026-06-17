"use client";

import { useState } from "react";
import { ArrowLeft, LayoutDashboard, FileText, Settings, BarChart2, Package, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import type { HistoryItem, InventoryItem } from "@/types";

interface DashboardViewProps {
  history: HistoryItem[];
  inventory: InventoryItem[];
  onSelectTemplate: (items: { id: string; quantity: number }[], elements: any[]) => void;
  onBack: () => void;
}

const templates = [
  {
    id: "vala",
    name: "Vala Aberta",
    desc: "Proteção de valas urbanas com cones, cavaletes e placas regulamentares.",
    items: [
      { id: "std-1", quantity: 1 }, // Placa Homens Trabalhando
      { id: "std-2", quantity: 6 }, // Cones
      { id: "std-3", quantity: 2 }, // Cavaletes
      { id: "std-7", quantity: 1 }, // Placa Vala Aberta
      { id: "std-11", quantity: 1 } // Cerquite / Tapume
    ],
    elements: [
      { id: "el-road", type: "road-h", x: 10, y: 100, xPercent: 0.05, yPercent: 0.4 },
      { id: "el-trench", type: "trench", x: 180, y: 110, xPercent: 0.45, yPercent: 0.44 },
      { id: "el-cone1", type: "cone", x: 160, y: 95, xPercent: 0.4, yPercent: 0.38 },
      { id: "el-cone2", type: "cone", x: 160, y: 135, xPercent: 0.4, yPercent: 0.54 },
      { id: "el-cone3", type: "cone", x: 230, y: 95, xPercent: 0.57, yPercent: 0.38 },
      { id: "el-cone4", type: "cone", x: 230, y: 135, xPercent: 0.57, yPercent: 0.54 },
      { id: "el-sign-work", type: "sign-work", x: 60, y: 112, xPercent: 0.15, yPercent: 0.45 },
      { id: "el-barrier", type: "barrier", x: 140, y: 112, xPercent: 0.35, yPercent: 0.45 }
    ]
  },
  {
    id: "emergencial",
    name: "Emergencial",
    desc: "Bloqueio ou desvio rápido de emergência em via pública.",
    items: [
      { id: "std-2", quantity: 8 }, // Cones
      { id: "std-3", quantity: 1 }, // Cavaletes
      { id: "std-9", quantity: 1 }, // Placa PARE/SIGA
      { id: "std-12", quantity: 1 } // Fita Zebrada
    ],
    elements: [
      { id: "el-road", type: "road-h", x: 10, y: 100, xPercent: 0.05, yPercent: 0.4 },
      { id: "el-cone1", type: "cone", x: 120, y: 90, xPercent: 0.3, yPercent: 0.36 },
      { id: "el-cone2", type: "cone", x: 140, y: 110, xPercent: 0.35, yPercent: 0.44 },
      { id: "el-cone3", type: "cone", x: 160, y: 130, xPercent: 0.4, yPercent: 0.52 },
      { id: "el-sign-pare", type: "sign-pare-siga", x: 80, y: 112, xPercent: 0.2, yPercent: 0.45 }
    ]
  },
  {
    id: "manutencao",
    name: "Manutenção de Via",
    desc: "Obras asfálticas de médio prazo com caminhão de barreira.",
    items: [
      { id: "std-1", quantity: 2 }, // Placa Homens Trabalhando
      { id: "std-2", quantity: 10 }, // Cones
      { id: "std-3", quantity: 2 }, // Cavaletes
      { id: "std-6", quantity: 1 }, // Placa Estreitamento de Via
      { id: "std-15", quantity: 1 } // Veículo Caminhão Barreira
    ],
    elements: [
      { id: "el-road", type: "road-h", x: 10, y: 100, xPercent: 0.05, yPercent: 0.4 },
      { id: "el-truck", type: "truck", x: 200, y: 105, xPercent: 0.5, yPercent: 0.42 },
      { id: "el-cone1", type: "cone", x: 140, y: 112, xPercent: 0.35, yPercent: 0.45 },
      { id: "el-cone2", type: "cone", x: 160, y: 112, xPercent: 0.4, yPercent: 0.45 },
      { id: "el-sign-work", type: "sign-work", x: 60, y: 112, xPercent: 0.15, yPercent: 0.45 }
    ]
  },
  {
    id: "temporaria",
    name: "Sinalização Temporária",
    desc: "Operação rápida de fluxo urbano ou controle simples de velocidade.",
    items: [
      { id: "std-1", quantity: 1 },
      { id: "std-2", quantity: 4 },
      { id: "std-3", quantity: 2 },
      { id: "std-8", quantity: 1 } // Placa Limite de Velocidade
    ],
    elements: [
      { id: "el-road", type: "road-h", x: 10, y: 100, xPercent: 0.05, yPercent: 0.4 },
      { id: "el-sign-speed", type: "sign-speed", x: 60, y: 112, xPercent: 0.15, yPercent: 0.45 },
      { id: "el-cone1", type: "cone", x: 140, y: 112, xPercent: 0.35, yPercent: 0.45 },
      { id: "el-cone2", type: "cone", x: 180, y: 112, xPercent: 0.45, yPercent: 0.45 }
    ]
  }
];

export default function DashboardView({ history, inventory, onSelectTemplate, onBack }: DashboardViewProps) {
  const [tab, setTab] = useState<"kpis" | "templates" | "statistics">("kpis");

  // KPI Calculations
  const totalWorks = history.length;
  const itemsInUse = inventory.reduce((acc, curr) => acc + curr.inUse, 0);
  const pendingDevolutions = history.filter(h => !h.returnedAt).length;

  const lowStockItems = inventory.filter(item => {
    const available = item.totalStock - item.inUse;
    return item.minStock !== undefined && item.minStock > 0 && available <= item.minStock;
  });

  const handleApplyTemplate = (template: typeof templates[0]) => {
    if (confirm(`Aplicar modelo "${template.name}"? Isso ira limpar o planejamento atual.`)) {
      onSelectTemplate(template.items, template.elements);
    }
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
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
          Painel & Estatísticas
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-6 border border-slate-200 shrink-0">
        <button
          onClick={() => setTab("kpis")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "kpis" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Indicadores
        </button>
        <button
          onClick={() => setTab("templates")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "templates" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Modelos
        </button>
        <button
          onClick={() => setTab("statistics")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "statistics" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Estatísticas
        </button>
      </div>

      {/* Tab content */}
      {tab === "kpis" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Total de Obras
              </span>
              <span className="text-3xl font-black text-slate-800 mt-2">{totalWorks}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-500" />
                Placas em Campo
              </span>
              <span className="text-3xl font-black text-slate-800 mt-2">{itemsInUse}</span>
            </div>

            <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition ${
              lowStockItems.length > 0 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-white border-slate-200"
            }`}>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? "text-rose-600 animate-pulse" : "text-slate-400"}`} />
                Alerta de Estoque
              </span>
              <span className={`text-3xl font-black mt-2 ${lowStockItems.length > 0 ? "text-rose-700" : "text-slate-800"}`}>
                {lowStockItems.length}
              </span>
            </div>

            <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition ${
              pendingDevolutions > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-white border-slate-200"
            }`}>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${pendingDevolutions > 0 ? "text-amber-500" : "text-slate-400"}`} />
                Pendente Devolução
              </span>
              <span className={`text-3xl font-black mt-2 ${pendingDevolutions > 0 ? "text-amber-700" : "text-slate-800"}`}>
                {pendingDevolutions}
              </span>
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Itens Abaixo do Estoque Mínimo
              </h4>
              <ul className="text-xs text-rose-700 space-y-1 font-medium">
                {lowStockItems.map(item => {
                  const available = item.totalStock - item.inUse;
                  return (
                    <li key={item.id} className="flex justify-between border-b border-rose-100 py-1 last:border-0">
                      <span>{item.name}</span>
                      <span>Disponível: {available} (Mínimo: {item.minStock})</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs border border-blue-100 font-medium">
            💡 Os modelos preenchem automaticamente a lista de materiais necessários e geram um croqui básico de sinalização correspondente para você editar.
          </div>
          
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-colors">
              <div>
                <h4 className="font-bold text-slate-800 text-base">{tpl.name}</h4>
                <p className="text-slate-500 text-xs mt-1 leading-normal">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {tpl.items.map(ti => {
                    const matchedName = inventory.find(i => i.id === ti.id)?.name || ti.id;
                    return (
                      <span key={ti.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {ti.quantity}x {matchedName}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => handleApplyTemplate(tpl)}
                className="w-full mt-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-lg transition"
              >
                Aplicar Modelo
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "statistics" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              Taxa de Utilização de Estoque
            </h3>

            {inventory.length === 0 ? (
              <p className="text-slate-500 italic text-sm text-center py-4">Nenhum item cadastrado no estoque para cálculo.</p>
            ) : (
              <div className="space-y-4">
                {inventory.map(item => {
                  const usePercent = item.totalStock > 0 ? Math.min(100, Math.round((item.inUse / item.totalStock) * 100)) : 0;
                  
                  return (
                    <div key={item.id} className="space-y-1 text-sm">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span className="truncate max-w-[70%]">{item.name}</span>
                        <span>{item.inUse} / {item.totalStock} ({usePercent}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            usePercent > 90 ? "bg-rose-500" : usePercent > 50 ? "bg-amber-400" : "bg-emerald-500"
                          }`}
                          style={{ width: `${usePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center py-6">
            <h4 className="text-sm font-bold text-slate-700">Taxa de Execução Geral</h4>
            <p className="text-3xl font-black text-blue-600 mt-2">
              {totalWorks > 0 ? `${Math.round(((totalWorks - pendingDevolutions) / totalWorks) * 100)}%` : "0%"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Obras concluídas e devolvidas de forma íntegra.</p>
          </div>
        </div>
      )}
    </div>
  );
}
