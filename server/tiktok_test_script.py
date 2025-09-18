#!/usr/bin/env python3
"""
TikTok Live Test Script - Prueba de Datos de API
Conecta al live de wahanfx, detecta 1 evento y extrae todos los datos disponibles
"""

import asyncio
import json
import time
import sys
from typing import Optional, Dict, Any
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except TypeError:
        import os
        os.system("chcp 65001 >nul 2>&1")

# Importar TikTokLive
try:
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent, LiveEndEvent, GiftEvent, LikeEvent, FollowEvent
except ImportError:
    print("ERROR: TikTokLive no esta instalado. Instalalo con: pip install TikTokLive", flush=True)
    sys.exit(1)

class TikTokDataExtractor:
    def __init__(self, username: str = "wahanfx"):
        self.username = username.replace('@', '').strip()
        self.client: Optional[TikTokLiveClient] = None
        self.is_connected = False
        self.event_detected = False
        self.output_file = Path(__file__).parent / "tiktok_data_extraction.json"

    def save_data(self, event_type: str, data: Dict[str, Any]):
        """Guardar datos extraídos en archivo JSON"""
        timestamp = time.time()
        extracted_data = {
            'timestamp': timestamp,
            'timestamp_readable': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp)),
            'event_type': event_type,
            'streamer': self.username,
            'data': data
        }

        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(extracted_data, f, indent=2, ensure_ascii=False)

            print(f"\n{'='*60}")
            print(f"DATOS EXTRAÍDOS Y GUARDADOS EN: {self.output_file}")
            print(f"{'='*60}")
            print(json.dumps(extracted_data, indent=2, ensure_ascii=False))
            print(f"{'='*60}")

        except Exception as e:
            print(f"ERROR guardando datos: {e}", flush=True)

    def extract_user_data(self, user_obj) -> Dict[str, Any]:
        """Extraer todos los datos disponibles del objeto usuario"""
        user_data = {}

        # Datos básicos siempre disponibles
        user_data['nickname'] = getattr(user_obj, 'nickname', None)
        user_data['unique_id'] = getattr(user_obj, 'unique_id', None)
        user_data['user_id'] = getattr(user_obj, 'user_id', None)

        # Imagen de perfil - explorar todas las formas posibles
        profile_picture_data = {}

        # Método 1: Atributo directo profile_picture
        if hasattr(user_obj, 'profile_picture'):
            pp_obj = user_obj.profile_picture
            profile_picture_data['raw_profile_picture'] = str(pp_obj)

            # Si es un objeto, explorar sus atributos
            if pp_obj and hasattr(pp_obj, '__dict__'):
                for attr_name in dir(pp_obj):
                    if not attr_name.startswith('_'):
                        try:
                            attr_value = getattr(pp_obj, attr_name)
                            if not callable(attr_value):
                                profile_picture_data[f'pp_{attr_name}'] = str(attr_value)
                        except:
                            pass

            # URLs específicas
            if hasattr(pp_obj, 'urls') and pp_obj.urls:
                profile_picture_data['urls'] = pp_obj.urls
                profile_picture_data['primary_url'] = pp_obj.urls[0] if pp_obj.urls else None

        # Método 2: Avatar info
        if hasattr(user_obj, 'avatar'):
            avatar_obj = user_obj.avatar
            profile_picture_data['raw_avatar'] = str(avatar_obj)

            if avatar_obj and hasattr(avatar_obj, '__dict__'):
                for attr_name in dir(avatar_obj):
                    if not attr_name.startswith('_'):
                        try:
                            attr_value = getattr(avatar_obj, attr_name)
                            if not callable(attr_value):
                                profile_picture_data[f'avatar_{attr_name}'] = str(attr_value)
                        except:
                            pass

        user_data['profile_picture_info'] = profile_picture_data

        # Explorar atributos seguros del usuario
        safe_user_attributes = ['nickname', 'unique_id', 'user_id', 'display_id', 'sec_uid']
        all_attributes = {}
        for attr_name in safe_user_attributes:
            try:
                if hasattr(user_obj, attr_name):
                    attr_value = getattr(user_obj, attr_name)
                    if attr_value is not None:
                        all_attributes[attr_name] = str(attr_value)
            except Exception as e:
                all_attributes[f'{attr_name}_error'] = str(e)

        user_data['all_user_attributes'] = all_attributes

        return user_data

    async def create_client(self) -> bool:
        """Crear cliente de TikTok Live"""
        try:
            self.client = TikTokLiveClient(unique_id=self.username)

            @self.client.on(ConnectEvent)
            async def on_connect(event: ConnectEvent):
                self.is_connected = True
                print(f"✅ CONECTADO a @{event.unique_id} (Room ID: {self.client.room_id})", flush=True)
                print(f"📡 Esperando eventos... (detectará el primer evento y extraerá todos los datos)", flush=True)

            @self.client.on(CommentEvent)
            async def on_comment(event: CommentEvent):
                if self.event_detected:
                    return

                self.event_detected = True
                print(f"💬 EVENTO COMENTARIO DETECTADO!", flush=True)

                # Extraer datos del usuario
                user_data = self.extract_user_data(event.user)

                # Datos del evento completo
                event_data = {
                    'comment_text': event.comment,
                    'user_data': user_data,
                    'room_id': self.client.room_id,
                    'event_timestamp': getattr(event, 'timestamp', None),
                    'raw_event_data': {}
                }

                # Extraer todos los atributos del evento de forma segura
                safe_attributes = ['comment', 'timestamp', 'user']
                for attr_name in safe_attributes:
                    try:
                        if hasattr(event, attr_name):
                            attr_value = getattr(event, attr_name)
                            if attr_value is not None and not callable(attr_value):
                                event_data['raw_event_data'][attr_name] = str(attr_value)
                    except Exception as e:
                        event_data['raw_event_data'][f'{attr_name}_error'] = str(e)

                self.save_data('comment', event_data)
                await self.disconnect()

            @self.client.on(GiftEvent)
            async def on_gift(event: GiftEvent):
                if self.event_detected:
                    return

                self.event_detected = True
                print(f"🎁 EVENTO REGALO DETECTADO!", flush=True)

                # Extraer datos del usuario
                user_data = self.extract_user_data(event.user)

                # Datos del regalo
                gift_data = {}
                if hasattr(event, 'gift'):
                    gift_obj = event.gift
                    for attr_name in dir(gift_obj):
                        if not attr_name.startswith('_') and not callable(getattr(gift_obj, attr_name, None)):
                            try:
                                attr_value = getattr(gift_obj, attr_name)
                                if attr_value is not None:
                                    gift_data[attr_name] = str(attr_value)
                            except:
                                pass

                # Datos del evento completo
                event_data = {
                    'gift_data': gift_data,
                    'user_data': user_data,
                    'room_id': self.client.room_id,
                    'repeat_count': getattr(event, 'repeat_count', None),
                    'repeat_end': getattr(event, 'repeat_end', None),
                    'raw_event_data': {}
                }

                # Extraer todos los atributos del evento de forma segura
                safe_attributes = ['comment', 'timestamp', 'user']
                for attr_name in safe_attributes:
                    try:
                        if hasattr(event, attr_name):
                            attr_value = getattr(event, attr_name)
                            if attr_value is not None and not callable(attr_value):
                                event_data['raw_event_data'][attr_name] = str(attr_value)
                    except Exception as e:
                        event_data['raw_event_data'][f'{attr_name}_error'] = str(e)

                self.save_data('gift', event_data)
                await self.disconnect()

            @self.client.on(LikeEvent)
            async def on_like(event: LikeEvent):
                if self.event_detected:
                    return

                self.event_detected = True
                print(f"❤️ EVENTO LIKE DETECTADO!", flush=True)

                # Extraer datos del usuario
                user_data = self.extract_user_data(event.user)

                # Datos del evento completo
                event_data = {
                    'like_count': getattr(event, 'count', 1),
                    'user_data': user_data,
                    'room_id': self.client.room_id,
                    'raw_event_data': {}
                }

                # Extraer todos los atributos del evento de forma segura
                safe_attributes = ['comment', 'timestamp', 'user']
                for attr_name in safe_attributes:
                    try:
                        if hasattr(event, attr_name):
                            attr_value = getattr(event, attr_name)
                            if attr_value is not None and not callable(attr_value):
                                event_data['raw_event_data'][attr_name] = str(attr_value)
                    except Exception as e:
                        event_data['raw_event_data'][f'{attr_name}_error'] = str(e)

                self.save_data('like', event_data)
                await self.disconnect()

            @self.client.on(FollowEvent)
            async def on_follow(event: FollowEvent):
                if self.event_detected:
                    return

                self.event_detected = True
                print(f"👥 EVENTO FOLLOW DETECTADO!", flush=True)

                # Extraer datos del usuario
                user_data = self.extract_user_data(event.user)

                # Datos del evento completo
                event_data = {
                    'user_data': user_data,
                    'room_id': self.client.room_id,
                    'raw_event_data': {}
                }

                # Extraer todos los atributos del evento de forma segura
                safe_attributes = ['comment', 'timestamp', 'user']
                for attr_name in safe_attributes:
                    try:
                        if hasattr(event, attr_name):
                            attr_value = getattr(event, attr_name)
                            if attr_value is not None and not callable(attr_value):
                                event_data['raw_event_data'][attr_name] = str(attr_value)
                    except Exception as e:
                        event_data['raw_event_data'][f'{attr_name}_error'] = str(e)

                self.save_data('follow', event_data)
                await self.disconnect()

            @self.client.on(DisconnectEvent)
            async def on_disconnect(event: DisconnectEvent):
                self.is_connected = False
                print(f"🔌 DESCONECTADO del live", flush=True)

            @self.client.on(LiveEndEvent)
            async def on_live_end(event: LiveEndEvent):
                self.is_connected = False
                print("📺 LIVE ha terminado", flush=True)

            return True

        except Exception as e:
            print(f"❌ ERROR creando cliente: {e}", flush=True)
            return False

    async def is_user_live(self) -> bool:
        """Verificar si el usuario está en vivo"""
        try:
            temp_client = TikTokLiveClient(unique_id=self.username)
            is_live = await temp_client.is_live()
            print(f"📡 VERIFICACION LIVE @{self.username}: {is_live}", flush=True)
            return is_live
        except Exception as e:
            print(f"❌ ERROR verificando live: {e}", flush=True)
            return False

    async def connect(self) -> bool:
        """Conectar al live"""
        try:
            print(f"🔍 Verificando si @{self.username} está en vivo...", flush=True)
            is_live = await self.is_user_live()

            if not is_live:
                print(f"❌ @{self.username} no está en vivo actualmente", flush=True)
                return False

            success = await self.create_client()
            if not success:
                return False

            print(f"🚀 Conectando a @{self.username}...", flush=True)
            await self.client.connect()
            return True

        except Exception as e:
            print(f"❌ ERROR conectando al live: {e}", flush=True)
            return False

    async def disconnect(self):
        """Desconectar del live"""
        try:
            if self.client and self.is_connected:
                await self.client.disconnect()
                self.is_connected = False
                print("✅ Desconectado correctamente", flush=True)
        except Exception as e:
            print(f"❌ ERROR desconectando: {e}", flush=True)

    async def run_test(self):
        """Ejecutar prueba completa"""
        print("🧪 INICIANDO PRUEBA DE EXTRACCIÓN DE DATOS TIKTOK LIVE")
        print(f"👤 Usuario objetivo: @{self.username}")
        print(f"📁 Archivo de salida: {self.output_file}")
        print("-" * 60)

        success = await self.connect()
        if not success:
            print("❌ No se pudo conectar al live. Terminando prueba.")
            return False

        # Esperar hasta que se detecte un evento o timeout
        timeout = 300  # 5 minutos
        start_time = time.time()

        print(f"⏱️ Esperando eventos por máximo {timeout} segundos...")

        while not self.event_detected and (time.time() - start_time) < timeout:
            await asyncio.sleep(1)

            # Mostrar progreso cada 30 segundos
            elapsed = int(time.time() - start_time)
            if elapsed % 30 == 0 and elapsed > 0:
                print(f"⏳ Esperando... {elapsed}/{timeout} segundos", flush=True)

        if not self.event_detected:
            print(f"⏰ TIMEOUT: No se detectó ningún evento en {timeout} segundos")
            await self.disconnect()
            return False

        print("✅ PRUEBA COMPLETADA: Evento detectado y datos extraídos")
        return True

async def main():
    """Función principal"""
    import argparse

    parser = argparse.ArgumentParser(description='TikTok Live Data Extraction Test')
    parser.add_argument('--username', '-u', type=str, default='wahanfx',
                       help='Usuario de TikTok para conectar (default: wahanfx)')
    args = parser.parse_args()

    extractor = TikTokDataExtractor(args.username)

    try:
        await extractor.run_test()
    except KeyboardInterrupt:
        print("\n🛑 Prueba interrumpida por el usuario")
        await extractor.disconnect()
    except Exception as e:
        print(f"❌ ERROR en la prueba: {e}")
        await extractor.disconnect()

if __name__ == "__main__":
    asyncio.run(main())