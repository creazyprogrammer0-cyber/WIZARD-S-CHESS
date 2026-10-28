import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChessMove,
  GameState,
  getLegalMovesForSquare,
} from '../game/chessEngine';
import { createMaterialLibrary } from '../scene/proceduralMaterials';
import {
  boardCoordsToWorld,
  buildCompositeChessPiece,
  ShatterDebrisSystem,
} from '../scene/chessPieceBuilder';
import { buildAndarmahalEnvironment } from '../scene/andarmahalEnvironment';

export type CameraViewMode = 'primal' | 'orbit360' | 'overhead' | 'ghostking';

interface ActivePieceMoveAnim {
  pieceId: string;
  isGhost: boolean;
  isCapture: boolean;
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
  victimX?: number;
  victimZ?: number;
  victimColor?: 'w' | 'b';
  shatterTriggered?: boolean;
  progress: number; // 0..1
  duration: number;
}

interface SpectralTrailNode {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  active: boolean;
}

interface WizardsChessCanvasProps {
  shellState: 'title' | 'playing' | 'paused' | 'gameover';
  gameState: GameState;
  selectedSquare: { row: number; col: number } | null;
  cameraMode: CameraViewMode;
  roomYawDeg: number;
  autoTour360: boolean;
  lastExecutedMove: ChessMove | null;
  defeatBloomActive: boolean;
  onSquareClick: (row: number, col: number) => void;
  onChangeRoomYawDeg?: (deg: number) => void;
}

// Pre-allocated math helpers at module scope (zero GC in loop)
const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 1.2, -0.5);
const _ghostReachVec = new THREE.Vector3();
const _playerReachVec = new THREE.Vector3();

