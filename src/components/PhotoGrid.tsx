import { useState } from 'react';
import { PhotoEntry } from '../types';
import { compressPhoto, isLikelyImage } from '../lib/photoStorage';
import { Camera, Image, Trash2, Loader2, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  photos: PhotoEntry[];
  onPhotosChange: (photos: PhotoEntry[]) => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Visually hide an <input type="file"> without using display:none —
// some mobile browsers (iOS Safari, Samsung Internet) can fail to fire
// the camera/file picker reliably for inputs that are display:none or
// triggered only via a programmatic .click() on a ref. Keeping the input
// on-screen (just visually invisible) and wrapping it in a <label> is the
// reliable cross-browser pattern.
const hiddenInputStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function PhotoGrid({ photos, onPhotosChange, toast }: Props) {
  const [processing, setProcessing] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null, inputEl?: HTMLInputElement | null, source?: string) => {
    console.log('[photo] onChange fired', { source, fileCount: files?.length ?? 0 });
    if (!files || !files.length) {
      toast('No file selected', 'info');
      return;
    }
    setProcessing(true);
    try {
      const newPhotos: PhotoEntry[] = [];
      let failed = 0;
      let lastError = '';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('[photo] processing file', { name: file.name, type: file.type, size: file.size });
        if (!isLikelyImage(file)) {
          console.warn('[photo] skipped — not recognized as image', file.type, file.name);
          continue;
        }
        try {
          const entry = await compressPhoto(file);
          newPhotos.push(entry);
        } catch (err) {
          failed++;
          lastError = err instanceof Error ? err.message : String(err);
          console.error('[photo] compressPhoto failed', err);
        }
      }
      if (newPhotos.length) {
        onPhotosChange([...photos, ...newPhotos]);
        toast(`${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} added`, 'success');
      }
      if (failed) {
        toast(`${failed} photo${failed > 1 ? 's' : ''} failed: ${lastError}`, 'error');
      }
      if (!newPhotos.length && !failed) {
        toast('No image found in selection', 'error');
      }
    } catch (err) {
      console.error('[photo] handleFiles top-level error', err);
      toast(`Photo processing failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setProcessing(false);
      if (inputEl) inputEl.value = '';
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
        {/* Camera: label wraps the input directly so the tap-to-open-camera
            gesture is native, not a programmatic .click() — required by
            iOS Safari for the camera picker to appear reliably. */}
        <label
          className={`btn btn-ghost text-xs flex-1 ${processing ? 'opacity-50 pointer-events-none' : ''}`}
          style={{ cursor: processing ? 'default' : 'pointer' }}
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />}
          Camera
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={hiddenInputStyle}
            disabled={processing}
            onChange={e => handleFiles(e.target.files, e.target, 'camera')}
          />
        </label>

        {/* Gallery: multi-select, no capture attribute */}
        <label
          className={`btn btn-ghost text-xs flex-1 ${processing ? 'opacity-50 pointer-events-none' : ''}`}
          style={{ cursor: processing ? 'default' : 'pointer' }}
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />}
          Gallery
          <input
            type="file"
            accept="image/*"
            multiple
            style={hiddenInputStyle}
            disabled={processing}
            onChange={e => handleFiles(e.target.files, e.target, 'gallery')}
          />
        </label>
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
          No photos yet — use Camera or Gallery above
        </p>
      )}
    </div>
  );
}
