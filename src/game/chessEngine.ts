export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  row: number; // 0..7 (0 is rank 8 / black side, 7 is rank 1 / white player side)
  col: number; // 0..7 (0 is file a, 7 is file h)
  hasMoved: boolean;
}

export interface ChessMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  piece: ChessPiece;
  captured?: ChessPiece;
  promotion?: PieceType;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  notation: string;
  triggersCursedSquare?: boolean;
}

export interface WarChallengeRound {
  round: number;
  title: string;
  subtitle: string;
  description: string;
  turnTimerSeconds: number;
  cursedSquares: string[]; // e.g. ['d4', 'e5']
  missingPlayerSquares: string[]; // algebraic squares removed from player's starting army
  ghostExtraKnightSquare?: string; // e.g. 'd6'
  aiDepth: number;
  aggressionBonus: number;
}

export const WAR_CHALLENGE_ROUNDS: WarChallengeRound[] = [
  {
    round: 1,
    title: 'Round I · The First Summoning',
    subtitle: 'Standard 32-Piece Royal Reckoning',
    description:
      'Enter the ruined Andarmahal. Command 16 carved ancient white marble pieces against the Ghost King’s 16 razor-sharp black obsidian legions.',
    turnTimerSeconds: 60,
    cursedSquares: ['d4', 'e5'],
    missingPlayerSquares: [],
    aiDepth: 2,
    aggressionBonus: 15,
  },
  {
    round: 2,
    title: 'Round II · Blood Moon Blitz & Root Blight',
    subtitle: '25s Turn Clock · 4 Bioluminescent Blight Squares',
    description:
      'The forest roots constrict the palace floor. Move within 25 seconds per turn while 4 central squares pulse with cursed spores that feed the Ghost King’s wrath.',
    turnTimerSeconds: 25,
    cursedSquares: ['c4', 'd4', 'e5', 'f5'],
    missingPlayerSquares: [],
    aiDepth: 2,
    aggressionBonus: 35,
  },
  {
    round: 3,
    title: 'Round III · Vanguard Blood Sacrifice',
    subtitle: '20s Blitz · Missing Queenside Knight · 6 Cursed Squares',
    description:
      'The Defeat Bloom has shattered your Queenside Knight (b1) before battle begins. Survive a 20-second blitz timer against heightened supernatural aggression.',
    turnTimerSeconds: 20,
    cursedSquares: ['c4', 'd4', 'e4', 'c5', 'd5', 'e5'],
    missingPlayerSquares: ['b1'],
    aiDepth: 3,
    aggressionBonus: 55,
  },
  {
    round: 4,
    title: 'Round IV · The Emperor’s Eternal Wrath',
    subtitle: '15s Blitz · Missing Knight & f2 Vanguard · Obsidian Dread-Guard',
    description:
      'The Ghost King’s full court surrounds the table. Your b1 Knight and f2 Pawn are ashes, and an extra Obsidian Dread-Knight stands at d6. Conquer his throne to break the curse.',
    turnTimerSeconds: 15,
    cursedSquares: ['c3', 'd4', 'e4', 'f3', 'c6', 'd5', 'e5', 'f6'],
    missingPlayerSquares: ['b1', 'f2'],
    ghostExtraKnightSquare: 'd6',
    aiDepth: 3,
    aggressionBonus: 80,
  },
];

export interface HorrorLyricLine {
  stanza: number;
  title: string;
  line: string;
  subline: string;
  intensity: 'whisper' | 'chant' | 'crescendo' | 'requiem';
}

