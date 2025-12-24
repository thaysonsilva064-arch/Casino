
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebaseService';
import { Room, GameType, RoomStatus } from '../types';
import { GAME_METADATA } from '../constants';

interface GlobalRoomsProps {
  onJoinRoom: (room: Room, asSpectator?: boolean) => void;
  onCreateRoom: (type: GameType, players: number, bet: number) => void;
  selectedGame: GameType | null;
}

const GlobalRooms: React.FC<GlobalRoomsProps> = ({ onJoinRoom, onCreateRoom, selectedGame }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterGame, setFilterGame] = useState<GameType | string>(selectedGame || 'Todos');
  const [selectedPlayers, setSelectedPlayers] = useState(2);
  const [selectedBet, setSelectedBet] = useState(0);

  const bets = [0, 100, 500, 1000, 5000];

  useEffect(() => {
    // Escuta as salas em tempo real do Firestore
    const unsubscribe = db.onRoomsUpdate((updatedRooms) => {
      setRooms(updatedRooms);
    });
    return () => unsubscribe();
  }, []);

  const filteredRooms = rooms.filter(r => 
    (filterGame === 'Todos' || r.gameType === filterGame)
  );

  return (
    <div className="space-y-6 h-full flex flex-col p-4 pb-24">
      <div className="flex items-center justify-between bg-glass p-6 rounded-[35px] border border-blue-500/20 shadow-2xl">
        <div>
          <h2 className="text-3xl font-rajdhani font-black text-blue-400 italic">RECRUTAMENTO GLOBAL</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">Encontre mesas com apostas reais</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/30 uppercase text-xs"
        >
          CRIAR MESA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 scroll-hide">
        {filteredRooms.map((room) => {
          const isFull = room.players.length >= room.maxPlayers;
          return (
            <div 
              key={room.id}
              className={`bg-glass p-6 rounded-[40px] border transition-all ${isFull ? 'border-purple-500/30' : 'border-green-500/30 shadow-lg shadow-green-500/5'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={room.creator.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.creator.id}`} className="w-12 h-12 rounded-full border-2 border-white/10" alt="avatar" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-xs font-black text-white truncate w-24 uppercase">{room.creator.name}</p>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">{room.gameType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block mb-1 ${isFull ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400 animate-pulse'}`}>
                    {isFull ? 'EM JOGO' : 'RECRUTANDO'}
                  </div>
                  <div className="text-[10px] font-black text-yellow-500 block">APOSTA: {room.bet > 0 ? `🪙 ${room.bet}` : 'GRÁTIS'}</div>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-3xl mb-6 flex justify-between items-center border border-white/5">
                 <div className="flex -space-x-3">
                   {room.players.map(p => (
                     <img key={p.id} src={p.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} className="w-10 h-10 rounded-full border-4 border-[#1a2333] shadow-lg" title={p.name} />
                   ))}
                   {Array.from({length: room.maxPlayers - room.players.length}).map((_, i) => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-dashed border-gray-700 bg-gray-900/50 flex items-center justify-center text-sm font-bold text-gray-700">?</div>
                   ))}
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-black uppercase">Prêmio Total</p>
                    <p className="text-lg font-black text-white">🪙 {room.pot}</p>
                 </div>
              </div>

              {isFull ? (
                <button 
                  onClick={() => onJoinRoom(room, true)}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-3xl text-xs font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  👁️ ASSISTIR MESA
                </button>
              ) : (
                <button 
                  onClick={() => onJoinRoom(room, false)}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-3xl text-xs font-black transition-all uppercase tracking-widest shadow-xl shadow-green-900/20"
                >
                  ENTRAR (PAGAR {room.bet})
                </button>
              )}
            </div>
          );
        })}
        {filteredRooms.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
             <span className="text-6xl block mb-4">📭</span>
             <p className="font-bold uppercase tracking-widest text-sm">Nenhuma sala ativa no momento</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-[#141b26] w-full max-w-lg rounded-[50px] p-10 border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.1)]">
            <h3 className="text-4xl font-rajdhani font-black mb-10 text-center text-blue-400 italic">CONFIGURAÇÃO DA MESA</h3>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">Selecione o Jogo</p>
                <div className="grid grid-cols-2 gap-3">
                  {GAME_METADATA.map(g => (
                    <button 
                      key={g.type} 
                      onClick={() => setFilterGame(g.type)} 
                      className={`p-5 rounded-3xl border-2 font-black text-xs transition-all uppercase ${filterGame === g.type ? 'border-blue-500 bg-blue-500/10 text-blue-400 scale-105 shadow-lg shadow-blue-500/20' : 'border-white/5 opacity-50'}`}
                    >
                      {g.icon} {g.type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">Vagas</p>
                  <div className="flex gap-3">
                    {[2, 3, 4].map(n => (
                      <button 
                        key={n} 
                        onClick={() => setSelectedPlayers(n)}
                        className={`w-14 h-14 rounded-2xl font-black border-2 transition-all ${selectedPlayers === n ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/5 opacity-40'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">Aposta Inicial</p>
                  <div className="flex flex-wrap gap-2">
                    {bets.map(b => (
                      <button 
                        key={b} 
                        onClick={() => setSelectedBet(b)}
                        className={`px-4 py-3 rounded-2xl font-black border-2 text-[10px] transition-all ${selectedBet === b ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-white/5 border-white/5 opacity-40'}`}
                      >
                        {b === 0 ? 'GRÁTIS' : `🪙 ${b}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <button 
                  onClick={() => { onCreateRoom(filterGame as GameType, selectedPlayers, selectedBet); setShowCreateModal(false); }}
                  className="w-full py-6 bg-blue-600 rounded-[30px] font-black text-xl shadow-2xl hover:bg-blue-500 transition-all uppercase tracking-tighter italic"
                >
                  PUBLICAR RECRUTAMENTO
                </button>
                <button onClick={() => setShowCreateModal(false)} className="w-full text-gray-500 font-bold py-2 uppercase text-xs tracking-widest">Descartar Configuração</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalRooms;
