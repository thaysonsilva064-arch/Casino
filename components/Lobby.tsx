
import React from 'react';
import { User, GameType } from '../types';
import { GAME_METADATA } from '../constants';

interface LobbyProps {
  user: User;
  onSelectGame: (type: GameType) => void;
}

const Lobby: React.FC<LobbyProps> = ({ user, onSelectGame }) => {
  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Header / Profile Info */}
      <div className="flex items-center justify-between bg-glass p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={user.photoURL} className="w-16 h-16 rounded-full border-2 border-blue-500" alt="Profile" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#141b26] rounded-full"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold font-rajdhani">{user.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">LVL {user.level}</span>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
             <span className="text-yellow-500 mr-2">🪙</span>
             <span className="font-bold">{user.coins.toLocaleString()}</span>
           </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-2xl group">
        <img src="https://picsum.photos/seed/casino/1200/400" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt="Promo" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
          <h3 className="text-3xl font-bold font-rajdhani">EVENTO DE VERÃO</h3>
          <p className="text-blue-300">Ganhe bônus em dobro em todas as mesas de Poker!</p>
        </div>
      </div>

      {/* Mini Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {GAME_METADATA.map((game) => (
          <div 
            key={game.type}
            onClick={() => onSelectGame(game.type)}
            className="anime-card-hover bg-glass p-6 rounded-3xl cursor-pointer group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{game.icon}</div>
            <h4 className="text-xl font-bold font-rajdhani mb-1">{game.type}</h4>
            <p className="text-xs text-gray-400 mb-4">{game.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                {game.onlineCount} online
              </span>
              <button className="bg-blue-600/20 text-blue-400 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                ➔
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
