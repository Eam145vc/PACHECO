import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Gift,
  Users,
  DollarSign,
  Search,
  ArrowUp,
  Filter,
  Settings,
  List,
  CheckSquare,
  Square
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  description: string;
  active: boolean;
  createdAt: string;
}

interface ProductForm {
  title: string;
  image: string;
  price: string;
  description: string;
}

const CoronasAdminPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProductForm>({
    title: '',
    image: '',
    price: '',
    description: ''
  });
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Usuario management states
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    amount: '',
    description: ''
  });

  // Palabras/frases usadas states
  const [showUsedWords, setShowUsedWords] = useState(false);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();

    // Scroll listener para el botón de scroll to top
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);

    // Cargar palabras usadas al inicio
    loadUsedWords();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('error', 'Error al cargar productos');
    }
    setLoading(false);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const resetForm = () => {
    setFormData({ title: '', image: '', price: '', description: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.price.trim()) {
      showNotification('error', 'Título y precio son requeridos');
      return;
    }

    const price = parseInt(formData.price);
    if (isNaN(price) || price < 1) {
      showNotification('error', 'El precio debe ser un número mayor a 0');
      return;
    }

    try {
      const url = editingProduct ? `/products/${editingProduct.id}` : '/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          image: formData.image.trim(),
          price: price,
          description: formData.description.trim()
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', editingProduct ? 'Producto actualizado' : 'Producto creado');
        loadProducts();
        resetForm();
      } else {
        showNotification('error', data.message || 'Error al guardar producto');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('error', 'Error al guardar producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      image: product.image,
      price: product.price.toString(),
      description: product.description
    });
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.title}"?`)) return;

    try {
      const response = await fetch(`/products/${product.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', 'Producto eliminado');
        loadProducts();
      } else {
        showNotification('error', data.message || 'Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('error', 'Error al eliminar producto');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch(`/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !product.active
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', product.active ? 'Producto desactivado' : 'Producto activado');
        loadProducts();
      } else {
        showNotification('error', data.message || 'Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error toggling product:', error);
      showNotification('error', 'Error al actualizar producto');
    }
  };

  const handleAddCoronas = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userForm.username.trim() || !userForm.amount.trim()) {
      showNotification('error', 'Usuario y cantidad son requeridos');
      return;
    }

    const amount = parseInt(userForm.amount);
    if (isNaN(amount) || amount < 1) {
      showNotification('error', 'La cantidad debe ser un número mayor a 0');
      return;
    }

    try {
      const response = await fetch('/api/coronas/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userForm.username.trim(),
          amount: amount,
          description: userForm.description.trim() || 'Admin addition'
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', `${amount} coronas agregadas a @${data.username}`);
        setUserForm({ username: '', amount: '', description: '' });
      } else {
        showNotification('error', data.message || 'Error al agregar coronas');
      }
    } catch (error) {
      console.error('Error adding coronas:', error);
      showNotification('error', 'Error al agregar coronas');
    }
  };

  // Funciones para gestión de palabras usadas
  const loadUsedWords = async () => {
    try {
      // Simular carga desde API o localStorage
      const stored = localStorage.getItem('usedWords');
      if (stored) {
        setUsedWords(JSON.parse(stored));
      } else {
        // Palabras de ejemplo
        setUsedWords([
          'HELLO WORLD',
          'INTELIGENCIA ARTIFICIAL',
          'PIZZA HAWAIANA',
          'TORRE EIFFEL',
          'LEON MARINO',
          'PELICULAS DE ACCION',
          'MUSICA CLASICA'
        ]);
      }
    } catch (error) {
      console.error('Error loading used words:', error);
    }
  };

  const toggleWordSelection = (word: string) => {
    const newSelection = new Set(selectedWords);
    if (newSelection.has(word)) {
      newSelection.delete(word);
    } else {
      newSelection.add(word);
    }
    setSelectedWords(newSelection);
  };

  const selectAllWords = () => {
    setSelectedWords(new Set(usedWords));
  };

  const deselectAllWords = () => {
    setSelectedWords(new Set());
  };

  const deleteSelectedWords = () => {
    if (selectedWords.size === 0) {
      showNotification('error', 'No hay palabras seleccionadas');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedWords.size} palabra(s) seleccionada(s)?`)) {
      return;
    }

    const newUsedWords = usedWords.filter(word => !selectedWords.has(word));
    setUsedWords(newUsedWords);
    setSelectedWords(new Set());

    // Guardar en localStorage
    localStorage.setItem('usedWords', JSON.stringify(newUsedWords));

    showNotification('success', `${selectedWords.size} palabra(s) eliminada(s) correctamente`);
  };

  const clearAllUsedWords = () => {
    if (!confirm('¿Estás seguro de eliminar TODAS las palabras usadas? Esta acción no se puede deshacer.')) {
      return;
    }

    setUsedWords([]);
    setSelectedWords(new Set());
    localStorage.removeItem('usedWords');

    showNotification('success', 'Todas las palabras usadas han sido eliminadas');
  };

  // Función para scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para scroll a sección específica
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtrar productos por término de búsqueda
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="coronas-admin-panel">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="coronas-admin-panel">
      {/* Notification */}
      {notification && (
        <motion.div 
          className={`notification ${notification.type}`}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
        >
          {notification.message}
        </motion.div>
      )}

      {/* Header */}
      <div className="header">
        <Link to="/admin" className="back-button">
          <ArrowLeft size={24} />
          Panel Admin
        </Link>
        <h1><Crown className="crown-icon" /> Admin de Coronas</h1>
      </div>

      {/* Navegación rápida flotante */}
      <div className="admin-quick-nav">
        <button
          className="nav-button"
          onClick={() => scrollToSection('stats')}
          title="Estadísticas"
        >
          <Gift size={24} />
        </button>
        <button
          className="nav-button"
          onClick={() => scrollToSection('actions')}
          title="Acciones"
        >
          <Settings size={24} />
        </button>
        <button
          className="nav-button"
          onClick={() => scrollToSection('products')}
          title="Productos"
        >
          <Crown size={24} />
        </button>
      </div>

      {/* Búsqueda rápida */}
      <div className="quick-search">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Search size={24} color="#ffd700" />
          <input
            type="text"
            placeholder="Buscar productos por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '8px',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div id="stats" className="stats-grid">
        <div className="stat-card">
          <Gift size={32} />
          <div className="stat-info">
            <span className="stat-number">{products.length}</span>
            <span className="stat-label">Productos Total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-number">{products.filter(p => p.active).length}</span>
            <span className="stat-label">Productos Activos</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div id="actions" className="actions">
        <button 
          className="primary-button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
        <button 
          className="secondary-button"
          onClick={() => setShowUserManagement(!showUserManagement)}
        >
          <Users size={20} />
          Gestión de Usuarios
        </button>
        <button
          className="secondary-button"
          onClick={() => setShowUsedWords(!showUsedWords)}
        >
          <List size={20} />
          Palabras Usadas
        </button>
      </div>

      {/* User Management */}
      {showUserManagement && (
        <motion.div 
          className="user-management-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3><Users size={24} /> Agregar Coronas a Usuario</h3>
          <form onSubmit={handleAddCoronas} className="user-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre de usuario (sin @)"
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
              />
              <input
                type="number"
                placeholder="Cantidad de coronas"
                min="1"
                value={userForm.amount}
                onChange={(e) => setUserForm({...userForm, amount: e.target.value})}
              />
            </div>
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={userForm.description}
              onChange={(e) => setUserForm({...userForm, description: e.target.value})}
            />
            <button type="submit" className="submit-button">
              <DollarSign size={18} />
              Agregar Coronas
            </button>
          </form>
        </motion.div>
      )}

      {/* Used Words Management */}
      {showUsedWords && (
        <motion.div
          className="user-management-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3><List size={24} /> Gestión de Palabras Usadas</h3>

          <div className="used-words-controls" style={{ marginBottom: '25px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={selectAllWords}
              className="submit-button"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', minHeight: '50px', padding: '10px 20px' }}
            >
              <CheckSquare size={18} />
              Seleccionar Todo
            </button>

            <button
              onClick={deselectAllWords}
              className="submit-button"
              style={{ background: 'rgba(255, 255, 255, 0.2)', minHeight: '50px', padding: '10px 20px' }}
            >
              <Square size={18} />
              Deseleccionar Todo
            </button>

            <button
              onClick={deleteSelectedWords}
              className="submit-button"
              style={{ background: 'linear-gradient(135deg, #f56565, #e53e3e)', minHeight: '50px', padding: '10px 20px' }}
              disabled={selectedWords.size === 0}
            >
              <Trash2 size={18} />
              Eliminar Seleccionadas ({selectedWords.size})
            </button>

            <button
              onClick={clearAllUsedWords}
              className="submit-button"
              style={{ background: 'linear-gradient(135deg, #ed8936, #dd6b20)', minHeight: '50px', padding: '10px 20px' }}
            >
              <X size={18} />
              Limpiar Todo
            </button>
          </div>

          <div className="used-words-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '15px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px'
          }}>
            {usedWords.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '40px',
                fontStyle: 'italic'
              }}>
                No hay palabras usadas registradas
              </div>
            ) : (
              usedWords.map((word, index) => (
                <div
                  key={index}
                  className={`used-word-item ${selectedWords.has(word) ? 'selected' : ''}`}
                  onClick={() => toggleWordSelection(word)}
                  style={{
                    background: selectedWords.has(word)
                      ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: selectedWords.has(word)
                      ? '2px solid #ffd700'
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: selectedWords.has(word) ? '#1a202c' : 'white',
                    fontWeight: selectedWords.has(word) ? '700' : '500'
                  }}
                >
                  {selectedWords.has(word) ? (
                    <CheckSquare size={18} color="#1a202c" />
                  ) : (
                    <Square size={18} color="rgba(255, 255, 255, 0.6)" />
                  )}
                  <span style={{ fontSize: '0.9rem' }}>{word}</span>
                </div>
              ))
            )}
          </div>

          {usedWords.length > 0 && (
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem'
            }}>
              Total: {usedWords.length} palabras | Seleccionadas: {selectedWords.size}
            </div>
          )}
        </motion.div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <motion.div 
            className="modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Título del producto *"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
              <input
                type="url"
                placeholder="URL de la imagen"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
              <input
                type="number"
                placeholder="Precio en Coronas *"
                min="1"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
              <textarea
                placeholder="Descripción del producto"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <div className="form-buttons">
                <button type="button" onClick={resetForm}>
                  <X size={18} />
                  Cancelar
                </button>
                <button type="submit" className="primary">
                  <Save size={18} />
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Products List */}
      <div id="products" className="products-section">
        <h2><Gift size={24} /> Productos</h2>
        
        {products.length === 0 ? (
          <div className="no-products">
            <p>No hay productos creados</p>
            <button onClick={() => setShowForm(true)}>
              <Plus size={20} />
              Crear primer producto
            </button>
          </div>
        ) : (
          <div className="products-list">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                className={`product-item ${!product.active ? 'inactive' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="product-preview">
                  {product.image && (
                    <img src={product.image} alt={product.title} />
                  )}
                  <div className="product-details">
                    <h4>{product.title}</h4>
                    {product.description && <p>{product.description}</p>}
                    <div className="price">
                      <Crown size={16} />
                      {product.price}
                    </div>
                    <div className="status">
                      Estado: <span className={product.active ? 'active' : 'inactive'}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="product-actions">
                  <button
                    onClick={() => handleEdit(product)}
                    className="edit-button"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`toggle-button ${product.active ? 'active' : 'inactive'}`}
                    title={product.active ? 'Desactivar' : 'Activar'}
                  >
                    {product.active ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="delete-button"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Botón de scroll to top */}
      <button
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        title="Volver arriba"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

export default CoronasAdminPanel;