import supabase from '../lib/supabase.js'

export const coronasApi = {
  // ADMIN - Obtener todos los usuarios con coronas
  async getAllUsers() {
    try {
      console.log('🔍 [getAllUsers] Iniciando consulta de usuarios...')

      const { data, error } = await supabase
        .from('users')
        .select('username, coronas')
        .order('coronas', { ascending: false })

      console.log('🔍 [getAllUsers] Resultado:', { data, error })

      if (error) {
        console.error('❌ [getAllUsers] Error de Supabase:', error)
        throw error
      }

      console.log('✅ [getAllUsers] Usuarios obtenidos:', data?.length || 0)
      return {
        success: true,
        users: data || []
      }
    } catch (error) {
      console.error('❌ [getAllUsers] Error fatal:', error)
      return {
        success: false,
        users: [],
        error: error.message
      }
    }
  },

  // ADMIN - Agregar coronas a un usuario
  async addCoronasToUser(username, amount, description = 'Manual addition') {
    try {
      // Obtener coronas actuales
      const currentUser = await this.getUserCoronas(username)
      const newCoronas = currentUser.coronas + amount

      // Actualizar o crear usuario
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          username,
          coronas: newCoronas
        }, {
          onConflict: 'username'
        })

      if (upsertError) throw upsertError

      // Crear transacción
      await supabase
        .from('transactions')
        .insert({
          username,
          type: 'add',
          amount,
          description
        })

      return {
        success: true,
        newBalance: newCoronas
      }
    } catch (error) {
      console.error('Error adding coronas:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ADMIN - Eliminar usuario
  async deleteUser(username) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .ilike('username', username)

      if (error) throw error

      // Crear registro de transacción
      await supabase
        .from('transactions')
        .insert({
          username,
          type: 'delete',
          amount: 0,
          description: 'User deleted by admin'
        })

      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ADMIN - Agregar producto
  async addProduct(title, image, price, description, deliverable) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          title,
          image,
          price: parseInt(price),
          description,
          deliverable,
          active: true
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        product: data
      }
    } catch (error) {
      console.error('Error adding product:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ADMIN - Actualizar producto
  async updateProduct(id, updates) {
    try {
      if (updates.price) {
        updates.price = parseInt(updates.price)
      }

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        product: data
      }
    } catch (error) {
      console.error('Error updating product:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ADMIN - Eliminar producto
  async deleteProduct(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting product:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ADMIN - Obtener todas las órdenes
  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        orders: data || []
      }
    } catch (error) {
      console.error('Error getting orders:', error)
      return {
        success: false,
        orders: []
      }
    }
  },
  // Obtener coronas de un usuario
  async getUserCoronas(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, coronas')
        .ilike('username', username)
        .maybeSingle()

      if (error) {
        throw error
      }

      // Si no existe el usuario, devolver coronas = 0 pero con éxito
      return {
        success: true,
        userId: data?.username || username,
        coronas: data?.coronas || 0
      }
    } catch (error) {
      console.error('Error getting user coronas:', error)
      return {
        success: true, // Cambiar a success: true para mostrar 0 coronas
        userId: username,
        coronas: 0
      }
    }
  },

  // Obtener todos los productos activos
  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        products: data || []
      }
    } catch (error) {
      console.error('Error getting products:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Canjear producto (solo crear orden, sin procesar pago)
  async redeemProduct(username, productId) {
    try {
      // Verificar que el usuario tenga suficientes coronas
      const userResult = await this.getUserCoronas(username)
      if (!userResult.success) {
        return { success: false, message: 'Usuario no encontrado' }
      }

      // Obtener información del producto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return { success: false, message: 'Producto no encontrado' }
      }

      if (userResult.coronas < product.price) {
        return { success: false, message: 'Coronas insuficientes' }
      }

      // Generar código de verificación
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Guardar código de verificación
      const { error: codeError } = await supabase
        .from('verification_codes')
        .insert({
          code,
          username,
          product_id: productId
        })

      if (codeError) throw codeError

      return {
        success: true,
        message: 'Código de verificación generado',
        code: code
      }
    } catch (error) {
      console.error('Error redeeming product:', error)
      return {
        success: false,
        message: 'Error al procesar canje'
      }
    }
  },

  // Confirmar canje con código
  async confirmRedeem(code) {
    try {
      // Verificar código
      const { data: codeData, error: codeError } = await supabase
        .from('verification_codes')
        .select(`
          *,
          products (*)
        `)
        .eq('code', code)
        .eq('used', false)
        .single()

      if (codeError || !codeData) {
        return { success: false, message: 'Código inválido o expirado' }
      }

      // Verificar que no hayan pasado más de 5 minutos
      const fiveMinutes = 5 * 60 * 1000
      const codeAge = new Date() - new Date(codeData.created_at)
      if (codeAge > fiveMinutes) {
        // Eliminar código expirado
        await supabase
          .from('verification_codes')
          .delete()
          .eq('code', code)

        return { success: false, message: 'Código expirado' }
      }

      // Marcar código como usado
      const { error: updateCodeError } = await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('code', code)

      if (updateCodeError) throw updateCodeError

      // Restar coronas del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('coronas')
        .ilike('username', codeData.username)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }

      const currentCoronas = userData?.coronas || 0
      const newBalance = currentCoronas - codeData.products.price

      // Actualizar coronas del usuario (o crear si no existe)
      const { error: updateUserError } = await supabase
        .from('users')
        .upsert({
          username: codeData.username,
          coronas: newBalance
        }, {
          onConflict: 'username'
        })

      if (updateUserError) throw updateUserError

      // Crear registro de transacción
      await supabase
        .from('transactions')
        .insert({
          username: codeData.username,
          type: 'subtract',
          amount: codeData.products.price,
          description: `Canje: ${codeData.products.title}`
        })

      // Crear orden
      await supabase
        .from('orders')
        .insert({
          username: codeData.username,
          product_id: codeData.products.id,
          product_title: codeData.products.title,
          product_price: codeData.products.price,
          status: 'fulfilled',
          fulfillment_content: codeData.products.deliverable,
          fulfilled_at: new Date().toISOString()
        })

      return {
        success: true,
        message: 'Canje realizado exitosamente',
        product: codeData.products.title,
        cost: codeData.products.price,
        deliverable: codeData.products.deliverable,
        newBalance: newBalance
      }
    } catch (error) {
      console.error('Error confirming redeem:', error)
      return {
        success: false,
        message: 'Error al confirmar canje'
      }
    }
  }
}