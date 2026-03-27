"use client";

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Group, Rect, RegularPolygon, Circle, Arrow, Text, Transformer, Line, Image as KonvaImage } from "react-konva";
import type Konva from "konva";

export type ElementType =
  | "road-h" | "road-v"
  | "sign-work" | "sign-stop" | "sign-desvio"
  | "cone" | "barrier" | "worker"
  | "arrow" | "label";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  points?: number[]; // [x1,y1,x2,y2]
  text?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface CroquiEditorProps {
  initialDataUrl?: string;
  stageRef: React.RefObject<Konva.Stage | null>;
  tool: ElementType | "select";
  editorActionsRef: React.MutableRefObject<{
    undo: () => void;
    clear: () => void;
    deleteSelected: () => void;
  } | null>;
}

export default function CroquiEditor({ initialDataUrl, stageRef, tool, editorActionsRef }: CroquiEditorProps) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  
  const historyRef = useRef<CanvasElement[][]>([]);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Resize Observer
  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    
    // Initial size
    const width = parent.clientWidth;
    setSize({ width, height: (width * 10) / 16 });

    const observer = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) {
        setSize({ width: w, height: (w * 10) / 16 });
      }
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  // Background Image Restoration
  useEffect(() => {
    if (initialDataUrl && !bgImage) {
      const img = new window.Image();
      img.src = initialDataUrl;
      img.onload = () => setBgImage(img);
    }
  }, [initialDataUrl, bgImage]);

  // Hook up Transformer
  useEffect(() => {
    if (!selectedId) {
      transformerRef.current?.nodes([]);
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    const node = stage.findOne(`#${selectedId}`);
    if (node) transformerRef.current?.nodes([node]);
  }, [selectedId, elements]);

  // Expose Editor Actions
  useEffect(() => {
    editorActionsRef.current = {
      undo: () => {
        if (historyRef.current.length > 0) {
          const prev = historyRef.current.pop();
          setElements(prev ?? []);
          setSelectedId(null);
        }
      },
      clear: () => {
        historyRef.current.push(structuredClone(elements));
        setElements([]);
        setSelectedId(null);
        setBgImage(null);
      },
      deleteSelected: () => {
        if (selectedId) {
          historyRef.current.push(structuredClone(elements));
          setElements(prev => prev.filter(e => e.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
  }, [elements, selectedId, editorActionsRef]);

  // Stage Mouse Down
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.hasName("bg-image");
    
    if (clickedOnEmpty) {
      setSelectedId(null);

      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      if (tool === "arrow") {
        if (!arrowStart) {
          setArrowStart(pos);
        } else {
          historyRef.current.push(structuredClone(elements));
          setElements([...elements, { id: `el-${crypto.randomUUID()}`, type: "arrow", x: 0, y: 0, points: [arrowStart.x, arrowStart.y, pos.x, pos.y] }]);
          setArrowStart(null);
        }
      } else if (tool === "label") {
        const text = window.prompt("Texto da etiqueta:");
        if (text) {
          historyRef.current.push(structuredClone(elements));
          setElements([...elements, { id: `el-${crypto.randomUUID()}`, type: "label", x: pos.x, y: pos.y, text }]);
        }
      } else if (tool !== "select") {
        historyRef.current.push(structuredClone(elements));
        // Center offsets
        let halfW = 0, halfH = 0;
        if (tool === "road-h") { halfW = 55; halfH = 19; }
        else if (tool === "road-v") { halfW = 19; halfH = 55; }
        else if (tool === "sign-desvio") { halfW = 28; halfH = 15; }
        else if (tool === "barrier") { halfW = 32; halfH = 9; }

        setElements([...elements, { id: `el-${crypto.randomUUID()}`, type: tool as ElementType, x: pos.x - halfW, y: pos.y - halfH }]);
      }
    }
  };

  const handleDragStart = () => {
    historyRef.current.push(structuredClone(elements));
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return { ...el, x: e.target.x(), y: e.target.y() };
      }
      return el;
    }));
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const id = e.target.id();
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return {
          ...el,
          x: e.target.x(),
          y: e.target.y(),
          rotation: e.target.rotation(),
          scaleX: e.target.scaleX(),
          scaleY: e.target.scaleY()
        };
      }
      return el;
    }));
  };

  if (size.width === 0) return <div ref={containerRef} className="w-full h-full" />;

  return (
    <div ref={containerRef} className="w-full h-full cursor-crosshair touch-none">
      <Stage 
        width={size.width} 
        height={size.height} 
        ref={stageRef}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
      >
        <Layer>
          {bgImage && <KonvaImage image={bgImage} width={size.width} height={size.height} name="bg-image" />}
          
          {/* Arrow preview */}
          {tool === "arrow" && arrowStart && (
            <Circle x={arrowStart.x} y={arrowStart.y} radius={5} fill="#3b82f6" />
          )}

          {elements.map((el) => {
            if (el.type === "arrow") {
              return (
                <Arrow
                  key={el.id}
                  id={el.id}
                  points={el.points || []}
                  stroke={selectedId === el.id ? "#6366f1" : "#374151"}
                  fill={selectedId === el.id ? "#6366f1" : "#374151"}
                  strokeWidth={2.5}
                  pointerLength={10}
                  pointerWidth={8}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => {
                     const target = e.target;
                     setElements(prev => prev.map(item => item.id === el.id ? { ...item, x: target.x(), y: target.y() } : item));
                  }}
                  onClick={() => setSelectedId(el.id)}
                  onTap={() => setSelectedId(el.id)}
                />
              );
            }

            if (el.type === "label") {
              return (
                <Text
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.text}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#1e293b"
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedId(el.id)}
                  onTap={() => setSelectedId(el.id)}
                />
              );
            }

            return (
              <Group
                key={el.id}
                id={el.id}
                x={el.x}
                y={el.y}
                rotation={el.rotation || 0}
                scaleX={el.scaleX || 1}
                scaleY={el.scaleY || 1}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                onClick={() => setSelectedId(el.id)}
                onTap={() => setSelectedId(el.id)}
              >
                {el.type === "road-h" && (
                  <>
                    <Rect width={110} height={38} fill="#6b7280" cornerRadius={4} />
                    <Line points={[10, 19, 100, 19]} stroke="#fff" strokeWidth={2} dash={[10, 8]} />
                  </>
                )}
                {el.type === "road-v" && (
                  <>
                    <Rect width={38} height={110} fill="#6b7280" cornerRadius={4} />
                    <Line points={[19, 10, 19, 100]} stroke="#fff" strokeWidth={2} dash={[10, 8]} />
                  </>
                )}
                {el.type === "sign-work" && (
                  <>
                    <RegularPolygon sides={3} radius={22} fill="#f59e0b" stroke="#b45309" strokeWidth={2} />
                    <Text text="!" fontSize={18} fontStyle="bold" fill="#7c2d12" offsetX={-1} offsetY={8} />
                  </>
                )}
                {el.type === "sign-stop" && (
                  <>
                    <RegularPolygon sides={8} radius={20} fill="#ef4444" stroke="#991b1b" strokeWidth={2} />
                    <Text text="STOP" fontSize={8} fontStyle="bold" fill="#fff" offsetX={11} offsetY={4} />
                  </>
                )}
                {el.type === "sign-desvio" && (
                  <>
                    <Rect width={56} height={30} fill="#3b82f6" stroke="#1d4ed8" cornerRadius={4} />
                    <Text text="DESVIO" fontSize={9} fontStyle="bold" fill="#fff" x={4} y={9} />
                  </>
                )}
                {el.type === "cone" && (
                  <>
                    <RegularPolygon sides={3} radius={18} fill="#f97316" stroke="#c2410c" strokeWidth={1.5} />
                    <Rect width={28} height={5} fill="#fff" offsetX={14} offsetY={-2} />
                    <Rect width={32} height={6} fill="#9ca3af" offsetX={16} offsetY={-14} />
                  </>
                )}
                {el.type === "barrier" && (
                  <>
                    <Rect width={8} height={20} fill="#9ca3af" x={10} y={15} />
                    <Rect width={8} height={20} fill="#9ca3af" x={46} y={15} />
                    <Rect width={64} height={18} fill="#f97316" stroke="#c2410c" cornerRadius={3} />
                    <Rect width={64} height={6} fill="#fff" y={6} />
                  </>
                )}
                {el.type === "worker" && (
                  <>
                    <Circle radius={8} fill="#fbbf24" stroke="#92400e" offsetX={0} offsetY={12} />
                    <Rect width={16} height={20} fill="#f97316" offsetX={8} offsetY={0} />
                    <Line points={[8, 4, 16, 12]} stroke="#111827" strokeWidth={3} />
                    <Line points={[-8, 4, -16, 12]} stroke="#111827" strokeWidth={3} />
                    <Line points={[4, 20, 6, 32]} stroke="#111827" strokeWidth={3} />
                    <Line points={[-4, 20, -6, 32]} stroke="#111827" strokeWidth={3} />
                  </>
                )}
              </Group>
            );
          })}

          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            borderStroke="#6366f1"
            borderStrokeDash={[4, 3]}
            anchorStroke="#6366f1"
            anchorFill="#fff"
            anchorSize={8}
          />
        </Layer>
      </Stage>
    </div>
  );
}
