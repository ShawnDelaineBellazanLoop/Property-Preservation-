import { useRef, useState } from 'react';
import { PhotoEntry } from '../types';
import { compressPhoto } from '../lib/photoStorage';
import { Camera, Image, Trash2, Loader2, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface Props {
  photos: PhotoEntry[];
  onPhotosChange: (photos: PhotoEntry[]) => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PhotoGrid({ photos, onPhotosChange, toast }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setProcessing(true);
    try {
      const newPhotos: PhotoEntry[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const entry = await compressPhoto(file);
        newPhotos.push(entry);
      }
      if (newPhotos.length) {
        onPhotosChange([...photos, ...newPhotos]);
        toast(`${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} added`, 'success');
      }
    } catch (err) {
      toast('Photo processing failed', 'error');
    } finally {
      setProcessing(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  const deletePhoto = (id: string, closeLightbox = false) => {
    const remaining = photos.filter(p => p.id !== id);
    onPhotosChange(remaining);
    if (closeLightbox || remaining.length === 0) {
      setLightbox(null);
    } else if (lightbox !== null && lightbox >= remaining.length) {
      setLightbox(remaining.length - 1);
    }
  };

  const navLightbox = (dir: -1 | 1) => {
    setLightbox(prev => {
      if (prev === null) return null;
      const next = prev + dir;
      if (next < 0 || next >= photos.length) return prev;
      return next;
    });
  };

  return (
    <div>
      {/* Upload buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowCamera(true)}
          disabled={processing}
          className="btn btn-ghost text-xs flex-1 disabled:opacity-50"
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />}
          Camera
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={processing}
          className="btn btn-ghost text-xs flex-1 disabled:opacity-50"
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />}
          Gallery
        </button>

        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Processing placeholders */}
      {processing && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton rounded-lg" style={{ aspectRatio: '1', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
              <img
                src={photo.thumb || photo.dataUrl}
                alt={photo.name}
                className="photo-thumb w-full h-full cursor-pointer"
                onClick={() => setLightbox(idx)}
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setLightbox(idx)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={() => deletePhoto(photo.id)}
                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              {/* Time badge */}
              <div className="absolute bottom-1 left-1 text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.7)' }}>
                {photo.capturedAt}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={e => { if (e.target === e.currentTarget) setLightbox(null); }}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-10">
            <X className="w-5 h-5 text-white" />
          </button>

          {lightbox > 0 && (
            <button onClick={() => navLightbox(-1)} className="absolute left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer z-10">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button onClick={() => navLightbox(1)} className="absolute right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer z-10">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}

          <div className="flex flex-col items-center gap-3 max-w-2xl w-full px-4">
            <img
              src={photos[lightbox].dataUrl}
              alt={photos[lightbox].name}
              className="max-h-[75vh] rounded-xl object-contain shadow-2xl"
              style={{ maxWidth: '100%' }}
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/60 font-mono">{photos[lightbox].capturedAt}</span>
              <span className="text-white/30">·</span>
              <span className="text-xs text-white/60 font-mono">{lightbox + 1} / {photos.length}</span>
              <span className="text-white/30">·</span>
              <button
                onClick={() => deletePhoto(photos[lightbox].id, true)}
                className="btn btn-danger text-xs py-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {photos.length === 0 && !processing && (
        <p className="text-center text-[11px] py-4" style={{ color: 'var(--text-muted)' }}>
          No photos yet - use Camera or Gallery above
        </p>
      )}

      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          onCapture={async (file) => {
            setProcessing(true);
            try {
              const entry = await compressPhoto(file);
              onPhotosChange([...photos, entry]);
              toast('Photo added', 'success');
            } catch {
              toast('Photo processing failed', 'error');
            } finally {
              setProcessing(false);
            }
          }}
        />
      )}
    </div>
  );
}
