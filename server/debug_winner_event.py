#!/usr/bin/env python3
"""
Script para capturar un evento de comentario específico que contenga una respuesta ganadora
y analizar exactamente qué datos de profile picture envía la API de TikTok Live
"""

import asyncio
import json
import time
import sys
import re
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except TypeError:
        import os
        os.system("chcp 65001 >nul 2>&1")

try:
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent
except ImportError:
    print("ERROR: TikTokLive no está instalado. Instálalo con: pip install TikTokLive", flush=True)
    sys.exit(1)

class WinnerEventDebugger:
    def __init__(self, username: str = "wahanfx"):
        self.username = username.replace('@', '').strip()
        self.client = None
        self.events_captured = []
        self.output_file = Path(__file__).parent / "winner_event_debug.json"

    def extract_all_profile_data(self, user_obj):
        """Extraer TODOS los datos posibles de profile picture del objeto user"""
        profile_data = {}

        try:
            print(f"\n🔍 ANÁLISIS COMPLETO DEL OBJETO USER:")
            print(f"🆔 Tipo: {type(user_obj)}")

            # Obtener todos los atributos del objeto
            all_attributes = dir(user_obj)

            for attr in all_attributes:
                if not attr.startswith('_'):  # Ignorar atributos privados
                    try:
                        value = getattr(user_obj, attr)
                        if not callable(value):  # Ignorar métodos
                            profile_data[f'attr_{attr}'] = str(value)

                            # Mostrar atributos relacionados con imágenes
                            if any(keyword in attr.lower() for keyword in ['avatar', 'picture', 'image', 'photo', 'pic']):
                                print(f"  🖼️  {attr}: {value}")
                                print(f"       Tipo: {type(value)}")

                                # Si es un objeto complejo, examinar sus atributos
                                if hasattr(value, '__dict__') or hasattr(value, '__slots__'):
                                    print(f"       Sub-atributos:")
                                    try:
                                        sub_attrs = dir(value)
                                        for sub_attr in sub_attrs:
                                            if not sub_attr.startswith('_'):
                                                try:
                                                    sub_value = getattr(value, sub_attr)
                                                    if not callable(sub_value):
                                                        print(f"         {sub_attr}: {sub_value}")
                                                        profile_data[f'attr_{attr}_{sub_attr}'] = str(sub_value)
                                                except:
                                                    pass
                                    except:
                                        pass

                            # Mostrar otros atributos importantes
                            elif any(keyword in attr.lower() for keyword in ['url', 'id', 'name']):
                                print(f"  📝 {attr}: {value}")

                    except Exception as e:
                        print(f"  ❌ Error accediendo a {attr}: {e}")

            # Método específico: extraer URLs de avatar usando el método del extractor existente
            avatar_urls = self.extract_avatar_urls_like_extractor(user_obj)
            profile_data['extracted_avatar_urls'] = avatar_urls

            # Extraer usando regex del string representation
            user_str = str(user_obj)
            profile_data['user_string_representation'] = user_str

            url_pattern = r'https://[^\'"\\s\]]+\.(webp|jpeg|jpg|png)[^\'"\\s\]]*'
            found_urls = []
            for match in re.finditer(url_pattern, user_str):
                found_urls.append(match.group(0))

            if found_urls:
                profile_data['regex_extracted_urls'] = found_urls
                print(f"\n📋 URLs encontradas con regex: {len(found_urls)}")
                for i, url in enumerate(found_urls, 1):
                    print(f"   {i}. {url}")

        except Exception as e:
            profile_data['extraction_error'] = str(e)
            print(f"❌ Error en extracción completa: {e}")

        return profile_data

    def extract_avatar_urls_like_extractor(self, user_obj):
        """Usar el método del extractor existente"""
        urls = {}

        try:
            # Método 1: avatar_thumb
            if hasattr(user_obj, 'avatar_thumb'):
                avatar_thumb = user_obj.avatar_thumb
                if hasattr(avatar_thumb, 'm_urls') and avatar_thumb.m_urls:
                    urls['avatar_thumb_urls'] = avatar_thumb.m_urls
                    print(f"✅ avatar_thumb URLs encontradas: {len(avatar_thumb.m_urls)}")

            # Método 2: avatar_medium
            if hasattr(user_obj, 'avatar_medium'):
                avatar_medium = user_obj.avatar_medium
                if hasattr(avatar_medium, 'm_urls') and avatar_medium.m_urls:
                    urls['avatar_medium_urls'] = avatar_medium.m_urls
                    print(f"✅ avatar_medium URLs encontradas: {len(avatar_medium.m_urls)}")

            # Método 3: avatar_large
            if hasattr(user_obj, 'avatar_large'):
                avatar_large = user_obj.avatar_large
                if hasattr(avatar_large, 'm_urls') and avatar_large.m_urls:
                    urls['avatar_large_urls'] = avatar_large.m_urls
                    print(f"✅ avatar_large URLs encontradas: {len(avatar_large.m_urls)}")

        except Exception as e:
            urls['extraction_error'] = str(e)
            print(f"❌ Error extrayendo URLs estilo extractor: {e}")

        return urls

    def save_debug_data(self, event_data):
        """Guardar datos de debug completos"""
        try:
            # Guardar evento individual
            timestamp = int(time.time())
            individual_file = Path(__file__).parent / f"winner_debug_{timestamp}.json"

            with open(individual_file, 'w', encoding='utf-8') as f:
                json.dump(event_data, f, indent=2, ensure_ascii=False)

            # Agregar a la lista de eventos
            self.events_captured.append(event_data)

            # Guardar todos los eventos
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(self.events_captured, f, indent=2, ensure_ascii=False)

            print(f"\n💾 Datos guardados:")
            print(f"   📄 Evento individual: {individual_file}")
            print(f"   📚 Todos los eventos: {self.output_file}")

        except Exception as e:
            print(f"❌ Error guardando datos: {e}")

    async def setup_client(self):
        """Configurar cliente TikTok Live"""
        try:
            self.client = TikTokLiveClient(unique_id=self.username)

            @self.client.on(ConnectEvent)
            async def on_connect(event):
                print(f"✅ CONECTADO a @{event.unique_id}")
                print(f"🆔 Room ID: {self.client.room_id}")
                print("🎯 Esperando comentarios...")
                print("💡 Escribe algo en el chat para capturar los datos del evento")
                print("=" * 70)

            @self.client.on(CommentEvent)
            async def on_comment(event):
                print(f"\n📝 COMENTARIO CAPTURADO - {time.strftime('%H:%M:%S')}")
                print(f"👤 Usuario: {getattr(event.user, 'nickname', 'Unknown')}")
                print(f"🆔 Unique ID: {getattr(event.user, 'unique_id', 'Unknown')}")
                print(f"💬 Comentario: {event.comment}")

                # Extraer TODOS los datos del usuario
                profile_data = self.extract_all_profile_data(event.user)

                # Crear estructura de datos completa
                event_data = {
                    'timestamp': time.time(),
                    'timestamp_readable': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'streamer': self.username,
                    'room_id': getattr(self.client, 'room_id', None),
                    'comment_event': {
                        'username': getattr(event.user, 'nickname', 'Unknown'),
                        'unique_id': getattr(event.user, 'unique_id', 'Unknown'),
                        'comment': event.comment,
                        'user_profile_analysis': profile_data
                    }
                }

                # Guardar datos
                self.save_debug_data(event_data)

                print("\n" + "=" * 70)
                print("🎉 ANÁLISIS COMPLETO GUARDADO")
                print("🔍 Revisa los archivos JSON generados para ver la estructura exacta")
                print("=" * 70)

            @self.client.on(DisconnectEvent)
            async def on_disconnect(event):
                print("🔌 Desconectado del live")

            return True

        except Exception as e:
            print(f"❌ Error configurando cliente: {e}")
            return False

    async def run(self, timeout=300):
        """Ejecutar captura de eventos"""
        print("🎯 INICIANDO DEBUG DE EVENTOS WINNER")
        print(f"👤 Usuario objetivo: @{self.username}")
        print(f"⏰ Timeout: {timeout} segundos")
        print("-" * 70)

        if not await self.setup_client():
            return False

        try:
            await self.client.connect()

            # Esperar eventos por tiempo limitado
            start = time.time()

            while (time.time() - start) < timeout:
                await asyncio.sleep(1)

                # Mostrar progreso cada 30 segundos
                elapsed = int(time.time() - start)
                if elapsed % 30 == 0 and elapsed > 0:
                    print(f"⏳ Capturando eventos... {elapsed}/{timeout}s (eventos: {len(self.events_captured)})")

            print(f"\n⏰ Tiempo completado. Eventos capturados: {len(self.events_captured)}")
            return True

        except Exception as e:
            print(f"❌ Error durante la captura: {e}")
            return False
        finally:
            if self.client and self.client.connected:
                await self.client.disconnect()

