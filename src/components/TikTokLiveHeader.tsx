import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  // RadioOff,
  Settings, 
  Save, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { tiktokLiveService } from '../services/tiktokLiveService';

interface TikTokLiveStatus {
  connected: boolean;
  streamer_username: string | null;
  room_id: string | null;
  last_update: number | null;
}

const TikTokLiveHeader: React.FC = () => {
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<TikTokLiveStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);

  // Cargar username guardado al inicio
  useEffect(() => {
    const saved = localStorage.getItem('tiktok-live-username');
    if (saved) {
      setUsername(saved);
      setSavedUsername(saved);
    }
    
    // Verificar estado inicial
    checkStatus();
  }, []);

  // Polling para mantener estado actualizado
  useEffect(() => {
    const stopPolling = tiktokLiveService.startStatusPolling((newStatus) => {
      if (newStatus) {
        setStatus(newStatus);
        setIsConnected(newStatus.connected);
        setRoomId(newStatus.room_id);

        // Limpiar mensaje de error si la conexión está activa
        if (newStatus.connected && errorMessage) {
          setErrorMessage('');
        }

        if (newStatus.streamer_username && newStatus.streamer_username !== savedUsername) {
          setSavedUsername(newStatus.streamer_username);
          setUsername(newStatus.streamer_username);
        }
      } else {
        setIsConnected(false);
        setStatus(null);
        // No limpiar errorMessage aquí para mantener el error visible
      }
    }, 3000);

    return stopPolling;
  }, [savedUsername, errorMessage]);

  const checkStatus = async () => {
    try {
      const response = await tiktokLiveService.getStatus();
      if (response.success && response.status) {
        setStatus(response.status);
        setIsConnected(response.status.connected);
        setRoomId(response.status.room_id);
        
        if (response.status.streamer_username) {
          setSavedUsername(response.status.streamer_username);
          setUsername(response.status.streamer_username);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const saveUsername = () => {
    if (username.trim()) {
      localStorage.setItem('tiktok-live-username', username.trim());
      setSavedUsername(username.trim());
      setErrorMessage('');
    }
  };

  const connectToLive = async () => {
    if (!username.trim()) {
      setErrorMessage('Por favor ingresa un usuario de TikTok');
      return;
    }

    setIsConnecting(true);
    setErrorMessage('');

    try {
      const response = await tiktokLiveService.startConnection(username.trim());
      
      if (response.success) {
        saveUsername();
        // El estado se actualizará automáticamente via polling
      } else {
        setErrorMessage(response.error || 'Error conectando al live');
      }
    } catch (error) {
      setErrorMessage('Error de conexión');
      console.error('Error connecting:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromLive = async () => {
    try {
      setIsConnecting(true);
      await tiktokLiveService.stopConnection();
      setIsConnected(false);
      setRoomId(null);
      setStatus(null);
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remover @ si el usuario lo incluye
    if (value.startsWith('@')) {
      value = value.substring(1);
    }
    setUsername(value);
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-500';
    if (errorMessage) return 'text-red-500';
    return isConnected ? 'text-green-500' : 'text-gray-400';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Conectando...';
    if (errorMessage) return 'Error de conexión';
    if (isConnected && roomId) return `Conectado (Room: ${roomId})`;
    if (isConnected) return 'Conectado';
    return 'Desconectado';
  };

  const getBorderColor = () => {
    if (errorMessage) return 'border-red-500';
    if (isConnected) return 'border-green-500';
    if (isConnecting) return 'border-yellow-500';
    return 'border-gray-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 ${getBorderColor()}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Radio className="w-6 h-6 text-red-500" />
            ) : (
              <div className="w-6 h-6 text-gray-400">Icono Alternativo</div>
            )}
            <h2 className="text-xl font-bold text-gray-800">TikTok Live</h2>
          </div>
          
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            {isConnecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>

        <button
          onClick={checkStatus}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="Actualizar estado"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Campo de usuario */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usuario de TikTok (sin @)
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="tu_usuario_tiktok"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isConnecting}
              />
            </div>
            
            {username !== savedUsername && username.trim() && (
              <button
                onClick={saveUsername}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1"
                title="Guardar usuario"
              >
                <Save className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {savedUsername && (
            <p className="text-xs text-gray-500 mt-1">
              Usuario guardado: @{savedUsername}
            </p>
          )}
        </div>

        {/* Botón de conexión */}
        <div>
          {isConnected ? (
            <button
              onClick={disconnectFromLive}
              disabled={isConnecting}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4">Icono Alternativo</div>
              )}
              <span>{isConnecting ? 'Desconectando...' : 'Desconectar'}</span>
            </button>
          ) : (
            <button
              onClick={connectToLive}
              disabled={isConnecting || !username.trim()}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className="w-4 h-4" />
              )}
              <span>{isConnecting ? 'Conectando...' : 'Conectar al Live'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{errorMessage}</span>
        </motion.div>
      )}

      {/* Información de estado cuando está conectado */}
      {isConnected && status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-700">
              ✅ Conectado al live de @{status.streamer_username}
            </span>
          </div>
          
          <div className="text-xs text-green-600 space-y-1">
            {roomId && <p>Room ID: {roomId}</p>}
            {status.last_update && (
              <p>Última actualización: {new Date(status.last_update * 1000).toLocaleTimeString()}</p>
            )}
            <p className="text-green-700 font-medium">
              🎯 El sistema detectará automáticamente las respuestas correctas en el chat del live
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TikTokLiveHeader;