import type { GameState } from './chessEngine';

export type FragmentIntensity = 'omen' | 'dread' | 'wrath';

export interface GhostFragmentTemplate {
  id: string;
  text: string;
  omenTag: string;
  intensity: FragmentIntensity;
}

export interface EphemeralGhostFragment {
  uid: string;
  text: string;
  omenTag: string;
  intensity: FragmentIntensity;
  slotIndex: number; // 0..3 peripheral screen positions
  pan: number; // -0.85..0.85 stereo pan for spatial whisper
  createdAt: number;
}

export const GHOST_KING_FRAGMENT_POOL: GhostFragmentTemplate[] = [
  // Omen tier (early game / psychological unease)
  {
    id: 'omen_1',
    text: '“Your pulse trembles against the white stone… I can hear it through the floor.”',
    omenTag: 'Whisper from the Banyan Roots',
    intensity: 'omen',
  },
  {
    id: 'omen_2',
    text: '“Three emperors sat in your chair. Their marrow feeds these glowing spores.”',
    omenTag: 'Echo of the Andarmahal',
    intensity: 'omen',
  },
  {
    id: 'omen_3',
    text: '“Do not look behind your bare shoulder. My servants only bite when seen.”',
    omenTag: 'Murmur in the Torchlight',
    intensity: 'omen',
  },
  {
    id: 'omen_4',
    text: '“Every square on this table was carved from a forgotten gravestone.”',
    omenTag: 'Voice of the Obsidian Crown',
    intensity: 'omen',
  },
  {
    id: 'omen_5',
    text: '“The scars on your forearms remember the blade. Soon your King will too.”',
    omenTag: 'Omen of the Rusted Katar',
    intensity: 'omen',
  },

  // Dread tier (captures underway / rising aggression)
  {
    id: 'dread_1',
    text: '“White marble cracks so sweetly… like mortal ribs beneath a warhorse.”',
    omenTag: 'Chant of the Shattered Pawn',
    intensity: 'dread',
  },
  {
    id: 'dread_2',
    text: '“You guard your center, yet the forest roots are already coiling around your ankles.”',
    omenTag: 'Blight of the Inner Palace',
    intensity: 'dread',
  },
  {
    id: 'dread_3',
    text: '“Did you think that move was yours? I whispered it into your skull.”',
    omenTag: 'DECREE OF THE PHANTOM SOVEREIGN',
    intensity: 'dread',
  },
  {
    id: 'dread_4',
    text: '“The torches dim each time you hesitate. The dark belongs to my court.”',
    omenTag: 'Shadow of the Courtiers',
    intensity: 'dread',
  },
  {
    id: 'dread_5',
    text: '“Your ivory pieces weep dust. My obsidian blades only sharpen on bone.”',
    omenTag: 'Curse of the Black Spire',
    intensity: 'dread',
  },

  // Wrath tier (high aggression / Check / late rounds)
  {
    id: 'wrath_1',
    text: '“KNEEL, MORTAL! THE THRONE OF ASH DEMANDS YOUR KING’S HEAD!”',
    omenTag: 'WRATH OF THE GHOST EMPEROR',
    intensity: 'wrath',
  },
  {
    id: 'wrath_2',
    text: '“THERE IS NO ESCAPE FROM THIS CHAMBER—ONLY THE DEFEAT BLOOM AWAITS!”',
    omenTag: 'OMEN OF THE SUB-BASS SHOCKWAVE',
    intensity: 'wrath',
  },
  {
    id: 'wrath_3',
    text: '“MY COURTIERS DRAW CLOSER! FEEL THEIR COLD BREATH UPON YOUR NECK!”',
    omenTag: 'REQUIEM OF THE ANDARMAHAL',
    intensity: 'wrath',
  },
  {
    id: 'wrath_4',
    text: '“THE PALACE ROOTS DRINK YOUR TIME! SURRENDER YOUR CROWN TO THE DARK!”',
    omenTag: 'BLOOD MOON DECREE',
    intensity: 'wrath',
  },
];

// 4 Peripheral screen slots that keep the central 3D chessboard unobstructed
export const PERIPHERAL_FRAGMENT_SLOTS: {
  label: string;
  positionClass: string;
  pan: number;
}[] = [
  {
    label: 'upper-left',
    positionClass: 'top-28 left-4 sm:left-8 text-left',
    pan: -0.75,
  },
  {
    label: 'upper-right',
    positionClass: 'top-28 right-4 sm:right-8 text-right items-end',
    pan: 0.75,
  },
  {
    label: 'mid-left',
    positionClass: 'top-1/2 -translate-y-1/2 left-4 sm:left-8 text-left',
    pan: -0.85,
  },
  {
    label: 'mid-right',
    positionClass: 'top-1/2 -translate-y-1/2 right-4 sm:right-8 text-right items-end',
    pan: 0.85,
  },
];

export function selectGhostKingFragment(
  state: GameState,
  excludeIds: Set<string>,
  rng: () => number = Math.random
): GhostFragmentTemplate {
  const totalCaptures = state.capturedByPlayer.length + state.capturedByGhost.length;

  let targetIntensity: FragmentIntensity = 'omen';
  if (state.inCheck || state.ghostAggressionLevel >= 55 || state.roundIndex >= 2) {
    targetIntensity = 'wrath';
  } else if (totalCaptures >= 2 || state.ghostAggressionLevel >= 30 || state.roundIndex >= 1) {
    targetIntensity = 'dread';
  }

  // Filter pool by intensity or fallback to full pool
  let candidates = GHOST_KING_FRAGMENT_POOL.filter(
    (f) => f.intensity === targetIntensity && !excludeIds.has(f.id)
  );
  if (candidates.length === 0) {
    candidates = GHOST_KING_FRAGMENT_POOL.filter((f) => !excludeIds.has(f.id));
  }
  if (candidates.length === 0) {
    candidates = GHOST_KING_FRAGMENT_POOL;
  }

  const idx = Math.floor(rng() * candidates.length);
  return candidates[Math.max(0, Math.min(candidates.length - 1, idx))];
}
