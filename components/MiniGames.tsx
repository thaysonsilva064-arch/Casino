
import React, { useState } from 'react';
import { GameType } from '../types';
import { GAME_METADATA } from '../constants';

interface MiniGamesProps {
  selectedGame: GameType | null;
  onPlayAgainstAI: (type: GameType, players: number) => void;
  onPlayMultiplayer: (type: GameType) => void;
}

const MiniGames: React.FC<MiniGamesProps> = ({ selectedGame, onPlayAgainstAI, onPlayMultiplayer }) => {
  const [showConfig, setShowConfig] = useState<GameType | null>(null);
  const games = selectedGame ? [GAME_METADATA.find(g => g.type === selectedGame)!] : GAME_METADATA;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-rajdhani font-black flex items-center gap-3 italic">
          🎲 SELECIONE SEU DESAFIO
        </h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">IA ou Multiplayer Real? Você decide.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <div key={game.type} className="bg-glass rounded-[40px] overflow-hidden border border-white/5 flex flex-col h-full group">
            <div className="h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-500">
              {game.icon}
            </div>
            <div className="p-8 flex flex-col flex-1">
              <h3 className="text-3xl font-rajdhani font-black mb-2 uppercase tracking-tighter italic">{game.type}</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">{game.description}</p>
              
              <div className="mt-auto space-y-4">
                {showConfig === game.type ? (
                   <div className="space-y-4 animate-in zoom-in duration-300">
                      <p className="text-[10px] text-blue-400 font-black text-center uppercase">Selecione o modo de treino</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onPlayAgainstAI(game.type, 2)} className="py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold border border-white/10 uppercase italic">1 VS 1 (Robot)</button>
                        <button onClick={() => onPlayAgainstAI(game.type, 4)} className="py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold border border-white/10 uppercase italic">2 VS 2 (Robots)</button>
                      </div>
                      <button onClick={() => setShowConfig(null)} className="w-full text-xs text-gray-500 font-bold uppercase">Cancelar</button>
                   </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setShowConfig(game.type)}
                      className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[25px] font-black flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-sm"
                    >
                      🤖 TREINO COM ROBÔS
                    </button>
                    <button 
                      onClick={() => onPlayMultiplayer(game.type)}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-[25px] font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-900/40 uppercase tracking-widest text-sm"
                    >
                      👥 MULTIPLAYER GLOBAL
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniGames;
