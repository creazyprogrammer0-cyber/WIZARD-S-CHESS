import * as THREE from 'three';
import { MaterialLibrary } from './proceduralMaterials';
import { BOARD_ORIGIN_OFFSET, SQUARE_SIZE } from './chessPieceBuilder';

export interface SquareCellMesh {
  row: number;
  col: number;
  algebraic: string;
  baseMesh: THREE.Mesh;
  overlayMesh: THREE.Mesh;
  cursedRootRing: THREE.Mesh;
}

export interface AndarmahalEnvironmentController {
  squareCells: SquareCellMesh[][];
  clickableSquareMeshes: THREE.Mesh[];
  ghostKingGroup: THREE.Group;
  ghostLeftHand: THREE.Group;
  ghostRightHand: THREE.Group;
  primalHandsGroup: THREE.Group;
  primalRightArm: THREE.Group;
  primalLeftArm: THREE.Group;
  torchLights: THREE.PointLight[];
  updateEnvironment: (
    elapsed: number,
    dt: number,
    ghostReachTarget: THREE.Vector3 | null,
    playerReachTarget: THREE.Vector3 | null,
    ghostRoarIntensity: number
  ) => void;
  dispose: () => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Pre-allocated scratch objects for zero-GC updates
const _dummy = new THREE.Object3D();
const _targetVec = new THREE.Vector3();

export function buildAndarmahalEnvironment(
  scene: THREE.Scene,
  mats: MaterialLibrary,
  isHeadless: boolean
): AndarmahalEnvironmentController {
  const disposables: THREE.BufferGeometry[] = [];
  const registerGeom = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  // =========================================================================
  // 1. THE 64-SQUARE ROYAL CHESSBOARD & ORNATE WAR-TABLE
  // =========================================================================
  const boardGroup = new THREE.Group();
  scene.add(boardGroup);

  const squareGeom = registerGeom(new THREE.BoxGeometry(SQUARE_SIZE * 0.98, 0.14, SQUARE_SIZE * 0.98));
  const overlayGeom = registerGeom(new THREE.PlaneGeometry(SQUARE_SIZE * 0.88, SQUARE_SIZE * 0.88));
  const cursedRingGeom = registerGeom(new THREE.TorusGeometry(SQUARE_SIZE * 0.36, 0.045, 8, 20));

  const squareCells: SquareCellMesh[][] = Array.from({ length: 8 }, () => []);
  const clickableSquareMeshes: THREE.Mesh[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const x = BOARD_ORIGIN_OFFSET + c * SQUARE_SIZE;
      const z = BOARD_ORIGIN_OFFSET + r * SQUARE_SIZE;
      const algebraic = `${FILES[c]}${8 - r}`;

      const baseMesh = new THREE.Mesh(
        squareGeom,
        isLight ? mats.boardLightSquare : mats.boardDarkSquare
      );
      baseMesh.position.set(x, -0.07, z);
      baseMesh.receiveShadow = !isHeadless;
      baseMesh.userData = { isSquare: true, row: r, col: c, algebraic };
      boardGroup.add(baseMesh);
      clickableSquareMeshes.push(baseMesh);

      const overlayMesh = new THREE.Mesh(overlayGeom, mats.boardSelectedOverlay);
      overlayMesh.rotation.x = -Math.PI / 2;
      overlayMesh.position.set(x, 0.012, z);
      overlayMesh.visible = false;
      boardGroup.add(overlayMesh);

      // Cursed bioluminescent root ring for Blight squares
      const cursedRootRing = new THREE.Mesh(cursedRingGeom, mats.boardCursedOverlay);
      cursedRootRing.rotation.x = Math.PI / 2;
      cursedRootRing.position.set(x, 0.025, z);
      cursedRootRing.visible = false;
      boardGroup.add(cursedRootRing);

      squareCells[r][c] = {
        row: r,
        col: c,
        algebraic,
        baseMesh,
        overlayMesh,
        cursedRootRing,
      };
    }
  }

  // Carved Royal Table Frame & Pedestal Beneath the Board
  const boardSpan = SQUARE_SIZE * 8;
  const frameOuterGeom = registerGeom(new THREE.BoxGeometry(boardSpan + 1.4, 0.28, boardSpan + 1.4));
  const frameOuter = new THREE.Mesh(frameOuterGeom, mats.boardBorderStone);
  frameOuter.position.set(0, -0.18, 0);
  frameOuter.receiveShadow = !isHeadless;
  boardGroup.add(frameOuter);

  const goldInlayGeom = registerGeom(new THREE.BoxGeometry(boardSpan + 0.35, 0.3, boardSpan + 0.35));
  const goldInlay = new THREE.Mesh(goldInlayGeom, mats.tarnishedRoyalGold);
  goldInlay.position.set(0, -0.16, 0);
  boardGroup.add(goldInlay);

  const tableSlabGeom = registerGeom(new THREE.BoxGeometry(boardSpan + 3.6, 0.45, boardSpan + 2.6));
  const tableSlab = new THREE.Mesh(tableSlabGeom, mats.palaceStonePillar);
  tableSlab.position.set(0, -0.52, 0);
  tableSlab.receiveShadow = !isHeadless;
  boardGroup.add(tableSlab);

