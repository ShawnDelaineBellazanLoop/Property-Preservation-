import { useRef, useState, useEffect, useCallback } from 'react';
import { X, RefreshCcw, Camera } from 'lucide-react';

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startStream = useCallback(async (mode: 'environment' | 'user') => {
    stopStream();
    setReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError(err?.message || 'Camera access denied. Check browser permissions.');
    }
  }, []);

  useEffect(() => {
    startStream(facingMode);
    return () => stopStream();
  }, [facingMode, startStream]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    canvas.toBlob(blob => {
      if (blob) {
        onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col bg-black"
      style={{ touchAction: 'none' }}
    >
      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <button
          onClick={onClose}
          className="p-3 rounded-full"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          aria-label="Close camera"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
          className="p-3 rounded-full"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          aria-label="Flip camera"
        >
          <RefreshCcw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black">
          <div className="p-6 rounded-2xl text-center max-w-xs w-full"
            style={{ background: 'var(--card)', border: '1px solid rgba(255,80,80,0.3)' }}>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button onClick={onClose} className="btn w-full" style={{ background: 'var(--green)', color: '#000' }}>
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 z-20 bg-white pointer-events-none" style={{ opacity: 0.6 }} />
      )}

      {/* Loading state */}
      {!ready && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--green)', borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onCanPlay={() => setReady(true)}
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter button */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-10 pt-4"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
        <button
          onClick={handleCapture}
          disabled={!ready}
          aria-label="Take photo"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: ready ? '#fff' : 'rgba(255,255,255,0.3)',
            border: '4px solid rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s',
          }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Camera className="w-7 h-7" style={{ color: '#000' }} />
        </button>
      </div>
    </div>
  );
}
