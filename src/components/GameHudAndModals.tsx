import React, { useEffect, useMemo, useState } from 'react';
import {
  ChessMove,
  coordsToAlgebraic,
  GameState,
  getActiveHorrorLyric,
  getAllLegalMoves,
  getChallengeForRound,
  getLegalMovesForSquare,
  PIECE_NAMES,
  WAR_CHALLENGE_ROUNDS,
} from '../game/chessEngine';
import { PERIPHERAL_FRAGMENT_SLOTS } from '../game/ghostKingFragments';
import { ActiveGhostFragment } from '../hooks/useGhostKingFragments';
import { CameraViewMode } from './WizardsChessCanvas';

interface GameHudAndModalsProps {
  shellState: 'title' | 'playing' | 'paused' | 'gameover';
  gameState: GameState;
  bestScore: number;
  selectedSquare: { row: number; col: number } | null;
  cameraMode: CameraViewMode;
  roomYawDeg: number;
  autoTour360: boolean;
  isMuted: boolean;
  defeatBloomActive: boolean;
  ghostFragments: ActiveGhostFragment[];
  onSelectCameraMode: (mode: CameraViewMode) => void;
  onChangeRoomYawDeg: (deg: number) => void;
  onToggleAutoTour360: () => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestartRound: () => void;
  onReturnToTitle: () => void;
  onExecuteMove: (move: ChessMove) => void;
  onSelectSquare: (row: number, col: number) => void;
  onTriggerDefeatBloomAndEscalate: () => void;
  onAdvanceToNextChallengeRound: () => void;
}

