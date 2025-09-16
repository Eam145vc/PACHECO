import supabase from '../lib/supabase.js'

export const coronasApi = {
  // Obtener coronas de un usuario
  async getUserCoronas(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, coronas')
        .ilike('username', username)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return {
        success: true,
        userId: data?.username || username,
        coronas: data?.coronas || 0
      }
    } catch (error) {
      console.error('Error getting user coronas:', error)
      return {
        success: false,
        error: error.message
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