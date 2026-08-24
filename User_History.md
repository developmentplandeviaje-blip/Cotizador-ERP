US-01: Validación y Asociación de Código de Referido en Cotización
Como: Asesor o Freelancer.  
Quiero: Ingresar y validar un código de referido dentro del cotizador.  Para: Asociar la venta al promotor correspondiente sin alterar los montos de la cotización mientras la regla de descuento permanezca inactiva.  

Escenario: Validación exitosa de un código de referido existente
  Dado que el asesor se encuentra en el formulario de creación de cotización
  Y el motor de reglas tiene la directiva de descuento por referido en estado "inactivo"
  Cuando ingresa el código "REF-2026-X" y el frontend dispara la validación
  Entonces el backend responde con estatus HTTP 200 y los datos del referido (ID y Nombre)
  Y el sistema asigna el "id_referidos" a la cotización en curso
  Y el subtotal y total de la cotización se mantienen sin ninguna deducción matemática ($0.00 de descuento).

Escenario: Intento de validación con código inexistente o inhabilitado
  Dado que el asesor ingresa un código "REF-INVALIDO"
  Cuando se ejecuta la verificación contra la API
  Entonces el backend responde con estatus HTTP 422 / 404 con el mensaje "El código de referido no existe o se encuentra inactivo"
  Y la interfaz muestra una advertencia visual sin bloquear el flujo de cotización
  Y el campo "id_referidos" permanece nulo (null).

Escenario: Comportamiento futuro ante activación de descuento (5%)
  Dado que el parámetro global "referidos_descuento_activo" es habilitado por un Administrador
  Y la cotización contiene un ítem de tipo "Hotel" por $100 USD y un ítem de tipo "Vuelo" por $200 USD
  Cuando se valida exitosamente el código de referido
  Entonces el sistema aplica un 5% de descuento exclusivamente sobre los $100 USD del hotel ($5 USD)
  Y el ítem de vuelo mantiene su tarifa íntegra ($200 USD)
  Y el campo "descuento_referidos_monto" registra exactamente 5.00 USD.

US-02: Autenticación Segura con Encriptación Irreversible y Trazabilidad
Como: Usuario del sistema (Admin, Líder, Asesor, Freelancer).  
Quiero: Iniciar sesión con credenciales cifradas y sanitizadas.  
Para: Acceder a mi panel de trabajo garantizando que mis credenciales no se expongan en logs ni bases de datos.

Escenario: Inicio de sesión exitoso con hashing Argon2id / Bcrypt
  Dado un usuario registrado con estatus activo (status = 1)
  Cuando envía su email y contraseña a través del endpoint "/api/v1/auth/login"
  Entonces el backend verifica el hash seguro sin invocar helpers de cifrado reversible
  Y retorna un token Sanctum/JWT junto con el perfil, permisos y branding asociado
  Y registra el evento en "login_logs" sanitizando estrictamente el payload (excluyendo el campo "password").

Escenario: Bloqueo de acceso a usuario inhabilitado
  Dado un usuario cuyas credenciales son correctas pero su estado es inactivo (status = 0)
  Cuando intenta iniciar sesión
  Entonces el sistema rechaza la autenticación con código HTTP 403 Forbidden
  Y devuelve el mensaje "Cuenta inhabilitada. Contacte al administrador".

US-03: Cálculo de Tarifas con Marcaje Automático para Freelancers
Como: Freelancer autenticado en la plataforma.  
Quiero: Visualizar el catálogo de hoteles y servicios turísticos.  
Para: Generar cotizaciones a mis clientes con mi porcentaje de ganancia (markup) aplicado automáticamente y sin visualizar costos netos.  

  Escenario: Aplicación transparente de Markup en catálogo y cotizador
  Dado que un Freelancer tiene configurado un porcentaje de ganancia del 15% en su perfil
  Y un hotel posee una tarifa base de $100.00 USD por noche/adulto (costo neto $80.00 USD)
  Cuando el Freelancer consulta la disponibilidad de la habitación
  Entonces el sistema le presenta un precio unitario de $115.00 USD ($100 + 15%)
  Y los campos de costo de proveedor ("costo_noche_adulto") se omiten completamente del payload JSON devuelto por la API.

Escenario: Generación de cotización en PDF con Branding propio
  Dado que el Freelancer tiene cargado su logo y configuración de hoja membretada en la tabla "freelancer"
  Cuando solicita la exportación del PDF de la cotización
  Entonces el microservicio/librería de renderizado genera el documento utilizando los activos visuales del Freelancer
  Y los montos impresos corresponden a los precios finales con el markup del 15% integrado.

