// Cross-tab synchronization utility
export class CrossTabSync {
  private static instance: CrossTabSync;
  private listeners: Set<(data: any) => void> = new Set();
  private readonly STORAGE_KEY = 'tiktok-word-game-state';
  private readonly SYNC_EVENT_KEY = 'tiktok-word-game-sync';

  static getInstance(): CrossTabSync {
    if (!CrossTabSync.instance) {
      CrossTabSync.instance = new CrossTabSync();
    }
    return CrossTabSync.instance;
  }

  constructor() {
    this.initStorageListener();
    this.initCustomEventListener();
  }

  private initStorageListener() {
    window.addEventListener('storage', (e) => {
      console.log('🔍 [SYNC] Storage event detected:', e);
      if (e.key === this.STORAGE_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          console.log('🔄 [SYNC] Broadcasting storage change to listeners:', data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('❌ [SYNC] Error parsing storage data:', error);
        }
      }
    });
  }

  private initCustomEventListener() {
    window.addEventListener('message', (e) => {
      if (e.data?.type === this.SYNC_EVENT_KEY) {
        console.log('📡 [SYNC] Received custom message:', e.data.payload);
        this.notifyListeners(e.data.payload);
      }
    });
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('❌ [SYNC] Error in listener:', error);
      }
    });
  }

  saveState(data: any): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      console.log('💾 [SYNC] Saved to localStorage:', data);
      
      // Also broadcast using postMessage as fallback
      this.broadcastToAllTabs(data);
    } catch (error) {
      console.error('❌ [SYNC] Error saving state:', error);
    }
  }

  loadState(): any | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('📦 [SYNC] Loaded from localStorage:', data);
        return data;
      }
    } catch (error) {
      console.error('❌ [SYNC] Error loading state:', error);
    }
    return null;
  }

  private broadcastToAllTabs(data: any): void {
    // Broadcast to all windows/tabs using postMessage
    try {
      // Use BroadcastChannel if available
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(this.SYNC_EVENT_KEY);
        channel.postMessage(data);
        channel.close();
        console.log('📡 [SYNC] Broadcasted via BroadcastChannel:', data);
      }
      
      // Also try parent window communication
      if (window.parent !== window) {
        window.parent.postMessage({
          type: this.SYNC_EVENT_KEY,
          payload: data
        }, '*');
      }
    } catch (error) {
      console.error('❌ [SYNC] Error broadcasting:', error);
    }
  }

  subscribe(listener: (data: any) => void): () => void {
    this.listeners.add(listener);
    console.log('👂 [SYNC] Added listener, total listeners:', this.listeners.size);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      console.log('👋 [SYNC] Removed listener, total listeners:', this.listeners.size);
    };
  }

  // Force sync test - for debugging
  forceSyncTest(): void {
    const testData = {
      test: true,
      timestamp: Date.now(),
      message: 'Force sync test'
    };
    
    console.log('🧪 [SYNC] Running force sync test...');
    this.saveState(testData);
    
    // Simulate receiving the data
    setTimeout(() => {
      this.notifyListeners(testData);
    }, 100);
  }
}

export const crossTabSync = CrossTabSync.getInstance();