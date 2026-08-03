const boardElement = document.getElementById('board');
const moveHistory = document.getElementById('moveHistory');
const aiWindow = document.getElementById('aiWindow');
const turnInfo = document.getElementById('turnInfo');
const resetBtn = document.getElementById('resetBtn');
const aiExampleBtn = document.getElementById('aiExampleBtn');

const pieces = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔',
};

class LocalChess {
  constructor() {
    this.reset();
  }

  reset() {
    this._turn = 'w';
    this.history = [];
    this._board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ];
  }

  board() {
    return this._board;
  }

  turn() {
    return this._turn;
  }

  squareToCoords(square) {
    return [8 - Number(square[1]), square.charCodeAt(0) - 97];
  }

  coordsToSquare(rank, file) {
    return `${String.fromCharCode(97 + file)}${8 - rank}`;
  }

  get(square) {
    const [rank, file] = this.squareToCoords(square);
    return this._board[rank][file];
  }

  set(square, piece) {
    const [rank, file] = this.squareToCoords(square);
    this._board[rank][file] = piece;
  }

  isWhite(piece) {
    return piece != null && piece === piece.toUpperCase();
  }

  isBlack(piece) {
    return piece != null && piece === piece.toLowerCase();
  }

  inBounds(rank, file) {
    return rank >= 0 && rank < 8 && file >= 0 && file < 8;
  }

  moves({ square, verbose = false }) {
    const piece = this.get(square);
    if (!piece || (this._turn === 'w' ? !this.isWhite(piece) : !this.isBlack(piece))) {
      return [];
    }

    const [rank, file] = this.squareToCoords(square);
    const type = piece.toLowerCase();
    const moves = [];

    const addMove = (targetRank, targetFile, captureOnly = false) => {
      if (!this.inBounds(targetRank, targetFile)) return;
      const targetPiece = this._board[targetRank][targetFile];
      if (targetPiece == null && !captureOnly) {
        moves.push(this.coordsToSquare(targetRank, targetFile));
      } else if (targetPiece != null) {
        const isCapture = this._turn === 'w' ? this.isBlack(targetPiece) : this.isWhite(targetPiece);
        if (isCapture) {
          moves.push(this.coordsToSquare(targetRank, targetFile));
        }
      }
    };

    const slide = (dr, df) => {
      let r = rank + dr;
      let f = file + df;
      while (this.inBounds(r, f)) {
        const targetPiece = this._board[r][f];
        if (targetPiece == null) {
          moves.push(this.coordsToSquare(r, f));
        } else {
          const isCapture = this._turn === 'w' ? this.isBlack(targetPiece) : this.isWhite(targetPiece);
          if (isCapture) {
            moves.push(this.coordsToSquare(r, f));
          }
          break;
        }
        r += dr;
        f += df;
      }
    };

    const forward = this._turn === 'w' ? -1 : 1;
    const startRank = this._turn === 'w' ? 6 : 1;

    switch (type) {
      case 'p':
        if (this.inBounds(rank + forward, file) && this._board[rank + forward][file] == null) {
          moves.push(this.coordsToSquare(rank + forward, file));
          if (rank === startRank && this._board[rank + forward * 2][file] == null) {
            moves.push(this.coordsToSquare(rank + forward * 2, file));
          }
        }
        for (const deltaFile of [-1, 1]) {
          const targetRank = rank + forward;
          const targetFile = file + deltaFile;
          if (this.inBounds(targetRank, targetFile)) {
            const targetPiece = this._board[targetRank][targetFile];
            if (targetPiece != null) {
              const isCapture = this._turn === 'w' ? this.isBlack(targetPiece) : this.isWhite(targetPiece);
              if (isCapture) {
                moves.push(this.coordsToSquare(targetRank, targetFile));
              }
            }
          }
        }
        break;
      case 'n':
        [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, df]) => addMove(rank + dr, file + df));
        break;
      case 'b':
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, df]) => slide(dr, df));
        break;
      case 'r':
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, df]) => slide(dr, df));
        break;
      case 'q':
        [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, df]) => slide(dr, df));
        break;
      case 'k':
        [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, df]) => addMove(rank + dr, file + df));
        break;
    }

    return verbose ? moves.map((to) => ({ from: square, to })) : moves;
  }

  move({ from, to, promotion = 'q' }) {
    const legalMove = this.moves({ square: from, verbose: true }).find((m) => m.to === to);
    if (!legalMove) {
      return null;
    }

    const piece = this.get(from);
    const targetPiece = this.get(to);
    const isPawn = piece && piece.toLowerCase() === 'p';
    const promotionRank = this._turn === 'w' ? '8' : '1';
    const movedPiece = isPawn && to[1] === promotionRank ? (this._turn === 'w' ? 'Q' : 'q') : piece;

    this.set(to, movedPiece);
    this.set(from, null);
    const san = `${from}${targetPiece ? 'x' : '-'}${to}`;
    this.history.push({ from, to, san });
    this._turn = this._turn === 'w' ? 'b' : 'w';
    return { from, to, san };
  }

  history({ verbose = false } = {}) {
    return verbose ? [...this.history] : this.history.map((item) => item.san);
  }
}