Escenario: Visualización del catálogo sin costos ocultos
  Dado que el usuario tiene el rol "Freelancer"
  Cuando accede al endpoint de listado de productos/servicios
  Entonces la respuesta API excluye los campos "costo_usd" y "comision_porcentaje"
  Y muestra únicamente "precio_publico_usd" (Tarifa de venta).

US-04: Autocompletado y Verificación Dinámica de Pasajeros (persona_venta)
Como: Asesor en la vista de detalle de venta.  
Quiero: Consultar la cédula/documento de identidad del pasajero principal.  
Para: Autocompletar su información existente o actualizar datos de contacto bajo confirmación explícita.

Escenario: Cliente recurrente con datos idénticos
  Dado que el asesor ingresa un número de documento que ya existe en la base de datos
  Cuando el sistema detecta la coincidencia
  Entonces autocompleta nombres, apellidos, teléfono, correo y edad en el formulario
  Y no solicita ninguna acción adicional si los datos no fueron modificados.

Escenario: Detección de cambios en teléfono o correo de cliente existente
  Dado que los datos de un cliente existente se cargan en el formulario
  Cuando el asesor modifica el número de teléfono o el correo electrónico y presiona "Guardar"
  Entonces la interfaz muestra un modal de diálogo: "¿Desea actualizar los datos de contacto del cliente en el registro maestro?"
  Y si el usuario selecciona "Sí", el backend actualiza el registro en la base de datos y asocia el pasajero a la venta
  Y si el usuario selecciona "No", el backend utiliza los datos modificados únicamente para la venta actual sin sobrescribir el registro maestro. Y debe mostrar una alerta al usuario: "El número de contacto ha sido actualizado para esta cotización únicamente."

Escenario: Autocompletado exitoso de datos de cliente
  Dado que el usuario ingresa un número de cédula válido en el formulario de pasajero
  Cuando el sistema realiza la consulta en la base de datos (cliente_venta o clientes)
  Entonces retorna los datos completos: nombre, apellido, fecha de nacimiento y email
  Y el Asesor puede continuar la cotización sin recapturar información básica.

Escenario: Validación de estatus del cliente
  Dado que el número de cédula consultado pertenece a un usuario inhabilitado (status = 0)
  Cuando se intenta agregar como pasajero
  Entonces el sistema debe impedir la acción y mostrar una alerta de "Cliente Inactivo."

US-05: Registro de Pagos Multi-Moneda y Desglose Transaccional por Servicio
Como: Asesor, Administrador o Líder.  
Quiero: Registrar abonos en divisas (USD/EUR) o moneda local (VES) asignando los montos a los servicios correspondientes (pago_venta_detalle).  
Para: Liquidar compromisos financieros, mantener auditada la tasa de cambio histórica aplicada y recalcular el saldo pendiente de la venta de forma atómica.

Escenario: Registro exitoso de abono en Bolívares (VES) con captura de tasa histórica
  Dado que una venta con ID 105 tiene un total neto de $500.00 USD
  Y la tasa oficial del día registrada en base de datos es de 40.00 VES/USD
  Cuando el asesor registra un abono de tipo "abono_cuota" por 4,000.00 VES asociado a un método de pago bancario
  Entonces el sistema ejecuta la operación dentro de un bloque "DB::transaction"
  Y persiste en la tabla "pago_venta" los campos: moneda_pago = 'VES', monto_original = 4000.00, tasa_cambio = 40.0000 y monto_usd = 100.00
  Y distribuye el monto en "pago_venta_detalle" para los servicios asociados
  Y actualiza el saldo pendiente de la venta a exactamente $400.00 USD
  Y confirma la transacción sin inconsistencias de redondeo decimal.

Escenario: Registro de pago con método digital y comisión transaccional
  Dado que se registra un pago de $200.00 USD vía pasarela digital (ej. Zelle / Tarjeta)
  Y el método de pago digital tiene parametrizada una comisión del 3.00%
  Cuando se procesa el cobro
  Entonces el sistema registra en "pago_venta" el monto_usd = 200.00 y comision_bancaria = 6.00 USD
  Y descuenta los $200.00 USD íntegros del balance deudor del cliente.

Escenario: Rollback automático ante fallo en la asignación por servicio
  Dado que el registro de cabecera en "pago_venta" es válido
  Pero la inserción satélite en "pago_venta_detalle" arroja un error de integridad o timeout
  Cuando el backend captura la excepción
  Entonces revierte completamente la transacción (Rollback)
  Y no altera el estado de la venta ni descuenta saldos parciales
  Y retorna un código de error HTTP 500 con un mensaje de fallo transaccional.

US-06: Plan de Pagos por Cuotas y Control de Fechas Límite
Como: Asesor.  
Quiero: Configurar un plan de cuotas dinámico a partir del pago inicial, la frecuencia de pago y las fechas límite del hotel/cliente.  
Para: Proveer al cliente un calendario estructurado de amortización y evitar cancelaciones por vencimiento de bloqueos con proveedores.

