import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCcw } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [error, setError] = useState<string | null>(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startCamera = useCallback(async (mode: 'environment' | 'user') => {
        stopCamera();
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: mode,
                    // Requests HD resolution (will fallback to max supported if lower)
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            streamRef.current = newStream;
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to access camera. Please check your browser permissions.');
        }
    }, []);

    useEffect(() => {
        startCamera(facingMode);

        // Cleanup: stop the camera track when the component unmounts
        return () => {
            stopCamera();
        };
    }, [facingMode, startCamera]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match the canvas size to the actual video stream size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw the current video frame onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to a JPEG file
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
            }
        }, 'image/jpeg', 0.9);
    };

    const toggleCamera = () => {
        setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={onClose}
                    className="p-3 text-white bg-black/50 rounded-full hover:bg-gray-800 transition-colors"
                    aria-label="Close camera"
                >
                    <X className="w-6 h-6" />
                </button>
                <button
                    onClick={toggleCamera}
                    className="p-3 text-white bg-black/50 rounded-full hover:bg-gray-800 transition-colors"
                    aria-label="Switch camera"
                >
                    <RefreshCcw className="w-6 h-6" />
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/90">
                    <div className="p-6 text-center bg-red-900/80 rounded-xl max-w-sm w-full">
                        <p className="mb-6 text-white text-lg">{error}</p>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 font-semibold text-black bg-white rounded-lg"
                        >
                            Close & Go Back
                        </button>
                    </div>
                </div>
            )}

            {/* Video Preview */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="flex-1 w-full h-full object-cover bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Bottom Capture Button */}
            <div className="absolute bottom-0 left-0 right-0 h-32 flex items-center justify-center pb-8 bg-gradient-to-t from-black/80 to-transparent">
                <button
                    onClick={handleCapture}
                    className="flex items-center justify-center w-20 h-20 bg-white border-4 border-gray-400 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
                    aria-label="Take photo"
                >
                    <Camera className="w-8 h-8 text-black" />
                </button>
            </div>
        </div>
    );
}