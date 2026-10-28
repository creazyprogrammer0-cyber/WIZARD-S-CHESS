import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState } from '../game/chessEngine';
import {
  EphemeralGhostFragment,
  PERIPHERAL_FRAGMENT_SLOTS,
  selectGhostKingFragment,
} from '../game/ghostKingFragments';
import { horrorAudio } from '../audio/horrorSoundscape';

export interface ActiveGhostFragment extends EphemeralGhostFragment {
  fadingOut: boolean;
}

export function useGhostKingFragments(
  shellState: 'title' | 'playing' | 'paused' | 'gameover',
  gameState: GameState
) {
  const [fragments, setFragments] = useState<ActiveGhostFragment[]>([]);
  const recentIdsRef = useRef<Set<string>>(new Set());
  const lastSlotRef = useRef<number>(-1);
  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    for (const id of timeoutsRef.current) {
      window.clearTimeout(id);
    }
    timeoutsRef.current = [];
  }, []);

  const spawnFragment = useCallback((currentGameState: GameState) => {
    const chosen = selectGhostKingFragment(currentGameState, recentIdsRef.current);
    recentIdsRef.current.add(chosen.id);
    if (recentIdsRef.current.size > 6) {
      const first = recentIdsRef.current.values().next().value;
      if (first) recentIdsRef.current.delete(first);
    }

    // Pick a peripheral slot distinct from the previous one
    const slotCount = PERIPHERAL_FRAGMENT_SLOTS.length;
    let slotIndex = Math.floor(Math.random() * slotCount);
    if (slotIndex === lastSlotRef.current) {
      slotIndex = (slotIndex + 1) % slotCount;
    }
    lastSlotRef.current = slotIndex;

    const slot = PERIPHERAL_FRAGMENT_SLOTS[slotIndex];
    const uid = `${chosen.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const instance: ActiveGhostFragment = {
      uid,
      text: chosen.text,
      omenTag: chosen.omenTag,
      intensity: chosen.intensity,
      slotIndex,
      pan: slot.pan,
      createdAt: Date.now(),
      fadingOut: false,
    };

    horrorAudio.triggerSpatialWhisper(slot.pan);

    setFragments((prev) => [...prev.slice(-2), instance]);

    // Begin fade-out after 3400ms
    const fadeTimer = window.setTimeout(() => {
      setFragments((prev) =>
        prev.map((item) => (item.uid === uid ? { ...item, fadingOut: true } : item))
      );
    }, 3400);

    // Remove completely after 3800ms
    const removeTimer = window.setTimeout(() => {
      setFragments((prev) => prev.filter((item) => item.uid !== uid));
    }, 3800);

    timeoutsRef.current.push(fadeTimer, removeTimer);
  }, []);

  useEffect(() => {
    if (shellState !== 'playing') {
      setFragments([]);
      return;
    }

    // Whenever it becomes the opponent's (Ghost King's) turn, spawn ephemeral cryptic fragments
    if (gameState.turn === 'b' && gameState.status === 'playing') {
      spawnFragment(gameState);

      // Spawn a secondary echoing whisper 260ms into the Ghost King's contemplation
      const echoTimer = window.setTimeout(() => {
        spawnFragment(gameState);
      }, 260);

      timeoutsRef.current.push(echoTimer);

      return () => {
        window.clearTimeout(echoTimer);
      };
    }
  }, [shellState, gameState.turn, gameState.status, gameState.moveHistory.length, spawnFragment]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    fragments,
    summonCrypticFragment: () => spawnFragment(gameState),
  };
}