export const HORROR_SONG_LYRICS: HorrorLyricLine[] = [
  {
    stanza: 1,
    title: 'I. Beneath the Banyan Throne',
    line: '“Step through the arches where emperors bled, the roots drink the marrow of crowns long dead…”',
    subline: 'The courtiers gather in ash and spore · Play your white stone on the palace floor.',
    intensity: 'whisper',
  },
  {
    stanza: 2,
    title: 'II. The Carving of Bone',
    line: '“White marble carved from a mortal vein, black glass forged in eternal pain…”',
    subline: 'Sixty-four graves in the flickering torch · The Ghost King breathes on the ruined porch.',
    intensity: 'whisper',
  },
  {
    stanza: 3,
    title: 'III. First Blood on the Checkered Stone',
    line: '“Hear the stone grind! Hear the chisel crack! No mortal hand calls a fallen pawn back!”',
    subline: 'Shards of white ivory scatter like teeth · The roots of the jungle awaken beneath.',
    intensity: 'chant',
  },
  {
    stanza: 4,
    title: 'IV. Whispers of the Andarmahal',
    line: '“Behind your bare shoulders the servants creep, counting the promises kings could not keep…”',
    subline: 'Cold spectral fingers brush dust on your skin · The obsidian bishops absolve no sin.',
    intensity: 'chant',
  },
  {
    stanza: 5,
    title: 'V. The Spire and the Blade',
    line: '“Tower of marble, fall into the mire! Rooks of black obsidian, crown him in fire!”',
    subline: 'Every capture feeds the hearth’s red roar · Your scars remember the ancient war.',
    intensity: 'crescendo',
  },
  {
    stanza: 6,
    title: 'VI. Requiem of the Sovereign',
    line: '“KNEEL TO THE PHANTOM! THE BLOOM OF DEFEAT! THE PALACE DEVOURS THE MORTAL SEAT!”',
    subline: 'Horns of the underworld shatter the night · Strike down the Ghost King or drown in his blight!',
    intensity: 'requiem',
  },
];

export interface GameState {
  board: (ChessPiece | null)[][];
  turn: PieceColor;
  roundIndex: number; // 0..3 into WAR_CHALLENGE_ROUNDS
  moveHistory: ChessMove[];
  capturedByPlayer: ChessPiece[]; // black obsidian pieces shattered by player
  capturedByGhost: ChessPiece[]; // white marble pieces shattered by Ghost King
  inCheck: PieceColor | null;
  status: 'playing' | 'checkmate' | 'stalemate' | 'timeout';
  winner: PieceColor | null;
  enPassantTarget: { row: number; col: number } | null;
  cursedSquares: Set<string>;
  turnTimeRemaining: number;
  playerScore: number;
  ghostAggressionLevel: number;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function coordsToAlgebraic(row: number, col: number): string {
  if (row < 0 || row > 7 || col < 0 || col > 7) return '';
  return `${FILES[col]}${8 - row}`;
}

export function algebraicToCoords(sq: string): { row: number; col: number } | null {
  if (!sq || sq.length !== 2) return null;
  const col = FILES.indexOf(sq[0].toLowerCase());
  const rank = parseInt(sq[1], 10);
  if (col === -1 || isNaN(rank) || rank < 1 || rank > 8) return null;
  return { row: 8 - rank, col };
}

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export const PIECE_NAMES: Record<PieceType, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King',
};

export function getChallengeForRound(roundIndex: number): WarChallengeRound {
  const clamped = Math.max(0, Math.min(WAR_CHALLENGE_ROUNDS.length - 1, roundIndex));
  return WAR_CHALLENGE_ROUNDS[clamped];
}

export function getActiveHorrorLyric(state: GameState): HorrorLyricLine {
  const totalCaptures = state.capturedByPlayer.length + state.capturedByGhost.length;
  if (state.inCheck || state.status === 'checkmate' || totalCaptures >= 10) {
    return HORROR_SONG_LYRICS[5];
  }
  if (totalCaptures >= 7 || state.roundIndex >= 3) {
    return HORROR_SONG_LYRICS[4];
  }
  if (totalCaptures >= 4 || state.roundIndex === 2) {
    return HORROR_SONG_LYRICS[3];
  }
  if (totalCaptures >= 2) {
    return HORROR_SONG_LYRICS[2];
  }
  if (state.moveHistory.length >= 2) {
    return HORROR_SONG_LYRICS[1];
  }
  return HORROR_SONG_LYRICS[0];
}

