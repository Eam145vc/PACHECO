#!/usr/bin/env python3
"""
TikTok Live Final Extractor - Extrae URLs de perfil específicamente
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
    print("ERROR: TikTokLive no esta instalado. Instalalo con: pip install TikTokLive", flush=True)
    sys.exit(1)

class FinalExtractor:
    def __init__(self, username: str = "wahanfx"):
        self.username = username.replace('@', '').strip()
        self.client = None
        self.event_detected = False
        self.output_file = Path(__file__).parent / "tiktok_final_extraction.json"

    def extract_avatar_urls(self, user_obj):
        """Extraer URLs de avatar usando múltiples métodos"""
        urls = {}

        try:
            # Método 1: avatar_thumb (encontrado en el análisis)
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

            # Método 4: Extraer de string representation usando regex
            user_str = str(user_obj)
            # Buscar URLs en el string usando regex
            url_pattern = r'https://[^\'"\s\]]+\.(webp|jpeg|jpg|png)[^\'"\s\]]*'
            found_urls = re.findall(url_pattern, user_str)
            if found_urls:
                # Reconstruir URLs completas
                complete_urls = []
                for match in re.finditer(url_pattern, user_str):
                    complete_urls.append(match.group(0))
                urls['extracted_from_string'] = complete_urls
                print(f"✅ URLs extraídas del string: {len(complete_urls)}")

        except Exception as e:
            urls['extraction_error'] = str(e)
            print(f"❌ Error extrayendo URLs: {e}")

        return urls

    def save_final_data(self, username, unique_id, comment, avatar_urls):
        """Guardar datos finales con URLs extraídas"""
        data = {
            'timestamp': time.time(),
            'timestamp_readable': time.strftime('%Y-%m-%d %H:%M:%S'),
            'streamer': self.username,
            'commenter': {
                'username': username,
                'unique_id': unique_id,
                'comment': comment
            },
            'avatar_urls': avatar_urls,
            'room_id': getattr(self.client, 'room_id', None)
        }

        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"\n{'='*70}")
            print("🎯 EXTRACCIÓN FINAL COMPLETADA")
            print(f"{'='*70}")
            print(f"📺 Streamer: @{self.username}")
            print(f"👤 Comentarista: {username} (@{unique_id})")
            print(f"💬 Comentario: {comment}")
            print(f"🏠 Room ID: {getattr(self.client, 'room_id', None)}")
            print(f"📁 Archivo: {self.output_file}")
            print(f"{'='*70}")

            print("🖼️ URLS DE IMÁGENES DE PERFIL EXTRAÍDAS:")
            for category, urls_list in avatar_urls.items():
                if isinstance(urls_list, list) and urls_list:
                    print(f"\n📂 {category.upper()}:")
                    for i, url in enumerate(urls_list, 1):
                        print(f"   {i}. {url}")
                elif urls_list and 'error' not in category:
                    print(f"\n📂 {category.upper()}: {urls_list}")

            print(f"\n{'='*70}")

        except Exception as e:
            print(f"❌ Error guardando datos finales: {e}")

    async def setup_client(self):
        """Configurar cliente"""
        try:
            self.client = TikTokLiveClient(unique_id=self.username)

            @self.client.on(ConnectEvent)
            async def on_connect(event):
                print(f"✅ CONECTADO a @{event.unique_id}")
                print(f"🆔 Room ID: {self.client.room_id}")
                print("🔍 Esperando primer comentario para extraer datos...")

            @self.client.on(CommentEvent)
            async def on_comment(event):
                if self.event_detected:
                    return

                self.event_detected = True
                print("\n💬 ¡COMENTARIO DETECTADO!")
                print("🔍 Extrayendo URLs de imagen de perfil...")

                username = getattr(event.user, 'nickname', 'Unknown')
                unique_id = getattr(event.user, 'unique_id', 'Unknown')
                comment = event.comment

                print(f"👤 Usuario: {username} (@{unique_id})")
                print(f"💬 Comentario: {comment}")

                # Extraer URLs de avatar
                avatar_urls = self.extract_avatar_urls(event.user)

                # Guardar datos finales
                self.save_final_data(username, unique_id, comment, avatar_urls)

                # Desconectar
                await self.client.disconnect()

            @self.client.on(DisconnectEvent)
            async def on_disconnect(event):
                print("🔌 Desconectado del live")

            return True

        except Exception as e:
            print(f"❌ Error configurando cliente: {e}")
            return False

    async def run(self):
        """Ejecutar extracción final"""
        print("🎯 INICIANDO EXTRACCIÓN FINAL DE URLS DE PERFIL")
        print(f"👤 Usuario objetivo: @{self.username}")
        print("-" * 70)

        if not await self.setup_client():
            return False

        try:
            await self.client.connect()

            # Esperar evento
            timeout = 300  # 5 minutos
            start = time.time()

            while not self.event_detected and (time.time() - start) < timeout:
                await asyncio.sleep(1)

                # Mostrar progreso cada 30 segundos
                elapsed = int(time.time() - start)
                if elapsed % 30 == 0 and elapsed > 0:
                    print(f"⏳ Esperando comentario... {elapsed}/{timeout}s")

            if not self.event_detected:
                print("⏰ TIMEOUT: No se detectó comentario en el tiempo límite")
                return False

            print("✅ EXTRACCIÓN COMPLETADA EXITOSAMENTE")
            return True

        except Exception as e:
            print(f"❌ Error durante la extracción: {e}")
            return False

async def main():
    import argparse

    parser = argparse.ArgumentParser(description='TikTok Live Final URL Extractor')
    parser.add_argument('--username', '-u', type=str, default='wahanfx',
                       help='Usuario de TikTok para conectar (default: wahanfx)')
    args = parser.parse_args()

    extractor = FinalExtractor(args.username)

    try:
        await extractor.run()
    except KeyboardInterrupt:
        print("\n🛑 Extracción interrumpida por el usuario")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())