interface FacturaSendCliente {
  contribuyente: boolean;
  ruc?: string;
  razonSocial: string;
  nombreFantasia?: string;
  tipoOperacion: number;
  tipoContribuyente?: number;
  documentoTipo?: number;
  documentoNumero?: string;
  direccion: string;
  numeroCasa?: string;
  departamento: number;
  departamentoDescripcion: string;
  distrito: number;
  distritoDescripcion: string;
  ciudad?: number;
  ciudadDescripcion?: string;
  pais: string;
  paisDescripcion: string;
  telefono?: string;
  celular?: string;
  email?: string;
  codigo?: string;
}

interface FacturaSendUsuario {
  documentoTipo: number;
  documentoNumero: string;
  nombre: string;
  cargo?: string;
}

interface FacturaSendCondicion {
  tipo: number;
  entregas: Array<{
    tipo: number;
    monto: number;
    moneda: string;
    cambio?: number;
  }>;
}

interface FacturaSendItem {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: number;
  precioUnitario: number;
  ivaTipo: number;
  ivaBase: number;
  iva: number;
}

interface FacturaSendDocumento {
  tipoDocumento: number;
  establecimiento: number;
  punto: number;
  numero: number;
  fecha: string;
  tipoEmision: number;
  tipoTransaccion: number;
  tipoImpuesto: number;
  moneda: string;
  observacion?: string;
  cliente: FacturaSendCliente;
  usuario: FacturaSendUsuario;
  factura: {
    presencia: number;
  };
  condicion: FacturaSendCondicion;
  items: FacturaSendItem[];
}

interface FacturaSendResponse {
  success: boolean;
  result?: {
    deList: Array<{
      cdc: string;
      numero: string;
      xml?: string;
      qr?: string;
      estado: string;
      respuesta_codigo: string;
      respuesta_mensaje: string;
      fechaEmision: string;
      fechaFirma: string;
    }>;
    loteId: number;
  };
  error?: string;
  mensaje?: string;
}

const FACTURASEND_CONFIG = {
  apiKey: process.env.FACTURASEND_API_KEY || '',
  baseUrl: 'https://api.facturasend.com.py/jhonifabianbenitezdelacruz',
  tenantId: 'jhonifabianbenitezdelacruz',
  ambiente: process.env.FACTURASEND_AMBIENTE || 'test' // 'test' o 'prod'
};

const CATALOG_CACHE = {
  departamentos: null as any,
  distritos: null as any,
  lastFetch: 0
};

async function obtenerCatalogos() {
  const CACHE_DURATION = 3600000;

  if (CATALOG_CACHE.departamentos && Date.now() - CATALOG_CACHE.lastFetch < CACHE_DURATION) {
    return CATALOG_CACHE;
  }

  try {
    const [deptResponse, distResponse] = await Promise.all([
      fetch(`${FACTURASEND_CONFIG.baseUrl}/departamentos`, {
        headers: { 'Authorization': `Bearer api_key_${FACTURASEND_CONFIG.apiKey}` }
      }),
      fetch(`${FACTURASEND_CONFIG.baseUrl}/distritos`, {
        headers: { 'Authorization': `Bearer api_key_${FACTURASEND_CONFIG.apiKey}` }
      })
    ]);

    if (deptResponse.ok && distResponse.ok) {
      const deptData = await deptResponse.json();
      const distData = await distResponse.json();

      CATALOG_CACHE.departamentos = deptData.result || deptData;
      CATALOG_CACHE.distritos = distData.result || distData;
      CATALOG_CACHE.lastFetch = Date.now();

      console.log('✅ Catálogos de FacturaSend cargados');
      return CATALOG_CACHE;
    }
  } catch (error) {
    console.error('❌ Error obteniendo catálogos:', error);
  }

  return null;
}

async function obtenerDatosGeograficos(departamento?: string, ciudad?: string) {
  const defecto = {
    departamento: 1,
    departamentoNombre: 'CAPITAL',
    distrito: 1,
    distritoNombre: 'ASUNCION',
    ciudadCodigo: 1,
    ciudadNombre: 'ASUNCION'
  };

  const catalogos = await obtenerCatalogos();

  if (!catalogos) {
    console.warn('⚠️  No se pudieron obtener catálogos de FacturaSend. Usando Asunción por defecto.');
    console.warn('⚠️  IMPORTANTE: Esto puede causar rechazo si el cliente no es de Asunción.');
    return defecto;
  }

  const deptStr = String(departamento || '').trim();

  if (!deptStr) {
    console.warn('⚠️  Cliente sin departamento configurado. Usando Asunción por defecto.');
    return defecto;
  }

  const dept = catalogos.departamentos?.find((d: any) => {
    const descripcion = String(d.descripcion || '').toLowerCase();
    const busqueda = deptStr.toLowerCase();
    return descripcion.includes(busqueda) || busqueda.includes(descripcion);
  });

  if (!dept) {
    console.warn(`⚠️  Departamento "${deptStr}" no encontrado en catálogo. Usando Asunción por defecto.`);
    console.warn('⚠️  Departamentos disponibles:', catalogos.departamentos?.map((d: any) => d.descripcion).join(', '));
    return defecto;
  }

  console.log(`✅ Departamento encontrado: ${dept.descripcion} (código ${dept.codigo})`);

  const ciudadStr = String(ciudad || '').trim();
  const distrito = catalogos.distritos?.find((d: any) => {
    if (d.departamento !== dept.codigo) return false;
    if (!ciudadStr) return false;
    const descripcion = String(d.descripcion || '').toLowerCase();
    const busqueda = ciudadStr.toLowerCase();
    return descripcion.includes(busqueda) || busqueda.includes(descripcion);
  }) || catalogos.distritos?.find((d: any) => d.departamento === dept.codigo);

  if (!distrito) {
    console.warn(`⚠️  Distrito/ciudad "${ciudadStr}" no encontrado. Usando primer distrito del departamento.`);
    return {
      departamento: dept.codigo,
      departamentoNombre: dept.descripcion,
      distrito: dept.codigo,
      distritoNombre: dept.descripcion,
      ciudadCodigo: dept.codigo,
      ciudadNombre: dept.descripcion
    };
  }

  console.log(`✅ Distrito encontrado: ${distrito.descripcion} (código ${distrito.codigo})`);

  return {
    departamento: dept.codigo,
    departamentoNombre: dept.descripcion,
    distrito: distrito.codigo,
    distritoNombre: distrito.descripcion,
    ciudadCodigo: distrito.codigo,
    ciudadNombre: distrito.descripcion
  };
}

/**
 * Verifica que la API de FacturaSend esté disponible
 */
export async function verificarConexionFacturaSend(): Promise<{ disponible: boolean; mensaje: string }> {
  try {
    console.log('🔍 Verificando conexión con FacturaSend...');
    console.log('🔑 API Key configurada:', !!FACTURASEND_CONFIG.apiKey);
    console.log('🌍 Ambiente configurado:', FACTURASEND_CONFIG.ambiente);
    console.log('👤 Tenant ID:', FACTURASEND_CONFIG.tenantId);

    if (!FACTURASEND_CONFIG.apiKey || FACTURASEND_CONFIG.apiKey === '') {
      console.error('❌ FACTURASEND_API_KEY no encontrada en variables de entorno');
      return {
        disponible: false,
        mensaje: 'API Key de FacturaSend no configurada. Agregá FACTURASEND_API_KEY en Secrets.'
      };
    }

    console.log('🔑 Usando API Key (primeros 20 chars):', FACTURASEND_CONFIG.apiKey.substring(0, 20) + '...');
    console.log('🔑 Longitud total de API Key:', FACTURASEND_CONFIG.apiKey.length);

    const response = await fetch(`${FACTURASEND_CONFIG.baseUrl}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer api_key_${FACTURASEND_CONFIG.apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ FacturaSend API disponible:', data);
      return {
        disponible: true,
        mensaje: 'Conexión exitosa con FacturaSend'
      };
    } else {
      const errorText = await response.text();
      console.error('❌ FacturaSend respondió con error:', response.status, errorText);
      return {
        disponible: false,
        mensaje: `Error ${response.status}: ${errorText}`
      };
    }
  } catch (error: any) {
    console.error('❌ Error al verificar FacturaSend:', error.message);
    return {
      disponible: false,
      mensaje: `Error de conexión: ${error.message}`
    };
  }
}

/**
 * Envía una factura electrónica a través de FacturaSend
 */
export async function enviarFacturaFacturaSend(documento: FacturaSendDocumento): Promise<FacturaSendResponse> {
  try {
    const totalItems = documento.items.reduce((sum, item) => {
      const subtotal = item.cantidad * item.precioUnitario;
      const iva = item.ivaTipo === 1 ? Math.round(subtotal * 0.1) : 0;
      return sum + subtotal + iva;
    }, 0);

    console.log('📤 Enviando factura a FacturaSend...');
    console.log('📋 Datos:', {
      numero: documento.numero,
      cliente: documento.cliente.razonSocial,
      precioSinIVA: documento.items[0].precioUnitario,
      ivaBase: documento.items[0].ivaBase,
      totalCalculado: totalItems,
      montoPagado: documento.condicion.entregas[0].monto,
      moneda: documento.moneda
    });

    const apiKey = FACTURASEND_CONFIG.apiKey;
    if (!apiKey || apiKey === '') {
      console.error('❌ API Key de FacturaSend NO configurada');
      throw new Error('API Key de FacturaSend no configurada. Agregá FACTURASEND_API_KEY en Secrets.');
    }

    const payload = [documento];

    console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));

    const url = `${FACTURASEND_CONFIG.baseUrl}/lote/create?xml=true&qr=true`;
    console.log('🌐 URL:', url);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer api_key_${apiKey}`
    };

    console.log('📤 Headers enviados:');
    console.log('  - Content-Type:', headers['Content-Type']);
    console.log('  - Authorization: Bearer api_key_[CONFIGURADO]');
    console.log('  - API Key length:', apiKey.length);

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response body:', responseText);

    let data: FacturaSendResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parseando respuesta JSON:', parseError);
      throw new Error(`Respuesta inválida de FacturaSend: ${responseText.substring(0, 200)}`);
    }

    if (response.ok && data.success && data.result) {
      const primerDE = data.result.deList[0];
      console.log('✅ Factura enviada exitosamente a FacturaSend');
      console.log('📋 CDC:', primerDE.cdc);
      console.log('📋 Estado:', primerDE.estado);
      console.log('📋 Código respuesta:', primerDE.respuesta_codigo);
      console.log('📋 Mensaje:', primerDE.respuesta_mensaje);

      return {
        success: true,
        result: data.result
      };
    } else {
      console.error('❌ FacturaSend rechazó la factura:', data);
      return {
        success: false,
        error: data.error || 'Error al procesar factura',
        mensaje: data.mensaje || JSON.stringify(data)
      };
    }
  } catch (error: any) {
    console.error('❌ Error al enviar factura a FacturaSend:', error);
    return {
      success: false,
      error: error.message,
      mensaje: 'Error de comunicación con FacturaSend'
    };
  }
}

/**
 * Construye el documento para FacturaSend a partir de datos del sistema
 */
export async function construirDocumentoFacturaSend(
  companyInfo: any,
  clientInfo: any,
  stageInfo: any,
  projectInfo: any,
  exchangeRate: number,
  numeroDocumento: number
): Promise<FacturaSendDocumento> {
  const amountUSD = parseFloat(stageInfo.amount);
  const amountPYG = Math.round(amountUSD * exchangeRate);

  // Formato de fecha para FacturaSend: YYYY-MM-DDTHH:MM:SS (sin milisegundos)
  const fechaEmision = new Date().toISOString().split('.')[0];

  const esContribuyente = clientInfo?.clientType === 'empresa' || clientInfo?.documentType === 'RUC';
  const ubicacion = await obtenerDatosGeograficos(clientInfo?.department, clientInfo?.city);

  // FacturaSend espera el monto que PAGA el cliente en PYG
  // Este es el monto total en guaraníes que pagó el cliente
  const montoPagadoPYG = amountPYG;

  // IVA EXENTO: La empresa no cobra IVA (tipo 3)
  // El precio unitario ES el monto total que paga el cliente
  const precioSinIVA = montoPagadoPYG;
  const ivaCalculado = 0;

  // Construir cliente - SOLO campos requeridos y validados
  const clienteData: any = {
    contribuyente: esContribuyente,
    razonSocial: String(clientInfo?.legalName || clientInfo?.nombre || 'Cliente').trim() || 'Cliente',
    tipoOperacion: esContribuyente ? 1 : 2,
    direccion: String(clientInfo?.address || 'Sin dirección').trim() || 'Sin dirección',
    numeroCasa: String(clientInfo?.houseNumber || '0').trim() || '0',
    departamento: ubicacion.departamento,
    departamentoDescripcion: String(ubicacion.departamentoNombre).trim() || 'CAPITAL',
    distrito: ubicacion.distrito,
    distritoDescripcion: String(ubicacion.distritoNombre).trim() || 'ASUNCION',
    pais: 'PRY',
    paisDescripcion: 'Paraguay'
  };

  // Agregar tipoContribuyente solo para contribuyentes
  if (esContribuyente) {
    clienteData.tipoContribuyente = 2;
  }

  // Agregar campos opcionales SOLO si tienen valor STRING válido y no vacío
  const nombreFantasia = clientInfo?.nombre;
  if (nombreFantasia) {
    const nombreStr = String(nombreFantasia).trim();
    if (nombreStr && nombreStr !== '' && nombreStr !== 'null' && nombreStr !== 'undefined') {
      clienteData.nombreFantasia = nombreStr;
    }
  }

  const telefono = clientInfo?.phone;
  if (telefono) {
    const telefonoStr = String(telefono).trim();
    if (telefonoStr && telefonoStr !== '' && telefonoStr !== 'null' && telefonoStr !== 'undefined') {
      clienteData.telefono = telefonoStr;
      clienteData.celular = telefonoStr;
    }
  }

  const email = clientInfo?.email || clientInfo?.user?.email;
  if (email) {
    const emailStr = String(email).trim();
    if (emailStr && emailStr !== '' && emailStr !== 'null' && emailStr !== 'undefined') {
      clienteData.email = emailStr;
    }
  }

  const codigo = clientInfo?.userId;
  if (codigo) {
    // FacturaSend requiere mínimo 3 caracteres para el código
    const codigoStr = String(codigo).trim().padStart(3, '0');
    if (codigoStr && codigoStr !== '' && codigoStr !== 'null' && codigoStr !== 'undefined') {
      clienteData.codigo = codigoStr;
    }
  }

  const ciudadCodigo = ubicacion.ciudadCodigo;
  if (ciudadCodigo) {
    clienteData.ciudad = ciudadCodigo;
  }

  const ciudadNombre = ubicacion.ciudadNombre;
  if (ciudadNombre) {
    const ciudadStr = String(ciudadNombre).trim();
    if (ciudadStr && ciudadStr !== '' && ciudadStr !== 'null' && ciudadStr !== 'undefined') {
      clienteData.ciudadDescripcion = ciudadStr;
    }
  }

  // Manejar RUC o documento según tipo de cliente
  if (esContribuyente && clientInfo?.documentNumber) {
    const rucStr = String(clientInfo.documentNumber).trim();
    if (rucStr && rucStr !== '' && rucStr !== 'null' && rucStr !== 'undefined') {
      clienteData.ruc = rucStr;
    }
  } else {
    clienteData.documentoTipo = clientInfo?.documentType === 'Pasaporte' ? 2 : 1;
    const docNumero = String(clientInfo?.documentNumber || '0').trim();
    clienteData.documentoNumero = docNumero && docNumero !== '' && docNumero !== 'null' && docNumero !== 'undefined' ? docNumero : '0';
  }

  // Construir observación con tipo de cambio
  const observacion = `Tipo de cambio: 1 USD = ${exchangeRate.toLocaleString('es-PY')} PYG. Monto original: USD ${amountUSD.toFixed(2)}`;

  const documento: FacturaSendDocumento = {
    tipoDocumento: 1,
    establecimiento: 1,
    punto: 1,
    numero: numeroDocumento,
    fecha: fechaEmision,
    tipoEmision: 1,
    tipoTransaccion: 2,
    tipoImpuesto: 1,
    moneda: 'PYG',
    observacion: observacion.substring(0, 500), // Máximo 500 caracteres
    cliente: clienteData,
    usuario: {
      documentoTipo: 1,
      documentoNumero: '12345678',
      nombre: 'SoftwarePar Admin',
      cargo: 'Administrador'
    },
    factura: {
      presencia: 2
    },
    condicion: {
      tipo: 1,
      entregas: [
        {
          tipo: 9,
          monto: montoPagadoPYG,
          moneda: 'PYG'
        }
      ]
    },
    items: [
      {
        descripcion: stageInfo.stageNumber && stageInfo.totalStages 
          ? String(`${stageInfo.stageName || 'Servicio'} (Pago ${stageInfo.stageNumber} de ${stageInfo.totalStages}) - ${projectInfo.name || 'Proyecto'}`).trim().substring(0, 500)
          : String(`${stageInfo.stageName || 'Servicio'} - ${projectInfo.name || 'Proyecto'}`).trim().substring(0, 500) || 'Servicio profesional',
        cantidad: 1,
        unidadMedida: 77,
        precioUnitario: precioSinIVA,
        ivaTipo: 3, // IVA Exento
        ivaBase: 0, // 0% gravado (exento)
        iva: 0 // 0% IVA
      }
    ]
  };

  console.log(`💬 Observación enviada a FacturaSend: ${observacion}`);

  return documento;
}

export function extraerResultadoFacturaSend(response: FacturaSendResponse) {
  if (!response.success || !response.result || !response.result.deList || response.result.deList.length === 0) {
    return {
      cdc: null,
      protocoloAutorizacion: null,
      estado: 'rechazado',
      mensaje: response.error || response.mensaje || 'Error desconocido',
      xml: null,
      qr: null
    };
  }

  const primerDE = response.result.deList[0];

  // FacturaSend puede devolver estado como string o no enviarlo
  const estadoStr = String(primerDE.estado || '').toLowerCase();
  const esAprobado = estadoStr === 'aprobado' || estadoStr === 'aceptado' || primerDE.cdc;

  // Extraer URL del QR de forma robusta
  let qrUrl = null;
  
  // Prioridad 1: Campo qr directo de FacturaSend
  if (primerDE.qr && typeof primerDE.qr === 'string' && primerDE.qr.trim() !== '') {
    qrUrl = primerDE.qr.trim();
    console.log(`📱 QR obtenido directamente de FacturaSend: ${qrUrl.substring(0, 80)}...`);
  }
  // Prioridad 2: Construir desde CDC si existe
  else if (primerDE.cdc) {
    qrUrl = `https://ekuatia.set.gov.py/consultas/qr?nVersion=150&Id=${primerDE.cdc}`;
    console.log(`⚠️ QR construido desde CDC: ${qrUrl.substring(0, 80)}...`);
  }

  console.log(`📱 QR URL final: ${qrUrl ? '✅ Disponible' : '❌ No disponible'}`);
  if (qrUrl) {
    console.log(`🔗 QR completo: ${qrUrl}`);
  }

  return {
    cdc: primerDE.cdc,
    protocoloAutorizacion: `FS-${response.result.loteId}-${primerDE.respuesta_codigo || 'OK'}`,
    estado: esAprobado ? 'aceptado' : 'rechazado',
    mensaje: primerDE.respuesta_mensaje || 'Procesado correctamente',
    xml: primerDE.xml,
    qr: qrUrl
  };
}