  // 4 Heavy Carved Lion-Pillar Table Legs reaching to the palace floor (y = -2.4)
  const legGeom = registerGeom(new THREE.CylinderGeometry(0.48, 0.65, 1.9, 12));
  const legPositions = [
    [-4.6, -1.45, -4.0],
    [4.6, -1.45, -4.0],
    [-4.6, -1.45, 4.0],
    [4.6, -1.45, 4.0],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeom, mats.palaceStonePillar);
    leg.position.set(lx, ly, lz);
    boardGroup.add(leg);
  }

  // =========================================================================
  // 2. CURSED ARTIFACTS ON THE WAR-TABLE FLANKS
  // =========================================================================
  // Left Flank: Occult Brass Skull Reliquary + Candelabra
  const skullGroup = new THREE.Group();
  skullGroup.position.set(-5.45, -0.28, -1.2);
  const skullCranium = new THREE.Mesh(
    registerGeom(new THREE.SphereGeometry(0.32, 14, 12)),
    mats.whiteMarbleTrim
  );
  skullCranium.position.y = 0.32;
  const skullJaw = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(0.28, 0.22, 0.3)),
    mats.whiteMarbleTrim
  );
  skullJaw.position.set(0, 0.14, 0.12);
  const skullEyeL = new THREE.Mesh(
    registerGeom(new THREE.SphereGeometry(0.06, 8, 8)),
    mats.biolumFloraCyan
  );
  skullEyeL.position.set(-0.1, 0.32, 0.26);
  const skullEyeR = skullEyeL.clone();
  skullEyeR.position.x = 0.1;
  const skullCrown = new THREE.Mesh(
    registerGeom(new THREE.CylinderGeometry(0.28, 0.22, 0.18, 8, 1, true)),
    mats.tarnishedRoyalGold
  );
  skullCrown.position.y = 0.56;
  skullGroup.add(skullCranium, skullJaw, skullEyeL, skullEyeR, skullCrown);
  skullGroup.rotation.y = 0.45;
  boardGroup.add(skullGroup);

  // Right Flank: Rusted Royal Katar / Broadsword driven into the stone table
  const swordGroup = new THREE.Group();
  swordGroup.position.set(5.4, -0.25, 0.9);
  const bladeMesh = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(0.08, 1.65, 0.26)),
    mats.rustedRelicIron
  );
  bladeMesh.position.y = 0.75;
  const crossguard = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(0.18, 0.1, 0.78)),
    mats.tarnishedRoyalGold
  );
  crossguard.position.y = 1.48;
  const pommel = new THREE.Mesh(
    registerGeom(new THREE.OctahedronGeometry(0.14, 0)),
    mats.blackObsidianCore
  );
  pommel.position.y = 1.92;
  swordGroup.add(bladeMesh, crossguard, pommel);
  swordGroup.rotation.z = 0.22;
  swordGroup.rotation.x = -0.15;
  boardGroup.add(swordGroup);

  // =========================================================================
  // 3. FULL 360° HAUNTED ROYAL PALACE ("ANDARMAHAL") & ENCROACHING FOREST
  // =========================================================================
  const floorGeom = registerGeom(new THREE.CylinderGeometry(24, 24, 0.24, 48));
  const palaceFloor = new THREE.Mesh(floorGeom, mats.palaceFloorMarble);
  palaceFloor.position.set(0, -2.52, 0);
  palaceFloor.receiveShadow = !isHeadless;
  scene.add(palaceFloor);

  // Concentric Golden Royal Floor Compass Rings & Bioluminescent Root Cracks (360° floor detail)
  for (const ringRadius of [6.4, 10.6, 14.2]) {
    const floorRing = new THREE.Mesh(
      registerGeom(new THREE.RingGeometry(ringRadius - 0.14, ringRadius + 0.14, 48)),
      mats.tarnishedRoyalGold
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -2.38;
    scene.add(floorRing);
  }

  const fissureGeom = registerGeom(new THREE.BoxGeometry(0.14, 0.04, 15.5));
  for (let i = 0; i < 8; i++) {
    const fissure = new THREE.Mesh(
      fissureGeom,
      i % 2 === 0 ? mats.biolumFloraCyan : mats.biolumFloraEmerald
    );
    const angle = (i * Math.PI) / 4;
    fissure.position.set(Math.cos(angle) * 7.8, -2.39, Math.sin(angle) * 7.8);
    fissure.rotation.y = -angle + Math.PI / 2;
    scene.add(fissure);
  }

  // 12 Towering Andarmahal Royal Pillars, Cusped Arches, Upper Gallery & Vaulted Dome Ribs (Full 360° Arcade)
  const pillarBaseGeom = registerGeom(new THREE.BoxGeometry(1.75, 0.8, 1.75));
  const pillarShaftGeom = registerGeom(new THREE.CylinderGeometry(0.58, 0.72, 11.2, 16));
  const pillarRingGeom = registerGeom(new THREE.TorusGeometry(0.68, 0.1, 8, 20));
  const pillarCapitalGeom = registerGeom(new THREE.CylinderGeometry(1.08, 0.64, 0.95, 12));
  const archSpanGeom = registerGeom(new THREE.TorusGeometry(3.85, 0.38, 10, 24, Math.PI));
  const domeRibGeom = registerGeom(new THREE.TorusGeometry(10.2, 0.22, 8, 28, Math.PI / 2.1));

  // Outer 360° Palace Wall Segments with Glowing Jharokha Lattice Windows (r = 18.2)
  const wallLowerGeom = registerGeom(new THREE.BoxGeometry(7.2, 4.2, 0.9));
  const wallPillarButtressGeom = registerGeom(new THREE.BoxGeometry(1.4, 13.2, 1.4));
  const windowArchGeom = registerGeom(new THREE.PlaneGeometry(3.8, 5.6));
  const windowFrameGeom = registerGeom(new THREE.TorusGeometry(2.0, 0.24, 8, 20, Math.PI));
  const windowGlowMatCyan = new THREE.MeshBasicMaterial({
    color: 0x164e63,
    side: THREE.DoubleSide,
  });
  const windowGlowMatAmber = new THREE.MeshBasicMaterial({
    color: 0x451a03,
    side: THREE.DoubleSide,
  });

  const numPillars = 12;
  const pillarRadius = 14.2;
  const outerWallRadius = 18.2;

  for (let i = 0; i < numPillars; i++) {
    const angle = (i * Math.PI * 2) / numPillars;
    const px = Math.cos(angle) * pillarRadius;
    const pz = Math.sin(angle) * pillarRadius;

    const pGroup = new THREE.Group();
    pGroup.position.set(px, -2.4, pz);
    pGroup.lookAt(0, -2.4, 0);

    const pBase = new THREE.Mesh(pillarBaseGeom, mats.palaceStonePillar);
    pBase.position.y = 0.4;
    const pShaft = new THREE.Mesh(pillarShaftGeom, mats.palaceStonePillar);
    pShaft.position.y = 6.0;

    const pBandMid = new THREE.Mesh(pillarRingGeom, mats.tarnishedRoyalGold);
    pBandMid.rotation.x = Math.PI / 2;
    pBandMid.position.y = 5.6;

    const pCap = new THREE.Mesh(pillarCapitalGeom, mats.tarnishedRoyalGold);
    pCap.position.y = 11.7;

    // Royal Cusped Arch connecting to next pillar
    const arch = new THREE.Mesh(archSpanGeom, mats.palaceStonePillar);
    arch.position.set(3.65, 9.4, -0.45);
    arch.rotation.y = Math.PI / numPillars;

    // Vaulted ceiling rib curving inward toward the central oculus dome
    const domeRib = new THREE.Mesh(domeRibGeom, mats.palaceStonePillar);
    domeRib.position.set(0, 11.8, 10.2);
    domeRib.rotation.y = Math.PI / 2;

    pGroup.add(pBase, pShaft, pBandMid, pCap, arch, domeRib);
    scene.add(pGroup);

    // Outer 360° Palace Perimeter Wall Bay + Arched Jharokha Window at mid-angle
    const midAngle = angle + Math.PI / numPillars;
    const wx = Math.cos(midAngle) * outerWallRadius;
    const wz = Math.sin(midAngle) * outerWallRadius;

    const wallBay = new THREE.Group();
    wallBay.position.set(wx, -2.4, wz);
    wallBay.lookAt(0, -2.4, 0);

    const lowerWall = new THREE.Mesh(wallLowerGeom, mats.palaceStonePillar);
    lowerWall.position.y = 2.1;

    const buttress = new THREE.Mesh(wallPillarButtressGeom, mats.boardBorderStone);
    buttress.position.set(3.8, 6.6, 0);

    // Arched Jharokha Window Backlit by Cursed Forest Moonlight / Hearth Glow
    const winBackdrop = new THREE.Mesh(
      windowArchGeom,
      i % 3 === 0 ? windowGlowMatAmber : windowGlowMatCyan
    );
    winBackdrop.position.set(0, 7.2, 0.48);

    const winArch = new THREE.Mesh(windowFrameGeom, mats.tarnishedRoyalGold);
    winArch.position.set(0, 9.2, 0.52);

    // Lattice mullions inside the window
    const mullionV = new THREE.Mesh(
      registerGeom(new THREE.BoxGeometry(0.12, 5.6, 0.16)),
      mats.tarnishedRoyalGold
    );
    mullionV.position.set(0, 7.2, 0.54);
    const mullionH = new THREE.Mesh(
      registerGeom(new THREE.BoxGeometry(3.8, 0.12, 0.16)),
      mats.tarnishedRoyalGold
    );
    mullionH.position.set(0, 7.2, 0.54);

    wallBay.add(lowerWall, buttress, winBackdrop, winArch, mullionV, mullionH);
    scene.add(wallBay);
  }

  // Upper Royal Cornice & Vaulted Oculus Dome Crown (`y = 9.8` & `y = 14.8`)
  const upperCorniceRing = new THREE.Mesh(
    registerGeom(new THREE.TorusGeometry(pillarRadius, 0.45, 10, 48)),
    mats.tarnishedRoyalGold
  );
  upperCorniceRing.rotation.x = Math.PI / 2;
  upperCorniceRing.position.y = 9.75;
  scene.add(upperCorniceRing);

  const oculusRing = new THREE.Mesh(
    registerGeom(new THREE.TorusGeometry(4.2, 0.38, 12, 36)),
    mats.tarnishedRoyalGold
  );
  oculusRing.rotation.x = Math.PI / 2;
  oculusRing.position.y = 14.5;
  scene.add(oculusRing);

  // Grand Hanging Wrought-Iron Royal Chandelier at Center of Chamber (`y = 7.6`)
  const chandelierGroup = new THREE.Group();
  chandelierGroup.position.set(0, 7.6, 0);
  const chandelierWheel = new THREE.Mesh(
    registerGeom(new THREE.TorusGeometry(2.6, 0.12, 10, 32)),
    mats.rustedRelicIron
  );
  chandelierWheel.rotation.x = Math.PI / 2;
  const chandelierInnerWheel = new THREE.Mesh(
    registerGeom(new THREE.TorusGeometry(1.2, 0.08, 8, 24)),
    mats.tarnishedRoyalGold
  );
  chandelierInnerWheel.rotation.x = Math.PI / 2;
  chandelierInnerWheel.position.y = 0.4;
  chandelierGroup.add(chandelierWheel, chandelierInnerWheel);

  const chainGeom = registerGeom(new THREE.CylinderGeometry(0.03, 0.03, 6.8, 6));
  const flameConeGeom = registerGeom(new THREE.ConeGeometry(0.22, 0.55, 8));
  const flameBasicMat = new THREE.MeshBasicMaterial({ color: 0xffa726 });

  for (let c = 0; c < 8; c++) {
    const ca = (c * Math.PI * 2) / 8;
    const cx = Math.cos(ca) * 2.6;
    const cz = Math.sin(ca) * 2.6;
    const flame = new THREE.Mesh(flameConeGeom, flameBasicMat);
    flame.position.set(cx, 0.32, cz);
    chandelierGroup.add(flame);

    if (c % 2 === 0) {
      const chain = new THREE.Mesh(chainGeom, mats.rustedRelicIron);
      chain.position.set(cx * 0.7, 3.4, cz * 0.7);
      chain.rotation.z = Math.cos(ca) * 0.18;
      chain.rotation.x = -Math.sin(ca) * 0.18;
      chandelierGroup.add(chain);
    }
  }
  scene.add(chandelierGroup);

  // =========================================================================
  // 3B. FOUR CARDINAL 360° LANDMARKS (NORTH, EAST, SOUTH, WEST)
  // =========================================================================
  // NORTH (z = -12.8): Roaring Royal Hearth & Ghost King's Sovereign Throne Dais
  const hearthGroup = new THREE.Group();
  hearthGroup.position.set(0, -2.4, -12.8);
  const hearthMantle = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(7.6, 6.2, 1.8)),
    mats.palaceStonePillar
  );
  hearthMantle.position.y = 3.1;
  const hearthGoldArch = new THREE.Mesh(
    registerGeom(new THREE.TorusGeometry(2.1, 0.25, 8, 20, Math.PI)),
    mats.tarnishedRoyalGold
  );
  hearthGoldArch.position.set(0, 2.2, 0.92);
  const hearthFireCore = new THREE.Mesh(
    registerGeom(new THREE.ConeGeometry(1.75, 3.2, 14)),
    new THREE.MeshBasicMaterial({ color: 0xff6d00 })
  );
  hearthFireCore.position.set(0, 1.5, 0.75);
  const throneDais = new THREE.Mesh(
    registerGeom(new THREE.CylinderGeometry(3.8, 4.4, 0.85, 16)),
    mats.boardBorderStone
  );
  throneDais.position.set(0, 0.42, 5.2);
  hearthGroup.add(hearthMantle, hearthGoldArch, hearthFireCore, throneDais);
  scene.add(hearthGroup);

  // SOUTH (z = +11.8): Challenger's Carved Stone Seat & Grand Southern Portal
  const southPortalGroup = new THREE.Group();
  southPortalGroup.position.set(0, -2.4, 12.2);
  const playerThroneBack = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(2.6, 3.8, 0.45)),
    mats.palaceStonePillar
  );
  playerThroneBack.position.set(0, 2.2, -5.2);
  const portalStair1 = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(7.5, 0.45, 2.8)),
    mats.palaceStonePillar
  );
  portalStair1.position.set(0, 0.22, 0);
  const portalStair2 = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(5.8, 0.9, 1.8)),
    mats.tarnishedRoyalGold
  );
  portalStair2.position.set(0, 0.45, 1.1);
  southPortalGroup.add(playerThroneBack, portalStair1, portalStair2);
  scene.add(southPortalGroup);

  // EAST (x = +12.2): Rusted Royal Armory & Shattered Marble Guardian Statue
  const eastArmoryGroup = new THREE.Group();
  eastArmoryGroup.position.set(12.2, -2.4, 0);
  eastArmoryGroup.rotation.y = -Math.PI / 2;
  const statuePedestal = new THREE.Mesh(
    registerGeom(new THREE.BoxGeometry(2.8, 1.8, 2.2)),
    mats.palaceStonePillar
  );
  statuePedestal.position.y = 0.9;
  const guardianTorso = new THREE.Mesh(
    registerGeom(new THREE.CylinderGeometry(0.85, 0.65, 3.2, 10)),
    mats.whiteMarbleTrim
  );
  guardianTorso.position.y = 3.4;
  guardianTorso.rotation.z = 0.14;
  const guardianHalberd = new THREE.Mesh(
    registerGeom(new THREE.CylinderGeometry(0.06, 0.06, 5.6, 8)),
    mats.tarnishedRoyalGold
  );
  guardianHalberd.position.set(1.1, 3.2, 0.4);
  guardianHalberd.rotation.z = -0.22;
  eastArmoryGroup.add(statuePedestal, guardianTorso, guardianHalberd);
  scene.add(eastArmoryGroup);

  // WEST (x = -12.2): Bioluminescent Banyan Shrine & Occult Astrolabe Reliquary
  const westShrineGroup = new THREE.Group();
  westShrineGroup.position.set(-12.2, -2.4, 0);
  westShrineGroup.rotation.y = Math.PI / 2;
  const shrineAltar = new THREE.Mesh(
    registerGeom(new THREE.CylinderGeometry(2.2, 2.6, 1.6, 12)),
    mats.boardBorderStone
  );
  shrineAltar.position.y = 0.8;
  const astrolabeRing1 = new THREE.Mesh(
    registerGeom(new THREE.TorusGeometry(1.45, 0.09, 10, 28)),
    mats.tarnishedRoyalGold
  );
  astrolabeRing1.position.y = 3.2;
  const astrolabeRing2 = new THREE.Mesh(
    registerGeom(new THREE.TorusGeometry(1.1, 0.08, 10, 24)),
    mats.biolumFloraCyan
  );
  astrolabeRing2.position.y = 3.2;
  astrolabeRing2.rotation.y = Math.PI / 3;
  astrolabeRing2.rotation.x = Math.PI / 4;
  const shrineCrystal = new THREE.Mesh(
    registerGeom(new THREE.OctahedronGeometry(0.62, 0)),
    mats.biolumFloraEmerald
  );
  shrineCrystal.position.y = 3.2;
  westShrineGroup.add(shrineAltar, astrolabeRing1, astrolabeRing2, shrineCrystal);
  scene.add(westShrineGroup);

  // 8 Standing Iron Fire Braziers around the 360° Perimeter + 6 PointLights for Full Room Illumination
  const torchLights: THREE.PointLight[] = [];
  const brazierCount = 8;
  const brazierRadius = 11.0;
  const brazierStandGeom = registerGeom(new THREE.CylinderGeometry(0.45, 0.65, 2.6, 10));
  const brazierBowlGeom = registerGeom(new THREE.CylinderGeometry(0.75, 0.35, 0.45, 12));
  const torchFlameGeom = registerGeom(new THREE.OctahedronGeometry(0.38, 1));
  const torchFlameMat = new THREE.MeshBasicMaterial({ color: 0xff9800 });

  for (let i = 0; i < brazierCount; i++) {
    const ba = (i * Math.PI * 2) / brazierCount + Math.PI / 8;
    const bx = Math.cos(ba) * brazierRadius;
    const bz = Math.sin(ba) * brazierRadius;

    const bGroup = new THREE.Group();
    bGroup.position.set(bx, -2.4, bz);
    const stand = new THREE.Mesh(brazierStandGeom, mats.rustedRelicIron);
    stand.position.y = 1.3;
    const bowl = new THREE.Mesh(brazierBowlGeom, mats.tarnishedRoyalGold);
    bowl.position.y = 2.7;
    const flame = new THREE.Mesh(torchFlameGeom, torchFlameMat);
    flame.position.y = 3.15;
    bGroup.add(stand, bowl, flame);
    scene.add(bGroup);

    // Place 2 diagonal high-range PointLights across the 360° room (eliminates 4 per-pixel light loops for low-spec GPUs)
    if (i === 0 || i === 4) {
      const pLight = new THREE.PointLight(0xff8c3b, 62, 38, 1.2);
      pLight.position.set(bx * 0.9, 2.5, bz * 0.9);
      scene.add(pLight);
      torchLights.push(pLight);
    }
  }

  // 8 Colossal Encroaching Banyan Tree Trunks & Glowing Root Tendrils around all 360°
  const treeTrunkGeom = registerGeom(new THREE.CylinderGeometry(0.85, 1.45, 15.0, 10));
  const canopyFoliageGeom = registerGeom(new THREE.DodecahedronGeometry(2.6, 1));
  for (let t = 0; t < 8; t++) {
    const ta = (t * Math.PI * 2) / 8 + 0.22;
    const tr = 16.4;
    const tx = Math.cos(ta) * tr;
    const tz = Math.sin(ta) * tr;

    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, -2.4, tz);
    treeGroup.lookAt(0, 2.0, 0);

    const trunk = new THREE.Mesh(treeTrunkGeom, mats.cursedBarkRoot);
    trunk.position.y = 7.2;
    trunk.rotation.x = 0.16;

    const glowingCanopyNode = new THREE.Mesh(
      canopyFoliageGeom,
      t % 2 === 0 ? mats.biolumFloraEmerald : mats.biolumFloraCyan
    );
    glowingCanopyNode.scale.set(0.45, 0.25, 0.45);
    glowingCanopyNode.position.set(0, 10.2, 1.4);

    treeGroup.add(trunk, glowingCanopyNode);
    scene.add(treeGroup);
  }

  // Giant Gnarled Forest Tree Roots Breaking Through Cracked Marble Floors (TubeGeometry)
  const rootCurves: THREE.CatmullRomCurve3[] = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, -2.4, -10),
      new THREE.Vector3(-9.5, -0.8, -6),
      new THREE.Vector3(-5.8, -2.0, -3.5),
      new THREE.Vector3(-4.7, -0.35, -2.2),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(15, -2.4, -9),
      new THREE.Vector3(9.5, -0.7, -5.5),
      new THREE.Vector3(6.2, -2.1, -2.0),
      new THREE.Vector3(4.8, -0.32, -0.8),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14, -2.4, 11),
      new THREE.Vector3(-8.5, -1.1, 7.5),
      new THREE.Vector3(-5.2, -2.2, 4.5),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(14, -2.4, 10),
      new THREE.Vector3(8.2, -0.9, 6.8),
      new THREE.Vector3(5.0, -2.1, 4.2),
    ]),
    // Overhead canopy root arch behind the Ghost King
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11, -2.4, -11),
      new THREE.Vector3(-6.5, 5.2, -10),
      new THREE.Vector3(0, 7.8, -9.2),
      new THREE.Vector3(6.5, 5.2, -10),
      new THREE.Vector3(11, -2.4, -11),
    ]),
    // Southern canopy root arch behind the Player
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11, -2.4, 11),
      new THREE.Vector3(-6.5, 5.5, 10.5),
      new THREE.Vector3(0, 8.2, 10.0),
      new THREE.Vector3(6.5, 5.5, 10.5),
      new THREE.Vector3(11, -2.4, 11),
    ]),
  ];

  const stemGeom = registerGeom(new THREE.CylinderGeometry(0.05, 0.09, 0.44, 8));
  const capGeom = registerGeom(new THREE.ConeGeometry(0.28, 0.26, 12));

  for (let idx = 0; idx < rootCurves.length; idx++) {
    const curve = rootCurves[idx];
    const tubeGeom = registerGeom(
      new THREE.TubeGeometry(curve, 28, idx >= 4 ? 0.5 : 0.38, 8, false)
    );
    const rootMesh = new THREE.Mesh(tubeGeom, mats.cursedBarkRoot);
    scene.add(rootMesh);

    // Grow glowing bioluminescent forest mushrooms along the gnarled roots
    for (let m = 1; m <= 5; m++) {
      const pt = curve.getPoint(m / 6);
      const mushGroup = new THREE.Group();
      mushGroup.position.copy(pt);
      const stem = new THREE.Mesh(stemGeom, mats.whiteMarbleTrim);
      stem.position.y = 0.2;
      const cap = new THREE.Mesh(
        capGeom,
        m % 2 === 0 ? mats.biolumFloraCyan : mats.biolumFloraEmerald
      );
      cap.position.y = 0.42;
      mushGroup.add(stem, cap);
      scene.add(mushGroup);
    }
  }

  // Bioluminescent Forest Spores & Floating Embers (InstancedMesh > 120 items)
  const sporeCount = 150;
  const sporeGeom = registerGeom(new THREE.OctahedronGeometry(0.075, 0));
  const sporeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sporeInstanced = new THREE.InstancedMesh(sporeGeom, sporeMat, sporeCount);
  sporeInstanced.frustumCulled = false;

  const sporeData: { x: number; y: number; z: number; speed: number; phase: number }[] = [];
  for (let i = 0; i < sporeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 2.5 + Math.random() * 14.5;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;
    const y = -1.8 + Math.random() * 9.5;
    sporeData.push({ x, y, z, speed: 0.4 + Math.random() * 0.8, phase: Math.random() * Math.PI * 2 });

    _dummy.position.set(x, y, z);
    _dummy.scale.setScalar(0.65 + Math.random() * 0.95);
    _dummy.updateMatrix();
    sporeInstanced.setMatrixAt(i, _dummy.matrix);

    // Alternate cyan forest spores, emerald blight spores, and warm firelight embers
    const colorHex = i % 3 === 0 ? 0x22d3ee : i % 3 === 1 ? 0x34d399 : 0xffa726;
    sporeInstanced.setColorAt(i, new THREE.Color(colorHex));
  }
  sporeInstanced.instanceMatrix.needsUpdate = true;
  if (sporeInstanced.instanceColor) sporeInstanced.instanceColor.needsUpdate = true;
  sporeInstanced.computeBoundingSphere();
  scene.add(sporeInstanced);

  // =========================================================================
  // 4. THE GHOST KING & HIS WANDERING SPECTRAL COURT
  // =========================================================================
  const ghostKingGroup = new THREE.Group();
  ghostKingGroup.position.set(0, 0.2, -6.2);
  scene.add(ghostKingGroup);

  // Torso / Tattered Sovereign Mantle
  const gkTorso = new THREE.Mesh(
    registerGeom(new THREE.ConeGeometry(1.45, 3.6, 12, 1, true)),
    mats.ghostKingCloak
  );
  gkTorso.position.y = 1.6;
  ghostKingGroup.add(gkTorso);

  // Pauldrons / Armored Spectral Shoulders
  const pauldronGeom = registerGeom(new THREE.DodecahedronGeometry(0.55, 0));
  const pauldronL = new THREE.Mesh(pauldronGeom, mats.blackObsidianMain);
  pauldronL.position.set(-1.25, 2.85, 0);
  const pauldronR = new THREE.Mesh(pauldronGeom, mats.blackObsidianMain);
  pauldronR.position.set(1.25, 2.85, 0);
  ghostKingGroup.add(pauldronL, pauldronR);

  // Spectral Skull Visage & Jagged Obsidian Imperial Crown
  const gkHeadGroup = new THREE.Group();
  gkHeadGroup.position.set(0, 3.55, 0.2);
  ghostKingGroup.add(gkHeadGroup);

  const gkSkull = new THREE.Mesh(
    registerGeom(new THREE.OctahedronGeometry(0.52, 1)),
    mats.blackObsidianMain
  );
  gkHeadGroup.add(gkSkull);

  const gkEyeGeom = registerGeom(new THREE.SphereGeometry(0.09, 8, 8));
  const gkEyeL = new THREE.Mesh(gkEyeGeom, mats.biolumFloraCyan);
  gkEyeL.position.set(-0.18, 0.06, 0.44);
  const gkEyeR = new THREE.Mesh(gkEyeGeom, mats.biolumFloraCyan);
  gkEyeR.position.set(0.18, 0.06, 0.44);
  gkHeadGroup.add(gkEyeL, gkEyeR);

  // 7-Spike Imperial Obsidian Crown
  const crownSpikeGeom = registerGeom(new THREE.ConeGeometry(0.11, 0.75, 5));
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7;
    const cSpike = new THREE.Mesh(crownSpikeGeom, mats.ghostKingCrown);
    cSpike.position.set(Math.cos(a) * 0.42, 0.58, Math.sin(a) * 0.42);
    cSpike.rotation.z = -Math.cos(a) * 0.2;
    cSpike.rotation.x = Math.sin(a) * 0.2;
    gkHeadGroup.add(cSpike);
  }

  // Articulated Spectral Hands of the Ghost King
  const buildSpectralHand = (isLeft: boolean): THREE.Group => {
    const hGroup = new THREE.Group();
    const palm = new THREE.Mesh(
      registerGeom(new THREE.BoxGeometry(0.42, 0.16, 0.52)),
      mats.blackObsidianMain
    );
    hGroup.add(palm);
    const clawGeom = registerGeom(new THREE.ConeGeometry(0.055, 0.42, 4));
    for (let f = -1.5; f <= 1.5; f += 1) {
      const claw = new THREE.Mesh(clawGeom, mats.biolumFloraCyan);
      claw.rotation.x = Math.PI / 2.2;
      claw.position.set(f * 0.1, -0.04, 0.42);
      hGroup.add(claw);
    }
    hGroup.position.set(isLeft ? -1.65 : 1.65, 2.1, 1.15);
    return hGroup;
  };

  const ghostLeftHand = buildSpectralHand(true);
  const ghostRightHand = buildSpectralHand(false);
  ghostKingGroup.add(ghostLeftHand, ghostRightHand);

  // 6 Wandering Spectral Courtiers, Guards & Servants in the surrounding shadows
  const courtierGroups: { group: THREE.Group; baseAngle: number; radius: number; speed: number }[] = [];
  const courtierCloakGeom = registerGeom(new THREE.ConeGeometry(0.65, 2.8, 8, 1, true));
  const courtierHeadGeom = registerGeom(new THREE.SphereGeometry(0.26, 10, 10));
  const spearShaftGeom = registerGeom(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6));

  for (let i = 0; i < 6; i++) {
    const cGroup = new THREE.Group();
    const cloak = new THREE.Mesh(courtierCloakGeom, mats.ghostKingCloak);
    cloak.position.y = 1.4;
    const head = new THREE.Mesh(courtierHeadGeom, mats.blackObsidianBlade);
    head.position.y = 2.95;
    const eye = new THREE.Mesh(gkEyeGeom, mats.biolumFloraEmerald);
    eye.scale.setScalar(0.7);
    eye.position.set(0, 2.95, 0.22);
    const spear = new THREE.Mesh(spearShaftGeom, mats.rustedRelicIron);
    spear.position.set(0.45, 1.7, 0.2);

    cGroup.add(cloak, head, eye, spear);
    const baseAngle = (i * Math.PI * 2) / 6;
    const radius = 10.5 + (i % 2) * 2.2;
    cGroup.position.set(Math.cos(baseAngle) * radius, -2.2, Math.sin(baseAngle) * radius);
    scene.add(cGroup);

    courtierGroups.push({
      group: cGroup,
      baseAngle,
      radius,
      speed: (i % 2 === 0 ? 1 : -1) * (0.08 + i * 0.015),
    });
  }

  // =========================================================================
  // 5. PRIMAL PLAYER PERSPECTIVE — WEATHERED BARE HANDS & TRIBAL SCARS
  // =========================================================================
  const primalHandsGroup = new THREE.Group();
  primalHandsGroup.position.set(0, 1.85, 5.05);
  scene.add(primalHandsGroup);

  const buildPrimalArm = (isRight: boolean): THREE.Group => {
    const armGroup = new THREE.Group();
    const sideSign = isRight ? 1 : -1;
    armGroup.position.set(sideSign * 1.85, 0.1, 0.4);

    // Muscular bare forearm reaching from player camera toward the marble pieces
    const forearm = new THREE.Mesh(
      registerGeom(new THREE.CylinderGeometry(0.26, 0.34, 2.2, 12)),
      mats.primalSkinMaterial
    );
    forearm.rotation.x = Math.PI / 2.6;
    forearm.rotation.z = sideSign * 0.24;
    forearm.position.set(sideSign * 0.18, 0.15, 0.72);
    armGroup.add(forearm);

    // Leather wrist wrap
    const wristWrap = new THREE.Mesh(
      registerGeom(new THREE.CylinderGeometry(0.275, 0.285, 0.42, 12)),
      mats.primalWrapMaterial
    );
    wristWrap.rotation.x = Math.PI / 2.6;
    wristWrap.rotation.z = sideSign * 0.24;
    wristWrap.position.set(-sideSign * 0.06, -0.12, -0.02);
    armGroup.add(wristWrap);

    // Glowing/pale tribal scar ridges across forearm
    const scarGeom = registerGeom(new THREE.BoxGeometry(0.34, 0.045, 0.06));
    for (let s = 0; s < 4; s++) {
      const scar = new THREE.Mesh(scarGeom, mats.primalScarMaterial);
      scar.position.set(sideSign * (0.04 + s * 0.04), 0.28 + s * 0.06, 0.25 + s * 0.22);
      scar.rotation.y = 0.35 * sideSign;
      armGroup.add(scar);
    }

    // Weathered palm & knuckles poised above the marble pieces
    const palm = new THREE.Mesh(
      registerGeom(new THREE.BoxGeometry(0.46, 0.18, 0.5)),
      mats.primalSkinMaterial
    );
    palm.rotation.x = 0.28;
    palm.position.set(-sideSign * 0.18, -0.24, -0.38);
    armGroup.add(palm);

    // 4 Fingers + Thumb poised over the marble edge
    const fingerGeom = registerGeom(new THREE.CapsuleGeometry(0.048, 0.25, 4, 8));
    for (let f = -1.5; f <= 1.5; f += 1) {
      const finger = new THREE.Mesh(fingerGeom, mats.primalSkinMaterial);
      finger.rotation.x = Math.PI / 2.8;
      finger.position.set(-sideSign * 0.18 + f * 0.1, -0.34, -0.68);
      armGroup.add(finger);
    }

    return armGroup;
  };

  const primalLeftArm = buildPrimalArm(false);
  const primalRightArm = buildPrimalArm(true);
  primalHandsGroup.add(primalLeftArm, primalRightArm);

  // Pre-compute world matrices once and freeze matrixAutoUpdate on all static architecture
  // so Three.js skips recalculating ~280 static Matrix4 transforms every frame
  const dynamicObjects = new Set<THREE.Object3D>([
    scene,
    chandelierGroup,
    astrolabeRing1,
    astrolabeRing2,
    shrineCrystal,
    sporeInstanced,
  ]);
  ghostKingGroup.traverse((obj) => dynamicObjects.add(obj));
  primalHandsGroup.traverse((obj) => dynamicObjects.add(obj));
  for (const c of courtierGroups) {
    c.group.traverse((obj) => dynamicObjects.add(obj));
  }
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      dynamicObjects.add(squareCells[r][c].cursedRootRing);
    }
  }

  scene.updateMatrixWorld(true);
  scene.traverse((obj) => {
    if (!dynamicObjects.has(obj)) {
      obj.updateMatrix();
      obj.matrixAutoUpdate = false;
    }
  });

  // =========================================================================
  // 6. PER-FRAME ENVIRONMENT & ACTOR ANIMATION UPDATE
  // =========================================================================
  const updateEnvironment = (
    elapsed: number,
    dt: number,
    ghostReachTarget: THREE.Vector3 | null,
    playerReachTarget: THREE.Vector3 | null,
    ghostRoarIntensity: number
  ) => {
    const dampFactor = 1 - Math.exp(-8 * dt);

    // 1. Flickering perimeter fire braziers & chandelier sway
    for (let i = 0; i < torchLights.length; i++) {
      const flicker =
        Math.sin(elapsed * 11 + i * 2.1) * 4.5 +
        Math.cos(elapsed * 23 + i * 1.7) * 2.8;
      torchLights[i].intensity = 58 + flicker + ghostRoarIntensity * 24;
    }
    chandelierGroup.rotation.y = elapsed * 0.12;
    chandelierGroup.rotation.z = Math.sin(elapsed * 1.1) * 0.025;
    astrolabeRing1.rotation.y = elapsed * 0.65;
    astrolabeRing2.rotation.z = -elapsed * 0.85;
    shrineCrystal.rotation.y = -elapsed * 0.9;
    shrineCrystal.position.y = 3.2 + Math.sin(elapsed * 2.4) * 0.16;

    // 2. Floating bioluminescent spores & firefly embers
    for (let i = 0; i < sporeCount; i++) {
      const s = sporeData[i];
      const curY = -1.8 + ((s.y + elapsed * s.speed + 1.8) % 9.5);
      const swayX = s.x + Math.sin(elapsed * 0.9 + s.phase) * 0.35;
      const swayZ = s.z + Math.cos(elapsed * 0.8 + s.phase) * 0.35;
      _dummy.position.set(swayX, curY, swayZ);
      _dummy.rotation.set(elapsed + s.phase, elapsed * 0.5, 0);
      _dummy.scale.setScalar(0.65 + 0.35 * Math.sin(elapsed * 2.5 + s.phase));
      _dummy.updateMatrix();
      sporeInstanced.setMatrixAt(i, _dummy.matrix);
    }
    sporeInstanced.instanceMatrix.needsUpdate = true;

    // 3. Ghost King looming idle & dynamic turn reaction
    ghostKingGroup.position.y =
      0.2 + Math.sin(elapsed * 1.8) * 0.18 + ghostRoarIntensity * 0.45;
    gkHeadGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.16;
    gkHeadGroup.rotation.x =
      0.12 + Math.cos(elapsed * 1.3) * 0.06 - ghostRoarIntensity * 0.35;

    if (ghostReachTarget) {
      // Ghost right hand reaches out over the board toward the moving obsidian piece
      _targetVec.set(
        ghostReachTarget.x * 0.65,
        1.65,
        Math.min(4.8, ghostReachTarget.z + 5.8)
      );
      ghostRightHand.position.lerp(_targetVec, dampFactor);
    } else {
      _targetVec.set(1.65, 2.1 + Math.sin(elapsed * 2.2) * 0.12, 1.15);
      ghostRightHand.position.lerp(_targetVec, dampFactor);
    }
    ghostLeftHand.position.y =
      2.1 + Math.cos(elapsed * 2.0) * 0.12 + ghostRoarIntensity * 0.6;

    // 4. Wandering Spectral Courtiers in the shadows
    for (let i = 0; i < courtierGroups.length; i++) {
      const c = courtierGroups[i];
      const angle = c.baseAngle + elapsed * c.speed;
      const cx = Math.cos(angle) * c.radius;
      const cz = Math.sin(angle) * c.radius;
      c.group.position.set(
        cx,
        -2.2 + Math.sin(elapsed * 2.4 + i) * 0.14,
        cz
      );
      c.group.lookAt(0, -0.5, 0);
    }

    // 5. Primal Player Hands reaching toward selected/moved marble piece
    if (playerReachTarget) {
      _targetVec.set(
        THREE.MathUtils.clamp(playerReachTarget.x * 0.45 + 0.8, -1.2, 2.4),
        0.42,
        THREE.MathUtils.clamp(playerReachTarget.z - 4.4, -2.2, 0.5)
      );
      primalRightArm.position.lerp(_targetVec, dampFactor);
    } else {
      _targetVec.set(1.55, 0.22 + Math.sin(elapsed * 1.6) * 0.03, 0.5);
      primalRightArm.position.lerp(_targetVec, dampFactor);
    }
    primalLeftArm.position.y = 0.22 + Math.cos(elapsed * 1.5) * 0.03;

    // 6. Pulse Cursed Blight square root rings
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const ring = squareCells[r][c].cursedRootRing;
        if (ring.visible) {
          ring.rotation.z = elapsed * 0.8 + (r + c) * 0.5;
          const s = 0.92 + Math.sin(elapsed * 3.5 + r) * 0.08;
          ring.scale.set(s, s, 1);
        }
      }
    }
  };

  return {
    squareCells,
    clickableSquareMeshes,
    ghostKingGroup,
    ghostLeftHand,
    ghostRightHand,
    primalHandsGroup,
    primalRightArm,
    primalLeftArm,
    torchLights,
    updateEnvironment,
    dispose: () => {
      disposables.forEach((g) => g.dispose());
      windowGlowMatCyan.dispose();
      windowGlowMatAmber.dispose();
      flameBasicMat.dispose();
      torchFlameMat.dispose();
      sporeMat.dispose();
    },
  };
}
