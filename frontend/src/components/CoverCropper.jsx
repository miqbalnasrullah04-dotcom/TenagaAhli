import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useTranslation } from '../context/LanguageContext.jsx';

/**
 * CoverCropper - Cover photo cropper with landscape aspect ratio
 * Designed for cover photos that will be displayed at 1400x400px (3.5:1 ratio)
 * 
 * @param {string} imageSrc - Source image URL (blob URL dari file yang dipilih)
 * @param {function} onCropComplete - Callback dengan cropped image blob
 * @param {function} onCancel - Callback ketika user cancel
 */
export default function CoverCropper({ imageSrc, onCropComplete, onCancel }) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = useCallback((location) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Function to create cropped image
  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error('Error cropping image:', e);
      alert(t('cover_crop.error', 'Gagal memotong foto. Silakan coba lagi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[120] flex flex-col">
      {/* Header */}
      <div className="bg-[#1F2A22] text-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-sm font-medium">{t('cover_crop.cancel', 'Batal')}</span>
        </button>
        <h2 className="text-sm font-semibold">{t('cover_crop.title', 'Sesuaikan Foto Cover')}</h2>
        <button
          onClick={createCroppedImage}
          disabled={loading}
          className="bg-[#8B4513] hover:bg-[#6B3410] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {loading ? t('cover_crop.processing', 'Memproses...') : t('cover_crop.done', 'Selesai')}
        </button>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={3.5} // Landscape aspect ratio for cover photo (1400:400 = 3.5:1)
          cropShape="rect" // Rectangle crop untuk cover photo
          showGrid={true}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
          style={{
            containerStyle: {
              background: 'rgba(0,0,0,0.5)',
            },
            cropAreaStyle: {
              border: '2px solid #8B4513',
            },
          }}
        />
      </div>

      {/* Zoom Controls */}
      <div className="bg-[#1F2A22] text-white px-6 py-6 flex items-center gap-4">
        <span className="material-symbols-outlined text-[20px]">zoom_out</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="flex-1 accent-[#8B4513] cursor-pointer"
        />
        <span className="material-symbols-outlined text-[20px]">zoom_in</span>
      </div>

      {/* Instructions */}
      <div className="bg-[#1F2A22] text-white/60 px-6 pb-4 space-y-2">
        <p className="text-center text-xs">
          {t('cover_crop.instructions', 'Geser untuk memposisikan · Pinch atau slider untuk zoom')}
        </p>
        <p className="text-center text-xs text-white/40">
          {t('cover_crop.dimensions', 'Foto cover akan ditampilkan dengan rasio 3.5:1 (landscape)')}
        </p>
      </div>
    </div>
  );
}

/**
 * Helper function to create image element
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Helper function to create cropped image blob
 */
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.9);
  });
}