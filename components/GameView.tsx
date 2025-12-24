
import React, { useState, useEffect } from 'react';
import { Room, User, GameType, RoomStatus } from '../types';
import { ANIME_CHARACTERS } from '../constants';
import BlackjackGame from './BlackjackGame';
import DominoGame from './DominoGame';

interface GameViewProps {
  room: Room;
  user: User;
  onExit: () => void;
  isAI?: boolean;
  isSpectator?: boolean;
}

const GameView: React.FC<GameViewProps> = ({ room, user, onExit, isAI, isSpectator }) => {
  const isWaiting = !isAI && room.players.length < room.maxPlayers;
  
  const gamePlayers = isAI ? [
    ...room.players,
    ...ANIME_CHARACTERS.slice(0, room.maxPlayers - room.players.length).map((char, i) => ({
      id: `ai-${char.id}`,
      name: `AI ${char.name}`,
      photoURL: char.image,
      status: 'online' as const,
      level: 10 + i,
      isAI: true
    }))
  ] : room.players;

  return (
    <div className="fixed inset-0 z-[60] bg-[#0b0e14] flex flex-col overflow-hidden">
      {/* Header com Status */}
      <div className="p-4 bg-glass flex items-center justify-between z-[100] border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="bg-red-500/20 text-red-500 p-2 px-4 rounded-xl font-bold hover:bg-red-500/30 transition-all">← SAIR</button>
          <div>
            <h1 className="font-black text-xl font-rajdhani text-white uppercase tracking-tighter leading-none">{room.gameType}</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-widest">{isSpectator ? 'MODO ESPECTADOR' : 'EM JOGO'}</p>
          </div>
        </div>
        
        <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/5">
           {gamePlayers.map(p => (
             <img key={p.id} src={p.photoURL} className={`w-10 h-10 rounded-full border-2 ${p.id === user.id ? 'border-blue-500 scale-110 shadow-lg' : 'border-gray-800'}`} />
           ))}
           {isWaiting && Array.from({length: room.maxPlayers - room.players.length}).map((_, i) => (
             <div key={i} className="w-10 h-10 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center animate-pulse text-gray-700">?</div>
           ))}
        </div>
      </div>

      <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0f1c15_0%,_#000000_100%)]">
        {isWaiting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50">
            <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
            <h2 className="text-4xl font-rajdhani font-black text-white mb-2">AGUARDANDO JOGADORES</h2>
            <p className="text-blue-400 font-bold uppercase tracking-widest animate-pulse">
               {room.players.length} / {room.maxPlayers} NA SALA
            </p>
            <div className="mt-12 flex gap-4">
               {room.players.map(p => (
                 <div key={p.id} className="flex flex-col items-center gap-2">
                   <img src={p.photoURL} className="w-16 h-16 rounded-3xl border-2 border-blue-500" />
                   <span className="text-[10px] font-bold uppercase">{p.name}</span>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {isSpectator && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-purple-600 px-4 py-1 rounded-full text-[10px] font-black animate-pulse shadow-lg">
                👀 ASSISTINDO PARTIDA
              </div>
            )}
            
            {room.gameType === GameType.DOMINO ? (
              <DominoGame 
                players={gamePlayers} 
                localUser={user} 
                onExit={onExit}
                isMultiplayer={!isAI}
                // isSpectator seria passado se atualizássemos as props do DominoGame
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                 <BlackjackGame players={gamePlayers} localUser={user} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameView;
