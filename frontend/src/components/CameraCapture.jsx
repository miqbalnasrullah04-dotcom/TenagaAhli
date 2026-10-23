import { useRef, useState, useEffect } from 'react';

/**
 * CameraCapture - Real-time camera capture component
 * Menggunakan WebRTC getUserMedia untuk akses kamera langsung
 */
export default function CameraCapture({ onCapture, onCancel, mode = 'selfie', title, instruction }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState(mode === 'ktp' ? 'environment' : 'user'); // 'user' = depan, 'environment' = belakang

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e1) {
        // Fallback untuk HP / laptop yang tidak mendukung constraint resolusi spesifik
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
        } catch (e2) {
          // Fallback webcam laptop tanpa facingMode
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (_) {}
      }
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser HP atau laptop Anda.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Kamera tidak ditemukan. Pastikan HP atau laptop Anda terhubung dengan kamera aktif.');
      } else {
        setError('Tidak dapat mengakses kamera: ' + (err.message || 'Periksa izin kamera Anda.'));
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image as data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    setCaptured(true);
    stopCamera();
  };

  const retake = () => {
    setCaptured(false);
    setCapturedImage(null);
    startCamera();
  };

  const confirm = () => {
    if (!capturedImage) return;

    // Convert data URL to blob
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        onCapture(blob);
      });
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCaptured(false);
    setCapturedImage(null);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-[120] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center">
          <span className="material-symbols-outlined text-[48px] text-[#B3261E] mb-4">error</span>
          <h3 className="text-lg font-bold text-[#1F2A22] mb-2">Tidak Dapat Mengakses Kamera</h3>
          <p className="text-sm text-[#5B6660] mb-6">{error}</p>
          <button
            onClick={onCancel}
            className="bg-[#2E5E3B] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#244B2F] transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[120] flex flex-col">
      {/* Header */}
      <div className="bg-[#1F2A22] text-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
          {captured ? 'Hasil Foto' : (title || (mode === 'ktp' ? 'Foto Kartu KTP' : 'Ambil Foto'))}
        </h2>
        {!captured && (
          <button
            onClick={switchCamera}
            className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            title="Ganti kamera"
          >
            <span className="material-symbols-outlined">flip_camera_android</span>
          </button>
        )}
        {captured && <div className="w-10"></div>}
      </div>

      {/* Camera Preview / Captured Image */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Overlay guide */}
            {mode === 'ktp' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                {/* Single KTP Card Frame (Aspect ratio standard KTP/ID-1 card ~ 85.6mm x 54mm) */}
                <div className="w-full max-w-xs sm:max-w-md aspect-[85.6/54] rounded-2xl border-2 border-dashed border-amber-400 bg-amber-500/10 flex flex-col items-center justify-center text-center p-4 backdrop-blur-[0.5px] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  <div className="flex items-center gap-2 bg-black/75 px-3 py-1.5 rounded-full border border-white/20 mb-2">
                    <span className="material-symbols-outlined text-amber-400 text-lg">badge</span>
                    <span className="text-xs font-bold text-white">Posisikan Kartu KTP Di Sini</span>
                  </div>
                  <p className="text-[11px] text-white/90 font-medium max-w-xs">
                    Pastikan seluruh kartu KTP masuk dalam bingkai & terbaca jelas
                  </p>
                </div>
                <div className="mt-4 bg-black/80 text-amber-300 text-xs px-4 py-2 rounded-full backdrop-blur-sm border border-amber-400/40 font-semibold shadow-lg text-center max-w-md">
                  Posisikan kartu KTP Anda di dalam bingkai. Pastikan tulisan dan NIK terbaca jelas tanpa pantulan cahaya.
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 rounded-full border-4 border-white/30"></div>
              </div>
            )}
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="bg-[#1F2A22] px-6 py-5">
        {!captured ? (
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 active:scale-95 transition-all shadow-lg flex items-center justify-center"
              title="Ambil foto"
            >
              <div className="w-16 h-16 rounded-full border-4 border-[#2E5E3B]"></div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={retake}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <span className="material-symbols-outlined">refresh</span>
              Ambil Ulang
            </button>
            <button
              onClick={confirm}
              className="flex items-center gap-2 bg-[#2E5E3B] hover:bg-[#244B2F] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <span className="material-symbols-outlined">check</span>
              Gunakan & Simpan Foto Ini
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-[#1F2A22] text-white/70 px-6 pb-4 text-center text-xs">
        {!captured ? (instruction || (mode === 'ktp' ? 'Posisikan kartu KTP Anda di dalam bingkai lalu tekan tombol jepret bulat' : 'Tekan tombol bulat untuk mengambil foto')) : 'Periksa kembali foto Anda. Jika sudah jelas dan tidak buram, klik Gunakan & Simpan.'}
      </div>
    </div>
  );
}
