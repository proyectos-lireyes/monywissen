import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move, RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (croppedBase64: string) => void;
  title?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  title = 'Ajustar y Recortar Foto de Perfil',
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset controls when a new image is loaded
  useEffect(() => {
    if (isOpen && imageSrc) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const moveBy = (dx: number, dy: number) => {
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleConfirm = () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const targetSize = 300; // Output 300x300 high clarity avatar
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetSize, targetSize);

    const img = imageRef.current;
    const viewportSize = 240; // Size of circular frame in UI
    const factor = targetSize / viewportSize;

    ctx.save();
    // Center of canvas
    ctx.translate(targetSize / 2, targetSize / 2);
    // Apply position
    ctx.translate(position.x * factor, position.y * factor);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply scale
    ctx.scale(scale, scale);

    // Draw centered image
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    // Calculate aspect fit inside viewport
    const aspect = imgWidth / imgHeight;
    let drawW = viewportSize;
    let drawH = viewportSize;
    if (aspect > 1) {
      drawH = viewportSize / aspect;
    } else {
      drawW = viewportSize * aspect;
    }

    ctx.drawImage(
      img,
      -((drawW * factor) / 2),
      -((drawH * factor) / 2),
      drawW * factor,
      drawH * factor
    );

    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    onConfirm(croppedBase64);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport & Drag Canvas Container */}
        <div className="relative w-full flex flex-col items-center justify-center my-2">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 border-blue-500 shadow-2xl overflow-hidden relative cursor-grab active:cursor-grabbing bg-slate-900 flex items-center justify-center touch-none select-none"
          >
            {/* Background Grid Guide */}
            <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none z-10" />

            <img
              ref={imageRef}
              src={imageSrc}
              alt="Ajustar foto"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              draggable={false}
              className="pointer-events-none select-none"
            />
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-2 flex items-center gap-1">
            <Move className="w-3 h-3 text-blue-500" /> Arrastra con el dedo/mouse para mover
          </p>
        </div>

        {/* Adjustments Controls */}
        <div className="w-full space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
              className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 shrink-0"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.2))}
              className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 shrink-0"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Precision Navigation D-Pad & Rotation */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveBy(0, -10)}
                className="p-1 bg-white dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600"
                title="Arriba"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveBy(0, 10)}
                className="p-1 bg-white dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600"
                title="Abajo"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveBy(-10, 0)}
                className="p-1 bg-white dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600"
                title="Izquierda"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveBy(10, 0)}
                className="p-1 bg-white dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600"
                title="Derecha"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 flex items-center gap-1 text-[10px] font-bold"
                title="Rotar"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotar
              </button>

              <button
                onClick={() => {
                  setScale(1);
                  setRotation(0);
                  setPosition({ x: 0, y: 0 });
                }}
                className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                title="Restablecer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" /> Confirmar Foto
          </button>
        </div>
      </div>
    </div>
  );
};
