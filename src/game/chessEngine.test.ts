import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGameState,
  getAllLegalMoves,
  getLegalMovesForSquare,
  executeMove,
  computeGhostKingMove,
  coordsToAlgebraic,
  algebraicToCoords,
  getActiveHorrorLyric,
  isKingInCheck,
} from './chessEngine.ts';
import {
  selectGhostKingFragment,
  PERIPHERAL_FRAGMENT_SLOTS,
} from './ghostKingFragments.ts';

test('Round I starts with all 32 pieces and 20 legal opening moves for player', () => {
  const state = createInitialGameState(0);
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (state.board[r][c]) count++;
    }
  }
  assert.equal(count, 32);
  assert.equal(state.turn, 'w');
  const openingMoves = getAllLegalMoves(state, 'w');
  assert.equal(openingMoves.length, 20);
});

test('Escalating War Rounds apply cursed squares, blitz timer, and missing vanguard pieces', () => {
  const round3 = createInitialGameState(2); // Round III: missing b1 Knight
  const b1 = algebraicToCoords('b1')!;
  assert.equal(round3.board[b1.row][b1.col], null);
  assert.equal(round3.turnTimeRemaining, 20);
  assert.equal(round3.cursedSquares.has('d4'), true);

  const round4 = createInitialGameState(3); // Round IV: missing b1 & f2, extra dread knight at d6
  const f2 = algebraicToCoords('f2')!;
  const d6 = algebraicToCoords('d6')!;
  assert.equal(round4.board[f2.row][f2.col], null);
  assert.equal(round4.board[d6.row][d6.col]?.type, 'n');
  assert.equal(round4.board[d6.row][d6.col]?.color, 'b');
});

test('Player move execution updates board, score, cursed square bonus, and switches turn to Ghost King', () => {
  let state = createInitialGameState(0);
  // Move e2 pawn to e4 (row 6 col 4 -> row 4 col 4)
  const e2Moves = getLegalMovesForSquare(state, 6, 4);
  const e4Move = e2Moves.find((m) => m.toRow === 4 && m.toCol === 4);
  assert.ok(e4Move, 'e2->e4 should be legal');
  state = executeMove(state, e4Move);
  assert.equal(state.turn, 'b');
  assert.equal(state.board[4][4]?.type, 'p');
  assert.equal(state.board[6][4], null);

  // Ghost King computes a valid response
  const ghostReply = computeGhostKingMove(state);
  assert.ok(ghostReply, 'Ghost King should return a legal move');
  state = executeMove(state, ghostReply);
  assert.equal(state.turn, 'w');
  assert.equal(state.moveHistory.length, 2);
});

test('Scholar mate / Fool mate checkmate detection works accurately', () => {
  let state = createInitialGameState(0);

  const playAlgebraic = (from: string, to: string) => {
    const f = algebraicToCoords(from)!;
    const t = algebraicToCoords(to)!;
    const legal = getLegalMovesForSquare(state, f.row, f.col);
    const chosen = legal.find((m) => m.toRow === t.row && m.toCol === t.col);
    assert.ok(chosen, `Move ${from}->${to} must be legal`);
    state = executeMove(state, chosen);
  };

  // Fool's mate against White (Ghost King wins -> triggers Defeat Bloom)
  playAlgebraic('f2', 'f3');
  playAlgebraic('e7', 'e5');
  playAlgebraic('g2', 'g4');
  playAlgebraic('d8', 'h4');

  assert.equal(isKingInCheck(state.board, 'w'), true);
  assert.equal(state.status, 'checkmate');
  assert.equal(state.winner, 'b');
});

test('Horror Song lyrics intensify as captures accumulate and during Check/Checkmate', () => {
  const state = createInitialGameState(0);
  assert.equal(getActiveHorrorLyric(state).stanza, 1);

  state.capturedByPlayer.push(
    { id: '1', type: 'p', color: 'b', row: 0, col: 0, hasMoved: true },
    { id: '2', type: 'p', color: 'b', row: 0, col: 1, hasMoved: true }
  );
  assert.equal(getActiveHorrorLyric(state).stanza, 3);

  state.inCheck = 'w';
  assert.equal(getActiveHorrorLyric(state).stanza, 6);
  assert.equal(getActiveHorrorLyric(state).intensity, 'requiem');
});

test('Algebraic coordinate conversion roundtrips all 64 squares', () => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = coordsToAlgebraic(r, c);
      const back = algebraicToCoords(sq);
      assert.deepEqual(back, { row: r, col: c });
    }
  }
});

test('Ghost King cryptic fragment selector scales intensity from omen to dread to wrath', () => {
  const state = createInitialGameState(0);
  const used = new Set<string>();

  const omenFrag = selectGhostKingFragment(state, used, () => 0.2);
  assert.equal(omenFrag.intensity, 'omen');
  used.add(omenFrag.id);

  // Add captures to trigger dread tier
  state.capturedByGhost.push(
    { id: 'w1', type: 'p', color: 'w', row: 6, col: 0, hasMoved: true },
    { id: 'w2', type: 'p', color: 'w', row: 6, col: 1, hasMoved: true }
  );
  const dreadFrag = selectGhostKingFragment(state, used, () => 0.4);
  assert.equal(dreadFrag.intensity, 'dread');

  // Put player in check to trigger wrath tier
  state.inCheck = 'w';
  const wrathFrag = selectGhostKingFragment(state, used, () => 0.1);
  assert.equal(wrathFrag.intensity, 'wrath');
  assert.equal(PERIPHERAL_FRAGMENT_SLOTS.length, 4);
});
