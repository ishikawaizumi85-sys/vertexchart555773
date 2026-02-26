import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { cn } from '../lib/utils';

interface DrawingCanvasProps {
  imageUrl: string;
  onExport: (dataUrl: string) => void;
  width: number;
  height: number;
}

interface Shape {
  id: string;
  type: 'trend' | 'snr';
  points: number[];
  color: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ imageUrl, onExport, width, height }) => {
  const [image] = useImage(imageUrl);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<'trend' | 'snr' | 'eraser'>('trend');
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<any>(null);

  const handleMouseDown = (e: any) => {
    if (tool === 'eraser') return;
    
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    
    const newShape: Shape = {
      id: crypto.randomUUID(),
      type: tool,
      points: tool === 'snr' ? [0, pos.y, width, pos.y] : [pos.x, pos.y, pos.x, pos.y],
      color: tool === 'snr' ? '#3b82f6' : '#10b981',
    };
    
    setShapes([...shapes, newShape]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || tool === 'eraser') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastShape = shapes[shapes.length - 1];
    
    if (lastShape.type === 'trend') {
      lastShape.points = [lastShape.points[0], lastShape.points[1], point.x, point.y];
    } else if (lastShape.type === 'snr') {
      lastShape.points = [0, point.y, width, point.y];
    }

    shapes.splice(shapes.length - 1, 1, lastShape);
    setShapes(shapes.concat());
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    exportCanvas();
  };

  const handleShapeClick = (id: string) => {
    if (tool === 'eraser') {
      setShapes(shapes.filter(s => s.id !== id));
      setTimeout(exportCanvas, 0);
    }
  };

  const exportCanvas = () => {
    if (stageRef.current) {
      const dataUrl = stageRef.current.toDataURL();
      onExport(dataUrl);
    }
  };

  const clear = () => {
    setShapes([]);
    setTimeout(exportCanvas, 0);
  };

  return (
    <div className="relative w-full h-full flex flex-col gap-2 md:gap-4">
      <div className="flex flex-wrap gap-2 p-1.5 md:p-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl self-start z-20">
        <button 
          onClick={() => setTool('trend')}
          className={cn(
            "px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all",
            tool === 'trend' ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "text-zinc-600 hover:text-indigo-400"
          )}
        >
          Trend
        </button>
        <button 
          onClick={() => setTool('snr')}
          className={cn(
            "px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all",
            tool === 'snr' ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "text-zinc-600 hover:text-purple-400"
          )}
        >
          SNR
        </button>
        <button 
          onClick={() => setTool('eraser')}
          className={cn(
            "px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all",
            tool === 'eraser' ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "text-zinc-600 hover:text-red-400"
          )}
        >
          Eraser
        </button>
        <div className="w-[1px] bg-white/5 mx-0.5 md:mx-1" />
        <button 
          onClick={clear}
          className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-all"
        >
          Clear
        </button>
      </div>

      <div className="relative flex-1 bg-black border border-white/5 rounded-[32px] overflow-hidden shadow-inner">
        <Stage
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          ref={stageRef}
          className="cursor-crosshair"
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={width}
                height={height}
                listening={false}
              />
            )}
            {shapes.map((shape) => (
              <Line
                key={shape.id}
                points={shape.points}
                stroke={shape.color}
                strokeWidth={3}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                onClick={() => handleShapeClick(shape.id)}
                hitStrokeWidth={20}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
