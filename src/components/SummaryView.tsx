import { useState } from "react";
import { MapPin, Share2, ArrowLeft, FileText, CheckSquare, Camera } from "lucide-react";
import type { PwaState, HistoryItem } from "@/types";

const IGUA_MAP_URL = "https://gis.iguasa.com.br/portal/apps/webappviewer/index.html?id=0d16863d15fa4d0ba5473f0299accdd7";

interface SummaryViewProps {
  state: PwaState;
  history: HistoryItem[];
  onUpdateResponsible: (name: string) => void;
  onSaveHistory: () => Promise<void>;
  onReset: () => void;
  onBack: () => void;
}

export default function SummaryView({ state, history, onUpdateResponsible, onSaveHistory, onReset, onBack }: SummaryViewProps) {
  const { location, checklist, responsible } = state;
  const [triedToSave, setTriedToSave] = useState(false);
  const isDuplicate = history.some(h => h.workId === state.currentWorkId);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedItems = checklist.items.filter(item => item.quantity > 0);
  const networkChecklist = location?.networkChecklist || [];
  const checkedNetworkItems = networkChecklist.filter(c => c.checked);
  const photos = state.photos || [];

  const generateText = () => {
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

    if (location?.networkNotes) {
      text += `\n*🔧 Rede de Esgoto:*\n${location.networkNotes}\n`;
    }

    if (checkedNetworkItems.length > 0) {
      text += `\n*✅ Verificações de Rede:*\n`;
      checkedNetworkItems.forEach(item => {
        text += `- ✓ ${item.label}\n`;
      });
    }

    if (checklist.observations) {
      text += `\n*📝 Observações:*\n${checklist.observations}\n`;
    }

    if (state.croqui) {
      text += `\n📐 Croqui de sinalização em anexo.\n`;
    }

    if (photos.length > 0) {
      text += `\n📷 ${photos.length} foto(s) do local em anexo.\n`;
    }

    text += `\n🗺️ Mapa IGUA (Cadastro de Esgoto):\n${IGUA_MAP_URL}\n`;

    return text;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const text = generateText();

    // Tentar compartilhamento nativo com imagem (Web Share API)
    if (state.croqui && navigator.share) {
      try {
        const res = await fetch(state.croqui);
        const blob = await res.blob();
        const file = new File([blob], `croqui-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'SinalizaExpress - Planejamento',
            text: text,
            files: [file]
          });
          return; // Sucesso no compartilhamento nativo
        }
      } catch (err) {
        console.error("Erro ao compartilhar nativamente com imagem:", err);
      }
    }

    // Fallback: Apenas texto via WhatsApp
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Title & Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("SinalizaExpress", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Relatorio de Planejamento de Sinalizacao de Obra", 14, 26);
      
      // Horizontal Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, 30, 196, 30);

      // Metadata Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Informacoes da Obra", 14, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Data: ${new Date(state.date).toLocaleDateString("pt-BR")}`, 14, 48);
      if (responsible) {
        doc.text(`Responsavel Tecnico: ${responsible}`, 14, 54);
      }

      // Location
      let yLoc = 60;
      if (location) {
        doc.setFont("helvetica", "bold");
        doc.text("Localizacao:", 14, yLoc);
        doc.setFont("helvetica", "normal");
        
        yLoc += 6;
        if (location.address && location.address !== "Buscando endereço...") {
          const splitAddress = doc.splitTextToSize(location.address, 180);
          doc.text(splitAddress, 14, yLoc);
          yLoc += splitAddress.length * 5;
        }
        doc.text(`Coordenadas: Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`, 14, yLoc);
        yLoc += 6;
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(`Link do Google Maps: https://www.google.com/maps?q=${location.lat},${location.lng}`, 14, yLoc);
        doc.setTextColor(30, 41, 59);
        yLoc += 10;
      }

      // Checklist Items
      let yItems = yLoc;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Equipamentos / Placas Selecionadas", 14, yItems);
      
      yItems += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      if (selectedItems.length === 0) {
        doc.text("Nenhum item selecionado.", 14, yItems);
        yItems += 8;
      } else {
        // Draw small table header
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(14, yItems, 182, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Equipamento", 16, yItems + 5);
        doc.text("Qtd", 180, yItems + 5);
        yItems += 7;
        
        doc.setFont("helvetica", "normal");
        selectedItems.forEach((item) => {
          if (yItems > 270) {
            doc.addPage();
            yItems = 20;
          }
          doc.text(item.name, 16, yItems + 5);
          doc.text(item.quantity.toString(), 180, yItems + 5);
          
          doc.setDrawColor(241, 245, 249);
          doc.line(14, yItems + 7, 196, yItems + 7);
          yItems += 7;
        });
      }

      // ========= REDE DE ESGOTO SECTION =========
      if (location?.networkNotes || checkedNetworkItems.length > 0) {
        if (yItems > 240) {
          doc.addPage();
          yItems = 20;
        }
        yItems += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(13, 148, 136); // teal-600
        doc.text("Rede de Esgoto", 14, yItems);
        doc.setTextColor(30, 41, 59);
        yItems += 6;

        if (location?.networkNotes) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const splitNotes = doc.splitTextToSize(location.networkNotes, 180);
          doc.text(splitNotes, 14, yItems);
          yItems += splitNotes.length * 5 + 4;
        }

        if (checkedNetworkItems.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("Verificacoes realizadas:", 14, yItems);
          yItems += 5;
          doc.setFont("helvetica", "normal");
          checkedNetworkItems.forEach(item => {
            if (yItems > 270) {
              doc.addPage();
              yItems = 20;
            }
            doc.text(`  [x] ${item.label}`, 14, yItems);
            yItems += 5;
          });
          yItems += 2;
        }

        // IGUA Map Link
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(37, 99, 235);
        doc.text("Mapa IGUA (Cadastro de Esgoto):", 14, yItems);
        yItems += 4;
        doc.text(IGUA_MAP_URL, 14, yItems);
        doc.setTextColor(30, 41, 59);
        yItems += 6;
      }

      // Observations
      if (checklist.observations) {
        if (yItems > 250) {
          doc.addPage();
          yItems = 20;
        }
        yItems += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Observacoes:", 14, yItems);
        doc.setFont("helvetica", "normal");
        yItems += 6;
        const splitObs = doc.splitTextToSize(checklist.observations, 180);
        doc.text(splitObs, 14, yItems);
        yItems += splitObs.length * 5;
      }

      // Croqui Image
      if (state.croqui) {
        if (yItems > 150) { 
          doc.addPage();
          yItems = 20;
        }
        yItems += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Croqui de Sinalizacao:", 14, yItems);
        yItems += 6;
        doc.addImage(state.croqui, "PNG", 14, yItems, 182, 102);
        yItems += 108;
      }

      // ========= PHOTOS SECTION =========
      if (photos.length > 0) {
        doc.addPage();
        let yPhoto = 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(109, 40, 217); // violet-700
        doc.text(`Fotos do Local (${photos.length})`, 14, yPhoto);
        doc.setTextColor(30, 41, 59);
        yPhoto += 8;

        for (let i = 0; i < photos.length; i++) {
          if (yPhoto > 200) {
            doc.addPage();
            yPhoto = 20;
          }
          try {
            doc.addImage(photos[i].dataUrl, "JPEG", 14, yPhoto, 85, 64);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(
              `Foto ${i + 1} — ${new Date(photos[i].timestamp).toLocaleString("pt-BR")}`,
              14, yPhoto + 68
            );
            yPhoto += 75;
          } catch (imgErr) {
            console.error("Error adding photo to PDF:", imgErr);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.text(`[Foto ${i + 1} — erro ao carregar]`, 14, yPhoto + 5);
            yPhoto += 12;
          }
        }
      }

      doc.save(`sinaliza_relatorio_${Date.now()}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar o relatório em PDF.");
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

      {/* Rede de Esgoto */}
      {(location?.networkNotes || checkedNetworkItems.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
            <FileText className="text-teal-600" />
            Rede de Esgoto
          </h3>
          {location?.networkNotes && (
            <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 text-sm text-teal-800 mb-3 whitespace-pre-wrap">
              {location.networkNotes}
            </div>
          )}
          {checkedNetworkItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                Verificações realizadas:
              </p>
              <ul className="space-y-1">
                {checkedNetworkItems.map(item => (
                  <li key={item.id} className="text-sm text-teal-700 flex items-center gap-2">
                    <span className="text-teal-500 font-bold">✓</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <a
            href={IGUA_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            🗺️ Abrir Mapa IGUA ↗
          </a>
        </div>
      )}

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

      {/* Fotos do Local */}
      {photos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-violet-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-violet-800 mb-3 flex items-center gap-2">
            <Camera className="text-violet-600" />
            Fotos do Local ({photos.length})
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="rounded-lg overflow-hidden border border-slate-200 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.dataUrl}
                  alt={photo.caption || "Foto"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Responsável</h3>
        <input
          type="text"
          value={responsible}
          onChange={(e) => {
            onUpdateResponsible(e.target.value);
            if (e.target.value.trim()) {
              setSaveError(null);
            }
          }}
          placeholder="Nome do técnico/encarregado"
          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${
            triedToSave && !responsible.trim()
              ? "border-rose-500 bg-rose-50 focus:ring-rose-500 text-rose-900"
              : "border-slate-300 text-slate-900"
          }`}
        />
        {triedToSave && !responsible.trim() && (
          <p className="text-rose-600 text-xs mt-1 font-medium">O nome do responsável é obrigatório.</p>
        )}
      </div>

      {isDuplicate && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex items-start gap-2.5">
          <span className="text-lg shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="font-bold text-sm leading-tight mb-1">Planejamento já salvo</p>
            <p className="text-xs leading-normal">Este planejamento de obra já foi registrado no histórico. Clique em "Nova Obra" para iniciar um novo planejamento.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-auto">
        <button
          onClick={handleShare}
          className="w-full py-4 bg-green-500 hover:bg-green-600 shadow-md text-white font-bold rounded-xl text-lg flex justify-center items-center gap-2 transition"
        >
          <Share2 className="w-6 h-6" />
          Compartilhar 
        </button>

        <button
          onClick={handleExportPDF}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 shadow-md text-white font-bold rounded-xl text-md flex justify-center items-center gap-2 transition"
        >
          <span className="text-lg">📄</span>
          Exportar Relatório PDF
        </button>

        <div className="flex gap-2 w-full mt-2">
          {saved || isDuplicate ? (
             <div className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center justify-center">
               Salvo ✓
             </div>
          ) : (
             <div className="flex flex-col w-full flex-1 gap-2">
               {saveError && (
                 <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-start gap-2 leading-tight">
                   <span className="shrink-0 mt-0.5">⚠️</span>
                   <span>{saveError}</span>
                 </div>
               )}
               <button
                 onClick={async () => { 
                   setTriedToSave(true);
                   if (!responsible.trim()) {
                     setSaveError("Por favor, preencha o nome do responsável.");
                     return;
                   }
                   try {
                     setSaveError(null);
                     await onSaveHistory(); 
                     setSaved(true); 
                   } catch (err: any) {
                     setSaveError(err.message || "Erro ao salvar no histórico.");
                   }
                 }}
                 className="w-full py-3 bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center justify-center transition hover:bg-blue-200"
               >
                 Salvar no Histórico
               </button>
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