Escenario: Generación automática del cronograma de cuotas
  Dado que una venta tiene un costo total de $1,200.00 USD
  Y el cliente realiza un pago inicial de $300.00 USD (restando $900.00 USD)
  Y se establece una fecha límite de pago a 3 meses con frecuencia mensual (3 cuotas)
  Cuando el asesor genera el plan de financiamiento
  Entonces el sistema calcula y proyecta 3 cuotas iguales de exactamente $300.00 USD cada una
  Y asigna a cada cuota su respectiva fecha de vencimiento sin exceder la "fecha_limite_hotel" ni la "fecha_limite_cliente".

Escenario: Restricción de vencimiento ante la fecha límite del proveedor
  Dado que un hotel impone una "fecha_limite_hotel" para el 15 de diciembre de 2026
  Cuando el asesor intenta programar una cuota final para el 20 de diciembre de 2026
  Entonces el motor de validación bloquea la acción con un error HTTP 422
  Y notifica en pantalla: "La fecha de la cuota no puede ser posterior a la fecha límite establecida por el proveedor".

US-07: Cálculo Semanal de Comisiones sin Dependencias Hardcodeadas
Como: Líder o Administrador.  
Quiero: Ejecutar el cálculo y consolidación semanal de comisiones por tipo de servicio (user_comision_config).  
Para: Liquidar las ganancias exactas de los asesores sin depender de IDs estáticos quemados en el código ni incurrir en consultas redundantes N+1.

Escenario: Liquidación estándar por servicio para un asesor
  Dado que el Asesor A tiene configurado en "user_comision_config": Hotel = 10% y Ferry = 5%
  Y durante el ciclo semanal (Viernes a Jueves) consolidó pagos por $1,000.00 USD en Hoteles y $500.00 USD en Ferrys
  Cuando el sistema ejecuta la agregación de comisiones vía Service Layer
  Entonces genera el desglose consolidado: $100.00 USD por concepto de Hoteles y $25.00 USD por Ferrys
  Y totaliza la comisión del periodo en exactamente $125.00 USD.

Escenario: Evaluación dinámica de Bono de Meta semanal (>= $20,000 USD)
  Dado que el umbral global de bono de meta está parametrizado en $20,000.00 USD
  Y la recaudación total consolidada del equipo en la semana alcanza los $22,500.00 USD
  Y los asesores elegibles están determinados mediante reglas de perfil en base de datos
  Cuando se dispara el proceso de cierre semanal
  Entonces el sistema calcula el porcentaje de bonificación adicional sobre los productos correspondientes para los usuarios elegibles
  Y audita el resultado en la tabla de liquidación sin invocar identificadores fijos en el código.

US-08: Motor Analítico de Frecuencias y Ranking de Rendimiento Comercial
Como: Administrador o Líder.  
Quiero: Ejecutar análisis periódicos sobre clientes frecuentes, ranking de ventas por rol y productos más cotizados/vendidos.  
Para: Tomar decisiones comerciales estratégicas e impulsar la gamificación del equipo.  

Escenario: Ejecución del pipeline de analítica de clientes y productos
  Dado que existen registros consolidados de cotizaciones y ventas en la base de datos
  Cuando el worker/servicio en Python procesa el lote analítico programado
  Entonces clasifica los clientes en deciles de recurrencia (de mayor a menor frecuencia)
  Y consolida el ranking de productos (Hoteles, Vuelos, Paquetes) más cotizados vs. convertidos a venta
  Y genera el ranking consolidado de Asesores, Líderes, Freelancers y Referidos por volumen de ventas en USD.

Escenario: Persistencia del Ranking Semanal para Gamificación
  Dado que es Viernes a las 09:00 AM
  Cuando el proceso batch en Python finaliza la agregación de ventas del ciclo semanal
  Entonces inserta el registro cabecera en "ranking_semanal"
  Y persiste el top de posiciones en "ranking_semanal_detalle" asociando "id_user", "posicion" y "total_vendido_usd"
  Y emite el payload para la notificación del "Vendedor de la Semana" en el frontend.

Escenario: Identificación de clientes recurrentes y segmentos de alto valor
  Dado que el sistema ejecuta la lógica analítica de "Frecuencia de Clientes"
  Cuando procesa las ventas y pagos registrados en el periodo
  Entonces clasifica a los clientes según su recurrencia (ej. "Frecuente >= 3 cotizaciones", "Ocasional", "Única vez")
  Y genera métricas de valor promedio de venta por segmento, facilitando campañas de retención.

