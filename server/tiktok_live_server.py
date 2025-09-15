#!/usr/bin/env python3
"""
TikTok Live Server
Conecta al live de TikTok y detecta respuestas para el juego de palabras
"""

import asyncio
import json
import time
import logging
import aiohttp
import re
from typing import Optional, Dict, Any
from dataclasses import dataclass
from pathlib import Path

# Importar TikTokLive
try:
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent, LiveEndEvent
except ImportError:
    print("❌ Error: TikTokLive no está instalado. Instálalo con: pip install TikTokLive")
    exit(1)

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
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('TikTokLive')
        
        # Load saved config
        self.load_config()

    def load_config(self):
        """Cargar configuración guardada"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.game_state.streamer_username = config.get('streamer_username')
                    self.logger.info(f"✅ Configuración cargada: {self.game_state.streamer_username}")
        except Exception as e:
            self.logger.error(f"❌ Error cargando configuración: {e}")

    def save_config(self):
        """Guardar configuración"""
        try:
            config = {
                'streamer_username': self.game_state.streamer_username
            }
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self.logger.info("💾 Configuración guardada")
        except Exception as e:
            self.logger.error(f"❌ Error guardando configuración: {e}")

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
                        self.logger.info(f"✅ Evento enviado al servidor: {event_type}")
                    else:
                        self.logger.warning(f"⚠️ Error enviando evento: {response.status}")
                        
        except Exception as e:
            self.logger.error(f"❌ Error notificando servidor: {e}")

    def normalize_text(self, text: str) -> str:
        """Normalizar texto para comparación"""
        # Remover acentos y caracteres especiales
        text = text.upper().strip()
        # Remover espacios extras y caracteres especiales
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    def check_answer(self, user_comment: str) -> bool:
        """Verificar si el comentario del usuario es la respuesta correcta"""
        if not self.game_state.current_answer:
            return False
            
        normalized_comment = self.normalize_text(user_comment)
        normalized_answer = self.normalize_text(self.game_state.current_answer)
        
        # Verificar coincidencia exacta o parcial (más del 80%)
        if normalized_comment == normalized_answer:
            return True
            
        # Verificar si contiene la respuesta completa
        if normalized_answer in normalized_comment:
            return True
            
        return False

    async def create_client(self, username: str) -> bool:
        """Crear cliente de TikTok Live"""
        try:
            # Limpiar username
            username = username.replace('@', '').strip()
            
            self.client = TikTokLiveClient(unique_id=username)
            
            # Setup event handlers
            @self.client.on(ConnectEvent)
            async def on_connect(event: ConnectEvent):
                self.is_connected = True
                self.reconnect_attempts = 0
                self.logger.info(f"🎉 Conectado a @{event.unique_id} (Room ID: {self.client.room_id})")
                
                await self.notify_express_server('connect', {
                    'username': event.unique_id,
                    'room_id': self.client.room_id,
                    'connected': True
                })

            @self.client.on(CommentEvent)
            async def on_comment(event: CommentEvent):
                # Obtener información completa del usuario
                user = event.user
                display_name = user.nickname or user.unique_id or "Usuario Anónimo"
                unique_id = user.unique_id or "unknown"
                comment = event.comment

                # Extraer foto de perfil del objeto ImageModel
                profile_picture = None

                # Lista de atributos de imagen para buscar en orden de prioridad
                avatar_attrs = ['avatar_thumb', 'avatar_medium', 'avatar_large', 'avatar']

                for attr in avatar_attrs:
                    avatar_obj = getattr(user, attr, None)
                    if avatar_obj:
                        self.logger.info(f"🔍 Inspeccionando {attr}: {type(avatar_obj)}")

                        # Verificar si tiene el atributo m_urls
                        if hasattr(avatar_obj, 'm_urls'):
                            urls = getattr(avatar_obj, 'm_urls', [])
                            self.logger.info(f"🖼️ URLs encontradas en {attr}: {urls}")
                            if urls and len(urls) > 0:
                                profile_picture = urls[0]
                                self.logger.info(f"✅ Foto seleccionada de {attr}: {profile_picture}")
                                break

                        # También verificar si es directamente una URL string
                        elif isinstance(avatar_obj, str) and avatar_obj.startswith('http'):
                            profile_picture = avatar_obj
                            self.logger.info(f"✅ URL directa encontrada en {attr}: {profile_picture}")
                            break

                        # Si es un diccionario, buscar URLs dentro
                        elif isinstance(avatar_obj, dict):
                            if 'url' in avatar_obj:
                                profile_picture = avatar_obj['url']
                                self.logger.info(f"✅ URL en diccionario {attr}: {profile_picture}")
                                break
                            elif 'urls' in avatar_obj:
                                urls = avatar_obj['urls']
                                if urls and len(urls) > 0:
                                    profile_picture = urls[0]
                                    self.logger.info(f"✅ Primera URL del diccionario {attr}: {profile_picture}")
                                    break

                self.logger.info(f"💬 {display_name} (@{unique_id}): {comment}")

                # Debug: Log de datos de usuario disponibles
                self.logger.info(f"🔍 Datos de usuario para {display_name}:")
                for attr in ['unique_id', 'nickname', 'display_name', 'avatar_url', 'profile_picture', 'avatar']:
                    value = getattr(user, attr, None)
                    if value:
                        self.logger.info(f"   - {attr}: {value}")

                # Log final del resultado de la foto de perfil
                if profile_picture:
                    self.logger.info(f"🖼️ FOTO DE PERFIL FINAL: {profile_picture}")
                else:
                    self.logger.warning("⚠️ NO se pudo extraer foto de perfil")

                # Verificar si es la respuesta correcta
                if self.game_state.is_active and self.check_answer(comment):
                    self.logger.info(f"🎉 ¡GANADOR DETECTADO!")
                    self.logger.info(f"👤 Ganador: {display_name} (@{unique_id})")
                    self.logger.info(f"💬 Comentario: {comment}")
                    self.logger.info(f"✅ Respuesta correcta: {self.game_state.current_answer}")
                    self.logger.info(f"🖼️ Foto de perfil enviada: {profile_picture}")

                    # Notificar al servidor Express con información completa
                    winner_data = {
                        'username': display_name,  # Nombre real para mostrar
                        'unique_id': unique_id,    # ID único para referencia
                        'profile_picture': profile_picture,  # Foto de perfil
                        'comment': comment,
                        'answer': self.game_state.current_answer,
                        'phrase': self.game_state.current_phrase,
                        'category': self.game_state.category
                    }

                    self.logger.info(f"📤 Enviando datos del ganador: {winner_data}")
                    await self.notify_express_server('winner', winner_data)

            @self.client.on(DisconnectEvent)
            async def on_disconnect(event: DisconnectEvent):
                self.is_connected = False
                self.logger.warning(f"⚠️ Desconectado del live")
                
                await self.notify_express_server('disconnect', {
                    'connected': False,
                    'reason': 'disconnect_event'
                })
                
                # Intentar reconectar
                if self.reconnect_attempts < self.max_reconnect_attempts:
                    await self.attempt_reconnect()

            @self.client.on(LiveEndEvent)
            async def on_live_end(event: LiveEndEvent):
                self.is_connected = False
                self.logger.info("📺 El live ha terminado")
                
                await self.notify_express_server('live_end', {
                    'connected': False,
                    'reason': 'live_ended'
                })

            return True
            
        except Exception as e:
            self.logger.error(f"❌ Error creando cliente: {e}")
            return False

    async def connect_to_live(self, username: str) -> Dict[str, Any]:
        """Conectar al live de TikTok"""
        try:
            self.game_state.streamer_username = username
            self.save_config()
            
            success = await self.create_client(username)
            if not success:
                return {'success': False, 'error': 'Error creando cliente'}

            # Conectar al live
            self.logger.info(f"🔄 Conectando a @{username}...")
            await self.client.connect()
            
            return {'success': True, 'message': f'Conectado a @{username}'}
            
        except Exception as e:
            self.logger.error(f"❌ Error conectando al live: {e}")
            return {'success': False, 'error': str(e)}

    async def attempt_reconnect(self):
        """Intentar reconectar automáticamente"""
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            self.logger.error("❌ Máximo de intentos de reconexión alcanzado")
            return
            
        self.reconnect_attempts += 1
        wait_time = min(30, 5 * self.reconnect_attempts)  # Wait 5, 10, 15, 20, 30 seconds
        
        self.logger.info(f"🔄 Intento de reconexión {self.reconnect_attempts}/{self.max_reconnect_attempts} en {wait_time}s...")
        
        await asyncio.sleep(wait_time)
        
        try:
            if self.game_state.streamer_username:
                await self.connect_to_live(self.game_state.streamer_username)
        except Exception as e:
            self.logger.error(f"❌ Error en reconexión: {e}")

    async def disconnect_from_live(self):
        """Desconectar del live"""
        try:
            if self.client and self.is_connected:
                await self.client.disconnect()
                self.is_connected = False
                self.logger.info("✅ Desconectado correctamente")
                return {'success': True, 'message': 'Desconectado correctamente'}
            else:
                return {'success': True, 'message': 'Ya estaba desconectado'}
        except Exception as e:
            self.logger.error(f"❌ Error desconectando: {e}")
            return {'success': False, 'error': str(e)}

    def update_game_state(self, phrase: str, answer: str, category: str, is_active: bool):
        """Actualizar estado del juego"""
        self.game_state.current_phrase = phrase
        self.game_state.current_answer = answer
        self.game_state.category = category
        self.game_state.is_active = is_active
        
        self.logger.info(f"🎮 Game state updated: {answer} ({category}) - Active: {is_active}")

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
            print(f"ERROR conectando: {result.get('error', 'Error desconocido')}")
    else:
        print("SERVIDOR corriendo, esperando comando de conexion...")
    
    try:
        # Mantener el servidor corriendo
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\nDETENIENDO servidor...")
        await server.disconnect_from_live()

if __name__ == "__main__":
    asyncio.run(main())