export function createInitialGameState(roundIndex = 0): GameState {
  const challenge = getChallengeForRound(roundIndex);
  const board: (ChessPiece | null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );

  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  // Place Black (Ghost King) pieces at rows 0 and 1
  for (let col = 0; col < 8; col++) {
    board[0][col] = {
      id: `b_${backRank[col]}_${col}`,
      type: backRank[col],
      color: 'b',
      row: 0,
      col,
      hasMoved: false,
    };
    board[1][col] = {
      id: `b_p_${col}`,
      type: 'p',
      color: 'b',
      row: 1,
      col,
      hasMoved: false,
    };
  }

  // Place White (Player) pieces at rows 6 and 7
  for (let col = 0; col < 8; col++) {
    board[6][col] = {
      id: `w_p_${col}`,
      type: 'p',
      color: 'w',
      row: 6,
      col,
      hasMoved: false,
    };
    board[7][col] = {
      id: `w_${backRank[col]}_${col}`,
      type: backRank[col],
      color: 'w',
      row: 7,
      col,
      hasMoved: false,
    };
  }

  // Apply challenge modifiers (missing player starting pieces)
  for (const sq of challenge.missingPlayerSquares) {
    const coords = algebraicToCoords(sq);
    if (coords && board[coords.row][coords.col]?.color === 'w' && board[coords.row][coords.col]?.type !== 'k') {
      board[coords.row][coords.col] = null;
    }
  }

  // Apply Ghost King extra dread-knight modifier if present
  if (challenge.ghostExtraKnightSquare) {
    const coords = algebraicToCoords(challenge.ghostExtraKnightSquare);
    if (coords && !board[coords.row][coords.col]) {
      board[coords.row][coords.col] = {
        id: `b_n_dread_${coords.row}_${coords.col}`,
        type: 'n',
        color: 'b',
        row: coords.row,
        col: coords.col,
        hasMoved: false,
      };
    }
  }

  return {
    board,
    turn: 'w',
    roundIndex: Math.max(0, Math.min(WAR_CHALLENGE_ROUNDS.length - 1, roundIndex)),
    moveHistory: [],
    capturedByPlayer: [],
    capturedByGhost: [],
    inCheck: null,
    status: 'playing',
    winner: null,
    enPassantTarget: null,
    cursedSquares: new Set(challenge.cursedSquares),
    turnTimeRemaining: challenge.turnTimerSeconds,
    playerScore: 0,
    ghostAggressionLevel: challenge.aggressionBonus,
  };
}

export function cloneBoard(board: (ChessPiece | null)[][]): (ChessPiece | null)[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function findKing(board: (ChessPiece | null)[][], color: PieceColor): { row: number; col: number } | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type === 'k') {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function isSquareAttacked(
  board: (ChessPiece | null)[][],
  targetRow: number,
  targetCol: number,
  byColor: PieceColor
): boolean {
  // 1. Pawn attacks
  const pawnDir = byColor === 'w' ? -1 : 1; // White attacks upward (-1), so a pawn at targetRow - pawnDir attacks targetRow
  const sourcePawnRow = targetRow - pawnDir;
  if (sourcePawnRow >= 0 && sourcePawnRow < 8) {
    for (const dc of [-1, 1]) {
      const sc = targetCol + dc;
      if (sc >= 0 && sc < 8) {
        const p = board[sourcePawnRow][sc];
        if (p && p.color === byColor && p.type === 'p') return true;
      }
    }
  }

  // 2. Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1],
    [-1, -2], [-1, 2],
    [1, -2], [1, 2],
    [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = targetRow + dr;
    const nc = targetCol + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p && p.color === byColor && p.type === 'n') return true;
    }
  }

  // 3. King adjacent attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = targetRow + dr;
      const nc = targetCol + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p && p.color === byColor && p.type === 'k') return true;
      }
    }
  }

  // 4. Orthogonal rays (Rook / Queen)
  const orthoDirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];
  for (const [dr, dc] of orthoDirs) {
    let nr = targetRow + dr;
    let nc = targetCol + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // 5. Diagonal rays (Bishop / Queen)
  const diagDirs = [
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];
  for (const [dr, dc] of diagDirs) {
    let nr = targetRow + dr;
    let nc = targetCol + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return false;
}

export function isKingInCheck(board: (ChessPiece | null)[][], color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const enemy: PieceColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingPos.row, kingPos.col, enemy);
}

