interface TikTokBotResponse {
  success: boolean;
  message?: string;
  letter?: string;
  phraseState?: string;
  error?: string;
}

interface PurchaseRequest {
  phrase: string;
  revealedLetters: string[];
  category: string;
  username: string;
  streamerUsername: string;
}

class TikTokBotService {
  private baseUrl = 'http://localhost:3002';

  async startBrowser(): Promise<TikTokBotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/start-login`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Error starting browser:', error);
      return { success: false, error: 'Error connecting to TikTok bot' };
    }
  }

  async setCookies(cookies: any[]): Promise<TikTokBotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/set-cookies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies })
      });
      return await response.json();
    } catch (error) {
      console.error('Error setting cookies:', error);
      return { success: false, error: 'Error setting cookies' };
    }
  }

  async purchaseVowel(data: PurchaseRequest): Promise<TikTokBotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-vowel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error purchasing vowel:', error);
      return { success: false, error: 'Error purchasing vowel' };
    }
  }

  async purchaseConsonant(data: PurchaseRequest): Promise<TikTokBotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-consonant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error purchasing consonant:', error);
      return { success: false, error: 'Error purchasing consonant' };
    }
  }

  async purchaseHint(data: Omit<PurchaseRequest, 'revealedLetters'>): Promise<TikTokBotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error purchasing hint:', error);
      return { success: false, error: 'Error purchasing hint' };
    }
  }

  async sendMessage(username: string, message: string): Promise<TikTokBotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message })
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Error sending message' };
    }
  }
}

export const tiktokBotService = new TikTokBotService();
export default tiktokBotService;