#!/usr/bin/env python3
"""
TikTok Live Server - Versión Simple sin Emojis
Conecta al live de TikTok y detecta respuestas para el juego de palabras
"""

import asyncio
import json
import time
import logging
import aiohttp
import re
import sys
import threading
import unicodedata
from typing import Optional, Dict, Any
from dataclasses import dataclass
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except TypeError:
        # En algunas versiones de Python/Windows, esto puede fallar. Usar chcp como fallback.
        import os
        os.system("chcp 65001 >nul 2>&1")

# Importar TikTokLive
try:
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent, LiveEndEvent, GiftEvent, LikeEvent, FollowEvent
except ImportError:
    print("ERROR: TikTokLive no esta instalado. Instalalo con: pip install TikTokLive", flush=True)
    sys.exit(1)

@dataclass
class GameState:
    current_phrase: Optional[str] = None
    current_answer: Optional[str] = None
    category: Optional[str] = None
    is_active: bool = False
    streamer_username: Optional[str] = None

class TikTokLiveServer:
    def __init__(self):
        self.client: Optional[TikTokLiveClient] = None
        self.game_state = GameState()
        self.is_connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        self.express_server_url = "http://localhost:3002"
        self.config_file = Path(__file__).parent / "tiktok_live_config.json"
        self.stdin_listener_running = False

        # Setup logging sin caracteres especiales
        # Reemplazamos logger con prints para asegurar la salida en tiempo real

        # Load saved config
        self.load_config()

        # Iniciar listener de stdin en hilo separado
        self.start_stdin_listener()

        # Iniciar polling del estado del juego para Render
        self.start_game_state_polling()

    def load_config(self):
        """Cargar configuración guardada"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.game_state.streamer_username = config.get('streamer_username')
                    print(f"CONFIGURACION cargada: {self.game_state.streamer_username}", flush=True)
        except Exception as e:
            print(f"ERROR cargando configuracion: {e}", flush=True)

    def save_config(self):
        """Guardar configuración"""
        try:
            config = {
                'streamer_username': self.game_state.streamer_username
            }
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            print("CONFIGURACION guardada", flush=True)
        except Exception as e:
            print(f"ERROR guardando configuracion: {e}", flush=True)

    def start_stdin_listener(self):
        """Iniciar listener de stdin en hilo separado"""
        def stdin_listener():
            self.stdin_listener_running = True
            print("STDIN listener iniciado - esperando mensajes...", flush=True)

            while self.stdin_listener_running:
                try:
                    # Leer línea de stdin (esto bloquea hasta que llegue una línea)
                    line = sys.stdin.readline()

                    # Si readline retorna cadena vacía, stdin se cerró
                    if not line:
                        print("STDIN cerrado, terminando listener", flush=True)
                        break

                    line = line.strip()
                    if line:
                        print(f"STDIN RECIBIDO: {line}", flush=True)
                        self.process_stdin_message(line)

                except EOFError:
                    print("EOF en stdin, terminando listener", flush=True)
                    break
                except Exception as e:
                    print(f"ERROR en stdin listener: {e}", flush=True)
                    # Pequeña pausa para evitar bucle infinito en caso de error
                    time.sleep(0.5)

            print("STDIN listener terminado", flush=True)

        # Iniciar hilo daemon
        thread = threading.Thread(target=stdin_listener, daemon=True)
        thread.start()
        print("STDIN listener thread iniciado", flush=True)

    def start_game_state_polling(self):
        """Iniciar polling del estado del juego para Render (donde no hay stdin)"""
        def game_state_poller():
            print("GAME STATE polling iniciado", flush=True)
            while True:
                try:
                    # Hacer request al endpoint interno del backend
                    response = requests.get(f"{self.express_server_url}/internal/game-state", timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success'):
                            game_state = data.get('game_state', {})
                            phrase = game_state.get('phrase', '')
                            answer = game_state.get('answer', '')
                            category = game_state.get('category', '')
                            is_active = game_state.get('isActive', False)

                            # Solo actualizar si hay cambios
                            if (self.game_state.current_answer != answer or
                                self.game_state.is_active != is_active):
                                self.update_game_state(phrase, answer, category, is_active)
                                print(f"GAME STATE actualizado via polling: {answer} ({category}) - Activo: {is_active}", flush=True)

                    time.sleep(5)  # Polling cada 5 segundos
                except Exception as e:
                    print(f"ERROR en game state polling: {e}", flush=True)
                    time.sleep(10)  # Esperar más tiempo si hay error

        # Iniciar hilo daemon
        thread = threading.Thread(target=game_state_poller, daemon=True)
        thread.start()
        print("GAME STATE polling thread iniciado", flush=True)

    def process_stdin_message(self, message: str):
        """Procesar mensaje recibido por stdin"""
        try:
            data = json.loads(message)
            action = data.get('action')

            if action == 'update_game_state':
                game_data = data.get('data', {})
                phrase = game_data.get('phrase', '')
                answer = game_data.get('answer', '')
                category = game_data.get('category', '')
                is_active = game_data.get('isActive', False)

                self.update_game_state(phrase, answer, category, is_active)
                print(f"GAME STATE actualizado via stdin: {answer} ({category}) - Activo: {is_active}", flush=True)

        except json.JSONDecodeError:
            print(f"MENSAJE STDIN invalido (no JSON): {message}", flush=True)
        except Exception as e:
            print(f"ERROR procesando mensaje stdin: {e}", flush=True)

    async def notify_express_server(self, event_type: str, data: Dict[str, Any]):
        """Notificar al servidor Express sobre eventos y loguear a archivo"""
        payload = {
            'event': event_type,
            'data': data,
            'timestamp': int(time.time())
        }
        
        # Loguear a archivo local como respaldo
        try:
            with open(Path(__file__).parent / "tiktok_events.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(payload) + "\n")
        except Exception as e:
            print(f"ERROR escribiendo a tiktok_events.log: {e}", flush=True)

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.express_server_url}/tiktok-live-event",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        print(f"EVENTO enviado al servidor: {event_type}", flush=True)
                    else:
                        print(f"ERROR enviando evento: {response.status}", flush=True)
                        
        except Exception as e:
            print(f"ERROR notificando servidor: {e}", flush=True)

    def normalize_text(self, text: str) -> str:
        """Normalizar texto para comparación, removiendo tildes y diacríticos"""
        text = text.upper().strip()
        # Remover tildes y diacríticos usando NFD (descomposición)
        text = unicodedata.normalize('NFD', text)
        text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
        # Remover caracteres especiales excepto letras y espacios
        text = re.sub(r'[^\w\s]', '', text)
        # Normalizar espacios múltiples
        text = re.sub(r'\s+', ' ', text)
        return text

    def check_answer(self, user_comment: str) -> bool:
        """Verificar si el comentario del usuario es la respuesta correcta"""
        if not self.game_state.current_answer:
            print(f"CHECK_ANSWER: No hay respuesta actual configurada", flush=True)
            return False

        normalized_comment = self.normalize_text(user_comment)
        normalized_answer = self.normalize_text(self.game_state.current_answer)

        print(f"CHECK_ANSWER: Comparando '{normalized_comment}' con '{normalized_answer}'", flush=True)

        # Coincidencia exacta
        if normalized_comment == normalized_answer:
            print(f"CHECK_ANSWER: MATCH EXACTO!", flush=True)
            return True

        # La respuesta está contenida en el comentario
        if normalized_answer in normalized_comment:
            print(f"CHECK_ANSWER: MATCH CONTENIDO!", flush=True)
            return True

        # Verificar por palabras individuales si la respuesta tiene múltiples palabras
        answer_words = normalized_answer.split()
        comment_words = normalized_comment.split()

        if len(answer_words) > 1:
            # Para frases, verificar que al menos 70% de las palabras coincidan
            matches = 0
            for word in answer_words:
                if word in comment_words:
                    matches += 1

            match_percentage = matches / len(answer_words)
            print(f"CHECK_ANSWER: Coincidencias de palabras: {matches}/{len(answer_words)} ({match_percentage*100:.1f}%)", flush=True)

            if match_percentage >= 0.7:  # 70% de coincidencia
                print(f"CHECK_ANSWER: MATCH POR PALABRAS!", flush=True)
                return True

        print(f"CHECK_ANSWER: NO MATCH", flush=True)
        return False

    async def create_client(self, username: str) -> bool:
        """Crear cliente de TikTok Live"""
        try:
            username = username.replace('@', '').strip()
            
            self.client = TikTokLiveClient(unique_id=username)
            
            @self.client.on(ConnectEvent)
            async def on_connect(event: ConnectEvent):
                self.is_connected = True
                self.reconnect_attempts = 0
                print(f"CONECTADO a @{event.unique_id} (Room ID: {self.client.room_id})", flush=True)
                
                await self.notify_express_server('connect', {
                    'username': event.unique_id,
                    'room_id': self.client.room_id,
                    'connected': True
                })

            @self.client.on(CommentEvent)
            async def on_comment(event: CommentEvent):
                username = event.user.nickname or event.user.unique_id
                unique_id = event.user.unique_id
                comment = event.comment

                # Extraer información adicional del usuario - URLs de imagen de perfil
                profile_picture = None
                profile_picture_urls = None

                # Extraer URLs usando la estructura correcta encontrada en el debug: avatar_thumb.m_urls
                if hasattr(event.user, 'avatar_thumb') and event.user.avatar_thumb:
                    if hasattr(event.user.avatar_thumb, 'm_urls') and event.user.avatar_thumb.m_urls:
                        profile_picture_urls = event.user.avatar_thumb.m_urls
                        profile_picture = profile_picture_urls[0] if profile_picture_urls else None
                        print(f"🖼️ URLS ENCONTRADAS: {len(profile_picture_urls)} URLs de imagen de perfil", flush=True)

                # Fallback: intentar otras fuentes de imagen si avatar_thumb no funciona
                if not profile_picture:
                    for avatar_attr in ['avatar_medium', 'avatar_large', 'avatar_jpg']:
                        if hasattr(event.user, avatar_attr):
                            avatar_obj = getattr(event.user, avatar_attr)
                            if hasattr(avatar_obj, 'm_urls') and avatar_obj.m_urls:
                                profile_picture_urls = avatar_obj.m_urls
                                profile_picture = profile_picture_urls[0]
                                print(f"🖼️ FALLBACK {avatar_attr}: {len(profile_picture_urls)} URLs encontradas", flush=True)
                                break

                print(f"COMENTARIO {username} (@{unique_id}): {comment}", flush=True)
                print(f"PROFILE_PICTURE: {profile_picture}", flush=True)
                print(f"GAME_STATE: Activo={self.game_state.is_active}, Respuesta='{self.game_state.current_answer}'", flush=True)

                # Enviar todos los comentarios al backend para debug
                await self.notify_express_server('comment', {
                    'username': username,
                    'unique_id': unique_id,
                    'profile_picture': profile_picture,
                    'profile_picture_urls': profile_picture_urls,
                    'comment': comment
                })

                if self.game_state.is_active:
                    if self.check_answer(comment):
                        print(f"🎉 GANADOR! {username} respondio correctamente: {comment}", flush=True)

                        await self.notify_express_server('winner', {
                            'username': username,
                            'unique_id': unique_id,
                            'profile_picture': profile_picture,
                            'profile_picture_urls': profile_picture_urls,
                            'comment': comment,
                            'answer': self.game_state.current_answer,
                            'phrase': self.game_state.current_phrase,
                            'category': self.game_state.category
                        })
                else:
                    print(f"JUEGO INACTIVO - comentario ignorado", flush=True)

            @self.client.on(GiftEvent)
            async def on_gift(event: GiftEvent):
                username = event.user.nickname or event.user.unique_id
                unique_id = event.user.unique_id
                gift_name = event.gift.name
                gift_id = event.gift.id

                # Manejar correctamente los streaks según la documentación de TikTokLive
                # Solo procesar cuando el streak termine o para regalos no-streakable
                should_process = False

                # Obtener cantidad desde el evento
                if hasattr(event, 'repeat_count'):
                    quantity = event.repeat_count
                elif hasattr(event, 'quantity'):
                    quantity = event.quantity
                else:
                    quantity = 1

                # Verificar si es un regalo con streak (tipo 1)
                if hasattr(event.gift, 'info') and hasattr(event.gift.info, 'type'):
                    gift_type = event.gift.info.type

                    if gift_type == 1:
                        # Regalos streakable (tipo 1) - solo procesar cuando termine el streak
                        if hasattr(event, 'repeat_end') and event.repeat_end == 1:
                            should_process = True
                            print(f"REGALO STREAK TERMINADO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO", flush=True)
                        else:
                            # Durante el streak - NO procesar
                            print(f"REGALO STREAK EN CURSO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - ESPERANDO", flush=True)
                    else:
                        # Regalos no-streakable (tipo != 1) - procesar inmediatamente
                        should_process = True
                        print(f"REGALO NO-STREAK: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO", flush=True)
                else:
                    # Si no podemos determinar el tipo, usar lógica alternativa
                    if hasattr(event, 'gift') and hasattr(event.gift, 'streakable'):
                        # Usar la propiedad extendida si está disponible
                        if event.gift.streakable and hasattr(event, 'streaking') and event.streaking:
                            # Streak activo - NO procesar
                            print(f"REGALO STREAK ACTIVO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - ESPERANDO", flush=True)
                        else:
                            # Streak terminado o regalo no-streakable - procesar
                            should_process = True
                            print(f"REGALO LISTO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO", flush=True)
                    else:
                        # Fallback - procesar todos (comportamiento anterior)
                        should_process = True
                        print(f"REGALO FALLBACK: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO", flush=True)

                # Solo enviar al servidor si debemos procesar
                if should_process:
                    await self.notify_express_server('gift', {
                        'username': username,
                        'unique_id': unique_id,
                        'gift_name': gift_name,
                        'gift_id': gift_id,
                        'quantity': quantity
                    })

            @self.client.on(LikeEvent)
            async def on_like(event: LikeEvent):
                username = event.user.nickname or event.user.unique_id
                unique_id = event.user.unique_id
                like_count = getattr(event, 'count', 1)  # Número de likes

                print(f"❤️ LIKE de {username} (@{unique_id}): {like_count} like(s)", flush=True)

                # Enviar evento de like al servidor Express
                await self.notify_express_server('like', {
                    'username': username,
                    'unique_id': unique_id,
                    'count': like_count
                })

            @self.client.on(FollowEvent)
            async def on_follow(event: FollowEvent):
                username = event.user.nickname or event.user.unique_id
                unique_id = event.user.unique_id

                print(f"👥 FOLLOW de {username} (@{unique_id})", flush=True)

                # Enviar evento de follow al servidor Express
                await self.notify_express_server('follow', {
                    'username': username,
                    'unique_id': unique_id
                })

            @self.client.on(DisconnectEvent)
            async def on_disconnect(event: DisconnectEvent):
                self.is_connected = False
                print(f"DESCONECTADO del live", flush=True)
                
                await self.notify_express_server('disconnect', {
                    'connected': False,
                    'reason': 'disconnect_event'
                })
                
                if self.reconnect_attempts < self.max_reconnect_attempts:
                    await self.attempt_reconnect()

            @self.client.on(LiveEndEvent)
            async def on_live_end(event: LiveEndEvent):
                self.is_connected = False
                print("LIVE ha terminado", flush=True)
                
                await self.notify_express_server('live_end', {
                    'connected': False,
                    'reason': 'live_ended'
                })

            return True
            
        except Exception as e:
            print(f"ERROR creando cliente: {e}", flush=True)
            return False

    async def is_user_live(self, username: str) -> bool:
        """Verificar si un usuario está en vivo antes de conectar"""
        try:
            # Crear cliente temporal para verificar
            temp_client = TikTokLiveClient(unique_id=username)
            is_live = await temp_client.is_live()
            print(f"VERIFICACION LIVE @{username}: {is_live}", flush=True)
            return is_live
        except Exception as e:
            print(f"ERROR verificando live: {e}", flush=True)
            return False

    async def connect_to_live(self, username: str) -> Dict[str, Any]:
        """Conectar al live de TikTok"""
        try:
            self.game_state.streamer_username = username
            self.save_config()

            # Verificar primero si el usuario está en vivo
            print(f"VERIFICANDO si @{username} está en vivo...", flush=True)
            is_live = await self.is_user_live(username)

            if not is_live:
                error_msg = f"@{username} no está en vivo actualmente"
                print(error_msg, flush=True)
                return {'success': False, 'error': error_msg}

            success = await self.create_client(username)
            if not success:
                return {'success': False, 'error': 'Error creando cliente'}

            print(f"CONECTANDO a @{username}...", flush=True)
            await self.client.connect()

            return {'success': True, 'message': f'Conectado a @{username}'}

        except Exception as e:
            error_msg = str(e)
            print(f"ERROR conectando al live: {error_msg}", flush=True)

            # Mejorar mensajes de error comunes
            if "not found" in error_msg.lower():
                error_msg = f"Usuario @{username} no encontrado"
            elif "not live" in error_msg.lower() or "offline" in error_msg.lower():
                error_msg = f"@{username} no está en vivo"
            elif "connection" in error_msg.lower():
                error_msg = "Error de conexión a TikTok"

            return {'success': False, 'error': error_msg}

    async def attempt_reconnect(self):
        """Intentar reconectar automáticamente"""
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            print("MAXIMO de intentos de reconexion alcanzado", flush=True)
            return
            
        self.reconnect_attempts += 1
        wait_time = min(30, 5 * self.reconnect_attempts)
        
        print(f"INTENTO de reconexion {self.reconnect_attempts}/{self.max_reconnect_attempts} en {wait_time}s...", flush=True)
        
        await asyncio.sleep(wait_time)
        
        try:
            if self.game_state.streamer_username:
                await self.connect_to_live(self.game_state.streamer_username)
        except Exception as e:
            print(f"ERROR en reconexion: {e}", flush=True)

    async def disconnect_from_live(self):
        """Desconectar del live"""
        try:
            if self.client and self.is_connected:
                await self.client.disconnect()
                self.is_connected = False
                print("DESCONECTADO correctamente", flush=True)
                return {'success': True, 'message': 'Desconectado correctamente'}
            else:
                return {'success': True, 'message': 'Ya estaba desconectado'}
        except Exception as e:
            print(f"ERROR desconectando: {e}", flush=True)
            return {'success': False, 'error': str(e)}

    def update_game_state(self, phrase: str, answer: str, category: str, is_active: bool):
        """Actualizar estado del juego"""
        self.game_state.current_phrase = phrase
        self.game_state.current_answer = answer
        self.game_state.category = category
        self.game_state.is_active = is_active
        
        print(f"GAME STATE actualizado: {answer} ({category}) - Activo: {is_active}", flush=True)

    def get_status(self) -> Dict[str, Any]:
        """Obtener estado actual"""
        return {
            'connected': self.is_connected,
            'streamer_username': self.game_state.streamer_username,
            'game_active': self.game_state.is_active,
            'current_phrase': self.game_state.current_phrase,
            'room_id': getattr(self.client, 'room_id', None) if self.client else None,
            'reconnect_attempts': self.reconnect_attempts
        }

# Función principal
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='TikTok Live Server')
    parser.add_argument('--username', '-u', type=str, help='Usuario de TikTok para conectar')
    parser.add_argument('--auto-start', action='store_true', help='Iniciar automáticamente si hay usuario guardado')
    args = parser.parse_args()

    print(f"ARGUMENTOS RECIBIDOS: {args}", flush=True)
    print(f"USERNAME ARG: {args.username}", flush=True)
    print(f"AUTO_START ARG: {args.auto_start}", flush=True)

    server = TikTokLiveServer()

    # Determinar qué usuario usar
    username_to_use = None
    if args.username:
        username_to_use = args.username
        print(f"USANDO USERNAME DE ARGUMENTO: {username_to_use}", flush=True)
    elif args.auto_start and server.game_state.streamer_username:
        username_to_use = server.game_state.streamer_username
        print(f"USANDO USERNAME GUARDADO: {username_to_use}", flush=True)
    else:
        print("NO HAY USERNAME - modo espera", flush=True)

    print("INICIANDO servidor TikTok Live...", flush=True)
    
    if username_to_use:
        print(f"CONECTANDO a @{username_to_use}...")
        result = await server.connect_to_live(username_to_use)
        print(f"RESULTADO: {result}")
        
        if result['success']:
            print("SERVIDOR corriendo y conectado.")
        else:
            error_msg = result.get('error', 'Error desconocido')
            print(f"ERROR conectando: {error_msg}")

            # Terminar con código 1 si es error de usuario (no en vivo, etc)
            if "no está en vivo" in error_msg or "no encontrado" in error_msg:
                print("Terminando - error de usuario")
                sys.exit(1)  # Código 1 = error de usuario, no reintentar
            else:
                print("Terminando - error técnico")
                sys.exit(2)  # Código 2 = error técnico, puede reintentar
    else:
        print("SERVIDOR corriendo, esperando comando de conexion...")

    try:
        # Mantener el servidor corriendo
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\nDETENIENDO servidor...")
        server.stdin_listener_running = False  # Detener stdin listener
        await server.disconnect_from_live()
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())