function generatePseudoLegalMovesForPiece(
  board: (ChessPiece | null)[][],
  piece: ChessPiece,
  enPassantTarget: { row: number; col: number } | null,
  cursedSquares: Set<string>
): ChessMove[] {
  const moves: ChessMove[] = [];
  const { row, col, color, type } = piece;
  const enemy: PieceColor = color === 'w' ? 'b' : 'w';

  const addMove = (
    toRow: number,
    toCol: number,
    opts?: {
      captured?: ChessPiece;
      promotion?: PieceType;
      isEnPassant?: boolean;
      isCastling?: 'kingside' | 'queenside';
    }
  ) => {
    const destSq = coordsToAlgebraic(toRow, toCol);
    const fromSq = coordsToAlgebraic(row, col);
    const pieceLetter = type === 'p' ? '' : type.toUpperCase();
    const capSymbol = opts?.captured ? 'x' : '→';
    const promoSuffix = opts?.promotion ? `=${opts.promotion.toUpperCase()}` : '';
    const notation =
      opts?.isCastling === 'kingside'
        ? 'O-O'
        : opts?.isCastling === 'queenside'
        ? 'O-O-O'
        : `${pieceLetter}${fromSq}${capSymbol}${destSq}${promoSuffix}`;

    moves.push({
      fromRow: row,
      fromCol: col,
      toRow,
      toCol,
      piece: { ...piece },
      captured: opts?.captured ? { ...opts.captured } : undefined,
      promotion: opts?.promotion,
      isEnPassant: opts?.isEnPassant,
      isCastling: opts?.isCastling,
      notation,
      triggersCursedSquare: cursedSquares.has(destSq),
    });
  };

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;

    // 1 step forward
    const r1 = row + dir;
    if (r1 >= 0 && r1 < 8 && !board[r1][col]) {
      if (r1 === promoRow) {
        addMove(r1, col, { promotion: 'q' });
      } else {
        addMove(r1, col);
      }
      // 2 steps forward from start
      const r2 = row + dir * 2;
      if (row === startRow && r2 >= 0 && r2 < 8 && !board[r2][col]) {
        addMove(r2, col);
      }
    }

    // Diagonal captures
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (r1 >= 0 && r1 < 8 && nc >= 0 && nc < 8) {
        const target = board[r1][nc];
        if (target && target.color === enemy) {
          if (r1 === promoRow) {
            addMove(r1, nc, { captured: target, promotion: 'q' });
          } else {
            addMove(r1, nc, { captured: target });
          }
        } else if (
          enPassantTarget &&
          enPassantTarget.row === r1 &&
          enPassantTarget.col === nc
        ) {
          const epCaptured = board[row][nc];
          if (epCaptured && epCaptured.color === enemy) {
            addMove(r1, nc, { captured: epCaptured, isEnPassant: true });
          }
        }
      }
    }
  } else if (type === 'n') {
    const offsets = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [1, -2], [1, 2],
      [2, -1], [2, 1],
    ];
    for (const [dr, dc] of offsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = board[nr][nc];
        if (!target) addMove(nr, nc);
        else if (target.color === enemy) addMove(nr, nc, { captured: target });
      }
    }
  } else if (type === 'b' || type === 'r' || type === 'q') {
    const dirs: [number, number][] = [];
    if (type === 'b' || type === 'q') {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (type === 'r' || type === 'q') {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = board[nr][nc];
        if (!target) {
          addMove(nr, nc);
        } else {
          if (target.color === enemy) addMove(nr, nc, { captured: target });
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  } else if (type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = board[nr][nc];
          if (!target) addMove(nr, nc);
          else if (target.color === enemy) addMove(nr, nc, { captured: target });
        }
      }
    }

    // Castling
    if (!piece.hasMoved && !isSquareAttacked(board, row, col, enemy)) {
      // Kingside
      const kRook = board[row][7];
      if (
        kRook &&
        kRook.color === color &&
        kRook.type === 'r' &&
        !kRook.hasMoved &&
        !board[row][5] &&
        !board[row][6] &&
        !isSquareAttacked(board, row, 5, enemy) &&
        !isSquareAttacked(board, row, 6, enemy)
      ) {
        addMove(row, 6, { isCastling: 'kingside' });
      }
      // Queenside
      const qRook = board[row][0];
      if (
        qRook &&
        qRook.color === color &&
        qRook.type === 'r' &&
        !qRook.hasMoved &&
        !board[row][1] &&
        !board[row][2] &&
        !board[row][3] &&
        !isSquareAttacked(board, row, 3, enemy) &&
        !isSquareAttacked(board, row, 2, enemy)
      ) {
        addMove(row, 2, { isCastling: 'queenside' });
      }
    }
  }

  return moves;
}

