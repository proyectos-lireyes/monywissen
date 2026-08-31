import React, { useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AvatarViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  onImageUpload?: (base64: string) => void;
  onImageDelete?: () => void;
  canEdit?: boolean;
}

export const AvatarViewerModal: React.FC<AvatarViewerModalProps> = ({ isOpen, onClose, imageUrl, title, onImageUpload, onImageDelete, canEdit = false }) => {
  const { showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('La imagen debe pesar menos de 2MB', '⚠️');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (onImageUpload && typeof reader.result === 'string') {
          onImageUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute top-4 right-4 flex gap-4">
        {canEdit && onImageUpload && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            title="Cambiar Foto"
          >
            <Upload className="w-6 h-6" />
          </button>
        )}
        {canEdit && onImageDelete && imageUrl && (
          <button
            onClick={onImageDelete}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-rose-400 transition-colors"
            title="Eliminar Foto"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md">
        <h2 className="text-white text-xl font-bold truncate max-w-xs">{title}</h2>
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden flex items-center justify-center shadow-2xl relative group">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl text-slate-500 font-bold">{title.slice(0,2).toUpperCase()}</span>
          )}
          {canEdit && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <span className="text-white font-semibold">Cambiar Foto</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
