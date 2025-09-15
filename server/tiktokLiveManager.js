const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TikTokLiveManager {
  constructor() {
    this.pythonProcess = null;
    this.isRunning = false;
    this.pythonScript = path.join(__dirname, 'tiktok_live_simple.py'); // Usar versión simple
    this.configFile = path.join(__dirname, 'tiktok_live_config.json');
    this.restartAttempts = 0;
    this.maxRestartAttempts = 5;
  }

  // Verificar si Python está instalado
  async checkPython() {
    return new Promise((resolve) => {
      const pythonCheck = spawn('python', ['--version']);
      
      pythonCheck.on('close', (code) => {
        resolve(code === 0);
      });
      
      pythonCheck.on('error', () => {
        resolve(false);
      });
    });
  }

  // Verificar dependencias de Python
  async checkDependencies() {
    return new Promise((resolve) => {
      const dependencyCheck = spawn('python', ['-c', 'import TikTokLive; import aiohttp; print("OK")']);
      
      dependencyCheck.on('close', (code) => {
        resolve(code === 0);
      });
      
      dependencyCheck.on('error', () => {
        resolve(false);
      });
    });
  }

  // Instalar dependencias automáticamente
  async installDependencies() {
    return new Promise((resolve, reject) => {
      console.log('📦 [TikTok Live] Instalando dependencias de Python...');
      
      const install = spawn('python', ['-m', 'pip', 'install', '-r', path.join(__dirname, 'requirements.txt')]);
      
      install.stdout.on('data', (data) => {
        console.log(`📦 ${data.toString().trim()}`);
      });
      
      install.stderr.on('data', (data) => {
        console.log(`📦 ${data.toString().trim()}`);
      });
      
      install.on('close', (code) => {
        if (code === 0) {
          console.log('✅ [TikTok Live] Dependencias instaladas correctamente');
          resolve(true);
        } else {
          console.error('❌ [TikTok Live] Error instalando dependencias');
          reject(new Error(`Pip install failed with code ${code}`));
        }
      });
      
      install.on('error', (error) => {
        console.error('❌ [TikTok Live] Error ejecutando pip:', error.message);
        reject(error);
      });
    });
  }

  // Iniciar el servidor Python
  async start(username = null) {
    if (this.isRunning) {
      console.log('⚠️ [TikTok Live] El servidor ya está ejecutándose');
      return { success: true, message: 'Ya está ejecutándose' };
    }

    try {
      // Verificar Python
      const hasPython = await this.checkPython();
      if (!hasPython) {
        throw new Error('Python no está instalado. Instala Python 3.8+ desde https://python.org/downloads/');
      }

      // Verificar dependencias
      const hasDependencies = await this.checkDependencies();
      if (!hasDependencies) {
        console.log('📦 [TikTok Live] Dependencias faltantes, instalando...');
        await this.installDependencies();
      }

      console.log('🚀 [TikTok Live] Iniciando servidor Python...');

      // Preparar argumentos - NO pasar username para evitar auto-conexión
      const args = [this.pythonScript];
      // Solo conectar automáticamente si se pasa username explícitamente
      // if (username) {
      //   args.push('--username', username);
      // }

      // Spawn del proceso Python
      this.pythonProcess = spawn('python', args, {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.isRunning = true;
      this.restartAttempts = 0;

      // Manejar stdout
      this.pythonProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`🐍 [Python] ${message}`);
      });

      // Manejar stderr
      this.pythonProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        console.error(`🐍 [Python Error] ${message}`);
      });

      // Manejar cierre del proceso
      this.pythonProcess.on('close', (code) => {
        console.log(`🐍 [Python] Proceso terminado con código ${code}`);
        this.isRunning = false;
        this.pythonProcess = null;

        // Auto-restart solo si el código de salida indica un error de conectividad temporal
        // No hacer auto-restart para errores comunes como "usuario no en vivo"
        if (code !== 0 && code !== 1 && this.restartAttempts < this.maxRestartAttempts) {
          this.restartAttempts++;
          console.log(`🔄 [TikTok Live] Auto-restart ${this.restartAttempts}/${this.maxRestartAttempts} en 10 segundos...`);
          setTimeout(() => {
            this.start(username);
          }, 10000); // Aumentado a 10 segundos
        } else if (code === 1) {
          console.log('⚠️ [TikTok Live] Proceso terminó con error de usuario (no en vivo, etc). No auto-restarting.');
        }
      });

      // Manejar error del proceso
      this.pythonProcess.on('error', (error) => {
        console.error('❌ [TikTok Live] Error iniciando proceso Python:', error.message);
        this.isRunning = false;
        this.pythonProcess = null;
      });

      // Dar tiempo para que el proceso se inicie
      await new Promise(resolve => setTimeout(resolve, 2000));

      return { success: true, message: 'Servidor Python iniciado' };

    } catch (error) {
      console.error('❌ [TikTok Live] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Detener el servidor Python
  async stop() {
    if (!this.isRunning || !this.pythonProcess) {
      console.log('⚠️ [TikTok Live] El servidor no está ejecutándose');
      return { success: true, message: 'Ya estaba detenido' };
    }

    try {
      console.log('🛑 [TikTok Live] Deteniendo servidor Python...');

      // Crear promesa para esperar que termine el proceso
      const processExit = new Promise((resolve) => {
        this.pythonProcess.once('close', () => {
          resolve();
        });
      });

      // Enviar SIGTERM primero (gentil)
      this.pythonProcess.kill('SIGTERM');

      // Esperar 3 segundos para que termine gentilmente
      const timeout = new Promise(resolve => setTimeout(resolve, 3000));

      await Promise.race([processExit, timeout]);

      // Si aún está corriendo después de 3 segundos, forzar
      if (this.isRunning && this.pythonProcess) {
        console.log('💀 [TikTok Live] Forzando cierre del proceso...');
        this.pythonProcess.kill('SIGKILL');

        // Esperar un poco más para SIGKILL
        const forceTimeout = new Promise(resolve => setTimeout(resolve, 1000));
        await Promise.race([processExit, forceTimeout]);
      }

      this.isRunning = false;
      this.pythonProcess = null;

      return { success: true, message: 'Servidor Python detenido' };

    } catch (error) {
      console.error('❌ [TikTok Live] Error deteniendo servidor:', error.message);
      this.isRunning = false;
      this.pythonProcess = null;
      return { success: false, error: error.message };
    }
  }

  // Reiniciar el servidor
  async restart(username = null) {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await this.start(username);
  }

  // Obtener estado
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.pythonProcess ? this.pythonProcess.pid : null,
      restartAttempts: this.restartAttempts
    };
  }

  // Iniciar en modo espera (sin conectar automáticamente)
  async startStandby() {
    return await this.start(); // Sin username = modo espera
  }

  // Conectar a un usuario específico
  async connectToUser(username) {
    // Si ya está corriendo, detenerlo GENTILMENTE primero
    if (this.isRunning) {
      console.log('⚠️ [TikTok Live] Deteniendo servidor existente para conectar nuevo usuario...');
      await this.stop();
      // Dar tiempo para que se detenga completamente
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`🚀 [TikTok Live] Iniciando y conectando a @${username}...`);

    // Preparar argumentos con username para conexión directa
    const args = [this.pythonScript, '--username', username];

    // Verificar Python y dependencias primero
    const hasPython = await this.checkPython();
    if (!hasPython) {
      return { success: false, error: 'Python no está instalado. Instala Python 3.8+ desde https://python.org/downloads/' };
    }

    const hasDependencies = await this.checkDependencies();
    if (!hasDependencies) {
      console.log('📦 [TikTok Live] Dependencias faltantes, instalando...');
      try {
        await this.installDependencies();
      } catch (error) {
        return { success: false, error: 'Error instalando dependencias: ' + error.message };
      }
    }

    // Iniciar proceso Python con usuario
    this.pythonProcess = spawn('python', args, {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.isRunning = true;
    this.restartAttempts = 0;

    // Setup event handlers
    this.pythonProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      console.log(`🐍 [Python] ${message}`);
    });

    this.pythonProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      console.error(`🐍 [Python Error] ${message}`);
    });

    this.pythonProcess.on('close', (code) => {
      console.log(`🐍 [Python] Proceso terminado con código ${code}`);
      this.isRunning = false;
      this.pythonProcess = null;

      // Solo auto-restart para errores técnicos, no para errores de usuario
      if (code === 2 && this.restartAttempts < this.maxRestartAttempts) {
        this.restartAttempts++;
        console.log(`🔄 [TikTok Live] Auto-restart ${this.restartAttempts}/${this.maxRestartAttempts} en 10 segundos...`);
        setTimeout(() => {
          this.connectToUser(username);
        }, 10000);
      } else if (code === 1) {
        console.log('⚠️ [TikTok Live] Error de usuario: usuario no está en vivo o no existe');
      } else if (code === 0) {
        console.log('✅ [TikTok Live] Proceso terminado normalmente');
      }
    });

    this.pythonProcess.on('error', (error) => {
      console.error('❌ [TikTok Live] Error iniciando proceso Python:', error.message);
      this.isRunning = false;
      this.pythonProcess = null;
    });

    // Dar tiempo para que el proceso se inicie
    await new Promise(resolve => setTimeout(resolve, 3000));

    return { success: true, message: `Conectando a @${username}` };
  }

  // Enviar actualización del estado del juego al servidor Python
  updateGameState(phrase, answer, category, isActive) {
    if (!this.isRunning || !this.pythonProcess) {
      console.log('⚠️ [TikTok Live] No se puede enviar estado del juego: servidor Python no está corriendo');
      return { success: false, error: 'Servidor Python no está corriendo' };
    }

    try {
      // Crear mensaje JSON para enviar al proceso Python
      const gameUpdate = {
        action: 'update_game_state',
        data: {
          phrase: phrase,
          answer: answer,
          category: category,
          isActive: isActive
        }
      };

      console.log('🎮 [TikTok Live] Enviando estado del juego a Python:', gameUpdate);

      // Verificar que stdin esté disponible
      if (!this.pythonProcess.stdin) {
        console.error('❌ [TikTok Live] stdin no está disponible en el proceso Python');
        return { success: false, error: 'stdin no disponible' };
      }

      // Enviar al proceso Python via stdin
      const jsonMessage = JSON.stringify(gameUpdate) + '\n';
      console.log('📝 [TikTok Live] Escribiendo a stdin:', jsonMessage.trim());

      this.pythonProcess.stdin.write(jsonMessage);

      return { success: true, message: 'Estado del juego enviado' };
    } catch (error) {
      console.error('❌ [TikTok Live] Error enviando estado del juego:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Limpiar al cerrar la aplicación
  cleanup() {
    if (this.pythonProcess) {
      console.log('🧹 [TikTok Live] Limpiando proceso Python...');
      this.pythonProcess.kill('SIGKILL');
      this.isRunning = false;
      this.pythonProcess = null;
    }
  }
}

// Singleton
const tiktokLiveManager = new TikTokLiveManager();

// Cleanup al cerrar la aplicación
process.on('exit', () => {
  tiktokLiveManager.cleanup();
});

process.on('SIGINT', () => {
  tiktokLiveManager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  tiktokLiveManager.cleanup();
  process.exit(0);
});

module.exports = tiktokLiveManager;