import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Brain, 
  Target,
  ChevronDown,
  Loader2,
  Wand2
} from 'lucide-react';
import OpenAIConfig, { OpenAIConfig as OpenAIConfigType } from './OpenAIConfig';

interface SmartPhraseGeneratorProps {
  onPhraseGenerated: (phrase: { text: string; category: string; difficulty: 'easy' | 'medium' | 'hard'; hints?: string[] }) => void;
}

const CATEGORIES = [
  { id: 'technology', name: 'Tecnología', emoji: '💻' },
  { id: 'food', name: 'Comida', emoji: '🍕' },
  { id: 'places', name: 'Lugares', emoji: '🏛️' },
  { id: 'animals', name: 'Animales', emoji: '🦁' },
  { id: 'movies', name: 'Películas', emoji: '🎬' },
  { id: 'music', name: 'Música', emoji: '🎵' },
  { id: 'sports', name: 'Deportes', emoji: '⚽' },
  { id: 'nature', name: 'Naturaleza', emoji: '🌿' },
  { id: 'science', name: 'Ciencia', emoji: '🔬' },
  { id: 'art', name: 'Arte', emoji: '🎨' },
  { id: 'history', name: 'Historia', emoji: '📜' },
  { id: 'space', name: 'Espacio', emoji: '🚀' },
  { id: 'books', name: 'Libros', emoji: '📚' },
  { id: 'games', name: 'Videojuegos', emoji: '🎮' },
  { id: 'travel', name: 'Viajes', emoji: '✈️' }
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Fácil', description: 'Palabras simples y comunes', color: '#4CAF50' },
  { id: 'medium', name: 'Medio', description: 'Frases de dificultad moderada', color: '#FF9800' },
  { id: 'hard', name: 'Difícil', description: 'Frases complejas y técnicas', color: '#F44336' }
];

