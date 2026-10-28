import * as THREE from 'three';

export interface MaterialLibrary {
  whiteMarbleMain: THREE.MeshStandardMaterial;
  whiteMarbleTrim: THREE.MeshStandardMaterial;
  whiteMarbleAccent: THREE.MeshStandardMaterial;
  blackObsidianMain: THREE.MeshStandardMaterial;
  blackObsidianBlade: THREE.MeshStandardMaterial;
  blackObsidianCore: THREE.MeshStandardMaterial;
  boardLightSquare: THREE.MeshStandardMaterial;
  boardDarkSquare: THREE.MeshStandardMaterial;
  boardCursedOverlay: THREE.MeshStandardMaterial;
  boardSelectedOverlay: THREE.MeshStandardMaterial;
  boardLegalMoveOverlay: THREE.MeshStandardMaterial;
  boardLegalCaptureOverlay: THREE.MeshStandardMaterial;
  boardBorderStone: THREE.MeshStandardMaterial;
  palaceStonePillar: THREE.MeshStandardMaterial;
  palaceFloorMarble: THREE.MeshStandardMaterial;
  cursedBarkRoot: THREE.MeshStandardMaterial;
  biolumFloraCyan: THREE.MeshStandardMaterial;
  biolumFloraEmerald: THREE.MeshStandardMaterial;
  rustedRelicIron: THREE.MeshStandardMaterial;
  tarnishedRoyalGold: THREE.MeshStandardMaterial;
  ghostKingCloak: THREE.MeshStandardMaterial;
  ghostKingCrown: THREE.MeshStandardMaterial;
  ghostSpectralGlow: THREE.MeshBasicMaterial;
  primalSkinMaterial: THREE.MeshStandardMaterial;
  primalScarMaterial: THREE.MeshStandardMaterial;
  primalWrapMaterial: THREE.MeshStandardMaterial;
  contactShadowMat: THREE.MeshBasicMaterial;
  dispose: () => void;
}

