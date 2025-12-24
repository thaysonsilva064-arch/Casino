
import { GameType, AnimeCharacter } from './types';

export const ANIME_CHARACTERS: AnimeCharacter[] = [
  { id: '1', name: 'Kael', image: 'https://picsum.photos/seed/kael/400/600' },
  { id: '2', name: 'Lina', image: 'https://picsum.photos/seed/lina/400/600' },
  { id: '3', name: 'Zoro', image: 'https://picsum.photos/seed/zoro/400/600' },
  { id: '4', name: 'Miku', image: 'https://picsum.photos/seed/miku/400/600' },
  { id: '5', name: 'Jin', image: 'https://picsum.photos/seed/jin/400/600' },
];

export const GAME_METADATA = [
  { type: GameType.BLACKJACK, icon: '🃏', onlineCount: 124, description: 'Chegue a 21 sem estourar!' },
  { type: GameType.DOMINO, icon: '🎲', onlineCount: 89, description: 'O clássico das pedras.' },
  { type: GameType.POKER, icon: '💎', onlineCount: 231, description: 'Estratégia e sorte.' },
  { type: GameType.TRUCO, icon: '⚔️', onlineCount: 156, description: 'Blefe é a alma do jogo.' },
];
