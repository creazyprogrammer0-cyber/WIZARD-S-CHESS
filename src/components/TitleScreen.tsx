import React from 'react';
import { WAR_CHALLENGE_ROUNDS } from '../game/chessEngine';

interface TitleScreenProps {
  selectedRoundIndex: number;
  highestUnlockedRound: number;
  onSelectRound: (roundIdx: number) => void;
  onStartGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedRoundIndex,
  highestUnlockedRound,
  onSelectRound,
  onStartGame,
}) => {
  const activeChallenge = WAR_CHALLENGE_ROUNDS[selectedRoundIndex] || WAR_CHALLENGE_ROUNDS[0];

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(6, 8, 14, 0.78) 0%, rgba(6, 8, 14, 0.35) 45%, rgba(6, 8, 14, 0.0) 100%)',
      }}
    >
      {/* Left/Top Negative-Space Anchor with Custom Inline SVG Royal Emblem & Lockup */}
      <div className="max-w-xl pointer-events-auto mt-2 md:mt-6">
        <svg
          viewBox="0 0 600 156"
          className="w-full max-w-[540px] h-auto mb-5 drop-shadow-[0_6px_18px_rgba(0,0,0,0.95)]"
          role="img"
          aria-label="Andarmahal: Wizard's Chess — War with the Ghost King"
        >
          {/* Ornate Royal Arch & Obsidian Crown Crest */}
          <path
            d="M16 38 L50 12 L66 34 L86 6 L106 34 L122 12 L156 38 L144 62 L28 62 Z"
            fill="#141824"
            stroke="#d49b3b"
            strokeWidth="2.2"
          />
          <circle cx="86" cy="28" r="5" fill="#22d3ee" />
          <circle cx="58" cy="36" r="3.5" fill="#34d399" />
          <circle cx="114" cy="36" r="3.5" fill="#34d399" />
          <path
            d="M28 68 L144 68"
            stroke="#d49b3b"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Main Display Title in SVG */}
          <text
            x="172"
            y="44"
            fill="#f5efe6"
            fontFamily="Cinzel, serif"
            fontWeight="700"
            fontSize="32"
            letterSpacing="3"
          >
            ANDARMAHAL
          </text>
          <text
            x="174"
            y="72"
            fill="#d49b3b"
            fontFamily="Cinzel, serif"
            fontWeight="600"
            fontSize="15"
            letterSpacing="2.8"
          >
            WIZARD’S CHESS · THE GHOST KING
          </text>

          {/* Architectural Hairline Rule with Bioluminescent Diamond */}
          <line x1="16" y1="94" x2="268" y2="94" stroke="#85622a" strokeWidth="1.2" />
          <polygon points="286,88 294,94 286,100 278,94" fill="#22d3ee" />
          <line x1="304" y1="94" x2="576" y2="94" stroke="#85622a" strokeWidth="1.2" />

          <text
            x="16"
            y="122"
            fill="#e2e8f0"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="600"
            fontSize="13"
            letterSpacing="0.6"
          >
            WHITE MARBLE VS. CURSED BLACK OBSIDIAN IN THE RUINED PALACE
          </text>
          <text
            x="16"
            y="144"
            fill="#67e8f9"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
            fontSize="12"
            letterSpacing="0.5"
          >
            32 PIECES · 360° PALACE &amp; FOREST TOUR · SPATIAL HORROR SONG
          </text>
        </svg>

        {/* Escalating War Round Selector (Interactive segmented controls) */}
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-wider text-amber-400/90 mb-2">
            Select War Escalation Stage
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-lg border border-amber-500/25"
            style={{ backgroundColor: 'rgba(13, 16, 26, 0.92)' }}
          >
            {WAR_CHALLENGE_ROUNDS.map((r, idx) => {
              const isSelected = idx === selectedRoundIndex;
              const isLocked = idx > highestUnlockedRound;
              return (
                <button
                  key={r.round}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onSelectRound(idx)}
                  className={`px-3 py-2 rounded text-left transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-amber-600/30 border border-amber-400 text-amber-100'
                      : isLocked
                      ? 'opacity-45 cursor-not-allowed text-slate-500'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="font-mono text-xs font-semibold tabular-nums">
                    Round {r.round} {isLocked ? '· Locked' : ''}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {r.turnTimerSeconds}s Clock
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-xs text-slate-300 leading-relaxed max-w-md">
            <strong className="text-amber-300">{activeChallenge.title}:</strong>{' '}
            {activeChallenge.description}
          </p>
        </div>

        {/* Primary Start Action */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            data-start="true"
            onClick={onStartGame}
            className="px-7 py-3.5 rounded-lg font-display font-bold text-sm tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition-all shadow-[0_0_28px_rgba(245,158,11,0.45)] whitespace-nowrap shrink-0 cursor-pointer"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Enter the Andarmahal (Enter / Space)
          </button>
        </div>
      </div>

      {/* Single flat borderless control-hint line in the bottom safe margin */}
      <div className="w-full text-center md:text-left text-xs text-slate-300/90 font-mono tracking-wide pointer-events-none">
        Click Square Select &amp; Move · Drag or WASD 360° Palace Tour · 1–4 Camera Perspectives · H Toggle Dock · Esc Pause
      </div>
    </div>
  );
};
