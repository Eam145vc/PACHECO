// Comprehensive diagnostics for cross-tab sync issues
export class GameDiagnostics {
  private static instance: GameDiagnostics;
  
  static getInstance(): GameDiagnostics {
    if (!GameDiagnostics.instance) {
      GameDiagnostics.instance = new GameDiagnostics();
    }
    return GameDiagnostics.instance;
  }

  runFullDiagnostic(): void {
    console.log('🔍 [DIAGNOSTIC] Starting full diagnostic...');
    
    this.testLocalStorage();
    this.testStorageEvents();
    this.testBroadcastChannel();
    this.testContextConnection();
    this.testStateFlow();
  }

  private testLocalStorage(): void {
    console.log('📦 [DIAGNOSTIC] Testing localStorage...');
    
    try {
      const testKey = 'diagnostic-test';
      const testValue = { test: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      
      if (retrieved.test === testValue.test) {
        console.log('✅ [DIAGNOSTIC] localStorage works correctly');
      } else {
        console.error('❌ [DIAGNOSTIC] localStorage retrieval failed');
      }
      
      localStorage.removeItem(testKey);
    } catch (error) {
      console.error('❌ [DIAGNOSTIC] localStorage error:', error);
    }
  }

  private testStorageEvents(): void {
    console.log('👂 [DIAGNOSTIC] Testing storage events...');
    
    const testHandler = (e: StorageEvent) => {
      console.log('📨 [DIAGNOSTIC] Storage event received:', e);
    };
    
    window.addEventListener('storage', testHandler);
    
    setTimeout(() => {
      const testData = { diagnostic: Date.now() };
      localStorage.setItem('diagnostic-storage-test', JSON.stringify(testData));
      
      setTimeout(() => {
        localStorage.removeItem('diagnostic-storage-test');
        window.removeEventListener('storage', testHandler);
        console.log('🧪 [DIAGNOSTIC] Storage event test completed');
      }, 500);
    }, 100);
  }

  private testBroadcastChannel(): void {
    console.log('📡 [DIAGNOSTIC] Testing BroadcastChannel...');
    
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('diagnostic-test');
        
        channel.onmessage = (event) => {
          console.log('📨 [DIAGNOSTIC] BroadcastChannel message received:', event.data);
        };
        
        setTimeout(() => {
          channel.postMessage({ diagnostic: Date.now() });
          
          setTimeout(() => {
            channel.close();
            console.log('✅ [DIAGNOSTIC] BroadcastChannel test completed');
          }, 500);
        }, 100);
        
      } catch (error) {
        console.error('❌ [DIAGNOSTIC] BroadcastChannel error:', error);
      }
    } else {
      console.log('⚠️ [DIAGNOSTIC] BroadcastChannel not supported');
    }
  }

  private testContextConnection(): void {
    console.log('🔗 [DIAGNOSTIC] Testing React Context connection...');
    
    // This will be called from components to verify context access
    console.log('📍 [DIAGNOSTIC] Current URL:', window.location.href);
    console.log('📍 [DIAGNOSTIC] Current pathname:', window.location.pathname);
  }

  testCrossTabSync(): void {
    console.log('🌐 [DIAGNOSTIC] Testing cross-tab sync manually...');
    
    const testState = {
      diagnostic: true,
      timestamp: Date.now(),
      url: window.location.href,
      test: 'manual-cross-tab-test'
    };
    
    localStorage.setItem('tiktok-word-game-state', JSON.stringify(testState));
    console.log('💾 [DIAGNOSTIC] Saved test state:', testState);
    
    // Force trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tiktok-word-game-state',
      newValue: JSON.stringify(testState),
      oldValue: null,
      url: window.location.href
    }));
    
    console.log('📤 [DIAGNOSTIC] Dispatched storage event');
  }

  private testStateFlow(): void {
    console.log('🌊 [DIAGNOSTIC] Testing state flow...');
    
    // Check if we're in admin or game page
    const isAdmin = window.location.pathname.includes('/admin');
    const isGame = window.location.pathname === '/';
    
    console.log('📍 [DIAGNOSTIC] Page type:', {
      isAdmin,
      isGame,
      pathname: window.location.pathname
    });
    
    if (isAdmin) {
      console.log('⚙️ [DIAGNOSTIC] Running admin-specific tests...');
      this.testAdminFlow();
    } else if (isGame) {
      console.log('🎮 [DIAGNOSTIC] Running game page tests...');
      this.testGamePageFlow();
    }
  }

  private testAdminFlow(): void {
    console.log('⚙️ [DIAGNOSTIC] Testing admin flow...');
    
    // Simulate admin action
    setTimeout(() => {
      console.log('🎯 [DIAGNOSTIC] Simulating admin phrase selection...');
      this.testCrossTabSync();
    }, 1000);
  }

  private testGamePageFlow(): void {
    console.log('🎮 [DIAGNOSTIC] Testing game page flow...');
    
    // Check if context is properly connected
    setTimeout(() => {
      console.log('👀 [DIAGNOSTIC] Checking if game page receives updates...');
      
      // Listen for the next 5 seconds
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        console.log(`⏰ [DIAGNOSTIC] Listening for updates... ${elapsed}ms elapsed`);
        
        if (elapsed > 5000) {
          clearInterval(checkInterval);
          console.log('⏱️ [DIAGNOSTIC] Listening period ended');
        }
      }, 1000);
    }, 500);
  }

  // Method to be called from GamePage component
  reportGamePageRender(gameState: any): void {
    console.log('🎮 [DIAGNOSTIC] GamePage render reported');
    console.log('📊 [DIAGNOSTIC] GamePage state:', gameState);
    console.log('📊 [DIAGNOSTIC] GamePage current phrase:', gameState?.currentPhrase?.text || 'null');
    console.log('📊 [DIAGNOSTIC] GamePage active:', gameState?.isGameActive);
  }

  // Method to be called from AdminRoute component
  reportAdminRender(gameState: any): void {
    console.log('⚙️ [DIAGNOSTIC] AdminRoute render reported');
    console.log('📊 [DIAGNOSTIC] AdminRoute state:', gameState);
    console.log('📊 [DIAGNOSTIC] AdminRoute current phrase:', gameState?.currentPhrase?.text || 'null');
    console.log('📊 [DIAGNOSTIC] AdminRoute active:', gameState?.isGameActive);
  }
}

export const gameDiagnostics = GameDiagnostics.getInstance();

// Auto-run diagnostics when loaded
setTimeout(() => {
  gameDiagnostics.runFullDiagnostic();
}, 500);