import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Brain, Settings, Save, Eye, EyeOff } from 'lucide-react';

interface OpenAIConfigProps {
  onConfigChange: (config: OpenAIConfig) => void;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  isConfigured: boolean;
}

const OPENAI_MODELS = [
  { id: 'gpt-5', name: 'GPT-5 (Latest)', description: 'Most advanced model' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast and affordable' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Ultra lightweight' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal capabilities' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Reliable and accurate' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Cost effective' }
];

const OpenAIConfig: React.FC<OpenAIConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<OpenAIConfig>({
    apiKey: '',
    model: 'gpt-4o',
    isConfigured: false
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Load saved config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('openai-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        onConfigChange(parsed);
      } catch (error) {
        console.error('Error loading OpenAI config:', error);
      }
    }
  }, [onConfigChange]);

  const handleApiKeyChange = (apiKey: string) => {
    const newConfig = {
      ...config,
      apiKey,
      isConfigured: apiKey.length > 0
    };
    setConfig(newConfig);
  };

  const handleModelChange = (model: string) => {
    const newConfig = {
      ...config,
      model
    };
    setConfig(newConfig);
  };

  const saveConfig = () => {
    localStorage.setItem('openai-config', JSON.stringify(config));
    onConfigChange(config);
  };

  const testConnection = async () => {
    if (!config.apiKey) return;
    
    setIsTestingConnection(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const newConfig = { ...config, isConfigured: true };
        setConfig(newConfig);
        localStorage.setItem('openai-config', JSON.stringify(newConfig));
        onConfigChange(newConfig);
      } else {
        console.error('API Key test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <motion.div
      className="openai-config"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="config-header">
        <Brain size={24} />
        <h3>Configuración OpenAI</h3>
        <div className={`status-dot ${config.isConfigured ? 'connected' : 'disconnected'}`} />
      </div>

      <div className="config-form">
        <div className="input-group">
          <label>
            <Key size={16} />
            API Key
          </label>
          <div className="api-key-input">
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={config.apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="api-key-field"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="toggle-visibility"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>
            <Settings size={16} />
            Modelo
          </label>
          <select
            value={config.model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="model-select"
          >
            {OPENAI_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
        </div>

        <div className="config-actions">
          <button
            onClick={testConnection}
            disabled={!config.apiKey || isTestingConnection}
            className="test-btn"
          >
            {isTestingConnection ? 'Probando...' : 'Probar Conexión'}
          </button>
          <button
            onClick={saveConfig}
            disabled={!config.apiKey}
            className="save-btn"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OpenAIConfig;