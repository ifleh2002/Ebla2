import React, { useState, useEffect, useRef } from 'react';
import { CameraSurveillanceItem } from '../types';
import {
  Video,
  Maximize2,
  Minimize2,
  Camera,
  Moon,
  Sun,
  ZoomIn,
  Radio,
  ShieldCheck,
  Settings,
  Download,
  CheckCircle2,
  Grid,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface ChantierLiveCamerasProps {
  cameras: CameraSurveillanceItem[];
  isEditable?: boolean;
  onUpdateCamera?: (updated: CameraSurveillanceItem) => void;
  onCaptureSnapshot?: (cameraCode: string, zone: string, dataUrl: string) => void;
}

export const ChantierLiveCameras: React.FC<ChantierLiveCamerasProps> = ({
  cameras,
  isEditable = false,
  onUpdateCamera,
  onCaptureSnapshot,
}) => {
  const [selectedCamId, setSelectedCamId] = useState<string | null>(null);
  const [clockStr, setClockStr] = useState<string>(() =>
    new Date().toLocaleTimeString('fr-FR', { hour12: false })
  );
  const [dateStr] = useState<string>(() =>
    new Date().toLocaleDateString('fr-FR')
  );
  const [nightVisionMap, setNightVisionMap] = useState<Record<string, boolean>>({});
  const [zoomMap, setZoomMap] = useState<Record<string, number>>({});
  const [editingCam, setEditingCam] = useState<CameraSurveillanceItem | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<{
    camCode: string;
    zone: string;
    time: string;
    dataUrl: string;
  } | null>(null);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockStr(new Date().toLocaleTimeString('fr-FR', { hour12: false }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleNightVision = (id: string) => {
    setNightVisionMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cycleZoom = (id: string) => {
    setZoomMap((prev) => {
      const current = prev[id] || 1;
      const next = current === 1 ? 1.4 : current === 1.4 ? 1.8 : 1;
      return { ...prev, [id]: next };
    });
  };

  const handleSnapshot = (cam: CameraSurveillanceItem) => {
    const videoEl = videoRefs.current[cam.id];
    let dataUrl = '';
    if (videoEl && videoEl.videoWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          // Stamp OSD header on captured frame
          ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
          ctx.fillRect(16, 16, 520, 54);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 18px monospace';
          ctx.fillText(
            `${cam.code} · ${cam.nom} · ${dateStr} ${clockStr}`,
            28,
            48
          );
          dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        }
      } catch (_e) {
        // Fallback if cross-origin video
      }
    }

    const snapTime = `${dateStr} ${clockStr}`;
    setLastSnapshot({
      camCode: cam.code,
      zone: `${cam.nom} (${cam.immeublesCouverts})`,
      time: snapTime,
      dataUrl,
    });

    if (onCaptureSnapshot && dataUrl) {
      onCaptureSnapshot(cam.code, `${cam.nom} - ${cam.immeublesCouverts}`, dataUrl);
    }
  };

  const displayedCameras = selectedCamId
    ? cameras.filter((c) => c.id === selectedCamId)
    : cameras;

  return (
    <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Surveillance Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>STREAMING DIRECT 24/7</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>4 Caméras IP 4K/HD · Chantier Mansouria</span>
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-400" />
            <span>Centre de Télésurveillance &amp; Suivi des Travaux à Distance 24/7</span>
          </h3>
          <p className="text-xs text-slate-400">
            Visualisation en temps réel des 6 Immeubles (A à F), de la piscine centrale, des 9 magasins et du sous-sol (230 places).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Clock OSD */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              {dateStr} &middot; {clockStr}
            </span>
          </div>

          {/* Quad / Single Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedCamId(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedCamId === null
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Mosaïque 4 Caméras</span>
            </button>
            {cameras.map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => setSelectedCamId(cam.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  selectedCamId === cam.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cam.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Snapshot Notification Banner */}
      {lastSnapshot && (
        <div className="p-3.5 bg-slate-900/95 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            {lastSnapshot.dataUrl && (
              <img
                src={lastSnapshot.dataUrl}
                alt={lastSnapshot.camCode}
                className="w-16 h-11 object-cover rounded-lg border border-slate-700"
              />
            )}
            <div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Capture d'écran enregistrée depuis {lastSnapshot.camCode} ({lastSnapshot.time})
                </span>
              </div>
              <div className="text-[11px] text-slate-300">{lastSnapshot.zone}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSnapshot.dataUrl && (
              <a
                href={lastSnapshot.dataUrl}
                download={`CAPTURE-${lastSnapshot.camCode}-${Date.now()}.jpg`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger Photo HD</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setLastSnapshot(null)}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* 4 Cameras Grid (2x2 in Quad mode, 1x1 in Focused mode) */}
      <div
        className={`grid gap-4 ${
          selectedCamId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {displayedCameras.map((cam) => {
          const isNight = Boolean(nightVisionMap[cam.id]);
          const zoom = zoomMap[cam.id] || 1;
          const isFocused = selectedCamId === cam.id;

          return (
            <div
              key={cam.id}
              className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col"
            >
              {/* Video Viewport */}
              <div
                className={`relative w-full overflow-hidden bg-black ${
                  isFocused ? 'h-[420px] sm:h-[500px]' : 'h-60 sm:h-68'
                }`}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[cam.id] = el;
                  }}
                  src={cam.streamUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{
                    transform: `scale(${zoom})`,
                    filter: isNight
                      ? 'sepia(100%) hue-rotate(85deg) saturate(260%) brightness(0.92) contrast(1.25)'
                      : 'contrast(1.04)',
                  }}
                />

                {/* Subtle scanline & CCTV corner reticle */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60" />

                {/* Top Left OSD: Camera Code + Live Indicator + Resolution */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                  <span className="px-2 py-0.5 rounded bg-slate-950/85 border border-slate-700 text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{cam.code}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-bold tracking-wider uppercase">
                    LIVE 24/7
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950/80 text-slate-200 text-[10px] font-mono border border-slate-700">
                    {cam.resolution}
                  </span>
                  {isNight && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      IR NIGHT VISION
                    </span>
                  )}
                  {zoom > 1 && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[10px] font-mono font-bold">
                      ZOOM {zoom.toFixed(1)}x
                    </span>
                  )}
                </div>

                {/* Top Right OSD: Real-Time Clock & Bitrate */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-950/85 border border-slate-800 text-[11px] font-mono text-slate-200 z-10">
                  {dateStr} {clockStr} &middot; 4.8 Mbps
                </div>

                {/* Bottom Overlay Info + Interactive Controls */}
                <div className="absolute bottom-3 inset-x-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2 z-10">
                  <div className="bg-slate-950/85 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-800/90">
                    <div className="text-xs font-bold text-white">{cam.nom}</div>
                    <div className="text-[11px] text-amber-300 font-medium">
                      {cam.immeublesCouverts}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {cam.zone} &middot; {cam.anglePtz}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end">
                    <button
                      type="button"
                      onClick={() => handleSnapshot(cam)}
                      className="p-2 rounded-lg bg-slate-900/90 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 transition-colors cursor-pointer"
                      title="Capturer une photo instantanée du chantier"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => cycleZoom(cam.id)}
                      className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      title="Zoom numérique"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleNightVision(cam.id)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isNight
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700'
                      }`}
                      title="Basculer Vision Nocturne Infrarouge"
                    >
                      {isNight ? (
                        <Sun className="w-3.5 h-3.5" />
                      ) : (
                        <Moon className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => setEditingCam(cam)}
                        className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
                        title="Paramétrer le flux de la caméra"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCamId(isFocused ? null : cam.id)
                      }
                      className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 transition-colors cursor-pointer"
                      title={isFocused ? 'Retour à la mosaïque 4 caméras' : 'Agrandir cette caméra'}
                    >
                      {isFocused ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to edit camera stream URL & zone (for Executive Board) */}
      {editingCam && onUpdateCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold">
                  Configuration Flux Caméra {editingCam.code}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingCam(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Fermer
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateCamera(editingCam);
                setEditingCam(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nom de la caméra
                </label>
                <input
                  type="text"
                  required
                  value={editingCam.nom}
                  onChange={(e) =>
                    setEditingCam({ ...editingCam, nom: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Immeubles &amp; Zones couverts
                </label>
                <input
                  type="text"
                  required
                  value={editingCam.immeublesCouverts}
                  onChange={(e) =>
                    setEditingCam({
                      ...editingCam,
                      immeublesCouverts: e.target.value,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  URL du Flux Streaming (MP4 / HLS / WebRTC / IP Cam)
                </label>
                <input
                  type="text"
                  required
                  value={editingCam.streamUrl}
                  onChange={(e) =>
                    setEditingCam({ ...editingCam, streamUrl: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Résolution
                  </label>
                  <select
                    value={editingCam.resolution}
                    onChange={(e) =>
                      setEditingCam({
                        ...editingCam,
                        resolution: e.target.value as CameraSurveillanceItem['resolution'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="4K UHD">4K UHD</option>
                    <option value="1080p Full HD">1080p Full HD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Angle PTZ
                  </label>
                  <input
                    type="text"
                    value={editingCam.anglePtz}
                    onChange={(e) =>
                      setEditingCam({ ...editingCam, anglePtz: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCam(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Enregistrer le Flux</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
