const puppeteer = require('puppeteer');

async function testLogin() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navegar a la página de inicio de sesión de TikTok
    await page.goto('https://www.tiktok.com/login', { waitUntil: 'networkidle2' });
    
    // Esperar a que los selectores estén disponibles
    await page.waitForSelector('input[name="username"]');
    await page.waitForSelector('input[name="password"]');

    // Ingresar las credenciales
    await page.type('input[name="username"]', 'tu_usuario'); // Cambia 'tu_usuario' por el nombre de usuario
    await page.type('input[name="password"]', 'tu_contraseña'); // Cambia 'tu_contraseña' por la contraseña
    await page.click('button[type="submit"]'); // Ajusta el selector según sea necesario

    // Esperar a que la navegación se complete
    await page.waitForNavigation();

    console.log('Inicio de sesión exitoso');
  } catch (error) {
    console.error('Error durante el inicio de sesión:', error);
  } finally {
    await browser.close();
  }
}

testLogin();