
## Marco de Reglas de Negocio Consolidado (Business Rules Engine)

### Eje 1: Autenticación, Usuarios y Control de Accesos (RBAC)

* **Jerarquía de Roles:** Se definen los roles base: `Admin`, `Líder`, `Asesor`, `Operador`, `Contable`, `Marketing` y el perfil especial `Freelancer`.


* **Multi-Perfil y Permisos Granulares:** Un usuario físico puede acumular múltiples perfiles (ej. Líder + Asesor). El acceso a funciones específicas (como crear usuarios o emitir ciertos reembolsos) se administra mediante permisos atómicos independientes del rol.


* **Matriz de Visibilidad por Rol:**
* `Admin` / `Líder`: Acceso global a ventas, reportes, usuarios y catálogos. Visualizan márgenes de costo neto y precio público.


* `Asesor`: Acceso exclusivo a sus cotizaciones y ventas (`id_user = auth.id`).


* `Freelancer`: Acceso aislado a sus operaciones. Los costos netos se ocultan estrictamente; solo visualizan tarifas con su markup asignado.




* **Branding de Freelancer:** Cada perfil Freelancer parametriza RIF, color primario, logotipo y hoja membretada para renderizar en su interfaz y en los PDFs generados.



### Eje 2: Lógica de Cotización, Precios, Monedas y Comisiones

* **Políticas de Moneda y Tasa de Cambio:**
* Moneda base del sistema: **USD**.


* El sistema integra y almacena la tasa oficial diaria (BCV) en base de datos para la conversión a **VES** y auditoría histórica.


* Soporte de tarifas base en EUR, USD o VES según el proveedor.




* **Cálculo de Tarifas de Hospedaje y Productos:**
* Segmentación de pasajeros: Adultos, Adolescentes, Niños e Infantes (los infantes no generan costo de entrada/alojamiento base).


* Aplicación de condiciones especiales de tarifas: `ninos_gratis`, `noches_gratis`, suplementos y temporadas (`desde`/`hasta`).


* **Regla de Markup para Freelancers:**

$$\text{Precio Venta} = \text{Tarifa Base} + \left(\text{Tarifa Base} \times \frac{\text{Porcentaje Freelancer}}{100}\right)$$


* **Regla de Código de Referido: Comportamiento Operativo Actual (Estado: Validación Pasiva):**
* El endpoint valida existencia y estatus del código ingresado contra la tabla `referidos` (o servicio externo desacoplado).


* Si es válido, se asocia el `id_referidos` a la entidad `ventas` para fines de auditoría y atribución.


* **Deducción matemática actual:** `$descuento_referidos_monto = 0.00` (no altera el subtotal ni el total neto de la cotización).


* **Lógica Dormida (Parametrizada para activación futura):**
* Flag de activación en `site_settings` o configuración (`referidos_descuento_activo = false`).
* Al activarse ($= \text{true}$), aplicará un $5\%$ exclusivamente sobre items elegibles (`hotel`, `paquete`, `excursion` con `aplica_descuento_referidos = 1`), excluyendo estrictamente `vuelo`, `ferry` y traslados no autorizados.


* **Excepción estricta:** No aplica sobre boletería aérea (Vuelos) ni servicios con bandera `aplica_descuento_referidos = false`.


* **Gestión de Comisiones y Bono de Meta:**
* Registro de porcentaje de comisión personalizado por tipo de servicio (`hotel`, `vuelo`, `ferry`, `excursion`, `vehiculo`, `traslado`, `paquete`, `otro`) por cada usuario.


* Los vuelos internacionales computan comisiones fijas/específicas parametrizadas en `vuelo_venta`.


* **Bono de Meta:** Proceso de validación semanal (Viernes a Jueves); si la recaudación consolida $\ge \$20,000\text{ USD}$, se activa la bonificación correspondiente calculada por el motor de reglas (eliminando IDs quemados en código).





### Eje 3: Gestión de Estados y Ciclo de Vida Transaccional

```
[Borrador / Cotización Rápida] ──> [Cotizado / Enviada] ──> [Aceptada / En Proceso de Pago] ──> [Venta Confirmada] ──> [Liquidada / Cerrada]
                                            │
                                            └──> [Rechazada / Vencida]

```

* **Borrador / Cotizado:** Registro de propuesta (paquete dinámico o pre-armado). Permite definir fechas límite de reserva tanto para el cliente como para el hotel/proveedor.


* **Transición a Venta:** Requiere la formalización de datos de pasajeros (`persona_venta`) y el registro de al menos un abono inicial (`pago_inicial`).


* **Auditoría y Autocompletado de Pasajeros:**
* Al ingresar la cédula/documento, el sistema consulta la base de datos de clientes.


* Si existe, autocompleta el perfil. Si se detectan cambios en teléfono o correo durante la carga, el sistema emite una confirmación de actualización antes de modificar la persistencia global.




* **Gestión de Pagos por Cuotas y Saldos:**
* Los pagos se distribuyen en cuotas según el monto inicial, la frecuencia y la fecha límite acordada.


* La deuda se audita mediante cálculo transaccional:

$$\text{Saldo Pendiente} = \text{Total Neto Cotización} - \sum (\text{Abonos Conciliados en USD})$$



* Los pagos en moneda local capturan de forma inmutable la `tasa_cambio` aplicada al momento exacto de la transacción para el cálculo de `monto_usd`.



### Eje 4: Estructura de Datos, Storage e Integraciones

* **Persistencia Transaccional:** Todas las operaciones de creación de ventas y división de pagos satélites (`hotel_venta`, `vuelo_venta`, `pago_venta_detalle`, etc.) deben ejecutarse dentro de transacciones de base de datos (`DB::transaction`).


* **Gestión de Storage y Assets:**
* Subida de imágenes, comprobantes de gastos y hojas membretadas bajo drivers centralizados con nombres únicos generados por UUID.


* Validación estricta de extensiones (`png`, `jpg`, `webp`, `pdf`) con tamaño máximo de archivo para bloquear ejecuciones arbitrarias.




* **Integraciones y Servicios Asíncronos:**
* **Servicio Python (Analytics & BI):** Microservicio o script asíncrono para calcular frecuencia de clientes, productos más vendidos/cotizados, ranking de asesores y alertas preventivas de fin de promociones (ventana de 5 días).


* **Notificaciones y Gamificación:** Eventos programados (cron jobs) todos los viernes a las 9:00 AM para computar el "Vendedor de la Semana" y notificaciones en tiempo real al alcanzar metas.


* **Webhooks (CRM Kommo):** Endpoint desacoplado con persistencia de logs en `callback_kommo` para ingesta asíncrona.