
export enum GameType {
  BLACKJACK = 'Blackjack',
  DOMINO = 'Dominó',
  POKER = 'Poker Lite',
  TRUCO = 'Truco'
}

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export interface User {
  id: string;
  name: string;
  photoURL: string;
  avatarId?: string; // ID da imagem de anime selecionada
  status: 'online' | 'offline';
  level: number;
  coins: number;
}

export interface Room {
  id: string;
  creator: User;
  gameType: GameType;
  players: User[];
  spectators: User[];
  maxPlayers: number;
  status: RoomStatus;
  bet: number; // Valor da entrada
  pot: number; // Valor total acumulado na mesa
}

export interface AnimeCharacter {
  id: string;
  name: string;
  image: string;
}

export type View = 'LOBBY' | 'MINI_GAMES' | 'GLOBAL_ROOMS' | 'GAME_VIEW' | 'PROFILE' | 'SETTINGS';

export interface DominoPiece {
  id: string;
  side1: number;
  side2: number;
  ownerId?: string;
}