export function applyMoveToBoard(
  board: (ChessPiece | null)[][],
  move: ChessMove
): (ChessPiece | null)[][] {
  const next = cloneBoard(board);
  const moving = next[move.fromRow][move.fromCol];
  if (!moving) return next;

  next[move.fromRow][move.fromCol] = null;

  if (move.isEnPassant) {
    next[move.fromRow][move.toCol] = null;
  }

  if (move.isCastling === 'kingside') {
    const rook = next[move.fromRow][7];
    if (rook) {
      next[move.fromRow][7] = null;
      rook.col = 5;
      rook.hasMoved = true;
      next[move.fromRow][5] = rook;
    }
  } else if (move.isCastling === 'queenside') {
    const rook = next[move.fromRow][0];
    if (rook) {
      next[move.fromRow][0] = null;
      rook.col = 3;
      rook.hasMoved = true;
      next[move.fromRow][3] = rook;
    }
  }

  moving.row = move.toRow;
  moving.col = move.toCol;
  moving.hasMoved = true;
  if (move.promotion) {
    moving.type = move.promotion;
  }

  next[move.toRow][move.toCol] = moving;
  return next;
}

export function getLegalMovesForSquare(
  state: GameState,
  row: number,
  col: number
): ChessMove[] {
  const piece = state.board[row]?.[col];
  if (!piece || piece.color !== state.turn) return [];

  const pseudo = generatePseudoLegalMovesForPiece(
    state.board,
    piece,
    state.enPassantTarget,
    state.cursedSquares
  );

  return pseudo.filter((move) => {
    const nextBoard = applyMoveToBoard(state.board, move);
    return !isKingInCheck(nextBoard, piece.color);
  });
}

export function getAllLegalMoves(state: GameState, color: PieceColor = state.turn): ChessMove[] {
  const allMoves: ChessMove[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.color === color) {
        const pseudo = generatePseudoLegalMovesForPiece(
          state.board,
          p,
          state.enPassantTarget,
          state.cursedSquares
        );
        for (const m of pseudo) {
          const nextBoard = applyMoveToBoard(state.board, m);
          if (!isKingInCheck(nextBoard, color)) {
            allMoves.push(m);
          }
        }
      }
    }
  }
  return allMoves;
}

export function executeMove(state: GameState, move: ChessMove): GameState {
  const nextBoard = applyMoveToBoard(state.board, move);
  const nextTurn: PieceColor = state.turn === 'w' ? 'b' : 'w';
  const challenge = getChallengeForRound(state.roundIndex);

  const capturedByPlayer = [...state.capturedByPlayer];
  const capturedByGhost = [...state.capturedByGhost];

  let scoreDelta = 0;
  let aggressionDelta = 0;

  if (move.captured) {
    if (state.turn === 'w') {
      capturedByPlayer.push(move.captured);
      scoreDelta += PIECE_VALUES[move.captured.type];
      aggressionDelta += 12;
    } else {
      capturedByGhost.push(move.captured);
      aggressionDelta += 18;
    }
  }

  if (move.triggersCursedSquare) {
    if (state.turn === 'w') {
      scoreDelta += 45;
      aggressionDelta += 10;
    } else {
      aggressionDelta += 15;
    }
  }

  // En passant target tracking
  let enPassantTarget: { row: number; col: number } | null = null;
  if (move.piece.type === 'p' && Math.abs(move.toRow - move.fromRow) === 2) {
    enPassantTarget = {
      row: (move.fromRow + move.toRow) / 2,
      col: move.fromCol,
    };
  }

  const nextInCheck = isKingInCheck(nextBoard, nextTurn) ? nextTurn : null;
  if (nextInCheck === 'b') {
    scoreDelta += 75;
  }

  const tempState: GameState = {
    ...state,
    board: nextBoard,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, move],
    capturedByPlayer,
    capturedByGhost,
    inCheck: nextInCheck,
    enPassantTarget,
    turnTimeRemaining: challenge.turnTimerSeconds,
    playerScore: state.playerScore + scoreDelta,
    ghostAggressionLevel: Math.min(100, state.ghostAggressionLevel + aggressionDelta),
  };

  const opponentLegalMoves = getAllLegalMoves(tempState, nextTurn);
  if (opponentLegalMoves.length === 0) {
    if (nextInCheck === nextTurn) {
      tempState.status = 'checkmate';
      tempState.winner = state.turn;
      if (state.turn === 'w') {
        tempState.playerScore += 1500 * (state.roundIndex + 1);
      }
    } else {
      tempState.status = 'stalemate';
      tempState.winner = null;
    }
  }

  return tempState;
}