Escenario: Ranking consolidado de ventas por rol y servicio
  Dado que el motor de analítica está programado para ejecutarse vía cronjob o bajo demanda
  Cuando se solicita el reporte de rendimiento comercial
  Entonces agrega las ventas totales por Rol (Admin, Líder, Asesor, etc.)
  Y desglosa el acumulado por tipo de servicio (hotel, vuelo, paquete, etc.) con sus respectivos montos consolidados.

Escenario: Ranking de productos másCotizados y más Vendidos
  Dado que el sistema ha acumulado una base de datos histórica de cotizaciones
  Cuando se dispara el job de procesamiento analítico
  Entonces identifica los productos/servicios que aparecen con mayor frecuencia en el campo "nombre_cot" (Cotizado)
  Y diferencia estos resultados de aquellos que figuran en estado "Venta Confirmada" (Vendidos)
  Y genera dos listados paralelos para la toma de decisiones comerciales (ej. impulsar lo cotizado vs capitalizar lo vendido).

US-09: Alerta Preventiva de Vencimiento de Promociones (Stock Sale Alert)Como: Asesor y Líder.  
Quiero: Recibir notificaciones automáticas cuando una tarifa en promoción se encuentre a 5 días o menos de culminar su vigencia de venta.  
Para: Contactar proactivamente a clientes interesados y acelerar el cierre de cotizaciones abiertas.

Escenario: Detección y notificación de tarifas promocionales por vencer
  Dado que existen habitaciones en "tarifa_habitacion" o vehículos en "vehiculo_tarifa" con bandera de promoción activa (promocion = 1)
  Y la fecha "hasta_venta" se encuentra exactamente a 5 días de la fecha actual del sistema
  Cuando el servicio analítico evalúa las vigencias de catálogo
  Entonces identifica las cotizaciones en estado "Borrador" o "Enviada" que incluyan dichos productos
  Y despacha una alerta preventiva al asesor responsable indicando los días restantes y la oportunidad de cierre.

Escenario: Exclusión de promociones vencidas o con plazo mayor a 5 días
  Dado que una tarifa promocional tiene fecha "hasta_venta" a 10 días en el futuro
  O su fecha "hasta_venta" ya expiró
  Cuando el servicio analítico realiza el escaneo diario
  Entonces no genera alertas preventivas de 5 días para dicho registro.

US-10: Registro y Rendición de Gastos Operativos con Manejo Seguro de Archivos
Como: Personal de Contabilidad, Administrador o Líder.  
Quiero: Registrar egresos operativos vinculando comprobantes digitalizados con nombres aleatorios seguros (UUID).  
Para: Consolidar el flujo de caja neto de la agencia y evitar vulnerabilidades de ejecución remota o archivos huérfanos.  

Escenario: Carga exitosa de gasto con comprobante en formato permitido
  Dado que el usuario completa el formulario de gastos con descripción, fecha, monto en USD y equivalente en VES
  Y adjunta un comprobante en formato PNG, JPG o PDF que no excede el límite de tamaño permitido
  Cuando envía el formulario al endpoint "/api/v1/gastos"
  Entonces el sistema valida el tipo MIME real del archivo
  Y almacena el documento en el storage seguro renombrándolo mediante un UUID único
  Y persiste el registro en la tabla "gastos" vinculando la ruta relativa generada
  Y responde con estatus HTTP 201 Created.

Escenario: Rechazo de archivos ejecutables o extensiones no autorizadas
  Dado que un usuario intenta adjuntar un archivo con extensión ".php", ".sh" o un binario camuflado
  Cuando se procesa la validación del Form Request en Laravel
  Entonces el backend rechaza la carga con código HTTP 422 Unprocessable Entity
  Y bloquea la persistencia del gasto
  Y no almacena ningún archivo en el disco del servidor.

Escenario: Registro exitoso de gasto operativo con subida segura de evidencia
  Dado que el usuario pertenece al rol "Contable" o "Administrador"
  Y el sistema ha definido el driver de almacenamiento "local_secure" o similar
  Cuando el usuario sube un comprobante en formato JPG o PDF con tamaño < 5MB
  Entonces el backend valida la extensión y el tamaño del archivo
  Y genera un nombre de archivo único (UUID) para la persistencia en el storage
  Y guarda el registro cabecera en "gasto_operativo" con el estado "emitido_no_conciliado".

Escenario: Rollback automático ante fallo en la transacción de gastos
  Dado que el registro de egreso y el nombre de archivo son válidos
  Pero la inserción en la tabla "gasto_operativo" falla debido a un error de integridad de datos
  Cuando el controlador captura la excepción
  Entonces revierte completamente la transacción (rollback)
  Y no deja archivos huérfanos ni registros parciales en la base de datos
  Y retorna un error 500 al frontend.

