require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (para el frontend de coronas)
app.use(express.static(path.join(__dirname, 'public')));

// Simular base de datos en memoria (en producción esto debería ser una DB real)
let usersData = {};
let products = [
  { id: 1, title: "Mensaje personalizado", description: "Te envío un mensaje personalizado", price: 100, active: true },
  { id: 2, title: "Shout-out en vivo", description: "Te menciono en el próximo live", price: 250, active: true },
  { id: 3, title: "Video personalizado", description: "Grabo un video solo para ti", price: 500, active: true }
];

// ===============================
// ENDPOINTS SISTEMA DE CORONAS
// ===============================

// Obtener saldo de coronas de un usuario
app.get('/coronas/:username', (req, res) => {
  const { username } = req.params;
  try {
    const userCoronas = usersData[username]?.coronas || 0;
    res.json({
      success: true,
      userId: username,
      coronas: userCoronas,
      isNew: !usersData[username]
    });
  } catch (error) {
    console.error('Error al obtener coronas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener productos disponibles
app.get('/products', (req, res) => {
  try {
    const activeProducts = products.filter(p => p.active);
    res.json({ success: true, products: activeProducts });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para sincronizar datos desde el servidor local del juego
app.post('/sync/user', (req, res) => {
  const { username, coronas, operation, amount, description } = req.body;

  try {
    if (!usersData[username]) {
      usersData[username] = { coronas: 0, history: [] };
    }

    if (operation === 'set') {
      usersData[username].coronas = coronas;
    } else if (operation === 'add') {
      usersData[username].coronas += amount;
    } else if (operation === 'subtract') {
      usersData[username].coronas = Math.max(0, usersData[username].coronas - amount);
    }

    if (description) {
      usersData[username].history.push({
        date: new Date().toISOString(),
        operation,
        amount,
        description,
        balance: usersData[username].coronas
      });
    }

    res.json({
      success: true,
      username,
      coronas: usersData[username].coronas
    });
  } catch (error) {
    console.error('Error sincronizando usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Página principal de consulta de coronas
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema de Coronas TikTok</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            h1 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
            }
            .search-box {
                margin-bottom: 30px;
            }
            input {
                width: 100%;
                padding: 15px;
                border: 2px solid #ddd;
                border-radius: 10px;
                font-size: 16px;
                box-sizing: border-box;
            }
            button {
                width: 100%;
                padding: 15px;
                background: #ff0050;
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 10px;
            }
            button:hover {
                background: #cc0040;
            }
            .result {
                margin-top: 20px;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            .success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            .error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
            .corona-count {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
            }
            .products {
                margin-top: 30px;
            }
            .product {
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 15px;
                margin: 10px 0;
                background: #f8f9fa;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>👑 Sistema de Coronas TikTok</h1>
            <div class="search-box">
                <input type="text" id="username" placeholder="Ingresa tu nombre de usuario TikTok">
                <button onclick="checkCoronas()">Consultar Coronas</button>
            </div>
            <div id="result"></div>
            <div id="products" style="display: none;">
                <h3>🎁 Productos Disponibles</h3>
                <div id="productsList"></div>
            </div>
        </div>

        <script>
            async function checkCoronas() {
                const username = document.getElementById('username').value.trim();
                if (!username) {
                    showResult('Por favor ingresa tu nombre de usuario', 'error');
                    return;
                }

                try {
                    const response = await fetch(\`/coronas/\${encodeURIComponent(username)}\`);
                    const data = await response.json();

                    if (data.success) {
                        showResult(\`
                            <div class="corona-count">👑 \${data.coronas} Coronas</div>
                            <p>Usuario: @\${data.userId}</p>
                            \${data.isNew ? '<p><em>Usuario nuevo - ¡Participa en el juego para ganar coronas!</em></p>' : ''}
                        \`, 'success');

                        loadProducts();
                    } else {
                        showResult('Error al consultar coronas', 'error');
                    }
                } catch (error) {
                    showResult('Error de conexión', 'error');
                }
            }

            function showResult(html, type) {
                const result = document.getElementById('result');
                result.innerHTML = html;
                result.className = \`result \${type}\`;
            }

            async function loadProducts() {
                try {
                    const response = await fetch('/products');
                    const data = await response.json();

                    if (data.success) {
                        const productsHtml = data.products.map(product => \`
                            <div class="product">
                                <h4>\${product.title}</h4>
                                <p>\${product.description}</p>
                                <strong>💰 \${product.price} coronas</strong>
                            </div>
                        \`).join('');

                        document.getElementById('productsList').innerHTML = productsHtml;
                        document.getElementById('products').style.display = 'block';
                    }
                } catch (error) {
                    console.error('Error loading products:', error);
                }
            }

            // Allow enter key to search
            document.getElementById('username').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    checkCoronas();
                }
            });
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(\`🚀 Sistema de Coronas funcionando en puerto \${PORT}\`);
  console.log(\`🌐 Acceso público para consultar coronas\`);
});