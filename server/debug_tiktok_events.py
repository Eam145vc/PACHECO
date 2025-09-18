#!/usr/bin/env python3
"""
Script para conectarse a TikTok Live y capturar eventos reales
para analizar la estructura de datos que incluye la foto de perfil
"""

import asyncio
import json
import time
from datetime import datetime
from TikTokLive import TikTokLiveClient
from TikTokLive.types import CommentEvent, ConnectEvent, DisconnectEvent

class TikTokEventDebugger:
    def __init__(self, username):
        self.username = username
        self.client = TikTokLiveClient(unique_id=username)
        self.events_captured = []

        # Registrar event handlers
        self.client.add_listener("connect", self.on_connect)
        self.client.add_listener("disconnect", self.on_disconnect)
        self.client.add_listener("comment", self.on_comment)

    async def on_connect(self, event: ConnectEvent):
        print(f"🔗 Conectado a @{self.username}")
        print(f"🏠 Room ID: {self.client.room_id}")
        print("🎯 Esperando comentarios para capturar estructura de datos...")
        print("=" * 60)

    async def on_disconnect(self, event: DisconnectEvent):
        print("🔌 Desconectado del live")

    async def on_comment(self, event: CommentEvent):
        """Capturar y analizar cada comentario que llega"""
        print(f"\n📝 COMENTARIO CAPTURADO - {datetime.now().strftime('%H:%M:%S')}")
        print(f"👤 Usuario: {event.user.display_name}")
        print(f"🆔 Unique ID: {event.user.unique_id}")
        print(f"💬 Comentario: {event.comment}")

        # Extraer todos los datos del usuario
        user_data = {
            'timestamp': time.time(),
            'timestamp_readable': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'user': {
                'display_name': event.user.display_name,
                'unique_id': event.user.unique_id,
                'user_id': getattr(event.user, 'user_id', None),
                'nickname': getattr(event.user, 'nickname', None),
                'avatar_thumb': getattr(event.user, 'avatar_thumb', None),
                'avatar_medium': getattr(event.user, 'avatar_medium', None),
                'avatar_large': getattr(event.user, 'avatar_large', None),
                # Intentar capturar otros campos de avatar
                'profile_picture': getattr(event.user, 'profile_picture', None),
                'avatar': getattr(event.user, 'avatar', None),
                'picture': getattr(event.user, 'picture', None),
            },
            'comment': event.comment,
            'room_id': self.client.room_id,
            'streamer': self.username
        }

        # Capturar TODOS los atributos del objeto user
        print("\n🔍 ANÁLISIS COMPLETO DEL OBJETO USER:")
        all_attributes = dir(event.user)
        for attr in all_attributes:
            if not attr.startswith('_'):  # Ignorar atributos privados
                try:
                    value = getattr(event.user, attr)
                    if not callable(value):  # Ignorar métodos
                        user_data['user'][f'raw_{attr}'] = str(value)
                        if 'avatar' in attr.lower() or 'picture' in attr.lower() or 'image' in attr.lower():
                            print(f"  🖼️  {attr}: {value}")
                        elif 'url' in attr.lower():
                            print(f"  🔗 {attr}: {value}")
                        else:
                            print(f"     {attr}: {value}")
                except Exception as e:
                    print(f"  ❌ Error accediendo a {attr}: {e}")

        # Guardar evento completo
        self.events_captured.append(user_data)

        # Guardar en archivo JSON inmediatamente
        filename = f"tiktok_debug_event_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(user_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Datos guardados en: {filename}")
        print("=" * 60)

        # También guardar un archivo con todos los eventos
        with open('all_tiktok_debug_events.json', 'w', encoding='utf-8') as f:
            json.dump(self.events_captured, f, indent=2, ensure_ascii=False)

    async def start(self):
        """Iniciar la captura de eventos"""
        try:
            print(f"🚀 Iniciando captura de eventos de @{self.username}")
            print("⏰ El script capturará automáticamente todos los comentarios")
            print("🛑 Presiona Ctrl+C para detener")
            print("")

            await self.client.start()
        except KeyboardInterrupt:
            print("\n🛑 Detenido por el usuario")
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            await self.cleanup()

    async def cleanup(self):
        """Limpiar recursos"""
        if self.client.connected:
            await self.client.disconnect()

        print(f"\n📊 RESUMEN:")
        print(f"Events capturados: {len(self.events_captured)}")
        if self.events_captured:
            print("📁 Archivos generados:")
            print("  - all_tiktok_debug_events.json (todos los eventos)")
            for i, event in enumerate(self.events_captured):
                print(f"  - tiktok_debug_event_{int(event['timestamp'])}.json")

async def main():
    username = "wahanfx"  # El streamer objetivo
    debugger = TikTokEventDebugger(username)
    await debugger.start()

if __name__ == "__main__":
    print("🎯 TikTok Live Event Debugger")
    print("📋 Este script capturará eventos de comentarios para analizar")
    print("   la estructura de datos incluyendo fotos de perfil")
    print("")

    asyncio.run(main())