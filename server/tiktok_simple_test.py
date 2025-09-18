#!/usr/bin/env python3
"""
TikTok Live Simple Test - Solo extrae datos básicos y URLs de perfil
"""

import asyncio
import json
import time
import sys
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
    from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent, LiveEndEvent, GiftEvent, LikeEvent, FollowEvent
except ImportError:
    print("ERROR: TikTokLive no esta instalado. Instalalo con: pip install TikTokLive", flush=True)
    sys.exit(1)

class SimpleTikTokTest:
    def __init__(self, username: str = "wahanfx"):
        self.username = username.replace('@', '').strip()
        self.client = None
        self.event_detected = False
        self.output_file = Path(__file__).parent / "tiktok_simple_data.json"

    def extract_profile_urls(self, user_obj):
        """Extraer específicamente las URLs de perfil"""
        urls = {}

        try:
            # Método principal: profile_picture.urls
            if hasattr(user_obj, 'profile_picture') and user_obj.profile_picture:
                pp = user_obj.profile_picture
                urls['profile_picture_raw'] = str(pp)

                if hasattr(pp, 'urls') and pp.urls:
                    urls['profile_picture_urls'] = pp.urls
                    urls['main_profile_url'] = pp.urls[0] if pp.urls else None

                # Explorar otros atributos del profile_picture
                try:
                    if hasattr(pp, 'url_list'):
                        urls['url_list'] = getattr(pp, 'url_list', None)
                    if hasattr(pp, 'uri'):
                        urls['uri'] = getattr(pp, 'uri', None)
                except:
                    pass

        except Exception as e:
            urls['profile_picture_error'] = str(e)

        try:
            # Método alternativo: avatar
            if hasattr(user_obj, 'avatar') and user_obj.avatar:
                avatar = user_obj.avatar
                urls['avatar_raw'] = str(avatar)

                if hasattr(avatar, 'urls') and avatar.urls:
                    urls['avatar_urls'] = avatar.urls

        except Exception as e:
            urls['avatar_error'] = str(e)

        return urls

    def save_data(self, event_type, username, unique_id, comment, profile_urls):
        """Guardar datos extraídos"""
        data = {
            'timestamp': time.time(),
            'event_type': event_type,
            'username': username,
            'unique_id': unique_id,
            'comment': comment,
            'profile_urls': profile_urls,
            'room_id': getattr(self.client, 'room_id', None)
        }

        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"\n{'='*50}")
            print("DATOS EXTRAÍDOS:")
            print(f"Usuario: {username} (@{unique_id})")
            print(f"Comentario: {comment}")
            print("URLs de perfil encontradas:")
            for key, value in profile_urls.items():
                print(f"  {key}: {value}")
            print(f"Guardado en: {self.output_file}")
            print(f"{'='*50}")

        except Exception as e:
            print(f"Error guardando: {e}")

    async def setup_client(self):
        """Configurar cliente"""
        try:
            self.client = TikTokLiveClient(unique_id=self.username)

            @self.client.on(ConnectEvent)
            async def on_connect(event):
                print(f"✅ Conectado a @{event.unique_id}")
                print("⏳ Esperando primer comentario...")

            @self.client.on(CommentEvent)
            async def on_comment(event):
                if self.event_detected:
                    return

                self.event_detected = True
                print("💬 ¡Comentario detectado!")

                username = getattr(event.user, 'nickname', 'Unknown')
                unique_id = getattr(event.user, 'unique_id', 'Unknown')
                comment = event.comment

                # Extraer URLs de perfil
                profile_urls = self.extract_profile_urls(event.user)

                # Guardar datos
                self.save_data('comment', username, unique_id, comment, profile_urls)

                # Desconectar
                await self.client.disconnect()

            @self.client.on(DisconnectEvent)
            async def on_disconnect(event):
                print("🔌 Desconectado")

            return True

        except Exception as e:
            print(f"Error configurando cliente: {e}")
            return False

    async def run(self):
        """Ejecutar test"""
        print(f"🚀 Conectando a @{self.username}...")

        if not await self.setup_client():
            return False

        try:
            await self.client.connect()

            # Esperar evento por 5 minutos
            timeout = 300
            start = time.time()

            while not self.event_detected and (time.time() - start) < timeout:
                await asyncio.sleep(1)

            if not self.event_detected:
                print("⏰ Timeout - no se detectó evento")
                return False

            print("✅ Test completado")
            return True

        except Exception as e:
            print(f"Error: {e}")
            return False

async def main():
    test = SimpleTikTokTest("wahanfx")
    await test.run()

if __name__ == "__main__":
    asyncio.run(main())