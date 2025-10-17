
const https = require('https');

async function testSIFEN() {
  // Primero hacer login como admin
  const loginData = JSON.stringify({
    email: 'softwarepar.lat@gmail.com',
    password: 'tu_password_admin'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  console.log('🔐 Haciendo login como admin...');
  
  const loginReq = https.request(loginOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const loginResponse = JSON.parse(data);
      
      if (!loginResponse.token) {
        console.error('❌ Error de login:', loginResponse);
        return;
      }
      
      console.log('✅ Login exitoso');
      const token = loginResponse.token;
      
      // Ahora llamar al endpoint de prueba SIFEN
      const testOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/test-sifen',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log('🧪 Ejecutando prueba SIFEN...\n');
      
      const testReq = https.request(testOptions, (testRes) => {
        let testData = '';
        
        testRes.on('data', (chunk) => {
          testData += chunk;
        });
        
        testRes.on('end', () => {
          const result = JSON.parse(testData);
          
          console.log('========================================');
          console.log('📊 RESULTADO DE LA PRUEBA SIFEN');
          console.log('========================================\n');
          
          console.log(`Estado: ${result.success ? '✅ EXITOSO' : '❌ FALLIDO'}`);
          console.log(`Mensaje: ${result.message}\n`);
          
          if (result.datos) {
            console.log('📋 DATOS DE LA FACTURA:');
            console.log(`   CDC: ${result.datos.cdc || 'N/A'}`);
            console.log(`   Protocolo: ${result.datos.protocoloAutorizacion || 'N/A'}`);
            console.log(`   Estado SIFEN: ${result.datos.estado || 'N/A'}`);
            console.log(`   URL QR: ${result.datos.urlQR ? 'Generado' : 'N/A'}\n`);
          }
          
          if (result.datos?.mensajeError) {
            console.log(`⚠️  Error SIFEN: ${result.datos.mensajeError}\n`);
          }
          
          console.log('🔧 CONFIGURACIÓN:');
          console.log(`   Ambiente: ${result.ambiente}`);
          console.log(`   ID CSC: ${result.configuracion?.idCSC}`);
          console.log(`   Certificado: ${result.configuracion?.tieneCertificado ? 'SÍ' : 'NO'}`);
          console.log(`   Endpoint: ${result.configuracion?.endpoint}\n`);
          
          if (result.xml) {
            console.log('📄 XML generado (primeros 500 caracteres):');
            console.log(result.xml.substring(0, 500) + '...\n');
          }
          
          console.log('========================================');
        });
      });
      
      testReq.on('error', (error) => {
        console.error('❌ Error en la prueba:', error);
      });
      
      testReq.end();
    });
  });
  
  loginReq.on('error', (error) => {
    console.error('❌ Error de conexión:', error);
  });
  
  loginReq.write(loginData);
  loginReq.end();
}

testSIFEN();
