import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Gift, ShoppingCart, ArrowLeft, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  description: string;
  deliverable: string;
  active: boolean;
}

interface UserData {
  username: string;
  coronas: number;
}

const CoronasPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadUserData = async (username: string) => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/coronas/${username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setUserData({ username: data.userId, coronas: data.coronas });
      } else {
        showNotification('error', 'Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showNotification('error', `Error al cargar datos del usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      loadUserData(usernameInput.trim());
    }
  };

  const handleRedeem = async () => {
    if (!selectedProduct || !userData) return;
    
    setRedeemLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          productId: selectedProduct.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowRedeemModal(false);
        if (data.code) {
          // Mostrar el código directamente si TikTok no está disponible
          setVerificationCode(data.code);
        }
        setShowCodeModal(true);
        showNotification('success', data.message);
      } else {
        showNotification('error', data.message);
      }
    } catch (error) {
      console.error('Error redeeming product:', error);
      showNotification('error', 'Error al canjear producto');
    }
    setRedeemLoading(false);
  };

  const handleConfirmCode = async () => {
    if (!verificationCode.trim()) {
      showNotification('error', 'Ingresa el código de verificación');
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/confirm-redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Mostrar el deliverable del producto
        const deliverableMessage = `¡Canje exitoso! ${data.product} canjeado por ${data.cost} coronas\n\n📦 TU PRODUCTO:\n${data.deliverable}`;
        alert(deliverableMessage);
        showNotification('success', `¡Canje exitoso! ${data.product} canjeado`);
        setUserData(prev => prev ? { ...prev, coronas: data.newBalance } : null);
        setShowCodeModal(false);
        setVerificationCode('');
      } else {
        showNotification('error', data.message);
      }
    } catch (error) {
      console.error('Error confirming code:', error);
      showNotification('error', 'Error al confirmar código');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };


  return (
    <div className="coronas-page">
      {/* Notification */}
      {notification && (
        <motion.div 
          className={`notification ${notification.type}`}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
        >
          {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {notification.message}
        </motion.div>
      )}

      {/* Header con Login y User Info */}
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLocal && (
          <Link to="/game" className="back-button">
            <ArrowLeft size={24} />
            Volver al juego
          </Link>
        )}

        <h1><Crown className="crown-icon" /> Sistema de Coronas</h1>
        
        <div className="header-right">
          {!userData ? (
            <div className="login-form">
              <form onSubmit={handleUsernameSubmit}>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Usuario de TikTok"
                  disabled={loading}
                  autoComplete="off"
                  className="header-input"
                />
                <button type="submit" disabled={loading || !usernameInput.trim()} className="login-button">
                  {loading ? 'Cargando...' : 'Login'}
                </button>
              </form>
            </div>
          ) : (
            <div className="user-info">
              <div className="username">@{userData.username}</div>
              <div className="corona-balance">
                <Crown className="crown-icon" size={20} />
                <span>{userData.coronas}</span>
                <span className="label">Coronas</span>
              </div>
              <button 
                onClick={() => setUserData(null)} 
                className="logout-button"
                title="Cerrar sesión"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mensaje para usuarios con 0 coronas */}
      {userData && userData.coronas === 0 && (
        <motion.div 
          className="zero-coronas-message"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Crown className="crown-icon" size={24} />
          <h3>¡Bienvenido {userData.username}!</h3>
          <p>Aún no tienes coronas, pero puedes ver todos los productos disponibles para cuando las consigas.</p>
        </motion.div>
      )}

      {/* Products */}
      <motion.div 
        className="products-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2><Gift size={24} /> Productos Canjeables</h2>
        
        {products.length === 0 ? (
          <div className="no-products">
            <p>No hay productos disponibles por el momento</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                className="product-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                {product.image && (
                  <div className="product-image">
                    <img src={product.image} alt={product.title} />
                  </div>
                )}
                <div className="product-info">
                  <h3>{product.title}</h3>
                  {product.description && (
                    <p className="description">{product.description}</p>
                  )}
                  <div className="price">
                    <Crown size={20} />
                    {product.price}
                  </div>
                  <button
                    className={`redeem-button ${!userData || userData.coronas < product.price ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!userData) {
                        showNotification('error', 'Debes iniciar sesión para canjear productos');
                        return;
                      }
                      setSelectedProduct(product);
                      setShowRedeemModal(true);
                    }}
                    disabled={!userData || userData.coronas < product.price}
                  >
                    <ShoppingCart size={18} />
                    {!userData ? 'Inicia sesión para canjear' : 
                     userData.coronas < product.price ? 'Coronas insuficientes' : 'Canjear'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Redeem Modal */}
      {showRedeemModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowRedeemModal(false)}>
          <motion.div 
            className="modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>Confirmar Canje</h3>
            <div className="product-preview">
              <h4>{selectedProduct.title}</h4>
              <div className="price">
                <Crown size={20} />
                {selectedProduct.price} Coronas
              </div>
            </div>
            <p>¿Deseas canjear este producto? Se te enviará un código de verificación a tu TikTok.</p>
            <div className="modal-buttons">
              <button 
                onClick={() => setShowRedeemModal(false)}
                disabled={redeemLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleRedeem}
                disabled={redeemLoading}
                className="primary"
              >
                {redeemLoading ? 'Procesando...' : 'Confirmar Canje'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div className="modal-overlay">
          <motion.div 
            className="modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>Código de Verificación</h3>
            <p>Ingresa el código de 6 dígitos que recibiste en tu TikTok:</p>
            {verificationCode && (
              <div style={{background: '#f0f0f0', padding: '10px', margin: '10px 0', borderRadius: '8px', textAlign: 'center'}}>
                <strong>Tu código: {verificationCode}</strong>
                <br />
                <small>También enviado a tu inbox de TikTok</small>
              </div>
            )}
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="code-input"
            />
            <div className="modal-buttons">
              <button onClick={() => {
                setShowCodeModal(false);
                setVerificationCode('');
              }}>
                Cancelar
              </button>
              <button 
                onClick={handleConfirmCode}
                className="primary"
                disabled={verificationCode.length !== 6}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CoronasPage;