interface WinnerData {
  username: string;
  unique_id: string;
  profile_picture?: string;
  comment: string;
  answer: string;
  phrase: string;
  category: string;
  coronaReward?: number;
}

type WinnerCallback = (winner: WinnerData) => void;

class WinnerService {
  private callbacks: WinnerCallback[] = [];
  private eventSource: EventSource | null = null;

  subscribe(callback: WinnerCallback): () => void {
    this.callbacks.push(callback);

    // Iniciar SSE connection si es la primera suscripción
    if (this.callbacks.length === 1) {
      this.startListening();
    }

    // Retornar función de unsubscribe
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
      if (this.callbacks.length === 0) {
        this.stopListening();
      }
    };
  }

  private startListening() {
    // Polling approach para eventos de ganador
    this.pollForWinners();
  }

  private stopListening() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private async pollForWinners() {
    const checkWinners = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/tiktok-live-winner`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.winner) {
            console.log('%c🎉🎉🎉 GANADOR ENCONTRADO! 🎉🎉🎉', 'color: gold; font-size: 24px; font-weight: bold; background: red; padding: 10px;');
            console.log('%c👤 Usuario:', 'color: white; font-size: 18px; background: blue; padding: 5px;', data.winner.username);
            console.log('%c💬 Comentario:', 'color: white; font-size: 18px; background: green; padding: 5px;', data.winner.comment);
            console.log('%c🖼️ FOTO DE PERFIL RECIBIDA:', 'color: yellow; font-size: 16px; background: purple; padding: 5px;', data.winner.profile_picture);
            console.log('%c📋 DATOS COMPLETOS DEL GANADOR:', 'color: cyan; font-size: 14px;', data.winner);
            this.notifyWinner(data.winner);
          }
        }
      } catch (error) {
        console.error('❌ [WINNER SERVICE] Error checking for winners:', error);
      }
    };

    // Check every 1 second for winners
    console.log('%c⏰ WINNER SERVICE INICIADO - Buscando ganadores...', 'color: blue; font-size: 16px; font-weight: bold;');
    setInterval(checkWinners, 1000);
  }

  notifyWinner(winner: WinnerData) {
    this.callbacks.forEach(callback => callback(winner));
  }

  // Test method to simulate a winner with real TikTok image URL
  testWinnerWithTikTokImage() {
    const testWinner: WinnerData = {
      username: "El Oraculo",
      unique_id: "oraculo_vidente",
      profile_picture: "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-avt-0068c001-no/e40e52e61504a1e5c49de2c3f9e265f8~tplv-tiktokx-cropcenter:100:100.webp?dr=10399&refresh_token=dab43435&x-expires=1758045600&x-signature=5yyRSQ72F8NAXZ5Wtn%2B%2FCwJ%2FZik%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=no1a",
      comment: "HOLA MUNDO",
      answer: "HOLA MUNDO",
      phrase: "HOLA MUNDO",
      category: "Test"
    };
    console.log('🧪 TESTING WINNER WITH REAL TIKTOK IMAGE:', testWinner);
    this.notifyWinner(testWinner);
  }
}

export const winnerService = new WinnerService();
export type { WinnerData };

// Make winnerService globally available for testing
(window as any).winnerService = winnerService;