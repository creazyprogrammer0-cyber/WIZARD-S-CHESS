/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChessMove,
  computeGhostKingMove,
  createInitialGameState,
  executeMove,
  GameState,
  getActiveHorrorLyric,
  getLegalMovesForSquare,
  WAR_CHALLENGE_ROUNDS,
} from './game/chessEngine';
import { horrorAudio } from './audio/horrorSoundscape';
import { CameraViewMode, WizardsChessCanvas } from './components/WizardsChessCanvas';
import { TitleScreen } from './components/TitleScreen';
import { GameHudAndModals } from './components/GameHudAndModals';
import { useGhostKingFragments } from './hooks/useGhostKingFragments';

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [shellState, setShellState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(
    isAutostart ? 'playing' : 'title'
  );
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [highestUnlockedRound, setHighestUnlockedRound] = useState<number>(3);
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(0));
  const [bestScore, setBestScore] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('primal');
  const [roomYawDeg, setRoomYawDeg] = useState<number>(0);
  const [autoTour360, setAutoTour360] = useState<boolean>(false);
  const [lastExecutedMove, setLastExecutedMove] = useState<ChessMove | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [defeatBloomActive, setDefeatBloomActive] = useState<boolean>(false);

  const ghostTimeoutRef = useRef<number | null>(null);

  // Ephemeral cryptic Ghost King text fragments during opponent's turn
  const { fragments: ghostFragments } = useGhostKingFragments(shellState, gameState);

  // Sync document.body.dataset.state for testability and Game Shell contract
  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  // Update Horror Song intensity only when captures/check/move state changes (not on 1Hz timer ticks)
  useEffect(() => {
    const lyric = getActiveHorrorLyric(gameStateRef.current);
    horrorAudio.setIntensity(lyric.intensity);
  }, [
    gameState.capturedByPlayer.length,
    gameState.capturedByGhost.length,
    gameState.inCheck,
    gameState.status,
    gameState.roundIndex,
    gameState.moveHistory.length,
  ]);

  const startRound = useCallback((roundIdx: number) => {
    if (ghostTimeoutRef.current !== null) {
      clearTimeout(ghostTimeoutRef.current);
      ghostTimeoutRef.current = null;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const clampedIdx = Math.max(0, Math.min(WAR_CHALLENGE_ROUNDS.length - 1, roundIdx));
    setSelectedRoundIndex(clampedIdx);
    setGameState(createInitialGameState(clampedIdx));
    setSelectedSquare(null);
    setLastExecutedMove(null);
    setDefeatBloomActive(false);
    setShellState('playing');
    document.body.dataset.state = 'playing';
    horrorAudio.startSoundscape();
  }, []);

  const triggerDefeatBloom = useCallback(() => {
    setDefeatBloomActive(true);
    horrorAudio.playHorrificDefeatBloom();
    setHighestUnlockedRound((prev) =>
      Math.min(WAR_CHALLENGE_ROUNDS.length - 1, Math.max(prev, selectedRoundIndex + 1))
    );
    setTimeout(() => {
      setShellState('gameover');
    }, 550);
  }, [selectedRoundIndex]);

  const handleExecuteMove = useCallback(
    (move: ChessMove) => {
      if (shellState !== 'playing') return;

      // Play visceral stone-grinding or bone-crushing shatter sound
      if (move.captured) {
        horrorAudio.playPieceCaptureShatter(move.piece.color === 'b');
      } else {
        horrorAudio.playPieceSlide(move.piece.color === 'b');
      }

      setLastExecutedMove(move);
      setSelectedSquare(null);

      setGameState((prev) => {
        const next = executeMove(prev, move);
        setBestScore((b) => Math.max(b, next.playerScore));

        if (next.status === 'checkmate' || next.status === 'stalemate') {
          if (next.winner === 'w') {
            horrorAudio.playVictoryFanfare();
            setHighestUnlockedRound((u) =>
              Math.min(WAR_CHALLENGE_ROUNDS.length - 1, Math.max(u, next.roundIndex + 1))
            );
            setTimeout(() => setShellState('gameover'), 550);
          } else {
            triggerDefeatBloom();
          }
        }
        return next;
      });
    },
    [shellState, triggerDefeatBloom]
  );

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  // Trigger Ghost King AI turn when it is Black's turn ('b') — snappy 550ms response
  useEffect(() => {
    if (shellState !== 'playing' || gameState.turn !== 'b' || gameState.status !== 'playing') {
      return;
    }

    ghostTimeoutRef.current = window.setTimeout(() => {
      const aiMove = computeGhostKingMove(gameStateRef.current);
      if (aiMove) {
        handleExecuteMove(aiMove);
      }
    }, 550);

    return () => {
      if (ghostTimeoutRef.current !== null) {
        clearTimeout(ghostTimeoutRef.current);
        ghostTimeoutRef.current = null;
      }
    };
  }, [shellState, gameState.turn, gameState.status, gameState.moveHistory.length, handleExecuteMove]);

  // Blitz Turn Timer Countdown (1Hz tick)
  useEffect(() => {
    if (shellState !== 'playing' || gameState.status !== 'playing') return;

    const timerId = window.setInterval(() => {
      setGameState((prev) => {
        if (prev.turnTimeRemaining <= 1) {
          // Turn clock expired -> Ghost King triggers Horrific Defeat Bloom!
          triggerDefeatBloom();
          return {
            ...prev,
            turnTimeRemaining: 0,
            status: 'timeout',
            winner: 'b',
          };
        }
        return {
          ...prev,
          turnTimeRemaining: prev.turnTimeRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [shellState, gameState.status, triggerDefeatBloom]);

  // Handle clicking a square on the 3D chessboard
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      const curState = gameStateRef.current;
      if (shellState !== 'playing' || curState.turn !== 'w' || curState.status !== 'playing') {
        return;
      }

      // If a square is already selected, check if clicked square is a legal destination
      if (selectedSquare) {
        const legalMoves = getLegalMovesForSquare(
          curState,
          selectedSquare.row,
          selectedSquare.col
        );
        const matchingMove = legalMoves.find((m) => m.toRow === row && m.toCol === col);
        if (matchingMove) {
          handleExecuteMove(matchingMove);
          return;
        }
      }

      // Otherwise, if clicked square contains a White player piece, select it
      const clickedPiece = curState.board[row]?.[col];
      if (clickedPiece && clickedPiece.color === 'w') {
        setSelectedSquare({ row, col });
        horrorAudio.triggerStoneFootstep(0);
      } else {
        setSelectedSquare(null);
      }
    },
    [shellState, selectedSquare, handleExecuteMove]
  );

  const handleSelectCameraMode = useCallback((mode: CameraViewMode) => {
    setCameraMode(mode);
    if (mode === 'orbit360') {
      setAutoTour360(true);
    } else if (mode === 'primal') {
      setRoomYawDeg(0);
      setAutoTour360(false);
    }
  }, []);

  const handleManualRoomYawDeg = useCallback((deg: number) => {
    setAutoTour360(false);
    setRoomYawDeg(deg);
  }, []);

  const handleToggleAutoTour360 = useCallback(() => {
    setAutoTour360((v) => !v);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      horrorAudio.setMuted(next);
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setShellState((s) => {
      if (s === 'playing') {
        horrorAudio.pauseSoundscape();
        return 'paused';
      }
      horrorAudio.startSoundscape();
      return 'playing';
    });
  }, []);

  const handleRestartRound = useCallback(() => {
    startRound(selectedRoundIndex);
  }, [startRound, selectedRoundIndex]);

  const handleReturnToTitle = useCallback(() => {
    horrorAudio.pauseSoundscape();
    setDefeatBloomActive(false);
    setShellState('title');
  }, []);

  const handleSelectSquareDirect = useCallback((r: number, c: number) => {
    setSelectedSquare({ row: r, col: c });
  }, []);

  const handleTriggerDefeatBloomAndEscalate = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: 'checkmate',
      winner: 'b',
    }));
    triggerDefeatBloom();
  }, [triggerDefeatBloom]);

  const handleAdvanceToNextChallengeRound = useCallback(() => {
    const nextIdx = (selectedRoundIndex + 1) % WAR_CHALLENGE_ROUNDS.length;
    startRound(nextIdx);
  }, [selectedRoundIndex, startRound]);

  // Global Keyboard Shortcuts (Title Start, Pause, Mute, Restart, Camera Presets 1-4)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shellState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startRound(selectedRoundIndex);
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setShellState((s) => {
          if (s === 'playing') {
            horrorAudio.pauseSoundscape();
            return 'paused';
          }
          if (s === 'paused') {
            horrorAudio.startSoundscape();
            return 'playing';
          }
          return s;
        });
      } else if (e.code === 'KeyM') {
        setIsMuted((m) => {
          const next = !m;
          horrorAudio.setMuted(next);
          return next;
        });
      } else if (e.code === 'KeyR' && shellState === 'playing') {
        startRound(selectedRoundIndex);
      } else if (shellState === 'playing') {
        if (e.code === 'Digit1') {
          setCameraMode('primal');
          setAutoTour360(false);
        } else if (e.code === 'Digit2') {
          setCameraMode('orbit360');
          setAutoTour360(true);
        } else if (e.code === 'Digit3') {
          setCameraMode('overhead');
          setAutoTour360(false);
        } else if (e.code === 'Digit4') {
          setCameraMode('ghostking');
          setAutoTour360(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellState, selectedRoundIndex, startRound]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b111e] select-none">
      {/* Isolated Full-Viewport 3D WebGL Canvas */}
      <WizardsChessCanvas
        shellState={shellState}
        gameState={gameState}
        selectedSquare={selectedSquare}
        cameraMode={cameraMode}
        roomYawDeg={roomYawDeg}
        autoTour360={autoTour360}
        lastExecutedMove={lastExecutedMove}
        defeatBloomActive={defeatBloomActive}
        onSquareClick={handleSquareClick}
        onChangeRoomYawDeg={setRoomYawDeg}
      />

      {/* Title Screen Overlay */}
      {shellState === 'title' && (
        <TitleScreen
          selectedRoundIndex={selectedRoundIndex}
          highestUnlockedRound={highestUnlockedRound}
          onSelectRound={(idx) => setSelectedRoundIndex(idx)}
          onStartGame={() => startRound(selectedRoundIndex)}
        />
      )}

      {/* Playing HUD & Outcome-Matched Modals */}
      {shellState !== 'title' && (
        <GameHudAndModals
          shellState={shellState}
          gameState={gameState}
          bestScore={bestScore}
          selectedSquare={selectedSquare}
          cameraMode={cameraMode}
          roomYawDeg={roomYawDeg}
          autoTour360={autoTour360}
          isMuted={isMuted}
          defeatBloomActive={defeatBloomActive}
          ghostFragments={ghostFragments}
          onSelectCameraMode={handleSelectCameraMode}
          onChangeRoomYawDeg={handleManualRoomYawDeg}
          onToggleAutoTour360={handleToggleAutoTour360}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onRestartRound={handleRestartRound}
          onReturnToTitle={handleReturnToTitle}
          onExecuteMove={handleExecuteMove}
          onSelectSquare={handleSelectSquareDirect}
          onTriggerDefeatBloomAndEscalate={handleTriggerDefeatBloomAndEscalate}
          onAdvanceToNextChallengeRound={handleAdvanceToNextChallengeRound}
        />
      )}
    </main>
  );
}

