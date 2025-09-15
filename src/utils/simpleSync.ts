// Simple cross-tab synchronization using custom events
class SimpleGameSync {
  private static instance: SimpleGameSync;
  private listeners: Array<(data: any) => void> = [];
  private readonly STORAGE_KEY = 'simple-game-state';

  static getInstance(): SimpleGameSync {
    if (!SimpleGameSync.instance) {
      SimpleGameSync.instance = new SimpleGameSync();
    }
    return SimpleGameSync.instance;
  }

  constructor() {
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === this.STORAGE_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          this.notifyListeners(data);
        } catch (error) {
          console.error('Parse error:', error);
        }
      }
    });

    // Also listen for custom events (same-tab updates)
    window.addEventListener('game-state-update', ((e: CustomEvent) => {
      this.notifyListeners(e.detail);
    }) as EventListener);
  }

  private notifyListeners(data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // Save state and broadcast to all tabs
  saveState(gameState: any): void {
    try {
      const serialized = JSON.stringify(gameState);
      localStorage.setItem(this.STORAGE_KEY, serialized);

      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('game-state-update', {
        detail: gameState
      }));

      // Force trigger storage event for cross-tab
      setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: this.STORAGE_KEY,
          newValue: serialized,
          oldValue: null,
          url: window.location.href
        }));
      }, 10);

    } catch (error) {
      console.error('Save error:', error);
    }
  }

  // Load current state
  loadState(): any {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return data;
      }
    } catch (error) {
      console.error('Load error:', error);
    }
    return null;
  }

  // Subscribe to state changes
  subscribe(callback: (data: any) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Clear all data
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    // Also clear old corrupted data
    localStorage.removeItem('tiktok-word-game-state');
  }

  // Initialize clean
  initClean(): void {
    this.clear();
    const cleanState = {
      currentPhrase: null,
      isGameActive: false,
      roundNumber: 1,
      winners: [],
      tokensPerWinner: 100
    };
    this.saveState(cleanState);
  }
}

export const simpleSync = SimpleGameSync.getInstance();