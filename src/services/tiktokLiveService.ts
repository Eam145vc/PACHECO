interface TikTokLiveResponse {
  success: boolean;
  message?: string;
  status?: TikTokLiveStatus;
  error?: string;
}

interface TikTokLiveStatus {
  connected: boolean;
  streamer_username: string | null;
  room_id: string | null;
  last_update: number | null;
  autoRevealVowel?: {
    username: string;
    timestamp: number;
  };
  autoRevealConsonant?: {
    username: string;
    timestamp: number;
  };
}

interface TikTokLiveEvent {
  event: string;
  data: any;
  timestamp: number;
}

class TikTokLiveService {
  private baseUrl = 'http://localhost:3002';

  async getStatus(): Promise<TikTokLiveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tiktok-live-status`);
      return await response.json();
    } catch (error) {
      console.error('Error getting TikTok Live status:', error);
      return { success: false, error: 'Error connecting to server' };
    }
  }

  async startConnection(username: string): Promise<TikTokLiveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tiktok-live-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      return await response.json();
    } catch (error) {
      console.error('Error starting TikTok Live connection:', error);
      return { success: false, error: 'Error starting connection' };
    }
  }

  async stopConnection(): Promise<TikTokLiveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tiktok-live-stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      console.error('Error stopping TikTok Live connection:', error);
      return { success: false, error: 'Error stopping connection' };
    }
  }

  async updateGameState(phrase: string, answer: string, category: string, isActive: boolean): Promise<TikTokLiveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tiktok-live-game-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase, answer, category, isActive })
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating game state:', error);
      return { success: false, error: 'Error updating game state' };
    }
  }

  // Método para polling del estado (para reconexión automática)
  startStatusPolling(callback: (status: TikTokLiveStatus | null) => void, intervalMs: number = 5000) {
    const interval = setInterval(async () => {
      const response = await this.getStatus();
      if (response.success && response.status) {
        callback(response.status);
      } else {
        callback(null);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

export const tiktokLiveService = new TikTokLiveService();
export default tiktokLiveService;