async def main():
    import argparse

    parser = argparse.ArgumentParser(description='TikTok Live Winner Event Debugger')
    parser.add_argument('--username', '-u', type=str, default='wahanfx',
                       help='Usuario de TikTok para conectar (default: wahanfx)')
    parser.add_argument('--timeout', '-t', type=int, default=300,
                       help='Tiempo máximo de captura en segundos (default: 300)')
    args = parser.parse_args()

    debugger = WinnerEventDebugger(args.username)

    try:
        await debugger.run(args.timeout)

        if debugger.events_captured:
            print(f"\n📊 RESUMEN FINAL:")
            print(f"✅ Eventos capturados: {len(debugger.events_captured)}")
            print(f"📁 Archivo principal: {debugger.output_file}")
            print("\n🔍 SIGUIENTE PASO:")
            print("1. Revisa los archivos JSON generados")
            print("2. Identifica la estructura exacta de los datos de profile picture")
            print("3. Actualiza el código del servidor para usar esa estructura")
        else:
            print("\n⚠️  No se capturaron eventos. Asegúrate de que:")
            print("1. El streamer esté en live")
            print("2. Haya actividad en el chat")
            print("3. La conexión a internet sea estable")

    except KeyboardInterrupt:
        print("\n🛑 Captura interrumpida por el usuario")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())