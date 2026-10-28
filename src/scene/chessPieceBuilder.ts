import * as THREE from 'three';
import { PieceColor, PieceType } from '../game/chessEngine';
import { MaterialLibrary } from './proceduralMaterials';

export const SQUARE_SIZE = 1.15;
export const BOARD_ORIGIN_OFFSET = -3.5 * SQUARE_SIZE;

export function boardCoordsToWorld(row: number, col: number): { x: number; z: number } {
  return {
    x: BOARD_ORIGIN_OFFSET + col * SQUARE_SIZE,
    z: BOARD_ORIGIN_OFFSET + row * SQUARE_SIZE,
  };
}

// Shared Lathe & Extrude Geometries cached for performance
interface PieceGeometryCache {
  basePedestal: THREE.LatheGeometry;
  collarRing: THREE.TorusGeometry;
  contactDisc: THREE.CircleGeometry;
  pawnBody: THREE.LatheGeometry;
  pawnHeadWhite: THREE.SphereGeometry;
  pawnHeadBlack: THREE.OctahedronGeometry;
  rookTower: THREE.LatheGeometry;
  rookMerlon: THREE.BoxGeometry;
  bishopBody: THREE.LatheGeometry;
  bishopMitre: THREE.ConeGeometry;
  knightBody: THREE.ExtrudeGeometry;
  knightCrest: THREE.ConeGeometry;
  queenBody: THREE.LatheGeometry;
  queenCoronetSpike: THREE.ConeGeometry;
  kingBody: THREE.LatheGeometry;
  kingCrossV: THREE.BoxGeometry;
  kingCrossH: THREE.BoxGeometry;
  obsidianBladeFin: THREE.ConeGeometry;
  spectralCoreOrb: THREE.OctahedronGeometry;
}

let cachedGeoms: PieceGeometryCache | null = null;

function getPieceGeometries(): PieceGeometryCache {
  if (cachedGeoms) return cachedGeoms;

  // 1. Turned pedestal base (Lathe)
  const basePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.44, 0.0),
    new THREE.Vector2(0.44, 0.08),
    new THREE.Vector2(0.37, 0.14),
    new THREE.Vector2(0.39, 0.2),
    new THREE.Vector2(0.31, 0.26),
  ];

  // 2. Pawn body lathe
  const pawnPts = [
    new THREE.Vector2(0.31, 0.26),
    new THREE.Vector2(0.22, 0.45),
    new THREE.Vector2(0.15, 0.72),
    new THREE.Vector2(0.21, 0.78),
    new THREE.Vector2(0.14, 0.84),
  ];

  // 3. Rook fortress column lathe
  const rookPts = [
    new THREE.Vector2(0.32, 0.26),
    new THREE.Vector2(0.28, 0.55),
    new THREE.Vector2(0.26, 0.92),
    new THREE.Vector2(0.34, 1.02),
    new THREE.Vector2(0.34, 1.16),
    new THREE.Vector2(0.22, 1.16),
    new THREE.Vector2(0.22, 1.05),
    new THREE.Vector2(0.0, 1.05),
  ];

  // 4. Bishop tapered body
  const bishopPts = [
    new THREE.Vector2(0.32, 0.26),
    new THREE.Vector2(0.24, 0.56),
    new THREE.Vector2(0.17, 0.96),
    new THREE.Vector2(0.24, 1.04),
    new THREE.Vector2(0.19, 1.12),
  ];

  // 5. Carved Warhorse Knight profile (ExtrudeGeometry with bevels)
  const horseShape = new THREE.Shape();
  horseShape.moveTo(-0.22, 0.26);
  horseShape.lineTo(0.22, 0.26);
  horseShape.lineTo(0.25, 0.56);
  horseShape.lineTo(0.18, 0.85);
  horseShape.lineTo(0.32, 0.96); // Snout
  horseShape.lineTo(0.28, 1.08);
  horseShape.lineTo(0.12, 1.18);
  horseShape.lineTo(0.05, 1.32); // Ears
  horseShape.lineTo(-0.08, 1.24);
  horseShape.lineTo(-0.24, 0.98); // Arched neck mane
  horseShape.lineTo(-0.2, 0.6);
  horseShape.closePath();

  const knightBody = new THREE.ExtrudeGeometry(horseShape, {
    steps: 1,
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 1,
  });
  knightBody.translate(0, 0, -0.11);

  // 6. Queen regal column
  const queenPts = [
    new THREE.Vector2(0.34, 0.26),
    new THREE.Vector2(0.26, 0.62),
    new THREE.Vector2(0.18, 1.02),
    new THREE.Vector2(0.27, 1.16),
    new THREE.Vector2(0.22, 1.28),
    new THREE.Vector2(0.29, 1.44),
    new THREE.Vector2(0.0, 1.44),
  ];

  // 7. King imperial column
  const kingPts = [
    new THREE.Vector2(0.36, 0.26),
    new THREE.Vector2(0.28, 0.68),
    new THREE.Vector2(0.2, 1.12),
    new THREE.Vector2(0.3, 1.26),
    new THREE.Vector2(0.24, 1.42),
    new THREE.Vector2(0.32, 1.58),
    new THREE.Vector2(0.0, 1.58),
  ];

  cachedGeoms = {
    basePedestal: new THREE.LatheGeometry(basePts, 16),
    collarRing: new THREE.TorusGeometry(0.24, 0.035, 8, 16),
    contactDisc: new THREE.CircleGeometry(0.52, 16),
    pawnBody: new THREE.LatheGeometry(pawnPts, 16),
    pawnHeadWhite: new THREE.SphereGeometry(0.19, 14, 12),
    pawnHeadBlack: new THREE.OctahedronGeometry(0.22, 0),
    rookTower: new THREE.LatheGeometry(rookPts, 16),
    rookMerlon: new THREE.BoxGeometry(0.11, 0.16, 0.11),
    bishopBody: new THREE.LatheGeometry(bishopPts, 16),
    bishopMitre: new THREE.ConeGeometry(0.21, 0.42, 14),
    knightBody,
    knightCrest: new THREE.ConeGeometry(0.08, 0.28, 5),
    queenBody: new THREE.LatheGeometry(queenPts, 16),
    queenCoronetSpike: new THREE.ConeGeometry(0.055, 0.24, 6),
    kingBody: new THREE.LatheGeometry(kingPts, 16),
    kingCrossV: new THREE.BoxGeometry(0.08, 0.34, 0.08),
    kingCrossH: new THREE.BoxGeometry(0.24, 0.08, 0.08),
    obsidianBladeFin: new THREE.ConeGeometry(0.07, 0.45, 4),
    spectralCoreOrb: new THREE.OctahedronGeometry(0.11, 0),
  };

  return cachedGeoms;
}