// Positional bonus for central control
const CENTER_BONUS = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 5, 10, 10, 10, 10, 5, 0],
  [0, 10, 20, 25, 25, 20, 10, 0],
  [0, 15, 25, 35, 35, 25, 15, 0],
  [0, 15, 25, 35, 35, 25, 15, 0],
  [0, 10, 20, 25, 25, 20, 10, 0],
  [0, 5, 10, 10, 10, 10, 5, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

function evaluateBoardForGhost(
  board: (ChessPiece | null)[][],
  cursedSquares: Set<string>,
  aggressionBonus: number
): number {
  let score = 0;
  const hasCursed = cursedSquares.size > 0;
  for (let r = 0; r < 8; r++) {
    const rowArr = board[r];
    const centerRow = CENTER_BONUS[r];
    for (let c = 0; c < 8; c++) {
      const p = rowArr[c];
      if (!p) continue;
      let val = PIECE_VALUES[p.type] + centerRow[c];
      if (hasCursed && cursedSquares.has(coordsToAlgebraic(r, c))) {
        val += 25;
      }
      // Advance bonus
      if (p.type === 'p') {
        val += (p.color === 'b' ? r : 7 - r) * 8;
      }
      if (p.color === 'b') {
        score += val;
      } else {
        score -= val;
      }
    }
  }
  if (isKingInCheck(board, 'w')) {
    score += 45 + aggressionBonus * 0.5;
  }
  return score;
}

export function computeGhostKingMove(state: GameState): ChessMove | null {
  const legalMoves = getAllLegalMoves(state, 'b');
  if (legalMoves.length === 0) return null;

  const challenge = getChallengeForRound(state.roundIndex);

  // Sort moves so captures and checks come first
  legalMoves.sort((a, b) => {
    const scoreA = (a.captured ? PIECE_VALUES[a.captured.type] * 2 : 0) + (a.triggersCursedSquare ? 40 : 0);
    const scoreB = (b.captured ? PIECE_VALUES[b.captured.type] * 2 : 0) + (b.triggersCursedSquare ? 40 : 0);
    return scoreB - scoreA;
  });

  let bestMove = legalMoves[0];
  let bestVal = -Infinity;

  for (const move of legalMoves) {
    const nextBoard = applyMoveToBoard(state.board, move);
    // Immediate checkmate check
    const whiteReplies = getAllLegalMoves(
      { ...state, board: nextBoard, turn: 'w', enPassantTarget: null },
      'w'
    );
    if (whiteReplies.length === 0 && isKingInCheck(nextBoard, 'w')) {
      return move;
    }

    let moveVal = evaluateBoardForGhost(nextBoard, state.cursedSquares, challenge.aggressionBonus);
    if (move.captured) {
      moveVal += PIECE_VALUES[move.captured.type] * 0.35 + challenge.aggressionBonus;
    }

    // 1-ply reply lookahead from White's strongest capture/response
    if (whiteReplies.length > 0) {
      let worstReplyEval = Infinity;
      // Check top 5 white responses for fast sub-2ms speed + tactical sharpness on low-spec devices
      whiteReplies.sort((a, b) => (b.captured ? PIECE_VALUES[b.captured.type] : 0) - (a.captured ? PIECE_VALUES[a.captured.type] : 0));
      const limit = Math.min(5, whiteReplies.length);
      for (let i = 0; i < limit; i++) {
        const afterReply = applyMoveToBoard(nextBoard, whiteReplies[i]);
        const evalAfter = evaluateBoardForGhost(afterReply, state.cursedSquares, challenge.aggressionBonus);
        if (evalAfter < worstReplyEval) {
          worstReplyEval = evalAfter;
        }
      }
      moveVal = moveVal * 0.35 + worstReplyEval * 0.65;
    }

    if (moveVal > bestVal) {
      bestVal = moveVal;
      bestMove = move;
    }
  }

  return bestMove;
}

