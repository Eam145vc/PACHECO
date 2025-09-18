import { GamePhrase, LetterTile } from '../types/game';

// Función para normalizar texto removiendo tildes y acentos
export const normalizeForComparison = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export const createPhraseFromText = (
  id: string,
  text: string, 
  category: string,
  difficulty: 'fácil' | 'medio' | 'difícil'
): GamePhrase => {
  const tiles: LetterTile[] = [];
  
  text.split('').forEach((char, index) => {
    if (char === ' ') {
      tiles.push({
        letter: '',
        isRevealed: true,
        isSpace: true,
        position: index
      });
    } else {
      tiles.push({
        letter: char.toLowerCase(),
        isRevealed: false,
        isSpace: false,
        position: index
      });
    }
  });

  return {
    id,
    text: text.toLowerCase(),
    category,
    difficulty,
    tiles,
    coronaReward: 5 // Default value, will be overridden
  };
};

export const isVowel = (letter: string): boolean => {
  return ['a', 'e', 'i', 'o', 'u'].includes(letter.toLowerCase());
};

export const isConsonant = (letter: string): boolean => {
  return /^[a-zA-Z]$/.test(letter) && !isVowel(letter);
};

export const revealLetter = (phrase: GamePhrase, letter: string): GamePhrase => {
  const normalizedInputLetter = normalizeForComparison(letter);

  const updatedTiles = phrase.tiles.map(tile => {
    if (!tile.isSpace && normalizeForComparison(tile.letter) === normalizedInputLetter) {
      return { ...tile, isRevealed: true };
    }
    return tile;
  });

  return { ...phrase, tiles: updatedTiles };
};

export const revealRandomVowel = (phrase: GamePhrase): GamePhrase => {
  const unrevealedVowels = phrase.tiles.filter(
    tile => !tile.isSpace && !tile.isRevealed && isVowel(tile.letter)
  );

  if (unrevealedVowels.length === 0) {
    return phrase;
  }

  const randomVowel = unrevealedVowels[Math.floor(Math.random() * unrevealedVowels.length)];
  return revealLetter(phrase, randomVowel.letter);
};

export const revealRandomConsonant = (phrase: GamePhrase): GamePhrase => {
  const unrevealedConsonants = phrase.tiles.filter(
    tile => !tile.isSpace && !tile.isRevealed && isConsonant(tile.letter)
  );

  if (unrevealedConsonants.length === 0) {
    return phrase;
  }

  const randomConsonant = unrevealedConsonants[Math.floor(Math.random() * unrevealedConsonants.length)];
  return revealLetter(phrase, randomConsonant.letter);
};

export const isPhraseComplete = (phrase: GamePhrase): boolean => {
  return phrase.tiles.every(tile => tile.isSpace || tile.isRevealed);
};

export const getRevealedText = (phrase: GamePhrase): string => {
  return phrase.tiles.map(tile => {
    if (tile.isSpace) return ' ';
    return tile.isRevealed ? tile.letter.toUpperCase() : '_';
  }).join('');
};