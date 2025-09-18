interface WinnerData {
  username: string;
  unique_id: string;
  profile_picture?: string;
  profile_picture_urls?: string[];
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

  // Test method to simulate a winner with real TikTok image URL (using actual data from debug)
  testWinnerWithTikTokImage() {
    const testWinner: WinnerData = {
      username: "Peliredtv 🍁",
      unique_id: "versuslatam",
      profile_picture: "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1f427703b4744b4a6f66df4370944bd2~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=8d41df80&x-expires=1758308400&x-signature=H%2BiMN%2BhSlHkHpKRGQyiKWKb30qU%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my",
      profile_picture_urls: [
        "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1f427703b4744b4a6f66df4370944bd2~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=8d41df80&x-expires=1758308400&x-signature=H%2BiMN%2BhSlHkHpKRGQyiKWKb30qU%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my",
        "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1f427703b4744b4a6f66df4370944bd2~tplv-tiktokx-cropcenter:100:100.jpeg?dr=14579&refresh_token=f49004b9&x-expires=1758308400&x-signature=rts8txtMRTEbsSo922ix%2FlzuxUc%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my",
        "https://p16-common-sign.tiktokcdn-us.com/tos-alisg-avt-0068/1f427703b4744b4a6f66df4370944bd2~tplv-tiktokx-cropcenter:100:100.webp?dr=18067&refresh_token=51058a76&x-expires=1758308400&x-signature=P98e%2F%2BEqOQjfMUQ9z5cQqAEBJLM%3D&t=4d5b0474&ps=ae600521&shp=a5d48078&shcp=fdd36af4&idc=my",
        "https://p19-common-sign.tiktokcdn-us.com/tos-alisg-avt-0068/1f427703b4744b4a6f66df4370944bd2~tplv-tiktokx-cropcenter:100:100.webp?dr=18067&refresh_token=b2a803de&x-expires=1758308400&x-signature=ch6iRnSOaTsJKsd7NxkLwVDLmNg%3D&t=4d5b0474&ps=ae600521&shp=a5d48078&shcp=fdd36af4&idc=my",
        "https://p16-common-sign.tiktokcdn-us.com/tos-alisg-avt-0068/1f427703b4744b4a6f66df4370944bd2~tplv-tiktokx-cropcenter:100:100.jpeg?dr=18067&refresh_token=f9656420&x-expires=1758308400&x-signature=bQ0CPcJZYExB2lCJQGs7ooltfTA%3D&t=4d5b0474&ps=ae600521&shp=a5d48078&shcp=fdd36af4&idc=my"
      ],
      comment: "INTELIGENCIA ARTIFICIAL",
      answer: "INTELIGENCIA ARTIFICIAL",
      phrase: "INTELIGENCIA ARTIFICIAL",
      category: "TECNOLOGÍA"
    };
    console.log('🧪 TESTING WINNER WITH REAL TIKTOK IMAGE:', testWinner);
    this.notifyWinner(testWinner);
  }
}

export const winnerService = new WinnerService();
export type { WinnerData };

// Make winnerService globally available for testing
(window as any).winnerService = winnerService;