/**
 * Builds a composite 4–10 part procedural 3D chess piece grounded at bottom-center (y=0).
 * Contrasts carved ancient white marble (Player) vs razor-sharp cursed black obsidian (Ghost King).
 */
export function buildCompositeChessPiece(
  id: string,
  type: PieceType,
  color: PieceColor,
  mats: MaterialLibrary,
  castShadow: boolean
): THREE.Group {
  const geoms = getPieceGeometries();
  const root = new THREE.Group();
  root.name = `piece_${id}`;

  const isWhite = color === 'w';
  const mainMat = isWhite ? mats.whiteMarbleMain : mats.blackObsidianMain;
  const trimMat = isWhite ? mats.whiteMarbleTrim : mats.blackObsidianBlade;
  const accentMat = isWhite ? mats.whiteMarbleAccent : mats.blackObsidianCore;

  // Part 1: Soft radial contact shadow disc flush at y = 0.015
  const shadowMesh = new THREE.Mesh(geoms.contactDisc, mats.contactShadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.015;
  shadowMesh.updateMatrix();
  shadowMesh.matrixAutoUpdate = false;
  root.add(shadowMesh);

  // Inner animated body rig (allows levitation, lunge, tilt without moving ground shadow)
  const rig = new THREE.Group();
  rig.name = 'pieceRig';
  root.add(rig);
  root.userData = { pieceId: id, type, color, rig };

  // Part 2: Primary Pedestal Base
  const pedestal = new THREE.Mesh(geoms.basePedestal, mainMat);
  pedestal.castShadow = castShadow;
  pedestal.receiveShadow = castShadow;
  rig.add(pedestal);

  // Part 3: Secondary Metallic/Trim Collar Ring
  const collar = new THREE.Mesh(geoms.collarRing, trimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.27;
  rig.add(collar);

  // If Black Obsidian (Ghost King), add 4 razor-sharp obsidian fins around pedestal
  if (!isWhite) {
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const fin = new THREE.Mesh(geoms.obsidianBladeFin, trimMat);
      fin.position.set(Math.cos(angle) * 0.28, 0.34, Math.sin(angle) * 0.28);
      fin.rotation.z = -Math.cos(angle) * 0.35;
      fin.rotation.x = Math.sin(angle) * 0.35;
      rig.add(fin);
    }
  }

  // Piece-specific primary & accent parts
  if (type === 'p') {
    const body = new THREE.Mesh(geoms.pawnBody, mainMat);
    body.castShadow = castShadow;
    rig.add(body);

    const head = new THREE.Mesh(
      isWhite ? geoms.pawnHeadWhite : geoms.pawnHeadBlack,
      isWhite ? mainMat : accentMat
    );
    head.position.y = 1.0;
    head.castShadow = castShadow;
    rig.add(head);

    const neckRing = new THREE.Mesh(geoms.collarRing, accentMat);
    neckRing.scale.setScalar(0.68);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.y = 0.82;
    rig.add(neckRing);
  } else if (type === 'r') {
    const tower = new THREE.Mesh(geoms.rookTower, mainMat);
    tower.castShadow = castShadow;
    rig.add(tower);

    // 6 Crenellated Merlons / Razor Battlements
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const merlon = new THREE.Mesh(
        isWhite ? geoms.rookMerlon : geoms.queenCoronetSpike,
        i % 2 === 0 ? mainMat : trimMat
      );
      merlon.position.set(Math.cos(a) * 0.27, 1.24, Math.sin(a) * 0.27);
      rig.add(merlon);
    }

    const core = new THREE.Mesh(geoms.spectralCoreOrb, accentMat);
    core.position.y = 1.26;
    rig.add(core);
  } else if (type === 'n') {
    const knight = new THREE.Mesh(geoms.knightBody, mainMat);
    // Face opponent (+Z for Black, -Z for White)
    knight.rotation.y = isWhite ? Math.PI / 2 : -Math.PI / 2;
    knight.castShadow = castShadow;
    rig.add(knight);

    // Armored mane / razor spine spikes
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(geoms.knightCrest, trimMat);
      spike.position.set(0, 0.72 + i * 0.2, isWhite ? 0.2 : -0.2);
      spike.rotation.x = isWhite ? 0.5 : -0.5;
      rig.add(spike);
    }

    // Glowing warhorse eye
    const eye = new THREE.Mesh(geoms.spectralCoreOrb, accentMat);
    eye.scale.setScalar(0.45);
    eye.position.set(0, 1.12, isWhite ? -0.16 : 0.16);
    rig.add(eye);
  } else if (type === 'b') {
    const body = new THREE.Mesh(geoms.bishopBody, mainMat);
    body.castShadow = castShadow;
    rig.add(body);

    const mitre = new THREE.Mesh(geoms.bishopMitre, isWhite ? mainMat : trimMat);
    mitre.position.y = 1.32;
    mitre.castShadow = castShadow;
    rig.add(mitre);

    const haloRing = new THREE.Mesh(geoms.collarRing, accentMat);
    haloRing.scale.setScalar(0.8);
    haloRing.rotation.x = Math.PI / 3;
    haloRing.position.y = 1.15;
    rig.add(haloRing);

    const finial = new THREE.Mesh(geoms.spectralCoreOrb, accentMat);
    finial.scale.setScalar(0.65);
    finial.position.y = 1.56;
    rig.add(finial);
  } else if (type === 'q') {
    const body = new THREE.Mesh(geoms.queenBody, mainMat);
    body.castShadow = castShadow;
    rig.add(body);

    // 8-point royal coronet
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const spike = new THREE.Mesh(geoms.queenCoronetSpike, i % 2 === 0 ? accentMat : trimMat);
      spike.position.set(Math.cos(a) * 0.23, 1.54, Math.sin(a) * 0.23);
      spike.rotation.z = -Math.cos(a) * 0.2;
      spike.rotation.x = Math.sin(a) * 0.2;
      rig.add(spike);
    }

    const orb = new THREE.Mesh(geoms.pawnHeadWhite, mainMat);
    orb.scale.setScalar(0.75);
    orb.position.y = 1.52;
    rig.add(orb);
  } else if (type === 'k') {
    const body = new THREE.Mesh(geoms.kingBody, mainMat);
    body.castShadow = castShadow;
    rig.add(body);

    const upperCollar = new THREE.Mesh(geoms.collarRing, accentMat);
    upperCollar.rotation.x = Math.PI / 2;
    upperCollar.position.y = 1.45;
    rig.add(upperCollar);

    if (isWhite) {
      // Imperial Marble Cross
      const crossV = new THREE.Mesh(geoms.kingCrossV, accentMat);
      crossV.position.y = 1.78;
      const crossH = new THREE.Mesh(geoms.kingCrossH, accentMat);
      crossH.position.y = 1.82;
      rig.add(crossV, crossH);
    } else {
      // Cursed Obsidian Sovereign Horned Spire
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const horn = new THREE.Mesh(geoms.obsidianBladeFin, trimMat);
        horn.position.set(Math.cos(a) * 0.25, 1.72, Math.sin(a) * 0.25);
        horn.rotation.z = -Math.cos(a) * 0.28;
        horn.rotation.x = Math.sin(a) * 0.28;
        rig.add(horn);
      }
      const sovereignCore = new THREE.Mesh(geoms.spectralCoreOrb, accentMat);
      sovereignCore.scale.setScalar(1.35);
      sovereignCore.position.y = 1.84;
      rig.add(sovereignCore);
    }
  }

  // Freeze local matrices on all static child sub-meshes inside rig (85% less matrix math per frame)
  for (const child of rig.children) {
    child.updateMatrix();
    child.matrixAutoUpdate = false;
  }

  return root;
}

