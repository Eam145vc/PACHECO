export interface LetterTile {
  letter: string;
  isRevealed: boolean;
  isSpace: boolean;
  position: number;
}

export interface GamePhrase {
  id: string;
  text: string;
  category: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
  tiles: LetterTile[];
  coronaReward: number;
}

export interface GameState {
  currentPhrase: GamePhrase | null;
  isGameActive: boolean;
  roundNumber: number;
  winners: string[];
  tokensPerWinner: number;
}

export interface AdminControls {
  autoRevealConsonants: boolean;
  autoRevealVowels: boolean;
  revealInterval: number; // seconds
  likesThreshold: number;
  giftsThreshold: number;
  manualReveal: boolean;
}