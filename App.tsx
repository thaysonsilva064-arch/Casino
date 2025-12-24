
import React, { useState, useEffect } from 'react';
import { User, Room, View, GameType, RoomStatus } from './types';
import { db } from './services/firebaseService';
import { ANIME_CHARACTERS } from './constants';
import Auth from './components/Auth';
import Lobby from './components/Lobby';
import MiniGames from './components/MiniGames';
import GlobalRooms from './components/GlobalRooms';
import GameView from './components/GameView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('LOBBY');
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [isAIMode, setIsAIMode] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Perfil temporário para edição
  const [tempName, setTempName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  // Inicializa o Firebase Auth real e monitora mudanças
  useEffect(() => {
    db.initAuth((loggedUser) => {
      setUser(loggedUser);
      setAuthChecked(true); // Finaliza o carregamento inicial
      if (loggedUser) {
        setTempName(loggedUser.name);
        setSelectedAvatar(loggedUser.photoURL);
      }
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const logged = await db.loginWithGoogle();
      if (!logged) {
        alert("Ops! O login falhou. Verifique se você permitiu o pop-up do Google.");
      }
    } catch (e: any) {
      console.error("Login Error:", e);
      alert("Erro ao conectar com Google: " + (e.message || "Tente novamente mais tarde."));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (room: Room, spectator: boolean = false) => {
    try {
      const updatedRoom = await db.joinRoom(room.id, spectator);
      if (updatedRoom) {
        setActiveRoom({ ...updatedRoom });
        setIsAIMode(false);
        setIsSpectator(spectator);
        setCurrentView('GAME_VIEW');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateRoom = async (type: GameType, players: number, bet: number = 0, isAI: boolean = false) => {
    try {
      if (isAI) {
        const newRoom: Room = {
          id: `AI_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          creator: user!,
          gameType: type,
          players: [user!],
          spectators: [],
          maxPlayers: players,
          status: RoomStatus.PLAYING,
          bet: 0,
          pot: 0
        };
        setActiveRoom(newRoom);
        setIsAIMode(true);
        setIsSpectator(false);
        setCurrentView('GAME_VIEW');
      } else {
        const newRoom = await db.createRoom(type, players, bet);
        setActiveRoom({ ...newRoom });
        setIsAIMode(false);
        setIsSpectator(false);
        setCurrentView('GAME_VIEW');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleBackToLobby = () => {
    if (activeRoom && !isAIMode) {
      db.leaveRoom(activeRoom.id);
    }
    setActiveRoom(null);
    setCurrentView('LOBBY');
  };

  const saveSettings = async () => {
    setLoading(true);
    await db.updateProfile(tempName, selectedAvatar);
    setUser(db.getCurrentUser());
    setLoading(false);
    setCurrentView('PROFILE');
  };

  // Splash Screen de carregamento para evitar tela preta
  if (!authChecked) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b0e14]">
        <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-purple-500/20 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-purple-500 border-b-transparent rounded-full animate-spin-slow"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl">🎰</div>
        </div>
        <h2 className="text-2xl font-rajdhani font-black tracking-[0.3em] text-blue-400 animate-pulse uppercase">Conectando ao Nexus...</h2>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0b0e14] flex flex-col md:flex-row">
      {/* Menu Lateral Estilo Gamer */}
      <nav className="order-last md:order-first w-full md:w-24 bg-[#141b26] border-t md:border-t-0 md:border-r border-gray-800 flex md:flex-col items-center justify-around md:justify-center p-4 gap-8 z-50 shadow-2xl">
        <button onClick={() => setCurrentView('LOBBY')} className={`p-4 rounded-2xl transition-all ${currentView === 'LOBBY' ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-110' : 'hover:bg-gray-800 opacity-30 hover:opacity-100'}`} title="Lobby">🏠</button>
        <button onClick={() => setCurrentView('MINI_GAMES')} className={`p-4 rounded-2xl transition-all ${currentView === 'MINI_GAMES' ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-110' : 'hover:bg-gray-800 opacity-30 hover:opacity-100'}`} title="Jogos">🎲</button>
        <button onClick={() => setCurrentView('GLOBAL_ROOMS')} className={`p-4 rounded-2xl transition-all ${currentView === 'GLOBAL_ROOMS' ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-110' : 'hover:bg-gray-800 opacity-30 hover:opacity-100'}`} title="Salas Globais">🌐</button>
        <button onClick={() => setCurrentView('PROFILE')} className={`p-4 rounded-2xl transition-all ${currentView === 'PROFILE' ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-110' : 'hover:bg-gray-800 opacity-30 hover:opacity-100'}`} title="Perfil">👤</button>
        <button onClick={() => setCurrentView('SETTINGS')} className={`p-4 rounded-2xl transition-all ${currentView === 'SETTINGS' ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-110' : 'hover:bg-gray-800 opacity-30 hover:opacity-100'}`} title="Configurações">⚙️</button>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-10 scroll-hide">
        {currentView === 'LOBBY' && <Lobby user={user} onSelectGame={(type) => { setSelectedGame(type); setCurrentView('MINI_GAMES'); }} />}
        
        {currentView === 'MINI_GAMES' && (
          <MiniGames 
            selectedGame={selectedGame} 
            onPlayAgainstAI={(type, players) => handleCreateRoom(type, players, 0, true)} 
            onPlayMultiplayer={(type) => { setSelectedGame(type); setCurrentView('GLOBAL_ROOMS'); }} 
          />
        )}
        
        {currentView === 'GLOBAL_ROOMS' && (
          <GlobalRooms 
            onJoinRoom={handleJoinRoom} 
            onCreateRoom={(type, players, bet) => handleCreateRoom(type, players, bet, false)} 
            selectedGame={selectedGame} 
          />
        )}
        
        {currentView === 'GAME_VIEW' && activeRoom && (
          <GameView room={activeRoom} user={user} onExit={handleBackToLobby} isAI={isAIMode} isSpectator={isSpectator} />
        )}
        
        {currentView === 'PROFILE' && (
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in duration-500">
            <div className="relative group">
              <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-48 h-48 rounded-[60px] border-4 border-blue-500 shadow-xl object-cover transition-transform group-hover:rotate-3" alt="Profile" />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 p-4 rounded-3xl shadow-xl">🏆</div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-6xl font-black font-rajdhani uppercase tracking-tighter italic">{user.name}</h1>
              <p className="text-blue-400 font-black uppercase tracking-[0.4em]">RANK: MESTRE • LVL {user.level}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
               <div className="bg-glass p-8 rounded-[40px] text-center border border-white/5">
                  <p className="text-[10px] text-gray-500 mb-1 font-black uppercase tracking-widest">SALDO</p>
                  <p className="text-3xl font-black text-yellow-500">🪙 {user.coins.toLocaleString()}</p>
               </div>
               <div className="bg-glass p-8 rounded-[40px] text-center border border-white/5">
                  <p className="text-[10px] text-gray-500 mb-1 font-black uppercase tracking-widest">STATUS</p>
                  <p className="text-3xl font-black text-green-500">ONLINE</p>
               </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setCurrentView('SETTINGS')} className="bg-white/5 text-white px-10 py-4 rounded-3xl border border-white/10 font-black uppercase tracking-widest hover:bg-white/10 transition-colors">EDITAR PERFIL</button>
              <button className="bg-red-500/10 text-red-500 px-10 py-4 rounded-3xl border border-red-500/20 font-black uppercase tracking-widest" onClick={() => { db.logout(); window.location.reload(); }}>SAIR</button>
            </div>
          </div>
        )}

        {currentView === 'SETTINGS' && (
          <div className="max-w-2xl mx-auto py-10 space-y-12 animate-in slide-in-from-right-10">
             <h2 className="text-4xl font-rajdhani font-black italic uppercase tracking-tighter text-blue-400">CONFIGURAÇÕES</h2>
             <div className="space-y-8 bg-glass p-10 rounded-[50px] border border-white/5 shadow-2xl">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-500 ml-4">Nome de Usuário</label>
                  <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 rounded-[25px] p-6 font-black text-xl text-white outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-5">
                   <label className="text-xs font-black uppercase text-gray-500 ml-4">Avatar Especial</label>
                   <div className="grid grid-cols-5 gap-4">
                      {ANIME_CHARACTERS.map(char => (
                        <button key={char.id} onClick={() => setSelectedAvatar(char.image)} className={`aspect-square rounded-3xl overflow-hidden border-4 transition-all ${selectedAvatar === char.image ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                          <img src={char.image} className="w-full h-full object-cover" alt={char.name} />
                        </button>
                      ))}
                   </div>
                </div>
                <div className="pt-10 flex gap-4">
                  <button onClick={saveSettings} disabled={loading} className="flex-1 bg-blue-600 text-white py-6 rounded-[30px] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-500 disabled:opacity-50">
                    {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                  </button>
                  <button onClick={() => setCurrentView('PROFILE')} className="px-10 bg-white/5 text-gray-400 py-6 rounded-[30px] font-black uppercase tracking-widest border border-white/10">CANCELAR</button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
