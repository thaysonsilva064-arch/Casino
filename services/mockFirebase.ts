
import { User, Room, GameType, RoomStatus } from '../types';

// NOTA: Em um ambiente real, você importaria do 'firebase/app' e 'firebase/auth'
// Aqui simulamos a API real do Firebase para garantir o funcionamento imediato.

type SubscriptionCallback = (rooms: Room[]) => void;

class FirebaseService {
  private rooms: Room[] = [];
  private subscriptions: Set<SubscriptionCallback> = new Set();
  private currentUser: User | null = null;

  constructor() {
    const saved = localStorage.getItem('nexus_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  }

  // Simulação de Login Real com Google
  async loginWithGoogle(): Promise<User> {
    // Simulando o delay de rede do Firebase Auth
    await new Promise(r => setTimeout(r, 1500));
    
    // Se já tiver logado, retorna o atual, senão cria um novo baseado no Google
    if (!this.currentUser) {
      const mockGoogleProfile = {
        id: "google_uid_" + Math.random().toString(36).substr(2, 9),
        name: 'Jogador Google',
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=google_${Math.random()}`,
        status: 'online' as const,
        level: 1,
        coins: 1000,
      };
      this.currentUser = mockGoogleProfile;
    }
    
    this.saveUser();
    return this.currentUser;
  }

  saveUser() {
    if (this.currentUser) {
      localStorage.setItem('nexus_user', JSON.stringify(this.currentUser));
      localStorage.setItem('nexus_coins', this.currentUser.coins.toString());
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('nexus_user');
  }

  getCurrentUser() { return this.currentUser; }

  updateProfile(name: string, photoURL: string) {
    if (this.currentUser) {
      this.currentUser.name = name;
      this.currentUser.photoURL = photoURL;
      this.saveUser();
    }
  }

  updateCoins(amount: number) {
    if (this.currentUser) {
      this.currentUser.coins += amount;
      this.saveUser();
    }
  }

  createRoom(gameType: GameType, maxPlayers: number, bet: number = 0): Room {
    if (!this.currentUser) throw new Error('Auth required');
    
    // Verifica se o jogador tem moedas suficientes para a aposta inicial
    if (this.currentUser.coins < bet) {
      throw new Error('Moedas insuficientes para criar esta sala!');
    }

    // Deduz a aposta inicial do criador
    this.updateCoins(-bet);

    const newRoom: Room = {
      id: "ROOM_" + Math.random().toString(36).substr(2, 4).toUpperCase(),
      creator: this.currentUser,
      gameType,
      players: [this.currentUser],
      spectators: [],
      maxPlayers,
      status: RoomStatus.WAITING,
      bet,
      pot: bet // Pot começa com a aposta do criador
    };
    
    this.rooms.push(newRoom);
    this.notify();
    return newRoom;
  }

  joinRoom(roomId: string, asSpectator: boolean = false): Room | null {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room || !this.currentUser) return null;

    if (asSpectator) {
      if (!room.spectators.find(s => s.id === this.currentUser?.id)) {
        room.spectators.push(this.currentUser);
      }
    } else {
      // Regras de Entrada: Max Jogadores e Saldo
      if (room.players.length < room.maxPlayers) {
        if (!room.players.find(p => p.id === this.currentUser?.id)) {
          if (this.currentUser.coins < room.bet) {
            alert('Você não tem moedas suficientes para entrar nesta aposta!');
            return null;
          }
          
          this.updateCoins(-room.bet);
          room.players.push(this.currentUser);
          room.pot += room.bet; // Adiciona ao pote acumulado
        }
        
        if (room.players.length === room.maxPlayers) {
          room.status = RoomStatus.PLAYING;
        }
      }
    }
    
    this.notify();
    return room;
  }

  leaveRoom(roomId: string) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room || !this.currentUser) return;

    room.players = room.players.filter(p => p.id !== this.currentUser?.id);
    room.spectators = room.spectators.filter(s => s.id !== this.currentUser?.id);
    
    if (room.players.length === 0) {
      this.rooms = this.rooms.filter(r => r.id !== roomId);
    } else {
      room.status = RoomStatus.WAITING;
    }
    this.notify();
  }

  onRoomsUpdate(callback: SubscriptionCallback) {
    this.subscriptions.add(callback);
    callback([...this.rooms]);
    return () => this.subscriptions.delete(callback);
  }

  private notify() {
    this.subscriptions.forEach(cb => cb([...this.rooms]));
  }
}

export const db = new FirebaseService();