function createMarbleTextures(maxAniso: number, isLight: boolean) {
  const size = 128;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Base fill
  ctx.fillStyle = isLight ? '#ece6d9' : '#12131a';
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Subtle mineral veins & micro-cracks
  for (let i = 0; i < 28; i++) {
    ctx.beginPath();
    bCtx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    bCtx.moveTo(x, y);
    for (let s = 0; s < 10; s++) {
      x += (Math.random() - 0.45) * 36;
      y += (Math.random() - 0.45) * 36;
      ctx.lineTo(x, y);
      bCtx.lineTo(x, y);
    }
    if (isLight) {
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(184, 148, 86, 0.32)' : 'rgba(110, 102, 92, 0.24)';
    } else {
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(190, 38, 65, 0.35)' : 'rgba(45, 195, 210, 0.22)';
    }
    ctx.lineWidth = 0.8 + Math.random() * 1.8;
    ctx.stroke();

    bCtx.strokeStyle = i % 2 === 0 ? '#505050' : '#a8a8a8';
    bCtx.lineWidth = 1.2;
    bCtx.stroke();
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAniso;

  return { colorMap, bumpMap };
}

function createBarkBumpTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#707070';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#353535' : '#b5b5b5';
    ctx.fillRect(Math.random() * size, Math.random() * size, 3 + Math.random() * 6, 24 + Math.random() * 40);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

function createRadialContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPalaceSandstoneTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm ancient royal sandstone / terracotta base
  ctx.fillStyle = '#6e5644';
  ctx.fillRect(0, 0, size, size);

  // Ashlar stone courses & carved mortar lines
  const rows = 8;
  const rowH = size / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    ctx.fillStyle = r % 2 === 0 ? 'rgba(255, 215, 165, 0.08)' : 'rgba(30, 20, 14, 0.12)';
    ctx.fillRect(0, y, size, rowH);

    ctx.strokeStyle = 'rgba(28, 18, 12, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    const cols = 4;
    const colW = size / cols;
    const offset = (r % 2) * (colW / 2);
    for (let c = 0; c <= cols; c++) {
      const x = (c * colW + offset) % size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  // Subtle moss & age patina flecks
  for (let i = 0; i < 32; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(52, 211, 153, 0.14)' : 'rgba(217, 155, 67, 0.12)';
    ctx.fillRect(
      Math.random() * size,
      Math.random() * size,
      3 + Math.random() * 8,
      2 + Math.random() * 6
    );
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAniso;
  return tex;
}

export function createMaterialLibrary(renderer: THREE.WebGLRenderer): MaterialLibrary {
  const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy() || 1, 4);
  const lightMarble = createMarbleTextures(maxAniso, true);
  const darkObsidian = createMarbleTextures(maxAniso, false);
  const barkBump = createBarkBumpTexture(maxAniso);
  const sandstoneTex = createPalaceSandstoneTexture(maxAniso);
  const shadowTex = createRadialContactShadowTexture();

  // 1. Player Piece Materials: Carved Ancient White Marble + Worn Royal Brass/Gold (Fast single-pass PBR)
  const whiteMarbleMain = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lightMarble.colorMap,
    bumpMap: lightMarble.bumpMap,
    bumpScale: 0.016,
    roughness: 0.2,
    metalness: 0.08,
  });

  const whiteMarbleTrim = new THREE.MeshStandardMaterial({
    color: 0xe2cfa6,
    roughness: 0.48,
    metalness: 0.35,
  });

  const whiteMarbleAccent = new THREE.MeshStandardMaterial({
    color: 0xe5a93c,
    emissive: 0x452708,
    emissiveIntensity: 0.25,
    roughness: 0.22,
    metalness: 0.85,
  });

  // 2. Ghost King Piece Materials: Cursed Razor-Sharp Black Obsidian + Spectral Veins (Fast single-pass PBR)
  const blackObsidianMain = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: darkObsidian.colorMap,
    bumpMap: darkObsidian.bumpMap,
    bumpScale: 0.02,
    roughness: 0.11,
    metalness: 0.42,
  });

  const blackObsidianBlade = new THREE.MeshStandardMaterial({
    color: 0x262d40,
    emissive: 0x082f49,
    emissiveIntensity: 0.25,
    roughness: 0.35,
    metalness: 0.78,
  });

  const blackObsidianCore = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00b8d4,
    emissiveIntensity: 1.85,
    roughness: 0.2,
    metalness: 0.1,
  });

  // 3. Chessboard Materials (64 squares + carved border)
  const boardLightSquare = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lightMarble.colorMap,
    bumpMap: lightMarble.bumpMap,
    bumpScale: 0.012,
    roughness: 0.3,
    metalness: 0.08,
  });

  const boardDarkSquare = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: darkObsidian.colorMap,
    bumpMap: darkObsidian.bumpMap,
    bumpScale: 0.015,
    roughness: 0.22,
    metalness: 0.25,
  });

  const boardCursedOverlay = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.6,
    roughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const boardSelectedOverlay = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.72,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const boardLegalMoveOverlay = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const boardLegalCaptureOverlay = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.9,
    transparent: true,
    opacity: 0.78,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const boardBorderStone = new THREE.MeshStandardMaterial({
    color: 0x4a3b31,
    map: sandstoneTex,
    bumpMap: barkBump,
    bumpScale: 0.025,
    roughness: 0.62,
    metalness: 0.2,
  });

  // 4. Andarmahal Palace & Deep Cursed Forest Materials (Bright, High-Contrast PBR)
  const palaceStonePillar = new THREE.MeshStandardMaterial({
    color: 0x9c7e65,
    map: sandstoneTex,
    bumpMap: lightMarble.bumpMap,
    bumpScale: 0.035,
    emissive: 0x24170e,
    emissiveIntensity: 0.32,
    roughness: 0.68,
    metalness: 0.12,
  });

  const palaceFloorMarble = new THREE.MeshStandardMaterial({
    color: 0x4c4654,
    map: darkObsidian.colorMap,
    bumpMap: darkObsidian.bumpMap,
    bumpScale: 0.028,
    emissive: 0x0d1322,
    emissiveIntensity: 0.28,
    roughness: 0.36,
    metalness: 0.22,
  });

  const cursedBarkRoot = new THREE.MeshStandardMaterial({
    color: 0x4f3829,
    bumpMap: barkBump,
    bumpScale: 0.055,
    emissive: 0x160f0a,
    emissiveIntensity: 0.28,
    roughness: 0.82,
    metalness: 0.05,
  });

  const biolumFloraCyan = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.5,
    roughness: 0.22,
    metalness: 0.1,
  });

  const biolumFloraEmerald = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 2.2,
    roughness: 0.25,
    metalness: 0.05,
  });

  const rustedRelicIron = new THREE.MeshStandardMaterial({
    color: 0x73523f,
    bumpMap: barkBump,
    bumpScale: 0.03,
    emissive: 0x1c110b,
    emissiveIntensity: 0.2,
    roughness: 0.54,
    metalness: 0.72,
  });

  const tarnishedRoyalGold = new THREE.MeshStandardMaterial({
    color: 0xe0ad45,
    emissive: 0x422905,
    emissiveIntensity: 0.3,
    roughness: 0.28,
    metalness: 0.88,
  });

  // 5. Ghost King & Spectral Court Materials
  const ghostKingCloak = new THREE.MeshStandardMaterial({
    color: 0x162840,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.85,
    roughness: 0.65,
    metalness: 0.25,
  });

  const ghostKingCrown = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    emissive: 0xe11d48,
    emissiveIntensity: 1.15,
    roughness: 0.18,
    metalness: 0.9,
  });

  const ghostSpectralGlow = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.82,
  });

  // 6. Primal Player Hands & Scars Materials
  const primalSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c583a,
    bumpMap: barkBump,
    bumpScale: 0.012,
    roughness: 0.76,
    metalness: 0.04,
  });

  const primalScarMaterial = new THREE.MeshStandardMaterial({
    color: 0xc28e70,
    emissive: 0x451a03,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.05,
  });

  const primalWrapMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b2f26,
    roughness: 0.9,
    metalness: 0.02,
  });

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const allMaterials: THREE.Material[] = [
    whiteMarbleMain,
    whiteMarbleTrim,
    whiteMarbleAccent,
    blackObsidianMain,
    blackObsidianBlade,
    blackObsidianCore,
    boardLightSquare,
    boardDarkSquare,
    boardCursedOverlay,
    boardSelectedOverlay,
    boardLegalMoveOverlay,
    boardLegalCaptureOverlay,
    boardBorderStone,
    palaceStonePillar,
    palaceFloorMarble,
    cursedBarkRoot,
    biolumFloraCyan,
    biolumFloraEmerald,
    rustedRelicIron,
    tarnishedRoyalGold,
    ghostKingCloak,
    ghostKingCrown,
    ghostSpectralGlow,
    primalSkinMaterial,
    primalScarMaterial,
    primalWrapMaterial,
    contactShadowMat,
  ];

  const allTextures: THREE.Texture[] = [
    lightMarble.colorMap,
    lightMarble.bumpMap,
    darkObsidian.colorMap,
    darkObsidian.bumpMap,
    barkBump,
    sandstoneTex,
    shadowTex,
  ];

  return {
    whiteMarbleMain,
    whiteMarbleTrim,
    whiteMarbleAccent,
    blackObsidianMain,
    blackObsidianBlade,
    blackObsidianCore,
    boardLightSquare,
    boardDarkSquare,
    boardCursedOverlay,
    boardSelectedOverlay,
    boardLegalMoveOverlay,
    boardLegalCaptureOverlay,
    boardBorderStone,
    palaceStonePillar,
    palaceFloorMarble,
    cursedBarkRoot,
    biolumFloraCyan,
    biolumFloraEmerald,
    rustedRelicIron,
    tarnishedRoyalGold,
    ghostKingCloak,
    ghostKingCrown,
    ghostSpectralGlow,
    primalSkinMaterial,
    primalScarMaterial,
    primalWrapMaterial,
    contactShadowMat,
    dispose: () => {
      allMaterials.forEach((m) => m.dispose());
      allTextures.forEach((t) => t.dispose());
    },
  };
}
