import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import CameraCapture from './CameraCapture';

// Adjust this interface if your app uses a different structure for photos
export interface PhotoEntry {
    id: string;
    dataUrl: string;
    timestamp: number;
}

interface PhotoGridProps {
    photos: PhotoEntry[];
    onAddPhoto: (photo: PhotoEntry) => void;
    onRemovePhoto: (id: string) => void;
}

export default function PhotoGrid({ photos, onAddPhoto, onRemovePhoto }: PhotoGridProps) {
    const [showCamera, setShowCamera] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // In-browser compression to prevent Android out-of-memory crashes
    const compressPhoto = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // Downscale to 1024px maximum dimension
                    const MAX_DIM = 1024;

                    if (width > height) {
                        if (width > MAX_DIM) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                        }
                    } else {
                        if (height > MAX_DIM) {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error("Failed to get canvas context"));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG at 70% quality (0.7)
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const processAndAddFile = async (file: File) => {
        try {
            const compressedDataUrl = await compressPhoto(file);
            onAddPhoto({
                id: crypto.randomUUID(),
                dataUrl: compressedDataUrl,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("Error compressing photo:", error);
            alert("Failed to process photo.");
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            await processAndAddFile(files[i]);
        }

        // Reset input so the same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-4">
                {/* Opens the custom in-page camera instead of native capture */}
                <button
                    onClick={() => setShowCamera(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#00FF87] text-black rounded-lg font-bold hover:bg-[#00cc6a] active:scale-95 transition-all"
                >
                    <Camera className="w-5 h-5" />
                    Camera
                </button>

                {/* Opens native gallery selector */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 text-white border border-gray-700 rounded-lg font-medium hover:bg-gray-700 active:scale-95 transition-all"
                >
                    <ImageIcon className="w-5 h-5" />
                    Gallery
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </div>

            {/* Photo Grid */}
            {photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="relative aspect-square group rounded-lg overflow-hidden border border-gray-700 bg-gray-900"
                        >
                            <img
                                src={photo.dataUrl}
                                alt="Property documentation"
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setLightboxImage(photo.dataUrl)}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemovePhoto(photo.id);
                                }}
                                className="absolute top-2 right-2 p-2 bg-red-600/90 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-500"
                                aria-label="Delete photo"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-lg bg-gray-900/50">
                    No photos attached to this item yet.
                </div>
            )}

            {/* In-Page Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onClose={() => setShowCamera(false)}
                    onCapture={(file) => {
                        processAndAddFile(file);
                        // Notice: We do NOT close the camera here. 
                        // This allows the inspector to rapidly snap multiple photos!
                    }}
                />
            )}

            {/* Lightbox Modal for Fullscreen Viewing */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-3 text-white bg-gray-800/80 rounded-full hover:bg-gray-700 z-[210]"
                        onClick={() => setLightboxImage(null)}
                        aria-label="Close fullscreen"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Enlarged property view"
                        className="max-w-full max-h-[90vh] object-contain rounded-md"
                        onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing lightbox
                    />
                </div>
            )}
        </div>
    );
}