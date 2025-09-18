#!/usr/bin/env python3
"""
TikTok Live Profile Explorer - Explora todos los atributos del usuario
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
    from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent
except ImportError:
    print("ERROR: TikTokLive no esta instalado. Instalalo con: pip install TikTokLive", flush=True)
    sys.exit(1)

class ProfileExplorer:
    def __init__(self, username: str = "wahanfx"):
        self.username = username.replace('@', '').strip()
        self.client = None
        self.event_detected = False
        self.output_file = Path(__file__).parent / "tiktok_profile_analysis.json"

    def explore_object(self, obj, name="object", max_depth=3, current_depth=0):
        """Explorar recursivamente un objeto y sus atributos"""
        if current_depth >= max_depth:
            return f"Max depth reached for {name}"

        exploration = {}

        # Información básica del objeto
        exploration['_type'] = str(type(obj))
        exploration['_str'] = str(obj)

        # Si es None o un tipo básico, retornar directamente
        if obj is None or isinstance(obj, (str, int, float, bool)):
            return obj

        # Si es una lista, explorar elementos
        if isinstance(obj, (list, tuple)):
            exploration['_is_list'] = True
            exploration['_length'] = len(obj)
            exploration['items'] = []
            for i, item in enumerate(obj[:5]):  # Solo los primeros 5 elementos
                exploration['items'].append(self.explore_object(item, f"{name}[{i}]", max_depth, current_depth + 1))
            return exploration

        # Si es un diccionario
        if isinstance(obj, dict):
            exploration['_is_dict'] = True
            for key, value in obj.items():
                exploration[str(key)] = self.explore_object(value, f"{name}.{key}", max_depth, current_depth + 1)
            return exploration

        # Para objetos complejos, explorar atributos
        if hasattr(obj, '__dict__') or hasattr(obj, '__slots__'):
            try:
                # Obtener lista de atributos
                attrs = []
                if hasattr(obj, '__dict__'):
                    attrs.extend(obj.__dict__.keys())
                if hasattr(obj, '__slots__'):
                    attrs.extend(obj.__slots__)

                # También incluir algunos atributos comunes
                common_attrs = ['urls', 'url_list', 'uri', 'profile_picture', 'avatar', 'nickname', 'unique_id']
                for attr in common_attrs:
                    if hasattr(obj, attr):
                        attrs.append(attr)

                # Remover duplicados y atributos privados
                attrs = list(set(attr for attr in attrs if not attr.startswith('_')))

                exploration['_attributes'] = attrs

                # Explorar cada atributo
                for attr_name in attrs[:20]:  # Limitar a 20 atributos
                    try:
                        attr_value = getattr(obj, attr_name)
                        if not callable(attr_value):
                            exploration[attr_name] = self.explore_object(
                                attr_value,
                                f"{name}.{attr_name}",
                                max_depth,
                                current_depth + 1
                            )
                    except Exception as e:
                        exploration[f"{attr_name}_error"] = str(e)

            except Exception as e:
                exploration['_exploration_error'] = str(e)

        return exploration

    def save_analysis(self, event_type, user_analysis, comment):
        """Guardar análisis completo"""
        data = {
            'timestamp': time.time(),
            'timestamp_readable': time.strftime('%Y-%m-%d %H:%M:%S'),
            'event_type': event_type,
            'comment': comment,
            'room_id': getattr(self.client, 'room_id', None),
            'user_analysis': user_analysis
        }

        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"\n{'='*60}")
            print("ANÁLISIS COMPLETO GUARDADO")
            print(f"Archivo: {self.output_file}")
            print(f"{'='*60}")

            # Mostrar un resumen de URLs encontradas
            self.find_urls_in_analysis(user_analysis)

        except Exception as e:
            print(f"Error guardando análisis: {e}")

    def find_urls_in_analysis(self, analysis, path=""):
        """Buscar URLs en el análisis"""
        urls_found = []

        def search_recursive(obj, current_path):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    new_path = f"{current_path}.{key}" if current_path else key

                    # Buscar campos que pueden contener URLs
                    if 'url' in key.lower() and isinstance(value, (str, list)):
                        if isinstance(value, str) and ('http' in value or '.jpg' in value or '.png' in value):
                            urls_found.append(f"{new_path}: {value}")
                        elif isinstance(value, list):
                            for i, item in enumerate(value):
                                if isinstance(item, str) and ('http' in item or '.jpg' in item or '.png' in item):
                                    urls_found.append(f"{new_path}[{i}]: {item}")

                    search_recursive(value, new_path)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    search_recursive(item, f"{current_path}[{i}]")

        search_recursive(analysis, "")

        print("\nURLs DE IMÁGENES ENCONTRADAS:")
        if urls_found:
            for url in urls_found:
                print(f"  📸 {url}")
        else:
            print("  ❌ No se encontraron URLs de imágenes")

    async def setup_client(self):
        """Configurar cliente"""
        try:
            self.client = TikTokLiveClient(unique_id=self.username)

            @self.client.on(ConnectEvent)
            async def on_connect(event):
                print(f"✅ Conectado a @{event.unique_id}")
                print("🔍 Esperando comentario para análisis profundo...")

            @self.client.on(CommentEvent)
            async def on_comment(event):
                if self.event_detected:
                    return

                self.event_detected = True
                print("💬 ¡Comentario detectado! Analizando usuario...")

                # Explorar completamente el objeto usuario
                print("🔍 Explorando objeto usuario...")
                user_analysis = self.explore_object(event.user, "user", max_depth=4)

                # Guardar análisis
                self.save_analysis('comment', user_analysis, event.comment)

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
        """Ejecutar exploración"""
        print(f"🚀 Conectando a @{self.username} para análisis profundo...")

        if not await self.setup_client():
            return False

        try:
            await self.client.connect()

            # Esperar evento
            timeout = 300
            start = time.time()

            while not self.event_detected and (time.time() - start) < timeout:
                await asyncio.sleep(1)

                # Mostrar progreso cada 30 segundos
                elapsed = int(time.time() - start)
                if elapsed % 30 == 0 and elapsed > 0:
                    print(f"⏳ Esperando... {elapsed}/{timeout}s")

            if not self.event_detected:
                print("⏰ Timeout - no se detectó evento")
                return False

            print("✅ Análisis completado")
            return True

        except Exception as e:
            print(f"Error: {e}")
            return False

async def main():
    explorer = ProfileExplorer("wahanfx")
    await explorer.run()

if __name__ == "__main__":
    asyncio.run(main())