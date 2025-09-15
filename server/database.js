const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'data');
    this.usersFile = path.join(this.dbPath, 'users.json');
    this.productsFile = path.join(this.dbPath, 'products.json');
    this.transactionsFile = path.join(this.dbPath, 'transactions.json');
    this.codesFile = path.join(this.dbPath, 'verification_codes.json');
    this.ordersFile = path.join(this.dbPath, 'orders.json');
    
    this.initDatabase();
  }

  initDatabase() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }

    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify({}));
    }

    if (!fs.existsSync(this.productsFile)) {
      fs.writeFileSync(this.productsFile, JSON.stringify([]));
    }

    if (!fs.existsSync(this.transactionsFile)) {
      fs.writeFileSync(this.transactionsFile, JSON.stringify([]));
    }

    if (!fs.existsSync(this.codesFile)) {
      fs.writeFileSync(this.codesFile, JSON.stringify({}));
    }

    if (!fs.existsSync(this.ordersFile)) {
      fs.writeFileSync(this.ordersFile, JSON.stringify([]));
    }
  }

  getUsers() {
    try {
      return JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    } catch (error) {
      console.error('Error reading users:', error);
      return {};
    }
  }

  saveUsers(users) {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  getUserCoronas(username) {
    const users = this.getUsers();
    // Buscar de forma case-insensitive
    const userKey = Object.keys(users).find(key => key.toLowerCase() === username.toLowerCase());
    return userKey && users[userKey] ? users[userKey].coronas || 0 : 0;
  }

  // Método auxiliar para encontrar el username correcto (case-insensitive)
  findUser(username) {
    const users = this.getUsers();
    const userKey = Object.keys(users).find(key => key.toLowerCase() === username.toLowerCase());
    return userKey ? { username: userKey, data: users[userKey] } : null;
  }

  addCoronas(username, amount, description = 'Manual addition') {
    const users = this.getUsers();
    if (!users[username]) {
      users[username] = { coronas: 0 };
    }
    users[username].coronas = (users[username].coronas || 0) + amount;
    this.saveUsers(users);
    
    this.addTransaction(username, 'add', amount, description);
    return users[username].coronas;
  }

  subtractCoronas(username, amount, description = 'Purchase') {
    const users = this.getUsers();
    if (!users[username]) {
      users[username] = { coronas: 0 };
    }

    if (users[username].coronas < amount) {
      return false;
    }

    users[username].coronas -= amount;
    this.saveUsers(users);

    this.addTransaction(username, 'subtract', amount, description);
    return true;
  }

  deleteUser(username) {
    const users = this.getUsers();
    // Buscar de forma case-insensitive
    const userKey = Object.keys(users).find(key => key.toLowerCase() === username.toLowerCase());

    if (!userKey) {
      return false;
    }

    delete users[userKey];
    this.saveUsers(users);

    this.addTransaction(userKey, 'delete', 0, 'User deleted by admin');
    return true;
  }

  getProducts() {
    try {
      return JSON.parse(fs.readFileSync(this.productsFile, 'utf8'));
    } catch (error) {
      console.error('Error reading products:', error);
      return [];
    }
  }

  saveProducts(products) {
    try {
      fs.writeFileSync(this.productsFile, JSON.stringify(products, null, 2));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  }

  addProduct(title, image, price, description = '', deliverable = '') {
    const products = this.getProducts();
    const newProduct = {
      id: Date.now().toString(),
      title,
      image,
      price,
      description,
      deliverable, // Contenido que se entrega al usuario (código, enlace, instrucciones, etc.)
      active: true,
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return false;
    
    products[index] = { ...products[index], ...updates };
    this.saveProducts(products);
    return products[index];
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    
    if (filtered.length === products.length) return false;
    
    this.saveProducts(filtered);
    return true;
  }

  addTransaction(username, type, amount, description) {
    try {
      const transactions = JSON.parse(fs.readFileSync(this.transactionsFile, 'utf8'));
      transactions.push({
        id: Date.now().toString(),
        username,
        type,
        amount,
        description,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(this.transactionsFile, JSON.stringify(transactions, null, 2));
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  }

  generateVerificationCode(username, productId) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codes = this.getVerificationCodes();
    
    codes[code] = {
      username,
      productId,
      createdAt: Date.now(),
      used: false
    };
    
    this.saveVerificationCodes(codes);
    return code;
  }

  verifyCode(code) {
    const codes = this.getVerificationCodes();
    const codeData = codes[code];
    
    if (!codeData || codeData.used) return false;
    
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - codeData.createdAt > fiveMinutes) {
      delete codes[code];
      this.saveVerificationCodes(codes);
      return false;
    }
    
    codeData.used = true;
    this.saveVerificationCodes(codes);
    return codeData;
  }

  getVerificationCodes() {
    try {
      return JSON.parse(fs.readFileSync(this.codesFile, 'utf8'));
    } catch (error) {
      console.error('Error reading codes:', error);
      return {};
    }
  }

  saveVerificationCodes(codes) {
    try {
      fs.writeFileSync(this.codesFile, JSON.stringify(codes, null, 2));
    } catch (error) {
      console.error('Error saving codes:', error);
    }
  }

  cleanExpiredCodes() {
    const codes = this.getVerificationCodes();
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();
    
    for (const code in codes) {
      if (now - codes[code].createdAt > fiveMinutes) {
        delete codes[code];
      }
    }
    
    this.saveVerificationCodes(codes);
  }

  // ORDERS MANAGEMENT
  getOrders() {
    try {
      return JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
    } catch (error) {
      console.error('Error reading orders:', error);
      return [];
    }
  }

  saveOrders(orders) {
    try {
      fs.writeFileSync(this.ordersFile, JSON.stringify(orders, null, 2));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  createOrder(username, productId, productTitle, productPrice) {
    const orders = this.getOrders();
    const newOrder = {
      id: Date.now().toString(),
      username,
      productId,
      productTitle,
      productPrice,
      status: 'pending', // pending, fulfilled, cancelled
      createdAt: new Date().toISOString(),
      fulfilledAt: null,
      fulfillmentContent: null
    };
    
    orders.push(newOrder);
    this.saveOrders(orders);
    return newOrder;
  }

  fulfillOrder(orderId, fulfillmentContent) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) return false;
    
    orders[orderIndex].status = 'fulfilled';
    orders[orderIndex].fulfilledAt = new Date().toISOString();
    orders[orderIndex].fulfillmentContent = fulfillmentContent;
    
    this.saveOrders(orders);
    return orders[orderIndex];
  }

  getPendingOrders() {
    const orders = this.getOrders();
    return orders.filter(o => o.status === 'pending');
  }

  getOrderById(orderId) {
    const orders = this.getOrders();
    return orders.find(o => o.id === orderId);
  }
}

module.exports = new Database();