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
from typing import Optional, Dict, Any
from dataclasses import dataclass
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == "win32":
    import os
    os.system("chcp 65001 >nul 2>&1")  # Cambiar a UTF-8

# Importar TikTokLive
try:
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent, LiveEndEvent, GiftEvent, LikeEvent, FollowEvent
except ImportError:
    print("ERROR: TikTokLive no esta instalado. Instalalo con: pip install TikTokLive")
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
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('TikTokLive')

        # Load saved config
        self.load_config()

        # Iniciar listener de stdin en hilo separado
        self.start_stdin_listener()

    def load_config(self):
        """Cargar configuración guardada"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.game_state.streamer_username = config.get('streamer_username')
                    self.logger.info(f"CONFIGURACION cargada: {self.game_state.streamer_username}")
        except Exception as e:
            self.logger.error(f"ERROR cargando configuracion: {e}")

    def save_config(self):
        """Guardar configuración"""
        try:
            config = {
                'streamer_username': self.game_state.streamer_username
            }
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self.logger.info("CONFIGURACION guardada")
        except Exception as e:
            self.logger.error(f"ERROR guardando configuracion: {e}")

    def start_stdin_listener(self):
        """Iniciar listener de stdin en hilo separado"""
        def stdin_listener():
            self.stdin_listener_running = True
            self.logger.info("STDIN listener iniciado - esperando mensajes...")

            while self.stdin_listener_running:
                try:
                    # Leer línea de stdin (esto bloquea hasta que llegue una línea)
                    line = sys.stdin.readline()

                    # Si readline retorna cadena vacía, stdin se cerró
                    if not line:
                        self.logger.info("STDIN cerrado, terminando listener")
                        break

                    line = line.strip()
                    if line:
                        self.logger.info(f"STDIN RECIBIDO: {line}")
                        self.process_stdin_message(line)

                except EOFError:
                    self.logger.info("EOF en stdin, terminando listener")
                    break
                except Exception as e:
                    self.logger.error(f"ERROR en stdin listener: {e}")
                    # Pequeña pausa para evitar bucle infinito en caso de error
                    time.sleep(0.5)

            self.logger.info("STDIN listener terminado")

        # Iniciar hilo daemon
        thread = threading.Thread(target=stdin_listener, daemon=True)
        thread.start()
        self.logger.info("STDIN listener thread iniciado")

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
                self.logger.info(f"GAME STATE actualizado via stdin: {answer} ({category}) - Activo: {is_active}")

        except json.JSONDecodeError:
            self.logger.warning(f"MENSAJE STDIN invalido (no JSON): {message}")
        except Exception as e:
            self.logger.error(f"ERROR procesando mensaje stdin: {e}")

    async def notify_express_server(self, event_type: str, data: Dict[str, Any]):
        """Notificar al servidor Express sobre eventos"""
        try:
            payload = {
                'event': event_type,
                'data': data,
                'timestamp': int(time.time())
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.express_server_url}/tiktok-live-event",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        self.logger.info(f"EVENTO enviado al servidor: {event_type}")
                    else:
                        self.logger.warning(f"ERROR enviando evento: {response.status}")
                        
        except Exception as e:
            self.logger.error(f"ERROR notificando servidor: {e}")

    def normalize_text(self, text: str) -> str:
        """Normalizar texto para comparación"""
        text = text.upper().strip()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    def check_answer(self, user_comment: str) -> bool:
        """Verificar si el comentario del usuario es la respuesta correcta"""
        if not self.game_state.current_answer:
            self.logger.warning(f"CHECK_ANSWER: No hay respuesta actual configurada")
            return False

        normalized_comment = self.normalize_text(user_comment)
        normalized_answer = self.normalize_text(self.game_state.current_answer)

        self.logger.info(f"CHECK_ANSWER: Comparando '{normalized_comment}' con '{normalized_answer}'")

        # Coincidencia exacta
        if normalized_comment == normalized_answer:
            self.logger.info(f"CHECK_ANSWER: MATCH EXACTO!")
            return True

        # La respuesta está contenida en el comentario
        if normalized_answer in normalized_comment:
            self.logger.info(f"CHECK_ANSWER: MATCH CONTENIDO!")
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
            self.logger.info(f"CHECK_ANSWER: Coincidencias de palabras: {matches}/{len(answer_words)} ({match_percentage*100:.1f}%)")

            if match_percentage >= 0.7:  # 70% de coincidencia
                self.logger.info(f"CHECK_ANSWER: MATCH POR PALABRAS!")
                return True

        self.logger.info(f"CHECK_ANSWER: NO MATCH")
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
                self.logger.info(f"CONECTADO a @{event.unique_id} (Room ID: {self.client.room_id})")
                
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

                # Extraer información adicional del usuario
                profile_picture = getattr(event.user, 'profile_picture', None)
                if hasattr(event.user, 'profile_picture') and event.user.profile_picture:
                    if hasattr(event.user.profile_picture, 'urls') and event.user.profile_picture.urls:
                        profile_picture = event.user.profile_picture.urls[0] if event.user.profile_picture.urls else None

                self.logger.info(f"COMENTARIO {username} (@{unique_id}): {comment}")
                self.logger.info(f"PROFILE_PICTURE: {profile_picture}")
                self.logger.info(f"GAME_STATE: Activo={self.game_state.is_active}, Respuesta='{self.game_state.current_answer}'")

                if self.game_state.is_active:
                    if self.check_answer(comment):
                        self.logger.info(f"🎉 GANADOR! {username} respondio correctamente: {comment}")

                        await self.notify_express_server('winner', {
                            'username': username,
                            'unique_id': unique_id,
                            'profile_picture': profile_picture,
                            'comment': comment,
                            'answer': self.game_state.current_answer,
                            'phrase': self.game_state.current_phrase,
                            'category': self.game_state.category
                        })
                else:
                    self.logger.info(f"JUEGO INACTIVO - comentario ignorado")

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
                            self.logger.info(f"REGALO STREAK TERMINADO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO")
                        else:
                            # Durante el streak - NO procesar
                            self.logger.info(f"REGALO STREAK EN CURSO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - ESPERANDO")
                    else:
                        # Regalos no-streakable (tipo != 1) - procesar inmediatamente
                        should_process = True
                        self.logger.info(f"REGALO NO-STREAK: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO")
                else:
                    # Si no podemos determinar el tipo, usar lógica alternativa
                    if hasattr(event, 'gift') and hasattr(event.gift, 'streakable'):
                        # Usar la propiedad extendida si está disponible
                        if event.gift.streakable and hasattr(event, 'streaking') and event.streaking:
                            # Streak activo - NO procesar
                            self.logger.info(f"REGALO STREAK ACTIVO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - ESPERANDO")
                        else:
                            # Streak terminado o regalo no-streakable - procesar
                            should_process = True
                            self.logger.info(f"REGALO LISTO: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO")
                    else:
                        # Fallback - procesar todos (comportamiento anterior)
                        should_process = True
                        self.logger.info(f"REGALO FALLBACK: {username} envio {quantity}x {gift_name} (ID: {gift_id}) - PROCESANDO")

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

                self.logger.info(f"❤️ LIKE de {username} (@{unique_id}): {like_count} like(s)")

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

                self.logger.info(f"👥 FOLLOW de {username} (@{unique_id})")

                # Enviar evento de follow al servidor Express
                await self.notify_express_server('follow', {
                    'username': username,
                    'unique_id': unique_id
                })

            @self.client.on(DisconnectEvent)
            async def on_disconnect(event: DisconnectEvent):
                self.is_connected = False
                self.logger.warning(f"DESCONECTADO del live")
                
                await self.notify_express_server('disconnect', {
                    'connected': False,
                    'reason': 'disconnect_event'
                })
                
                if self.reconnect_attempts < self.max_reconnect_attempts:
                    await self.attempt_reconnect()

            @self.client.on(LiveEndEvent)
            async def on_live_end(event: LiveEndEvent):
                self.is_connected = False
                self.logger.info("LIVE ha terminado")
                
                await self.notify_express_server('live_end', {
                    'connected': False,
                    'reason': 'live_ended'
                })

            return True
            
        except Exception as e:
            self.logger.error(f"ERROR creando cliente: {e}")
            return False

    async def is_user_live(self, username: str) -> bool:
        """Verificar si un usuario está en vivo antes de conectar"""
        try:
            # Crear cliente temporal para verificar
            temp_client = TikTokLiveClient(unique_id=username)
            is_live = await temp_client.is_live()
            self.logger.info(f"VERIFICACION LIVE @{username}: {is_live}")
            return is_live
        except Exception as e:
            self.logger.error(f"ERROR verificando live: {e}")
            return False

    async def connect_to_live(self, username: str) -> Dict[str, Any]:
        """Conectar al live de TikTok"""
        try:
            self.game_state.streamer_username = username
            self.save_config()

            # Verificar primero si el usuario está en vivo
            self.logger.info(f"VERIFICANDO si @{username} está en vivo...")
            is_live = await self.is_user_live(username)

            if not is_live:
                error_msg = f"@{username} no está en vivo actualmente"
                self.logger.warning(error_msg)
                return {'success': False, 'error': error_msg}

            success = await self.create_client(username)
            if not success:
                return {'success': False, 'error': 'Error creando cliente'}

            self.logger.info(f"CONECTANDO a @{username}...")
            await self.client.connect()

            return {'success': True, 'message': f'Conectado a @{username}'}

        except Exception as e:
            error_msg = str(e)
            self.logger.error(f"ERROR conectando al live: {error_msg}")

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
            self.logger.error("MAXIMO de intentos de reconexion alcanzado")
            return
            
        self.reconnect_attempts += 1
        wait_time = min(30, 5 * self.reconnect_attempts)
        
        self.logger.info(f"INTENTO de reconexion {self.reconnect_attempts}/{self.max_reconnect_attempts} en {wait_time}s...")
        
        await asyncio.sleep(wait_time)
        
        try:
            if self.game_state.streamer_username:
                await self.connect_to_live(self.game_state.streamer_username)
        except Exception as e:
            self.logger.error(f"ERROR en reconexion: {e}")

    async def disconnect_from_live(self):
        """Desconectar del live"""
        try:
            if self.client and self.is_connected:
                await self.client.disconnect()
                self.is_connected = False
                self.logger.info("DESCONECTADO correctamente")
                return {'success': True, 'message': 'Desconectado correctamente'}
            else:
                return {'success': True, 'message': 'Ya estaba desconectado'}
        except Exception as e:
            self.logger.error(f"ERROR desconectando: {e}")
            return {'success': False, 'error': str(e)}

    def update_game_state(self, phrase: str, answer: str, category: str, is_active: bool):
        """Actualizar estado del juego"""
        self.game_state.current_phrase = phrase
        self.game_state.current_answer = answer
        self.game_state.category = category
        self.game_state.is_active = is_active
        
        self.logger.info(f"GAME STATE actualizado: {answer} ({category}) - Activo: {is_active}")

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
    
    server = TikTokLiveServer()
    
    # Determinar qué usuario usar
    username_to_use = None
    if args.username:
        username_to_use = args.username
    elif args.auto_start and server.game_state.streamer_username:
        username_to_use = server.game_state.streamer_username
    
    print("INICIANDO servidor TikTok Live...")
    
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