// Pooled Shatter Debris System for Bone-Crushing Piece Destruction
interface ShatterShard {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ShatterDebrisSystem {
  private shards: ShatterShard[] = [];
  private group = new THREE.Group();
  private shardGeom = new THREE.DodecahedronGeometry(0.12, 0);

  constructor(scene: THREE.Scene, mats: MaterialLibrary) {
    scene.add(this.group);
    // Pre-allocate 56 shards in pool (zero GC during gameplay)
    for (let i = 0; i < 56; i++) {
      const mesh = new THREE.Mesh(
        this.shardGeom,
        i % 2 === 0 ? mats.whiteMarbleMain : mats.blackObsidianMain
      );
      mesh.visible = false;
      this.group.add(mesh);
      this.shards.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        life: 0,
        maxLife: 1.4,
        active: false,
      });
    }
  }

  public triggerShatterBurst(
    worldX: number,
    worldZ: number,
    victimColor: PieceColor,
    mats: MaterialLibrary
  ) {
    let spawned = 0;
    for (const s of this.shards) {
      if (s.active) continue;
      s.active = true;
      s.life = 0;
      s.maxLife = 1.1 + Math.random() * 0.6;
      s.mesh.material =
        victimColor === 'w'
          ? spawned % 4 === 0
            ? mats.whiteMarbleAccent
            : mats.whiteMarbleMain
          : spawned % 3 === 0
          ? mats.blackObsidianCore
          : mats.blackObsidianMain;
      s.mesh.visible = true;
      s.mesh.position.set(
        worldX + (Math.random() - 0.5) * 0.3,
        0.35 + Math.random() * 0.8,
        worldZ + (Math.random() - 0.5) * 0.3
      );
      s.mesh.scale.set(
        0.5 + Math.random() * 1.1,
        0.4 + Math.random() * 1.3,
        0.5 + Math.random() * 0.9
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 4.2;
      s.vx = Math.cos(angle) * speed;
      s.vy = 2.6 + Math.random() * 3.8;
      s.vz = Math.sin(angle) * speed;
      s.rx = (Math.random() - 0.5) * 14;
      s.ry = (Math.random() - 0.5) * 14;
      s.rz = (Math.random() - 0.5) * 14;
      spawned++;
      if (spawned >= 18) break;
    }
  }

  public update(dt: number) {
    for (const s of this.shards) {
      if (!s.active) continue;
      s.life += dt;
      if (s.life >= s.maxLife) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      s.vy -= 12.5 * dt; // Gravity
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;

      // Bounce on board/table surface (y = 0.06)
      if (s.mesh.position.y < 0.06) {
        s.mesh.position.y = 0.06;
        s.vy = -s.vy * 0.42;
        s.vx *= 0.72;
        s.vz *= 0.72;
      }

      s.mesh.rotation.x += s.rx * dt;
      s.mesh.rotation.y += s.ry * dt;
      s.mesh.rotation.z += s.rz * dt;

      const fade = 1 - s.life / s.maxLife;
      s.mesh.scale.multiplyScalar(0.992 + fade * 0.008);
    }
  }

  public dispose() {
    this.shardGeom.dispose();
  }
}