const SmartPhraseGenerator: React.FC<SmartPhraseGeneratorProps> = ({ onPhraseGenerated }) => {
  const [openAIConfig, setOpenAIConfig] = useState<OpenAIConfigType>({
    apiKey: '',
    model: 'gpt-4o',
    isConfigured: false
  });
  const [selectedCategory, setSelectedCategory] = useState('technology');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPhrase, setGeneratedPhrase] = useState('');
  const [generatedHints, setGeneratedHints] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [manualPhrase, setManualPhrase] = useState('');
  const [generatedHistory, setGeneratedHistory] = useState<string[]>([]);

  // Show config if not configured
  useEffect(() => {
    if (!openAIConfig.isConfigured) {
      setShowConfig(true);
    }
  }, [openAIConfig.isConfigured]);

  const generatePhrase = async () => {
    if (!openAIConfig.isConfigured) {
      setShowConfig(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      const category = CATEGORIES.find(c => c.id === selectedCategory);
      const difficulty = DIFFICULTIES.find(d => d.id === selectedDifficulty);

      const historyText = generatedHistory.length > 0 ? `\n\nNO REPITAS estas frases ya generadas:\n${generatedHistory.join(', ')}` : '';
      
      const prompt = `Genera una ${selectedDifficulty === 'easy' ? 'palabra simple' : 'frase'} en español para un juego de adivinanza CON PISTAS.

Categoría: ${category?.name}
Dificultad: ${difficulty?.name}

REQUISITOS CRÍTICOS para la FRASE:
- ${selectedDifficulty === 'easy' ? 'Debe ser UNA sola palabra común y REAL que existe' : selectedDifficulty === 'medium' ? 'Debe ser una frase de 2-3 palabras NATURALES (usa artículos o conectores solo si suena más natural)' : 'Debe ser una frase de 3-5 palabras que sea NATURAL y que TODO EXISTA REALMENTE'}
- Relacionada con ${category?.name}
- ${difficulty?.description}
- SOLO cosas que EXISTEN REALMENTE en la vida real
- NO inventes nombres, lugares, productos o conceptos ficticios
- La frase debe sonar NATURAL en español (usa conectores, preposiciones, artículos cuando sea necesario)
- Sin signos de puntuación
- Solo letras y espacios
- En mayúsculas
- Apropiada para todas las edades

EJEMPLOS CORRECTOS de frases naturales:
- Fácil: PIZZA, GATO, CASA, AGUA
- Medio: TORRE EIFFEL, PIZZA HAWAIANA, SISTEMA SOLAR, AGUA DE MAR, MOTOR DE AUTO
- Difícil: INTELIGENCIA ARTIFICIAL, CALENTAMIENTO GLOBAL, PANEL SOLAR, SISTEMA DE NAVEGACIÓN

EJEMPLOS INCORRECTOS (NO hacer):
- ❌ PIZZA ALIEN SUPREMA (no existe realmente)
- ❌ COMPUTADORA CUÁNTICA ZETA (inventado/ficticio)
- ❌ MOTOR ESPACIAL INFINITO (ficticio)

Requisitos para las PISTAS (3 pistas):
- PISTA 1: Una pista indirecta y sutil que NO sea muy obvia
- PISTA 2: Una pista más específica pero sin dar la respuesta
- PISTA 3: Una pista más directa pero que aún requiera pensar

Ejemplos correctos de ${difficulty?.name}:
${selectedDifficulty === 'easy' ? 'PIZZA, GATO, CASA' : selectedDifficulty === 'medium' ? 'TORRE EIFFEL, PIZZA HAWAIANA, AGUA DE MAR' : 'INTELIGENCIA ARTIFICIAL, CALENTAMIENTO GLOBAL, SISTEMA DE NAVEGACIÓN'}${historyText}

IMPORTANTE: Verifica que TODO lo que generes EXISTA REALMENTE y sea reconocible por cualquier persona.

FORMATO DE RESPUESTA (exactamente así):
FRASE: [tu frase aquí]
PISTA1: [pista indirecta]
PISTA2: [pista específica]
PISTA3: [pista directa]`;

      console.log('Enviando prompt a OpenAI:', prompt);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: openAIConfig.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('Respuesta de OpenAI:', data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        console.log('Contenido completo generado:', content);

        // Parsear la respuesta para extraer frase y pistas
        const lines = content.split('\n');
        let phrase = '';
        let hints: string[] = [];

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('FRASE:')) {
            phrase = trimmedLine.replace('FRASE:', '').trim().toUpperCase();
          } else if (trimmedLine.startsWith('PISTA1:')) {
            hints[0] = trimmedLine.replace('PISTA1:', '').trim();
          } else if (trimmedLine.startsWith('PISTA2:')) {
            hints[1] = trimmedLine.replace('PISTA2:', '').trim();
          } else if (trimmedLine.startsWith('PISTA3:')) {
            hints[2] = trimmedLine.replace('PISTA3:', '').trim();
          }
        }

        // Si no se encontró el formato esperado, usar toda la respuesta como frase
        if (!phrase) {
          phrase = content.split('\n')[0].trim().toUpperCase();
          hints = ['Pista no disponible', 'Pista no disponible', 'Pista no disponible'];
        }

        console.log('Frase extraída:', phrase);
        console.log('Pistas extraídas:', hints);

        // Verificar si la frase ya fue generada antes
        if (generatedHistory.includes(phrase)) {
          console.log('Frase repetida detectada, generando nueva...');
          // Intentar generar otra vez (máximo 2 intentos adicionales)
          if (generatedHistory.length < 20) { // Evitar bucle infinito
            generatePhrase();
            return;
          }
        }

        setGeneratedPhrase(phrase);
        setGeneratedHints(hints.filter(h => h)); // Filtrar pistas vacías
        // Agregar al historial (mantener solo las últimas 10)
        setGeneratedHistory(prev => {
          const newHistory = [...prev, phrase];
          return newHistory.slice(-10);
        });
      } else {
        throw new Error('Respuesta inválida de OpenAI');
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      alert(`Error al generar frase: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptPhrase = () => {
    if (generatedPhrase) {
      const category = CATEGORIES.find(c => c.id === selectedCategory);
      onPhraseGenerated({
        text: generatedPhrase,
        category: category?.name || 'Tecnología',
        difficulty: selectedDifficulty,
        hints: generatedHints
      });
      setGeneratedPhrase('');
      setGeneratedHints([]);
    }
  };

  const addManualPhrase = () => {
    if (manualPhrase.trim()) {
      const category = CATEGORIES.find(c => c.id === selectedCategory);
      onPhraseGenerated({
        text: manualPhrase.toUpperCase().trim(),
        category: category?.name || 'Tecnología',
        difficulty: selectedDifficulty,
        hints: ['Pista manual no disponible', 'Crea tus propias pistas', 'Añade pistas personalizadas']
      });
      setManualPhrase('');
    }
  };

  if (showConfig) {
    return (
      <div className="smart-phrase-generator">
        <OpenAIConfig onConfigChange={setOpenAIConfig} />
        <button 
          onClick={() => setShowConfig(false)}
          className="close-config-btn"
          disabled={!openAIConfig.isConfigured}
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="smart-phrase-generator"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="generator-header">
        <div className="header-title">
          <Brain size={24} />
          <h3>Generador Inteligente de Frases</h3>
        </div>
        <button 
          onClick={() => setShowConfig(true)}
          className="config-btn"
          title="Configurar OpenAI"
        >
          <Brain size={16} />
        </button>
      </div>

      <div className="generator-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Categoría</label>
            <div className="select-wrapper">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          <div className="control-group">
            <label>Dificultad</label>
            <div className="difficulty-buttons">
              {DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id as any)}
                  className={`difficulty-btn ${selectedDifficulty === difficulty.id ? 'active' : ''}`}
                  style={{ '--difficulty-color': difficulty.color } as any}
                >
                  <Target size={14} />
                  {difficulty.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="generate-section">
          <button
            onClick={generatePhrase}
            disabled={isGenerating || !openAIConfig.isConfigured}
            className="generate-btn"
            style={{ 
              backgroundColor: !openAIConfig.isConfigured ? '#ccc' : '#4CAF50',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              cursor: isGenerating || !openAIConfig.isConfigured ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="spinning" />
                Generando...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                Generar Frase IA
              </>
            )}
          </button>

          {!openAIConfig.isConfigured && (
            <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '8px' }}>
              ⚠️ Configura tu API Key de OpenAI primero
            </p>
          )}

          {generatedPhrase && (
            <motion.div
              className="generated-phrase"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: '#f0f8ff',
                border: '2px solid #4CAF50',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px',
                textAlign: 'center'
              }}
            >
              <div
                className="phrase-text"
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '16px'
                }}
              >
                {generatedPhrase}
              </div>

              {/* Mostrar pistas generadas */}
              {generatedHints.length > 0 && (
                <div className="generated-hints" style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffd700',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  textAlign: 'left'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '14px' }}>
                    💡 Pistas generadas:
                  </h4>
                  {generatedHints.map((hint, index) => (
                    <div key={index} style={{
                      fontSize: '13px',
                      color: '#856404',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ fontWeight: 'bold', minWidth: '20px' }}>{index + 1}.</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="phrase-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={acceptPhrase} 
                  className="accept-btn"
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} />
                  AGREGAR FRASE
                </button>
                <button 
                  onClick={generatePhrase} 
                  className="regenerate-btn"
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={16} />
                  Generar otra
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="manual-section">
          <div className="section-divider">
            <span>O agregar manualmente</span>
          </div>
          <div className="manual-input">
            <input
              type="text"
              placeholder="Escribe tu frase personalizada..."
              value={manualPhrase}
              onChange={(e) => setManualPhrase(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addManualPhrase()}
              className="manual-phrase-input"
            />
            <button
              onClick={addManualPhrase}
              disabled={!manualPhrase.trim()}
              className="add-manual-btn"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartPhraseGenerator;