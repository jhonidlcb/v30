
export function verifyEnvironmentConfiguration() {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
  };

  const optionalVars = {
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_PASS: process.env.GMAIL_PASS
  };

  console.log('🔍 Verificando configuración de variables de entorno...');
  
  let allCorrect = true;
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.error(`❌ Variable ${key} no está configurada`);
      allCorrect = false;
    } else {
      console.log(`✅ Variable ${key} configurada correctamente`);
    }
  }

  for (const [key, value] of Object.entries(optionalVars)) {
    if (!value) {
      console.warn(`⚠️  Variable ${key} no está configurada (opcional, email notifications may not work)`);
    } else {
      console.log(`✅ Variable ${key} configurada correctamente`);
    }
  }

  return allCorrect;
}