const chess = new LocalChess();
let selectedSquare = null;
let highlightSquares = [];

// Render the entire chessboard UI from the current game state.
// Adds squares, pieces, highlights, and updates the current player display.
function renderBoard() {
  boardElement.innerHTML = '';
  const board = chess.board();
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const rank = ranks[rankIndex];
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      const file = String.fromCharCode(97 + fileIndex);
      const squareName = `${file}${rank}`;
      const square = document.createElement('div');
      square.classList.add('square');
      const isLight = (rankIndex + fileIndex) % 2 === 0;
      square.classList.add(isLight ? 'light' : 'dark');
      if (selectedSquare === squareName) {
        square.classList.add('selected');
      }
      if (highlightSquares.includes(squareName)) {
        square.classList.add('highlight');
      }
      square.dataset.square = squareName;
      square.addEventListener('click', handleSquareClick);
      square.addEventListener('dragover', handleDragOver);
      square.addEventListener('drop', handleDrop);
      square.addEventListener('dragenter', handleDragEnter);
      square.addEventListener('dragleave', handleDragLeave);

      const piece = board[rankIndex][fileIndex];
      if (piece) {
        const pieceElement = document.createElement('span');
        const pieceSymbol = pieces[piece];
        pieceElement.textContent = pieceSymbol;
        pieceElement.classList.add('piece');
        pieceElement.draggable = true;
        pieceElement.dataset.square = squareName;
        pieceElement.addEventListener('dragstart', handleDragStart);
        square.appendChild(pieceElement);
      }

      boardElement.appendChild(square);
    }
  }

  turnInfo.textContent = `Turn: ${chess.turn() === 'w' ? 'White' : 'Black'}`;
}

// Handle clicks on squares to either select a piece or execute a legal move.
// Only allows moves that follow piece movement rules.
function handleSquareClick(event) {
  const square = event.currentTarget.dataset.square;
  const piece = chess.get(square);

  if (selectedSquare && highlightSquares.includes(square)) {
    const move = chess.move({ from: selectedSquare, to: square, promotion: 'q' });
    if (move) {
      selectedSquare = null;
      highlightSquares = [];
      updateMoveHistory();
      renderBoard();
      return;
    }
  }

  if (piece && ((chess.turn() === 'w' && chess.isWhite(piece)) || (chess.turn() === 'b' && chess.isBlack(piece)))) {
    selectedSquare = square;
    highlightSquares = chess.moves({ square, verbose: true }).map((m) => m.to);
  } else {
    selectedSquare = null;
    highlightSquares = [];
  }
  renderBoard();
}

function handleDragStart(event) {
  const square = event.currentTarget.dataset.square;
  event.dataTransfer.setData('text/plain', square);
  event.dataTransfer.effectAllowed = 'move';
  selectedSquare = square;
  highlightSquares = chess.moves({ square, verbose: true }).map((m) => m.to);
  renderBoard();
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
  const square = event.currentTarget.dataset.square;
  if (selectedSquare && highlightSquares.includes(square)) {
    event.currentTarget.classList.add('drag-over');
  }
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  const from = event.dataTransfer.getData('text/plain');
  const to = event.currentTarget.dataset.square;
  event.currentTarget.classList.remove('drag-over');
  const move = chess.move({ from, to, promotion: 'q' });
  selectedSquare = null;
  highlightSquares = [];
  if (move) {
    updateMoveHistory();
  }
  renderBoard();
}

// Update the visible move history list with the current game moves.
// Displays moves in simple algebraic notation.
function updateMoveHistory() {
  const history = chess.history({ verbose: true });
  moveHistory.innerHTML = '';
  history.forEach((move, index) => {
    if (index % 2 === 0) {
      const item = document.createElement('li');
      item.textContent = `${Math.floor(index / 2) + 1}. ${move.san}`;
      moveHistory.appendChild(item);
    } else {
      const lastItem = moveHistory.lastElementChild;
      lastItem.textContent = `${lastItem.textContent} ${move.san}`;
    }
  });
}

// Reset the game state, clear selections, clear the AI text window, and redraw the board.
function resetBoard() {
  chess.reset();
  selectedSquare = null;
  highlightSquares = [];
  updateMoveHistory();
  aiWindow.value = '';
  renderBoard();
}

// Generate a simple AI response message for the AI window.
// This is a placeholder for future AI integration.
function generateAiResponse() {
  const history = chess.history();
  const message = history.length === 0
    ? 'Start the game by moving a piece. I will respond with strategic thoughts and suggestions.'
    : `Move ${history.length}: ${history[history.length - 1]}. Keep an eye on center control and piece development.`;
  aiWindow.value = message;
}

resetBtn.addEventListener('click', resetBoard);
aiExampleBtn.addEventListener('click', generateAiResponse);

renderBoard();
updateMoveHistory();