export const GameHudAndModals: React.FC<GameHudAndModalsProps> = React.memo(({
  shellState,
  gameState,
  bestScore,
  selectedSquare,
  cameraMode,
  roomYawDeg,
  autoTour360,
  isMuted,
  defeatBloomActive,
  ghostFragments,
  onSelectCameraMode,
  onChangeRoomYawDeg,
  onToggleAutoTour360,
  onToggleMute,
  onTogglePause,
  onRestartRound,
  onReturnToTitle,
  onExecuteMove,
  onSelectSquare,
  onTriggerDefeatBloomAndEscalate,
  onAdvanceToNextChallengeRound,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shellState === 'playing' && e.code === 'KeyH') {
        setDockCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shellState]);

  const challenge = useMemo(
    () => getChallengeForRound(gameState.roundIndex),
    [gameState.roundIndex]
  );

  const activeLyric = useMemo(
    () => getActiveHorrorLyric(gameState),
    [
      gameState.capturedByPlayer.length,
      gameState.capturedByGhost.length,
      gameState.inCheck,
      gameState.status,
      gameState.roundIndex,
      gameState.moveHistory.length,
    ]
  );

  // Memoize legal moves for selected square so 1Hz clock ticks & 360° camera rotation don't clone boards
  const selectedMoves = useMemo(
    () =>
      selectedSquare && gameState.turn === 'w'
        ? getLegalMovesForSquare(gameState, selectedSquare.row, selectedSquare.col)
        : [],
    [gameState.board, gameState.turn, gameState.enPassantTarget, selectedSquare]
  );

  const suggestedMoves = useMemo(() => {
    if (gameState.turn !== 'w') return [];
    const allPlayerMoves = getAllLegalMoves(gameState, 'w');
    return allPlayerMoves
      .sort((a, b) => {
        const sa = (a.captured ? 100 : 0) + (a.triggersCursedSquare ? 40 : 0);
        const sb = (b.captured ? 100 : 0) + (b.triggersCursedSquare ? 40 : 0);
        return sb - sa;
      })
      .slice(0, 4);
  }, [gameState.board, gameState.turn, gameState.enPassantTarget]);

  const nextRoundIndex = Math.min(
    WAR_CHALLENGE_ROUNDS.length - 1,
    gameState.roundIndex + 1
  );
  const nextChallenge = WAR_CHALLENGE_ROUNDS[nextRoundIndex];


  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Horrific Defeat Bloom Red/Cyan Shockwave Vignette when triggered */}
      {defeatBloomActive && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            boxShadow: 'inset 0 0 140px 45px rgba(225, 29, 72, 0.72)',
            border: '2px solid rgba(244, 63, 94, 0.65)',
          }}
        />
      )}

      {/* EPHEMERAL CRYPTIC GHOST KING TEXT FRAGMENTS DURING OPPONENT'S TURN */}
      <div
        className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
        aria-live="polite"
      >
        {ghostFragments.map((frag) => {
          const slot =
            PERIPHERAL_FRAGMENT_SLOTS[frag.slotIndex] || PERIPHERAL_FRAGMENT_SLOTS[0];
          const isWrath = frag.intensity === 'wrath';
          const isDread = frag.intensity === 'dread';
          return (
            <div
              key={frag.uid}
              data-testid="ghost-king-fragment"
              className={`fixed flex flex-col max-w-[260px] sm:max-w-xs px-3.5 py-2.5 rounded-lg border transition-opacity duration-200 ${
                slot.positionClass
              } ${
                frag.fadingOut ? 'opacity-0' : 'opacity-100'
              } ${
                isWrath
                  ? 'border-rose-500/65 shadow-[0_0_26px_rgba(225,29,72,0.45)]'
                  : isDread
                  ? 'border-amber-500/50 shadow-[0_0_20px_rgba(217,119,6,0.3)]'
                  : 'border-cyan-500/45 shadow-[0_0_18px_rgba(6,182,212,0.28)]'
              }`}
              style={{ backgroundColor: 'rgba(8, 11, 20, 0.92)' }}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-cyan-300/90">
                <span>Ghost King</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    isWrath
                      ? 'text-rose-400 font-semibold'
                      : isDread
                      ? 'text-amber-300'
                      : 'text-cyan-300'
                  }
                >
                  {frag.omenTag}
                </span>
              </div>
              <p
                className={`mt-1 text-xs sm:text-sm font-semibold italic leading-snug ${
                  isWrath
                    ? 'text-rose-200'
                    : isDread
                    ? 'text-amber-100'
                    : 'text-slate-100'
                }`}
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                {frag.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* TOP PERIMETER BAR: Left Status Cluster · Center Horror Song Lyrics · Right Utility SVG Controls */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* Top-Left Perimeter Cluster: Live Mechanics Readouts */}
        <div
          className="pointer-events-auto rounded-lg px-2.5 py-2 sm:px-3.5 sm:py-2.5 border border-amber-500/30 shadow-lg max-w-[232px] sm:max-w-md min-w-0"
          style={{ backgroundColor: 'rgba(10, 13, 22, 0.92)' }}
        >
          {/* Quiet unboxed metadata line with middle-dot separators */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-300/90 font-medium truncate">
            <span className="truncate">{challenge.title}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">
              {gameState.turn === 'w' ? 'Your Turn' : 'Ghost Turn'}
            </span>
            {gameState.inCheck && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400 font-bold shrink-0">CHECK!</span>
              </>
            )}
          </div>

          {/* Hero-to-Kicker (~3:1) Tabular-Nums Metrics */}
          <div className="mt-1 flex items-baseline gap-3 sm:gap-5">
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">
                CLOCK
              </div>
              <div
                className={`font-mono text-lg sm:text-2xl font-bold tabular-nums leading-tight ${
                  gameState.turnTimeRemaining <= 10 ? 'text-rose-400' : 'text-amber-100'
                }`}
              >
                {Math.round(gameState.turnTimeRemaining)}s
              </div>
            </div>

            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">
                SLAIN
              </div>
              <div className="font-mono text-lg sm:text-2xl font-bold tabular-nums leading-tight text-cyan-300">
                {gameState.capturedByPlayer.length}
                <span className="text-[10px] sm:text-xs text-slate-400 font-normal">
                  /{gameState.capturedByGhost.length}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">
                SCORE
              </div>
              <div className="font-mono text-lg sm:text-2xl font-bold tabular-nums leading-tight text-emerald-300">
                {Math.round(gameState.playerScore)}
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                WRATH
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums leading-tight text-rose-400">
                {Math.round(gameState.ghostAggressionLevel)}%
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: Synchronized Original Horror Song Lyrics */}
        {showLyrics && (
          <div
            className="hidden lg:flex flex-col items-center text-center px-5 py-2 rounded-lg border border-cyan-500/25 max-w-xl pointer-events-auto"
            style={{ backgroundColor: 'rgba(8, 12, 20, 0.88)' }}
          >
            <div className="text-[11px] font-mono text-cyan-300 tracking-wide">
              {activeLyric.title} · Intensity: {activeLyric.intensity.toUpperCase()}
            </div>
            <div
              className="text-sm font-semibold text-amber-100 mt-0.5 italic"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {activeLyric.line}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">{activeLyric.subline}</div>
          </div>
        )}

        {/* Top-Right Utility Controls: Square SVG Icon Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            tabIndex={-1}
            aria-label={showLyrics ? 'Hide Horror Song Lyrics' : 'Show Horror Song Lyrics'}
            onClick={(e) => {
              e.currentTarget.blur();
              setShowLyrics((v) => !v);
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-amber-500/30 flex items-center justify-center text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(10, 13, 22, 0.92)' }}
            title="Toggle Horror Song Lyrics"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-amber-500/30 flex items-center justify-center text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(10, 13, 22, 0.92)' }}
            title="Mute / Unmute Audio [M]"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Restart Current War Round (R)"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestartRound();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-amber-500/30 flex items-center justify-center text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(10, 13, 22, 0.92)' }}
            title="Restart Round [R]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game (P or Escape)"
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-amber-500/30 flex items-center justify-center text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(10, 13, 22, 0.92)' }}
            title="Pause [P / Esc]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Zero Side-Panel Clutter) */}
      <div className="w-full flex flex-col items-center pointer-events-none">
        {/* Collapse / Expand Toggle Tab */}
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="pointer-events-auto px-4 py-1 rounded-t-lg border border-b-0 border-amber-500/30 text-xs font-mono text-amber-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
          style={{ backgroundColor: 'rgba(10, 13, 22, 0.94)' }}
        >
          <svg
            viewBox="0 0 16 16"
            className={`w-3.5 h-3.5 transition-transform ${dockCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
          <span>{dockCollapsed ? 'Show Tactical & Camera Dock [H]' : 'Hide Controls [H]'}</span>
        </button>

        {!dockCollapsed && (
          <div
            className="pointer-events-auto w-full max-w-[940px] rounded-xl border border-amber-500/30 px-4 py-3 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(10, 13, 22, 0.94)' }}
          >
            {/* Zone 1: 360° Camera Perspective & Full-Room 360° Panorama Controls */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300 font-medium">
                <span>Perspective &amp; Full 360° Room View</span>
                <span className="font-mono text-cyan-300 tabular-nums">
                  {roomYawDeg}° / 360°
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'primal', label: '1. Primal Hands' },
                    { id: 'orbit360', label: '2. 360° Palace Tour' },
                    { id: 'overhead', label: '3. Overhead Board' },
                    { id: 'ghostking', label: '4. Ghost King Court' },
                  ] as { id: CameraViewMode; label: string }[]
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => onSelectCameraMode(cam.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraMode === cam.id
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
              {/* 360° Room Angle Scrubber + Cardinal Room Landmarks */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={roomYawDeg}
                  aria-label="360° Room Panorama Angle"
                  onChange={(e) => onChangeRoomYawDeg(Number(e.target.value))}
                  className="w-24 sm:w-28 accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                {(
                  [
                    { deg: 0, label: '0° N' },
                    { deg: 90, label: '90° E' },
                    { deg: 180, label: '180° S' },
                    { deg: 270, label: '270° W' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.deg}
                    type="button"
                    onClick={() => onChangeRoomYawDeg(preset.deg)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      Math.abs(roomYawDeg - preset.deg) < 8
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-cyan-200 hover:bg-slate-700 border border-cyan-500/30'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onToggleAutoTour360}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    autoTour360
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-emerald-300 hover:bg-slate-700 border border-emerald-500/30'
                  }`}
                >
                  {autoTour360 ? 'Auto 360°: ON' : 'Auto 360°'}
                </button>
              </div>
            </div>

            {/* Zone 2: Selected Square / Tactical Move Command Strip */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="text-[11px] text-slate-400 font-medium truncate">
                {selectedSquare
                  ? `Selected ${coordsToAlgebraic(selectedSquare.row, selectedSquare.col).toUpperCase()} (${
                      selectedMoves.length
                    } legal moves) — Click square or choose move:`
                  : 'Tactical Command — Click any White Marble piece or quick-strike:'}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(selectedMoves.length > 0 ? selectedMoves.slice(0, 4) : suggestedMoves).map(
                  (m) => (
                    <button
                      key={m.notation}
                      type="button"
                      onClick={() => {
                        onSelectSquare(m.fromRow, m.fromCol);
                        onExecuteMove(m);
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        m.captured
                          ? 'bg-rose-600/80 hover:bg-rose-500 text-white border border-rose-300/40'
                          : m.triggersCursedSquare
                          ? 'bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-400/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-100 border border-amber-500/25'
                      }`}
                    >
                      {m.notation}
                      {m.captured ? ` (Shatter ${PIECE_NAMES[m.captured.type]})` : ''}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Zone 3: Endure Defeat Bloom & Escalate War Challenge */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={onTriggerDefeatBloomAndEscalate}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-200 bg-rose-950/90 hover:bg-rose-900 border border-rose-500/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Trigger the Ghost King's Horrific Defeat Bloom and face the next escalating War Round"
              >
                Endure Defeat Bloom
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SINGLE FOCUSED STATUS MODAL CARDS: PAUSED & GAMEOVER (VICTORY/DEFEAT) */}
      {/* ===================================================================== */}
      {shellState === 'paused' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(5, 7, 12, 0.82)' }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-amber-500/40 p-6 shadow-2xl"
            style={{ backgroundColor: 'rgba(12, 16, 28, 0.98)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
          >
            <h2
              id="pause-modal-title"
              className="text-2xl font-bold text-amber-100 tracking-wide"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              War Suspended in the Andarmahal
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              {challenge.title} · {challenge.subtitle}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10">
                <div className="text-[10px] uppercase text-slate-400">WAR ROUND</div>
                <div className="font-mono text-lg font-bold tabular-nums text-amber-300">
                  {challenge.round}/4
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10">
                <div className="text-[10px] uppercase text-slate-400">SHATTERED</div>
                <div className="font-mono text-lg font-bold tabular-nums text-cyan-300">
                  {gameState.capturedByPlayer.length}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10">
                <div className="text-[10px] uppercase text-slate-400">SCORE</div>
                <div className="font-mono text-lg font-bold tabular-nums text-emerald-300">
                  {Math.round(gameState.playerScore)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onTogglePause}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Resume Match (Esc / P)
              </button>
              <button
                type="button"
                onClick={onRestartRound}
                className="w-full py-2.5 px-4 rounded-lg font-medium text-sm bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Restart {challenge.title}
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 px-4 rounded-lg font-medium text-sm bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10 transition-colors cursor-pointer"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {shellState === 'gameover' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(8, 6, 12, 0.86)' }}
        >
          <div
            className={`w-full max-w-lg rounded-xl p-6 shadow-2xl border ${
              gameState.winner === 'w'
                ? 'border-emerald-400/50'
                : 'border-rose-500/60'
            }`}
            style={{ backgroundColor: 'rgba(13, 15, 25, 0.98)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gameover-modal-title"
          >
            <div className="text-xs font-mono uppercase tracking-widest text-rose-400">
              {gameState.winner === 'w'
                ? 'Sovereign Banished · Stage Cleared'
                : 'Horrific Defeat Bloom · Sub-Bass Shockwave'}
            </div>
            <h2
              id="gameover-modal-title"
              className="mt-1 text-2xl sm:text-3xl font-bold text-amber-100"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {gameState.winner === 'w'
                ? 'The Obsidian Crown Shatters!'
                : 'The Ghost King Claims Your Mortal Soul'}
            </h2>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {gameState.winner === 'w'
                ? 'Your carved ancient marble legion crushed the Ghost King’s court. Yet deeper roots stir beneath the Andarmahal...'
                : 'Demonic royal horns echo off the ruined palace walls as the Defeat Bloom shockwave tears through the chamber. To break his curse, you must survive the next escalating War Round!'}
            </p>

            {/* 3 Tabular-Nums Mastery / Progress Stat Tiles */}
            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
                <div className="text-[10px] uppercase text-slate-400">WAR ROUND</div>
                <div className="font-mono text-xl font-bold tabular-nums text-amber-300">
                  {challenge.round} / 4
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
                <div className="text-[10px] uppercase text-slate-400">OBSIDIAN SLAIN</div>
                <div className="font-mono text-xl font-bold tabular-nums text-cyan-300">
                  {gameState.capturedByPlayer.length} / 16
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
                <div className="text-[10px] uppercase text-slate-400">SCORE / BEST</div>
                <div className="font-mono text-xl font-bold tabular-nums text-emerald-300">
                  {Math.round(gameState.playerScore)} /{' '}
                  {Math.round(Math.max(bestScore, gameState.playerScore))}
                </div>
              </div>
            </div>

            {/* Next-Round Challenge Escalation Preview */}
            <div className="mt-4 p-3.5 rounded-lg bg-slate-900/95 border border-amber-500/30">
              <div className="text-xs font-semibold text-amber-300">
                Next Escalating War Challenge: {nextChallenge.title}
              </div>
              <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                {nextChallenge.subtitle}
              </div>
              <p className="text-xs text-slate-300 mt-1">{nextChallenge.description}</p>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={onAdvanceToNextChallengeRound}
                className="flex-1 py-3 px-5 rounded-lg font-bold text-sm bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Enter {nextChallenge.title}
              </button>
              <button
                type="button"
                onClick={onRestartRound}
                className="py-3 px-4 rounded-lg font-medium text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Retry Round {challenge.round}
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="py-3 px-4 rounded-lg font-medium text-xs bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

