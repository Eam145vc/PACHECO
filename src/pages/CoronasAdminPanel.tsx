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
  DollarSign
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

  // Usuario management states
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadProducts();
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

      {/* Stats */}
      <div className="stats-grid">
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
      <div className="actions">
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
      <div className="products-section">
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
            {products.map((product) => (
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
    </div>
  );
};

export default CoronasAdminPanel;