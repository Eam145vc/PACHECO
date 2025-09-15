import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Gift,
  Users,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Minus,
  UserX
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  description: string;
  deliverable: string;
  active: boolean;
  createdAt: string;
}

interface ProductForm {
  title: string;
  image: string;
  price: string;
  description: string;
  deliverable: string;
}

interface User {
  username: string;
  coronas: number;
}

interface Order {
  id: string;
  username: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  createdAt: string;
  fulfilledAt: string | null;
  fulfillmentContent: string | null;
}

const CoronasAdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProductForm>({
    title: '',
    image: '',
    price: '',
    description: '',
    deliverable: ''
  });
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [fulfillmentContent, setFulfillmentContent] = useState('');
  const [fulfillingOrderId, setFulfillingOrderId] = useState<string | null>(null);

  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadProducts();
    loadUsers();
    loadOrders();
    loadPendingOrders();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/products');
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

  const loadUsers = async () => {
    try {
      const response = await fetch('/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('error', 'Error al cargar usuarios');
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const response = await fetch('/orders/pending');
      const data = await response.json();
      if (data.success) {
        setPendingOrders(data.orders);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
    }
  };

  const handleFulfillOrder = async (orderId: string) => {
    if (!fulfillmentContent.trim()) {
      showNotification('error', 'El contenido de entrega es requerido');
      return;
    }

    try {
      const response = await fetch(`/orders/${orderId}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fulfillmentContent: fulfillmentContent.trim()
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', data.message);
        setFulfillmentContent('');
        setFulfillingOrderId(null);
        loadPendingOrders();
        loadOrders();
      } else {
        showNotification('error', data.message);
      }
    } catch (error) {
      console.error('Error fulfilling order:', error);
      showNotification('error', 'Error al procesar la orden');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const resetForm = () => {
    setFormData({ title: '', image: '', price: '', description: '', deliverable: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.price.trim() || !formData.deliverable.trim()) {
      showNotification('error', 'Título, precio y entregable son requeridos');
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
          description: formData.description.trim(),
          deliverable: formData.deliverable.trim()
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
      description: product.description,
      deliverable: product.deliverable || ''
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
      const response = await fetch('/coronas/add', {
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
        showNotification('success', `${amount} coronas agregadas a @${data.userId}`);
        setUserForm({ username: '', amount: '', description: '' });
        loadUsers(); // Recargar la lista de usuarios
      } else {
        showNotification('error', data.message || 'Error al agregar coronas');
      }
    } catch (error) {
      console.error('Error adding coronas:', error);
      showNotification('error', 'Error al agregar coronas');
    }
  };

  const handleRemoveCoronas = async (e: React.FormEvent) => {
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
      const response = await fetch('/coronas/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userForm.username.trim(),
          amount: amount,
          description: userForm.description.trim() || 'Admin removal'
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', `${amount} coronas removidas de @${data.userId}`);
        setUserForm({ username: '', amount: '', description: '' });
        loadUsers(); // Recargar la lista de usuarios
      } else {
        showNotification('error', data.message || 'Error al remover coronas');
      }
    } catch (error) {
      console.error('Error removing coronas:', error);
      showNotification('error', 'Error al remover coronas');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente al usuario @${username}? Esta acción no se puede deshacer.`)) return;

    try {
      const response = await fetch(`/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', `Usuario @${username} eliminado exitosamente`);
        loadUsers(); // Recargar la lista de usuarios
      } else {
        showNotification('error', data.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('error', 'Error al eliminar usuario');
    }
  };

  if (loading) {
    return (
      <div className="loading">Cargando...</div>
    );
  }

  return (
    <div className="coronas-admin-content">
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

      {/* Tab Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={20} />
          Productos
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={20} />
          Usuarios
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Clock size={20} />
          Órdenes ({pendingOrders.length})
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {activeTab === 'products' && (
          <>
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
          </>
        )}
        {activeTab === 'users' && (
          <>
            <div className="stat-card">
              <Users size={32} />
              <div className="stat-info">
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Usuarios Total</span>
              </div>
            </div>
            <div className="stat-card">
              <Crown size={32} />
              <div className="stat-info">
                <span className="stat-number">{users.reduce((sum, u) => sum + u.coronas, 0)}</span>
                <span className="stat-label">Coronas Totales</span>
              </div>
            </div>
          </>
        )}
        {activeTab === 'orders' && (
          <>
            <div className="stat-card">
              <Clock size={32} />
              <div className="stat-info">
                <span className="stat-number">{pendingOrders.length}</span>
                <span className="stat-label">Órdenes Pendientes</span>
              </div>
            </div>
            <div className="stat-card">
              <CheckCircle size={32} />
              <div className="stat-info">
                <span className="stat-number">{orders.filter(o => o.status === 'fulfilled').length}</span>
                <span className="stat-label">Órdenes Completadas</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="actions">
        {activeTab === 'products' && (
          <button 
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        )}
        {activeTab === 'users' && (
          <>
            <button 
              className="secondary-button"
              onClick={() => setShowUserManagement(!showUserManagement)}
            >
              <Users size={20} />
              Gestión de Usuarios
            </button>
            <button 
              className="secondary-button"
              onClick={() => setShowUsersList(!showUsersList)}
            >
              <Users size={20} />
              Ver Usuarios ({users.length})
            </button>
          </>
        )}
        {activeTab === 'orders' && (
          <button 
            className="secondary-button"
            onClick={() => {loadPendingOrders(); loadOrders();}}
          >
            <Clock size={20} />
            Actualizar Órdenes
          </button>
        )}
      </div>

      {/* User Management */}
      {activeTab === 'users' && showUserManagement && (
        <motion.div 
          className="user-management-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3><Users size={24} /> Gestión de Coronas de Usuario</h3>
          <form className="user-form">
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
            <div className="button-row">
              <button type="button" onClick={handleAddCoronas} className="submit-button add-button">
                <DollarSign size={18} />
                Agregar Coronas
              </button>
              <button type="button" onClick={handleRemoveCoronas} className="submit-button remove-button">
                <Minus size={18} />
                Quitar Coronas
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users List */}
      {activeTab === 'users' && showUsersList && (
        <motion.div 
          className="users-list-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3><Users size={24} /> Usuarios Registrados</h3>
          {users.length === 0 ? (
            <div className="no-users">
              <p>No hay usuarios registrados aún</p>
            </div>
          ) : (
            <div className="users-grid">
              {users.map((user) => (
                <div key={user.username} className="user-card">
                  <div className="user-info">
                    <span className="username">@{user.username}</span>
                    <div className="coronas-display">
                      <Crown size={16} />
                      <span>{user.coronas}</span>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button
                      onClick={() => {
                        setUserForm({...userForm, username: user.username});
                        setShowUserManagement(true);
                      }}
                      className="manage-coronas-btn"
                      title="Gestionar coronas"
                    >
                      <DollarSign size={14} />
                      Gestionar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.username)}
                      className="delete-user-btn"
                      title="Eliminar usuario"
                    >
                      <UserX size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Orders Section */}
      {activeTab === 'orders' && (
        <div className="orders-section">
          <h2><Clock size={24} /> Órdenes Pendientes</h2>
          
          {pendingOrders.length === 0 ? (
            <div className="no-orders">
              <p>No hay órdenes pendientes</p>
            </div>
          ) : (
            <div className="orders-list">
              {pendingOrders.map((order) => (
                <motion.div
                  key={order.id}
                  className="order-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="order-header">
                    <div className="order-info">
                      <h4>{order.productTitle}</h4>
                      <p className="username">Cliente: @{order.username}</p>
                      <p className="price">
                        <Crown size={16} />
                        {order.productPrice} Coronas
                      </p>
                      <p className="created-at">
                        Creada: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="order-status">
                      <span className="status-badge pending">
                        <Clock size={16} />
                        Pendiente
                      </span>
                    </div>
                  </div>
                  
                  {fulfillingOrderId === order.id ? (
                    <div className="fulfill-form">
                      <h4>Contenido de Entrega</h4>
                      <textarea
                        placeholder="Ingresa el código, enlace o contenido que se enviará al usuario..."
                        value={fulfillmentContent}
                        onChange={(e) => setFulfillmentContent(e.target.value)}
                        rows={4}
                        className="fulfillment-textarea"
                      />
                      <div className="fulfill-buttons">
                        <button 
                          onClick={() => {
                            setFulfillingOrderId(null);
                            setFulfillmentContent('');
                          }}
                          className="cancel-button"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleFulfillOrder(order.id)}
                          className="confirm-button"
                          disabled={!fulfillmentContent.trim()}
                        >
                          <CheckCircle size={16} />
                          Entregar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="order-actions">
                      <button
                        onClick={() => {
                          setFulfillingOrderId(order.id);
                          setFulfillmentContent('');
                        }}
                        className="fulfill-button"
                      >
                        <Package size={16} />
                        Procesar Orden
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Completed Orders */}
          {orders.filter(o => o.status === 'fulfilled').length > 0 && (
            <div className="completed-orders-section">
              <h3><CheckCircle size={20} /> Órdenes Completadas</h3>
              <div className="orders-list">
                {orders.filter(o => o.status === 'fulfilled').slice(0, 10).map((order) => (
                  <motion.div
                    key={order.id}
                    className="order-item completed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="order-header">
                      <div className="order-info">
                        <h4>{order.productTitle}</h4>
                        <p className="username">Cliente: @{order.username}</p>
                        <p className="price">
                          <Crown size={16} />
                          {order.productPrice} Coronas
                        </p>
                        <p className="fulfilled-at">
                          Entregada: {order.fulfilledAt ? new Date(order.fulfilledAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="order-status">
                        <span className="status-badge fulfilled">
                          <CheckCircle size={16} />
                          Completada
                        </span>
                      </div>
                    </div>
                    
                    {order.fulfillmentContent && (
                      <div className="fulfillment-preview">
                        <strong>Contenido entregado:</strong>
                        <p>{order.fulfillmentContent.slice(0, 150)}{order.fulfillmentContent.length > 150 ? '...' : ''}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {activeTab === 'products' && showForm && (
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
              <textarea
                placeholder="Entregable del producto (código, enlace, instrucciones, etc.) *"
                rows={4}
                value={formData.deliverable}
                onChange={(e) => setFormData({...formData, deliverable: e.target.value})}
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
      {activeTab === 'products' && (
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
                    ✏️
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
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default CoronasAdminContent;