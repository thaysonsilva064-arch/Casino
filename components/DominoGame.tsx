
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, DominoPiece, Room } from '../types';
import { db } from '../services/firebaseService';

interface DominoGameProps {
  players: any[];
  localUser: User;
  isMultiplayer?: boolean;
  betAmount?: number;
  roomPot?: number;
  onExit: () => void;
}

interface BoardPiece extends DominoPiece {
  flipped: boolean;
  position: 'left' | 'right' | 'start';
}

const Pips = ({ value }: { value: number }) => {
  const dotPositions: Record<number, number[]> = {
    0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 1, 2, 6, 7, 8]
  };
  const dots = dotPositions[value] || [];
  return (
    <div className="grid grid-cols-3 grid-rows-3 w-8 h-8 sm:w-10 sm:h-10 gap-0.5 p-1">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {dots.includes(i) && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full shadow-sm"></div>}
        </div>
      ))}
    </div>
  );
};

const DominoUI: React.FC<{ 
  side1: number; 
  side2: number; 
  isDouble?: boolean; 
  isVertical?: boolean;
  playable?: boolean;
  isNew?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}> = ({ side1, side2, isDouble, isVertical, playable, isNew, onPointerDown }) => {
  const vertical = isDouble || isVertical;
  return (
    <div 
      onPointerDown={onPointerDown}
      className={`
        ${vertical ? 'w-10 h-20 sm:w-14 sm:h-28 flex-col' : 'w-20 h-10 sm:w-28 sm:h-14 flex-row'} 
        bg-[#f8f5f0] border-2 border-[#b8b3a8] rounded-md shadow-lg flex items-center justify-center relative transition-all duration-300
        ${!playable && onPointerDown ? 'opacity-40 grayscale pointer-events-none' : 'cursor-grab active:cursor-grabbing hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'}
        ${isNew ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
        touch-none
      `}
    >
      <Pips value={side1} />
      <div className={`${vertical ? 'w-4/5 h-[2px]' : 'w-[2px] h-4/5'} bg-[#d1cec7] mx-1 relative`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#8b7355] rounded-full"></div>
      </div>
      <Pips value={side2} />
    </div>
  );
};

const DominoGame: React.FC<DominoGameProps> = ({ players, localUser, isMultiplayer, roomPot = 0, onExit }) => {
  const [board, setBoard] = useState<BoardPiece[]>([]);
  const [hands, setHands] = useState<Record<string, DominoPiece[]>>({});
  const [deck, setDeck] = useState<DominoPiece[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  
  const [draggingPiece, setDraggingPiece] = useState<DominoPiece | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<'left' | 'right' | null>(null);

  const tableViewportRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Inicialização garantida do Jogo e distribuição de peças
  useEffect(() => {
    if (!players || players.length === 0) return;

    const fullDeck: DominoPiece[] = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        fullDeck.push({ id: `pc-${i}-${j}-${Math.random().toString(36).substr(2,4)}`, side1: i, side2: j });
      }
    }
    const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
    
    const newHands: Record<string, DominoPiece[]> = {};
    players.forEach((p, idx) => {
      newHands[p.id] = shuffled.slice(idx * 7, (idx + 1) * 7);
    });

    const remainingDeck = shuffled.slice(players.length * 7);
    
    // Encontra quem começa
    let starterIdx = 0;
    let starterPiece = newHands[players[0].id][0];
    let maxVal = -1;

    players.forEach((p, idx) => {
      newHands[p.id]?.forEach(pc => {
        const val = pc.side1 === pc.side2 ? pc.side1 + pc.side2 + 100 : pc.side1 + pc.side2;
        if (val > maxVal) {
          maxVal = val;
          starterIdx = idx;
          starterPiece = pc;
        }
      });
    });

    const pId = players[starterIdx].id;
    newHands[pId] = (newHands[pId] || []).filter(p => p.id !== starterPiece.id);
    
    setHands(newHands);
    setDeck(remainingDeck);
    setBoard([{ ...starterPiece, flipped: false, position: 'start' }]);
    setLastPlayedId(starterPiece.id);
    setTurnIndex((starterIdx + 1) % players.length);
    setGameOver(false);
    setWinner(null);
    setTimeLeft(120);

    setTimeout(centerCamera, 300);
    return () => clearInterval(timerRef.current);
  }, [players]);

  useEffect(() => {
    if (gameOver) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }, [turnIndex, gameOver]);

  const centerCamera = () => {
    if (tableViewportRef.current) {
      const v = tableViewportRef.current;
      v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2;
      v.scrollTop = (v.scrollHeight - v.clientHeight) / 2;
    }
  };

  const currentPlayer = players[turnIndex];
  const isMyTurn = currentPlayer?.id === localUser.id;
  
  // Reforço na busca da mão do jogador atual
  const myHand = useMemo(() => {
    return hands[localUser.id] || [];
  }, [hands, localUser.id]);

  const getBoardEnds = () => {
    if (board.length === 0) return { left: -1, right: -1 };
    const start = board.find(p => p.position === 'start');
    if(!start) return { left: -1, right: -1 };

    let leftVal = start.side1;
    let rightVal = start.side2;
    const leftChain = board.filter(p => p.position === 'left');
    const rightChain = board.filter(p => p.position === 'right');
    if (leftChain.length > 0) {
      const last = leftChain[leftChain.length - 1];
      leftVal = last.flipped ? last.side2 : last.side1;
    }
    if (rightChain.length > 0) {
      const last = rightChain[rightChain.length - 1];
      rightVal = last.flipped ? last.side1 : last.side2;
    }
    return { left: leftVal, right: rightVal };
  };

  const validateMove = (piece: DominoPiece, side: 'left' | 'right') => {
    const { left, right } = getBoardEnds();
    const targetVal = side === 'left' ? left : right;
    return piece.side1 === targetVal || piece.side2 === targetVal;
  };

  const performMove = (piece: DominoPiece, side: 'left' | 'right') => {
    const { left, right } = getBoardEnds();
    const targetVal = side === 'left' ? left : right;
    let flipped = (side === 'left') ? (piece.side1 === targetVal) : (piece.side2 === targetVal);
    
    setBoard(prev => [...prev, { ...piece, position: side, flipped }]);
    setLastPlayedId(piece.id);
    
    const newHand = (hands[currentPlayer.id] || []).filter(p => p.id !== piece.id);
    setHands(prev => ({ ...prev, [currentPlayer.id]: newHand }));
    
    if (newHand.length === 0) {
      endGame(currentPlayer.name);
    } else {
      setTurnIndex((turnIndex + 1) % players.length);
      setTimeLeft(120);
    }
  };

  const endGame = async (winnerName: string) => {
    setGameOver(true);
    setWinner(winnerName);
    if (winnerName === localUser.name) {
      await db.updateCoins(roomPot || 500);
    }
  };

  const handleDraw = () => {
    if (deck.length === 0) return;
    const newDeck = [...deck];
    const p = newDeck.pop()!;
    setDeck(newDeck);
    setHands(prev => ({ ...prev, [currentPlayer.id]: [...(prev[currentPlayer.id] || []), p] }));
  };

  const handlePass = () => {
    setTurnIndex((turnIndex + 1) % players.length);
    setTimeLeft(120);
  };

  const onPointerDown = (e: React.PointerEvent, piece: DominoPiece) => {
    if (!isMyTurn || gameOver) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingPiece(piece);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingPiece) return;
    setMousePos({ x: e.clientX, y: e.clientY });
    if (tableViewportRef.current) {
      const vRect = tableViewportRef.current.getBoundingClientRect();
      const relX = (e.clientX - vRect.left) / vRect.width;
      if (relX < 0.35) setDropTarget('left');
      else if (relX > 0.65) setDropTarget('right');
      else setDropTarget(null);
    }
  };

  const onPointerUp = () => {
    if (draggingPiece && dropTarget && validateMove(draggingPiece, dropTarget)) {
      performMove(draggingPiece, dropTarget);
    }
    setDraggingPiece(null);
    setDropTarget(null);
  };

  const { left: cL, right: cR } = getBoardEnds();

  return (
    <div className="w-full h-full flex flex-col bg-[#062617] overflow-hidden relative select-none" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {/* HUD Info */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4 pointer-events-none">
        <div className={`py-4 rounded-[30px] font-black border text-center backdrop-blur-md transition-all ${isMyTurn ? 'bg-blue-600 border-blue-400 scale-105 shadow-xl shadow-blue-500/30' : 'bg-black/60 border-white/10 opacity-80'}`}>
          <div className="text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-1">{isMyTurn ? 'SEU TURNO' : `VEZ DE: ${currentPlayer?.name}`}</div>
          <div className={`text-4xl font-black italic tracking-tighter ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="mt-1 text-[9px] text-white/40 font-black uppercase tracking-widest">💰 POTE: 🪙 {roomPot}</div>
        </div>
      </div>

      {/* Arena da Mesa */}
      <div ref={tableViewportRef} className="flex-1 overflow-auto flex items-center justify-center scroll-hide z-10 bg-[radial-gradient(circle_at_center,_#0a3d25_0%,_#062617_100%)]">
        <div className="min-w-[4000px] min-h-[2000px] flex items-center justify-center relative">
           <div className="flex items-center gap-4 p-20 rounded-[100px] bg-black/5 border border-white/5 shadow-2xl">
              <div className="flex flex-row-reverse items-center gap-4">
                {board.filter(p => p.position === 'left').map(p => (
                  <DominoUI key={p.id} side1={p.flipped ? p.side2 : p.side1} side2={p.flipped ? p.side1 : p.side2} isDouble={p.side1 === p.side2} isNew={p.id === lastPlayedId} />
                ))}
              </div>
              {board.find(p => p.position === 'start') && (
                <DominoUI side1={board.find(p => p.position === 'start')!.side1} side2={board.find(p => p.position === 'start')!.side2} isDouble isNew={board.find(p => p.position === 'start')!.id === lastPlayedId} />
              )}
              <div className="flex items-center gap-4">
                {board.filter(p => p.position === 'right').map(p => (
                  <DominoUI key={p.id} side1={p.flipped ? p.side2 : p.side1} side2={p.flipped ? p.side1 : p.side2} isDouble={p.side1 === p.side2} isNew={p.id === lastPlayedId} />
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Mão do Jogador */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col items-center gap-4 z-50 bg-gradient-to-t from-black via-black/90 to-transparent backdrop-blur-md border-t border-white/10">
        <div className="flex gap-4 overflow-x-auto pb-6 max-w-full scroll-hide px-6">
          {myHand.length > 0 ? (
            myHand.map((piece) => (
              <DominoUI 
                key={piece.id} 
                side1={piece.side1} 
                side2={piece.side2} 
                isVertical
                playable={isMyTurn && (validateMove(piece, 'left') || validateMove(piece, 'right'))}
                onPointerDown={(e) => onPointerDown(e, piece)}
              />
            ))
          ) : (
            <div className="py-10 text-white/10 font-black italic uppercase tracking-[0.5em]">Aguardando Peças...</div>
          )}
        </div>
        
        <div className="flex gap-6">
          <button onClick={centerCamera} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/50 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5">📍 CENTRO</button>
          {isMyTurn && (
            <>
              {deck.length > 0 && !myHand.some(p => validateMove(p, 'left') || validateMove(p, 'right')) && (
                <button onClick={handleDraw} className="px-10 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-2xl font-black text-sm uppercase italic tracking-tighter shadow-xl">🛒 COMPRAR ({deck.length})</button>
              )}
              {!myHand.some(p => validateMove(p, 'left') || validateMove(p, 'right')) && deck.length === 0 && (
                <button onClick={handlePass} className="px-10 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm uppercase italic tracking-tighter shadow-xl">⏭️ PASSAR VEZ</button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dragging Overlay */}
      {draggingPiece && (
        <div 
          className="fixed pointer-events-none z-[1000] transition-transform duration-75" 
          style={{ 
            left: mousePos.x, 
            top: mousePos.y, 
            transform: `translate(-${dragOffset.x}px, -${dragOffset.y}px) scale(1.2) rotate(3deg)` 
          }}
        >
          <DominoUI side1={draggingPiece.side1} side2={draggingPiece.side2} isVertical />
          <div className="fixed inset-0 pointer-events-none z-[-1] flex justify-between items-center px-20 md:px-40">
             <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full border-8 flex flex-col items-center justify-center transition-all ${dropTarget === 'left' ? 'bg-green-500/40 border-green-400 scale-110 shadow-2xl' : 'bg-black/20 border-white/5 opacity-10'}`}>
               <div className="text-white text-5xl md:text-7xl font-black italic">{cL}</div>
             </div>
             <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full border-8 flex flex-col items-center justify-center transition-all ${dropTarget === 'right' ? 'bg-green-500/40 border-green-400 scale-110 shadow-2xl' : 'bg-black/20 border-white/5 opacity-10'}`}>
               <div className="text-white text-5xl md:text-7xl font-black italic">{cR}</div>
             </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-700">
           <div className="text-9xl mb-8 animate-bounce">🏆</div>
           <h2 className="text-7xl font-rajdhani font-black text-yellow-500 italic uppercase tracking-tighter mb-4">{winner} VENCEU!</h2>
           <p className="text-white/40 font-bold uppercase tracking-[0.5em] mb-12">PRÊMIO: 🪙 {roomPot}</p>
           <button onClick={onExit} className="bg-white text-black px-20 py-6 rounded-[35px] font-black text-2xl hover:scale-105 shadow-2xl transition-all uppercase italic tracking-tighter">VOLTAR PARA O LOBBY</button>
        </div>
      )}
    </div>
  );
};

export default DominoGame;