export const WizardsChessCanvas: React.FC<WizardsChessCanvasProps> = ({
  shellState,
  gameState,
  selectedSquare,
  cameraMode,
  roomYawDeg,
  autoTour360,
  lastExecutedMove,
  defeatBloomActive,
  onSquareClick,
  onChangeRoomYawDeg,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store latest props in refs so React UI updates never re-create the WebGL canvas
  const stateRef = useRef({
    shellState,
    gameState,
    selectedSquare,
    cameraMode,
    roomYawDeg,
    autoTour360,
    defeatBloomActive,
    onSquareClick,
    onChangeRoomYawDeg,
  });
  stateRef.current = {
    shellState,
    gameState,
    selectedSquare,
    cameraMode,
    roomYawDeg,
    autoTour360,
    defeatBloomActive,
    onSquareClick,
    onChangeRoomYawDeg,
  };

  const activeMoveAnimRef = useRef<ActivePieceMoveAnim | null>(null);
  const traumaRef = useRef(0);
  const hitstopRef = useRef(0);
  const ghostRoarRef = useRef(0);
  const lastProcessedMoveCountRef = useRef(0);
  const externalYawSyncRef = useRef(roomYawDeg);
  const renderNowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    renderNowRef.current?.();
  }, [
    shellState,
    cameraMode,
    roomYawDeg,
    autoTour360,
    selectedSquare,
    gameState.moveHistory.length,
    defeatBloomActive,
  ]);

  // Trigger move/attack/shatter animation when a new move is added
  useEffect(() => {
    if (!lastExecutedMove) {
      lastProcessedMoveCountRef.current = 0;
      return;
    }
    const moveCount = gameState.moveHistory.length;
    if (moveCount === lastProcessedMoveCountRef.current) return;
    lastProcessedMoveCountRef.current = moveCount;

    const fromWorld = boardCoordsToWorld(lastExecutedMove.fromRow, lastExecutedMove.fromCol);
    const toWorld = boardCoordsToWorld(lastExecutedMove.toRow, lastExecutedMove.toCol);
    const isGhost = lastExecutedMove.piece.color === 'b';
    const isCapture = Boolean(lastExecutedMove.captured);

    activeMoveAnimRef.current = {
      pieceId: lastExecutedMove.piece.id,
      isGhost,
      isCapture,
      fromX: fromWorld.x,
      fromZ: fromWorld.z,
      toX: toWorld.x,
      toZ: toWorld.z,
      victimX: isCapture ? toWorld.x : undefined,
      victimZ: isCapture ? toWorld.z : undefined,
      victimColor: lastExecutedMove.captured?.color,
      shatterTriggered: false,
      progress: 0,
      duration: isCapture ? 0.62 : 0.45,
    };

    if (isGhost) {
      ghostRoarRef.current = isCapture ? 1.0 : 0.45;
    }
  }, [lastExecutedMove, gameState.moveHistory.length]);

  // Trigger massive camera trauma and Ghost King roar on Defeat Bloom
  useEffect(() => {
    if (defeatBloomActive) {
      traumaRef.current = 1.0;
      ghostRoarRef.current = 1.5;
    }
  }, [defeatBloomActive]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b111e);
    // Ultra-clean atmospheric depth so the full 360° room, outer walls, and forest remain crystal-clear
    scene.fog = new THREE.FogExp2(0x0b111e, 0.0042);

    const camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      90
    );
    camera.position.set(0, 4.4, 8.6);
    camera.lookAt(0, 1.0, -0.5);

    const isLowSpecDevice =
      isHeadless ||
      (typeof navigator.hardwareConcurrency === 'number' &&
        navigator.hardwareConcurrency <= 4);

    let currentPixelRatio = isLowSpecDevice
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isLowSpecDevice,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;
    renderer.setPixelRatio(currentPixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isLowSpecDevice;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    container.appendChild(renderer.domElement);

    // Studio PBR environment reflections via RoomEnvironment + PMREMGenerator (skip expensive cubemap pass on CPU headless renderer)
    let envTarget: THREE.WebGLRenderTarget | null = null;
    if (!isHeadless) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envTarget.texture;
      pmremGenerator.dispose();
    }

    // High-Clarity 360° Lighting Rig:
    // 1. Bright midnight sky & warm palace floor bounce HemisphereLight
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x4a321e, 1.55);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // 2. Warm firelight DirectionalKeyLight with shadow frustum
    const keyLight = new THREE.DirectionalLight(0xffc478, 2.8);
    keyLight.position.set(6, 13, 6);
    if (!isLowSpecDevice) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 512;
      keyLight.shadow.mapSize.height = 512;
      const d = 6.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 26;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // 3. Spectral Rim Light from behind the Ghost King
    const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.95);
    rimLight.position.set(-5, 8, -12);
    scene.add(rimLight);

    // 4. Southern & Eastern Fill Light so all 360° palace walls and arches are vibrantly visible
    const palaceFillLight = new THREE.DirectionalLight(0xf59e0b, 1.35);
    palaceFillLight.position.set(-6, 9, 12);
    scene.add(palaceFillLight);

    // Build Material Library & Andarmahal + Cursed Forest Environment
    const mats = createMaterialLibrary(renderer);
    const envCtrl = buildAndarmahalEnvironment(scene, mats, isHeadless);
    const shatterSystem = new ShatterDebrisSystem(scene, mats);

    // Piece Mesh Registry (keyed by piece.id)
    const pieceMeshes = new Map<string, THREE.Group>();
    const piecesRoot = new THREE.Group();
    scene.add(piecesRoot);

    // Spectral Levitation Trail Pool for Ghost King piece moves
    const trailNodes: SpectralTrailNode[] = [];
    const trailGeom = new THREE.OctahedronGeometry(0.14, 0);
    for (let i = 0; i < 24; i++) {
      const tMesh = new THREE.Mesh(trailGeom, mats.ghostSpectralGlow);
      tMesh.visible = false;
      scene.add(tMesh);
      trailNodes.push({ mesh: tMesh, life: 0, maxLife: 0.55, active: false });
    }

    const spawnSpectralTrail = (x: number, y: number, z: number) => {
      for (const node of trailNodes) {
        if (!node.active) {
          node.active = true;
          node.life = 0;
          node.mesh.position.set(
            x + (Math.random() - 0.5) * 0.18,
            y + (Math.random() - 0.5) * 0.15,
            z + (Math.random() - 0.5) * 0.18
          );
          node.mesh.scale.setScalar(1);
          node.mesh.visible = true;
          break;
        }
      }
    };

    // Interactive 360° Camera Orbit State (Pointer drag + WASD/Arrow keys + HUD 360° scrubber)
    let orbitYaw = THREE.MathUtils.degToRad(stateRef.current.roomYawDeg || 0);
    let orbitPitch = 0.34;
    let orbitDistance = 10.6;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastHudYawSyncMs = 0;
    const keysHeld = new Set<string>();

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const normalizeDeg = (rad: number): number => {
      const deg = (THREE.MathUtils.radToDeg(rad) % 360 + 360) % 360;
      return Math.round(deg);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      orbitYaw -= dx * 0.0085;
      orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.006, 0.12, 1.28);

      const now = performance.now();
      if (now - lastHudYawSyncMs > 80 && stateRef.current.onChangeRoomYawDeg) {
        lastHudYawSyncMs = now;
        const nextDeg = normalizeDeg(orbitYaw);
        externalYawSyncRef.current = nextDeg;
        stateRef.current.onChangeRoomYawDeg(nextDeg);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      const moveDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (stateRef.current.onChangeRoomYawDeg) {
        const nextDeg = normalizeDeg(orbitYaw);
        externalYawSyncRef.current = nextDeg;
        stateRef.current.onChangeRoomYawDeg(nextDeg);
      }
      // Treat as click on chessboard if pointer barely dragged
      if (moveDist < 10 && stateRef.current.shellState === 'playing') {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);

        const hits = raycaster.intersectObjects(envCtrl.clickableSquareMeshes, false);
        if (hits.length > 0) {
          const { row, col } = hits[0].object.userData;
          if (typeof row === 'number' && typeof col === 'number') {
            stateRef.current.onSquareClick(row, col);
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      orbitDistance = THREE.MathUtils.clamp(orbitDistance + e.deltaY * 0.006, 5.8, 16.2);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysHeld.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };
    const handleBlur = () => {
      keysHeld.clear();
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // ResizeObserver for crisp viewport sizing
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Pre-warm shaders
    renderer.compile(scene, camera);

    interface CachedPieceEntry {
      id: string;
      color: 'w' | 'b';
      row: number;
      col: number;
      worldX: number;
      worldZ: number;
      phase: number;
      meshGroup: THREE.Group;
      rig: THREE.Object3D | undefined;
    }

    let cachedPieces: CachedPieceEntry[] = [];
    let lastSyncedBoard: unknown = null;
    let lastSyncedSelKey = '';
    let slowFrameStreak = 0;

    let rafId = 0;
    const startTimeMs = performance.now();
    let prevTimeMs = startTimeMs;

    const animate = (nowMs: number) => {
      if (!isHeadless) {
        rafId = requestAnimationFrame(animate);
      }

      const rawDt = Math.max(0.001, (nowMs - prevTimeMs) / 1000);
      prevTimeMs = nowMs;

      // Automatic Dynamic Resolution Governor for low-configuration devices:
      // If rolling frame time exceeds 22ms (<45fps) for 20 frames, step down pixelRatio to 1.0
      if (!isHeadless && currentPixelRatio > 1) {
        if (rawDt > 0.022 && rawDt < 0.25) {
          slowFrameStreak++;
          if (slowFrameStreak >= 20) {
            currentPixelRatio = 1;
            renderer.setPixelRatio(1);
          }
        } else {
          slowFrameStreak = Math.max(0, slowFrameStreak - 1);
        }
      }

      const dt = Math.min(rawDt, 0.05);
      const elapsed = (nowMs - startTimeMs) / 1000;

      const {
        shellState: curShell,
        gameState: curGame,
        selectedSquare: curSel,
        cameraMode: curCamMode,
        roomYawDeg: curRoomYawDeg,
        autoTour360: curAutoTour,
      } = stateRef.current;

      // Sync external HUD yaw slider / compass preset changes
      if (!isDragging && curRoomYawDeg !== externalYawSyncRef.current) {
        externalYawSyncRef.current = curRoomYawDeg;
        orbitYaw = THREE.MathUtils.degToRad(curRoomYawDeg);
      }

      // Decay trauma & Ghost King roar
      traumaRef.current = Math.max(0, traumaRef.current - dt * 1.4);
      ghostRoarRef.current = Math.max(0, ghostRoarRef.current - dt * 1.1);

      // Hitstop freeze timer on violent capture impacts
      if (hitstopRef.current > 0) {
        hitstopRef.current = Math.max(0, hitstopRef.current - dt);
      }
      const simDt = hitstopRef.current > 0 ? dt * 0.08 : dt;

      // Keyboard WASD / Arrow 360° camera orbit support & Auto-360° Tour
      if (curShell === 'playing') {
        let yawChangedByKey = false;
        if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) {
          orbitYaw -= 1.55 * dt;
          yawChangedByKey = true;
        }
        if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) {
          orbitYaw += 1.55 * dt;
          yawChangedByKey = true;
        }
        if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) {
          orbitPitch = THREE.MathUtils.clamp(orbitPitch + 0.9 * dt, 0.12, 1.28);
        }
        if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) {
          orbitPitch = THREE.MathUtils.clamp(orbitPitch - 0.9 * dt, 0.12, 1.28);
        }
        if (curAutoTour && !isDragging) {
          orbitYaw += 0.36 * dt;
        }
        if (
          yawChangedByKey &&
          nowMs - lastHudYawSyncMs > 200 &&
          stateRef.current.onChangeRoomYawDeg
        ) {
          lastHudYawSyncMs = nowMs;
          const nextDeg = normalizeDeg(orbitYaw);
          externalYawSyncRef.current = nextDeg;
          stateRef.current.onChangeRoomYawDeg(nextDeg);
        }
      }

      // 1. Dirty-Flag Sync: Only rebuild piece list when curGame.board changes (Zero per-frame Set/Map allocations)
      if (curGame.board !== lastSyncedBoard) {
        lastSyncedBoard = curGame.board;
        const activeIds = new Set<string>();
        const nextCached: CachedPieceEntry[] = [];

        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = curGame.board[r][c];
            if (!piece) continue;
            activeIds.add(piece.id);

            let meshGroup = pieceMeshes.get(piece.id);
            if (!meshGroup || meshGroup.userData.type !== piece.type) {
              if (meshGroup) {
                piecesRoot.remove(meshGroup);
              }
              meshGroup = buildCompositeChessPiece(
                piece.id,
                piece.type,
                piece.color,
                mats,
                !isLowSpecDevice
              );
              piecesRoot.add(meshGroup);
              pieceMeshes.set(piece.id, meshGroup);
            }

            const targetWorld = boardCoordsToWorld(r, c);
            nextCached.push({
              id: piece.id,
              color: piece.color,
              row: r,
              col: c,
              worldX: targetWorld.x,
              worldZ: targetWorld.z,
              phase: (r * 8 + c) * 0.7,
              meshGroup,
              rig: meshGroup.userData.rig as THREE.Object3D | undefined,
            });
          }
        }

        for (const [id, meshGroup] of pieceMeshes.entries()) {
          if (!activeIds.has(id)) {
            piecesRoot.remove(meshGroup);
            pieceMeshes.delete(id);
          }
        }

        cachedPieces = nextCached;
        if (!isLowSpecDevice) {
          renderer.shadowMap.needsUpdate = true;
        }
      }

      // 2. Fast Per-Frame Piece Transform & Animation Update
      const anim = activeMoveAnimRef.current;
      for (let i = 0; i < cachedPieces.length; i++) {
        const entry = cachedPieces[i];
        const { meshGroup, rig } = entry;

        if (anim && anim.pieceId === entry.id) {
          anim.progress = Math.min(1, anim.progress + simDt / anim.duration);
          const t = anim.progress;
          const smoothT = t * t * (3 - 2 * t);

          const curX = THREE.MathUtils.lerp(anim.fromX, anim.toX, smoothT);
          const curZ = THREE.MathUtils.lerp(anim.fromZ, anim.toZ, smoothT);
          meshGroup.position.set(curX, 0, curZ);

          if (rig) {
            if (anim.isGhost) {
              const levitateArc = Math.sin(t * Math.PI) * 1.35;
              rig.position.y = levitateArc;
              rig.rotation.z = Math.sin(t * Math.PI * 2) * 0.22;
              if (Math.random() < 0.75) {
                spawnSpectralTrail(curX, 0.5 + levitateArc, curZ);
              }
            } else {
              const lungeArc = anim.isCapture ? Math.sin(t * Math.PI) * 0.55 : 0.04;
              rig.position.y = lungeArc;
              rig.rotation.x = anim.isCapture ? Math.sin(t * Math.PI) * 0.38 : 0;
            }
          }

          if (
            anim.isCapture &&
            !anim.shatterTriggered &&
            t >= 0.68 &&
            anim.victimX !== undefined &&
            anim.victimZ !== undefined &&
            anim.victimColor
          ) {
            anim.shatterTriggered = true;
            shatterSystem.triggerShatterBurst(
              anim.victimX,
              anim.victimZ,
              anim.victimColor,
              mats
            );
            traumaRef.current = 0.65;
            hitstopRef.current = 0.055;
          }

          if (anim.progress >= 1) {
            if (rig) {
              rig.position.set(0, 0, 0);
              rig.rotation.set(0, 0, 0);
            }
            activeMoveAnimRef.current = null;
            if (!isLowSpecDevice) {
              renderer.shadowMap.needsUpdate = true;
            }
          }
        } else {
          meshGroup.position.set(entry.worldX, 0, entry.worldZ);
          if (rig) {
            if (entry.color === 'b') {
              rig.position.y = 0.04 + Math.sin(elapsed * 2.4 + entry.phase) * 0.035;
            } else {
              const isSelected = curSel?.row === entry.row && curSel?.col === entry.col;
              rig.position.y = isSelected ? 0.22 + Math.sin(elapsed * 5) * 0.04 : 0;
            }
            rig.rotation.set(0, 0, 0);
          }
        }
      }

      // 3. Dirty-Flag 64-Square Highlight Sync (Only runs when selection or board changes!)
      const curSelKey = `${curGame.roundIndex}_${curGame.moveHistory.length}_${curGame.turn}_${
        curSel ? `${curSel.row}_${curSel.col}` : 'none'
      }`;
      if (curSelKey !== lastSyncedSelKey) {
        lastSyncedSelKey = curSelKey;
        const legalMoves =
          curSel && curGame.turn === 'w'
            ? getLegalMovesForSquare(curGame, curSel.row, curSel.col)
            : [];
        const legalMap = new Map<string, ChessMove>();
        for (const m of legalMoves) {
          legalMap.set(`${m.toRow}_${m.toCol}`, m);
        }

        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const cell = envCtrl.squareCells[r][c];
            cell.cursedRootRing.visible = curGame.cursedSquares.has(cell.algebraic);

            const isSelected = curSel?.row === r && curSel?.col === c;
            const legalMove = legalMap.get(`${r}_${c}`);

            if (isSelected) {
              cell.overlayMesh.material = mats.boardSelectedOverlay;
              cell.overlayMesh.visible = true;
            } else if (legalMove) {
              cell.overlayMesh.material = legalMove.captured
                ? mats.boardLegalCaptureOverlay
                : mats.boardLegalMoveOverlay;
              cell.overlayMesh.visible = true;
            } else {
              cell.overlayMesh.visible = false;
            }
          }
        }
      }

      // Update Spectral Trail Pool
      for (const node of trailNodes) {
        if (!node.active) continue;
        node.life += simDt;
        if (node.life >= node.maxLife) {
          node.active = false;
          node.mesh.visible = false;
        } else {
          const fade = 1 - node.life / node.maxLife;
          node.mesh.scale.setScalar(fade);
          node.mesh.position.y += simDt * 0.4;
        }
      }

      // Update Shatter Debris System
      shatterSystem.update(simDt);

      // Compute Ghost King & Primal Player Hand reach targets
      let ghostReach: THREE.Vector3 | null = null;
      let playerReach: THREE.Vector3 | null = null;
      const curAnim = activeMoveAnimRef.current;
      if (curAnim) {
        if (curAnim.isGhost) {
          _ghostReachVec.set(curAnim.toX, 0.8, curAnim.toZ);
          ghostReach = _ghostReachVec;
        } else {
          _playerReachVec.set(curAnim.toX, 0.5, curAnim.toZ);
          playerReach = _playerReachVec;
        }
      } else if (curSel) {
        const selW = boardCoordsToWorld(curSel.row, curSel.col);
        _playerReachVec.set(selW.x, 0.5, selW.z);
        playerReach = _playerReachVec;
      }

      envCtrl.primalHandsGroup.visible =
        curShell === 'playing' && (curCamMode === 'primal' || curCamMode === 'orbit360');

      envCtrl.updateEnvironment(
        elapsed,
        simDt,
        ghostReach,
        playerReach,
        ghostRoarRef.current
      );

      // Smooth Exponential Camera Damping & Full 360° Room Framing
      if (curShell === 'title') {
        // Live World 360° Camera Tour on Title Screen
        const tourAngle = elapsed * 0.24;
        _camPosTarget.set(
          Math.sin(tourAngle) * 11.2,
          4.0 + Math.sin(elapsed * 0.5) * 0.7,
          Math.cos(tourAngle) * 11.2
        );
        _camLookTarget.set(0, 1.25, -0.8);
      } else if (curCamMode === 'primal') {
        // Primal Perspective with full 360° room orbit capability (at yaw=0° seated behind scarred hands; rises smoothly over Ghost King around 180°)
        const backArc = Math.max(0, -Math.cos(orbitYaw));
        const primalRadius = 8.35 + backArc * 2.2;
        const horiz = Math.cos(orbitPitch) * primalRadius;
        _camPosTarget.set(
          Math.sin(orbitYaw) * horiz,
          Math.max(1.4, Math.sin(orbitPitch) * primalRadius + 1.45 + backArc * 2.35),
          Math.cos(orbitYaw) * horiz
        );
        _camLookTarget.set(0, 1.05, backArc * 1.35 - 0.45);
      } else if (curCamMode === 'orbit360') {
        // Wide 360° Palace & Forest Panorama Tour
        const backArc = Math.max(0, -Math.cos(orbitYaw));
        const panoRadius = Math.max(10.6, orbitDistance) + backArc * 1.2;
        const horiz = Math.cos(orbitPitch) * panoRadius;
        _camPosTarget.set(
          Math.sin(orbitYaw) * horiz,
          Math.max(1.6, Math.sin(orbitPitch) * panoRadius + 2.1 + backArc * 1.65),
          Math.cos(orbitYaw) * horiz
        );
        _camLookTarget.set(0, 1.35, backArc * 0.8);
      } else if (curCamMode === 'overhead') {
        // High Tactical Overhead View (rotatable 360° around vertical axis)
        _camPosTarget.set(
          Math.sin(orbitYaw) * 2.2,
          10.8,
          Math.cos(orbitYaw) * 2.2
        );
        _camLookTarget.set(0, 0, 0);
      } else if (curCamMode === 'ghostking') {
        // Ghost King Sovereign Throne & Royal Hearth Panorama
        _camPosTarget.set(
          Math.sin(orbitYaw) * 4.2,
          3.4,
          2.8
        );
        _camLookTarget.set(0, 2.35, -6.2);
      }

      // Apply decaying trauma * trauma camera shake on captures or Defeat Bloom
      const shakeMag = traumaRef.current * traumaRef.current * 0.42;
      const shakeX = (Math.random() - 0.5) * shakeMag;
      const shakeY = (Math.random() - 0.5) * shakeMag;

      const camDamp = isHeadless ? 1.0 : 1 - Math.exp(-5.5 * dt);
      camera.position.lerp(_camPosTarget, camDamp);
      camera.position.x += shakeX;
      camera.position.y += shakeY;

      _currentLookAt.lerp(_camLookTarget, camDamp);
      camera.lookAt(_currentLookAt);

      renderer.render(scene, camera);
    };

    renderNowRef.current = () => animate(performance.now());
    animate(performance.now());

    return () => {
      renderNowRef.current = null;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      shatterSystem.dispose();
      trailGeom.dispose();
      envCtrl.dispose();
      mats.dispose();
      envTarget?.dispose();
      renderer.dispose();
      if (domElem.parentNode === container) {
        container.removeChild(domElem);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="wizards-chess-canvas"
      className={`fixed inset-0 w-full h-full select-none ${
        defeatBloomActive ? 'animate-pulse contrast-150 saturate-150' : ''
      }`}
    />
  );
};
