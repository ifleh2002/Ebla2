import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PropertyLot } from '../types';
import { Compass, Sun, Moon, RotateCcw, Eye, Camera, Sparkles } from 'lucide-react';

interface Virtual3DTourProps {
  lot: PropertyLot;
}

export const Virtual3DTour: React.FC<Virtual3DTourProps> = ({ lot }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightingMode, setLightingMode] = useState<'day' | 'sunset'>('day');
  const [currentView, setCurrentView] = useState<'global' | 'salon' | 'chambre' | 'terrasse'>('global');
  const [isInteracting, setIsInteracting] = useState(false);

  // References to keep Three.js scene alive
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 420;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(lightingMode === 'day' ? 0xe2e8f0 : 0x1e1e2f);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(12, 11, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear previous canvas
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.8);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Floor Base (Parquet / Marbre)
    const floorGeo = new THREE.BoxGeometry(10, 0.2, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdfd7cc, // Warm travertine / oak
      roughness: 0.35,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.1, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Terrace Floor (Decking wood / exterior tile)
    const terraceGeo = new THREE.BoxGeometry(10, 0.2, 2.5);
    const terraceMat = new THREE.MeshStandardMaterial({
      color: 0xc4a482,
      roughness: 0.6,
    });
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.position.set(0, -0.09, -5.25);
    terrace.receiveShadow = true;
    scene.add(terrace);

    // Glass Balustrade on Terrace overlooking pool & ocean
    const glassGeo = new THREE.BoxGeometry(10, 1.1, 0.08);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.85,
      opacity: 0.7,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });
    const glassBalustrade = new THREE.Mesh(glassGeo, glassMat);
    glassBalustrade.position.set(0, 0.55, -6.5);
    scene.add(glassBalustrade);

    // Outer and Inner Walls (Cutaway architectural section)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });

    const createWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // Back wall
    createWall(10, 2.8, 0.25, 0, 1.4, 4);
    // Right wall
    createWall(0.25, 2.8, 8, 5, 1.4, 0);
    // Left wall
    createWall(0.25, 2.8, 8, -5, 1.4, 0);
    // Interior dividing partition (Living Room / Bedroom)
    createWall(0.2, 2.4, 5.5, 0.5, 1.2, 1.25);

    // Contemporary Furniture:
    // 1. Modern L-Sofa in Living Room
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 1.2), sofaMat);
    sofaMain.position.set(-2.5, 0.35, 1.8);
    sofaMain.castShadow = true;
    scene.add(sofaMain);

    const sofaL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.6), sofaMat);
    sofaL.position.set(-1.5, 0.35, 0.4);
    sofaL.castShadow = true;
    scene.add(sofaL);

    // Coffee table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.8), tableMat);
    table.position.set(-2.5, 0.18, 0.4);
    table.castShadow = true;
    scene.add(table);

    // 2. Master Bed in Bedroom
    const bedBaseMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const bedSheetMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9 });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 2.4), bedSheetMat);
    bed.position.set(2.8, 0.3, 2.4);
    bed.castShadow = true;
    scene.add(bed);

    // Headboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.2), bedBaseMat);
    headboard.position.set(2.8, 0.6, 3.7);
    scene.add(headboard);

    // 3. Terrace Lounge Chairs & Coffee Table
    const outdoorMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const lounger1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), outdoorMat);
    lounger1.position.set(-2, 0.2, -5.2);
    lounger1.rotation.y = 0.2;
    scene.add(lounger1);

    const lounger2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), outdoorMat);
    lounger2.position.set(2, 0.2, -5.2);
    lounger2.rotation.y = -0.2;
    scene.add(lounger2);

    // Ocean & Pool Ground Horizon Disc in the background
    const oceanGeo = new THREE.CircleGeometry(35, 32);
    const oceanMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -0.25, -20);
    scene.add(ocean);

    // Mouse / Touch Interaction Orbit variables
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = new THREE.Spherical(18, Math.PI / 3.5, Math.PI / 4);

    const updateCameraFromSpherical = () => {
      camera.position.setFromSpherical(spherical);
      camera.lookAt(targetLookAt.current);
    };
    updateCameraFromSpherical();

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      setIsInteracting(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      spherical.theta -= deltaX * 0.007;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.007));

      updateCameraFromSpherical();

      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(8, Math.min(28, spherical.radius + e.deltaY * 0.015));
      updateCameraFromSpherical();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domElem.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Subtle atmospheric ocean wave pulsation
      ocean.position.y = -0.25 + Math.sin(Date.now() * 0.001) * 0.04;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElem.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElem.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update lighting theme
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current) return;

    if (lightingMode === 'sunset') {
      sceneRef.current.background = new THREE.Color(0x1e1528);
      dirLightRef.current.color = new THREE.Color(0xf59e0b); // Warm amber golden hour
      dirLightRef.current.intensity = 1.8;
      dirLightRef.current.position.set(-15, 6, -10);
      hemiLightRef.current.color = new THREE.Color(0xfbbf24);
      hemiLightRef.current.groundColor = new THREE.Color(0x312e81);
    } else {
      sceneRef.current.background = new THREE.Color(0xe0f2fe); // Bright Atlantic sky
      dirLightRef.current.color = new THREE.Color(0xfffbeb);
      dirLightRef.current.intensity = 1.3;
      dirLightRef.current.position.set(10, 16, 10);
      hemiLightRef.current.color = new THREE.Color(0xffffff);
      hemiLightRef.current.groundColor = new THREE.Color(0x475569);
    }
  }, [lightingMode]);

  // Camera presets
  const setPresetView = (view: 'global' | 'salon' | 'chambre' | 'terrasse') => {
    setCurrentView(view);
    if (!cameraRef.current) return;

    const camera = cameraRef.current;

    switch (view) {
      case 'global':
        camera.position.set(13, 11, 14);
        camera.lookAt(0, 0, 0);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'salon':
        camera.position.set(-2, 3, 4.5);
        camera.lookAt(-2, 0.8, 0.8);
        targetLookAt.current.set(-2, 0.8, 0.8);
        break;
      case 'chambre':
        camera.position.set(2.8, 3.2, 5.2);
        camera.lookAt(2.8, 0.8, 2);
        targetLookAt.current.set(2.8, 0.8, 2);
        break;
      case 'terrasse':
        camera.position.set(0, 2.2, -2.5);
        camera.lookAt(0, 0.8, -8);
        targetLookAt.current.set(0, 0.8, -8);
        break;
    }
  };

  return (
    <div className="relative flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md">
      {/* 3D Top Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 pointer-events-auto">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-white tracking-wide">
            Visite 3D Interactive &middot; {lot.id} ({lot.typology})
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            WebGL 60 FPS
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Lighting Mode */}
          <button
            onClick={() => setLightingMode(lightingMode === 'day' ? 'sunset' : 'day')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/90 text-white border border-slate-700 hover:bg-slate-700 backdrop-blur-md transition-colors"
            title="Basculer entre Plein Jour et Coucher de Soleil Mansouria"
          >
            {lightingMode === 'day' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Plein Soleil</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Golden Hour</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[360px] sm:h-[440px] cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Orbit Interaction Helper text */}
      <div className="absolute bottom-16 left-3 z-10 pointer-events-none">
        <span className="text-[11px] text-slate-300 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-700/50">
          Glissez pour faire pivoter à 360° &middot; Molette ou pincement pour zoomer
        </span>
      </div>

      {/* Bottom Camera Presets bar */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Points de vue :</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setPresetView('global')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              currentView === 'global' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Vue 3D Isométrique
          </button>

          <button
            onClick={() => setPresetView('salon')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              currentView === 'salon' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Salon & Séjour
          </button>

          <button
            onClick={() => setPresetView('chambre')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              currentView === 'chambre' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Suite Parentale
          </button>

          <button
            onClick={() => setPresetView('terrasse')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              currentView === 'terrasse' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Terrasse Vue Mer
          </button>
        </div>
      </div>
    </div>
  );
};
