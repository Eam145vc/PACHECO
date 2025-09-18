#!/usr/bin/env node

// Script de prueba local para Supabase
console.log('🧪 Iniciando pruebas locales de Supabase...\n');

import { createClient } from '@supabase/supabase-js';

// Configuración actual (misma que usa el servidor)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ikrjjodyclyizrefqclt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrcmpqb2R5Y2x5aXpyZWZxY2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzMyNDUsImV4cCI6MjA3MzYwOTI0NX0.pg2mQuFkZGiOpinpZoVABJzasATJYrrzXfRt0jGW0WQ';

console.log('📋 Configuración:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key length: ${supabaseKey.length} caracteres`);
console.log(`   Env VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL || 'NO DEFINIDA'}`);
console.log(`   Env VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NO DEFINIDA'}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Test 1: Conexión básica...');
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ ERROR en conexión básica:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Duration:', duration + 'ms\n');
      return false;
    } else {
      console.log('✅ Conexión básica exitosa');
      console.log('   Count:', data);
      console.log('   Duration:', duration + 'ms\n');
      return true;
    }
  } catch (error) {
    console.log('❌ EXCEPCIÓN en conexión básica:');
    console.log('   Error:', error.message);
    console.log('   Type:', error.constructor.name);
    console.log('   Stack:', error.stack.split('\n')[0]);
    return false;
  }
}

async function testSimpleQuery() {
  try {
    console.log('🔍 Test 2: Consulta simple de usuarios...');
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('users')
      .select('username, coronas')
      .limit(3);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ ERROR en consulta simple:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Duration:', duration + 'ms\n');
      return false;
    } else {
      console.log('✅ Consulta simple exitosa');
      console.log('   Usuarios encontrados:', data.length);
      console.log('   Primeros usuarios:', JSON.stringify(data, null, 2));
      console.log('   Duration:', duration + 'ms\n');
      return true;
    }
  } catch (error) {
    console.log('❌ EXCEPCIÓN en consulta simple:');
    console.log('   Error:', error.message);
    console.log('   Type:', error.constructor.name);
    return false;
  }
}

async function testInsert() {
  try {
    console.log('🔍 Test 3: Insertar usuario de prueba...');
    const testUsername = `test_${Date.now()}`;
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('users')
      .upsert({
        username: testUsername,
        coronas: 10
      }, {
        onConflict: 'username'
      })
      .select();

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ ERROR en inserción:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Duration:', duration + 'ms\n');
      return false;
    } else {
      console.log('✅ Inserción exitosa');
      console.log('   Usuario creado:', data);
      console.log('   Duration:', duration + 'ms\n');

      // Limpiar usuario de prueba
      await supabase.from('users').delete().eq('username', testUsername);
      console.log('🧹 Usuario de prueba eliminado\n');
      return true;
    }
  } catch (error) {
    console.log('❌ EXCEPCIÓN en inserción:');
    console.log('   Error:', error.message);
    console.log('   Type:', error.constructor.name);
    return false;
  }
}

async function testHTTP() {
  try {
    console.log('🔍 Test 4: Conectividad HTTP directa...');
    const testUrl = `${supabaseUrl}/rest/v1/users`;
    const startTime = Date.now();

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Range': '0-2'  // Solo 3 registros
      }
    });

    const duration = Date.now() - startTime;
    const responseText = await response.text();

    console.log('🌐 HTTP Response:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Duration:', duration + 'ms');
    console.log('   Body length:', responseText.length);
    console.log('   Body preview:', responseText.substring(0, 200));

    if (response.ok) {
      console.log('✅ HTTP conectividad exitosa\n');
      return true;
    } else {
      console.log('❌ HTTP falló\n');
      return false;
    }

  } catch (error) {
    console.log('❌ EXCEPCIÓN en HTTP:');
    console.log('   Error:', error.message);
    console.log('   Type:', error.constructor.name);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Ejecutando todas las pruebas...\n');

  const results = {
    connection: await testConnection(),
    simpleQuery: await testSimpleQuery(),
    insert: await testInsert(),
    http: await testHTTP()
  };

  console.log('📊 RESUMEN DE RESULTADOS:');
  console.log('============================');
  console.log(`Conexión básica:     ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Consulta simple:     ${results.simpleQuery ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Inserción:           ${results.insert ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`HTTP directo:        ${results.http ? '✅ PASS' : '❌ FAIL'}`);

  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n🎯 RESULTADO: ${passCount}/${totalCount} pruebas exitosas`);

  if (passCount === totalCount) {
    console.log('🎉 ¡Todas las pruebas pasaron! Supabase funciona correctamente en local.');
    console.log('💡 El problema podría ser específico del entorno de Render.');
  } else if (passCount === 0) {
    console.log('💥 Todas las pruebas fallaron. Hay un problema fundamental con las credenciales o el proyecto Supabase.');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Hay problemas intermitentes o de permisos.');
  }

  console.log('\n📝 RECOMENDACIONES:');
  if (!results.connection && !results.http) {
    console.log('   • Verifica que las credenciales de Supabase sean correctas');
    console.log('   • Confirma que el proyecto Supabase esté activo (no pausado)');
    console.log('   • Revisa que la URL del proyecto sea la correcta');
  }
  if (results.http && !results.connection) {
    console.log('   • HTTP funciona pero SDK falla: posible problema de configuración del cliente');
  }
  if (!results.insert && results.simpleQuery) {
    console.log('   • Permisos de escritura limitados: revisa las políticas RLS de Supabase');
  }
}

// Ejecutar todas las pruebas
runAllTests().catch(error => {
  console.error('💥 Error fatal ejecutando pruebas:', error);
  process.exit(1);
});