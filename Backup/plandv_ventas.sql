-- ========================================================
-- Base de datos: `plandeviaje_cotizador`
-- ========================================================

CREATE DATABASE IF NOT EXISTS `plandeviaje_cotizador` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `plandeviaje_cotizador`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `ranking_semanal_detalle`, `ranking_semanal`, `gastos`, `pago_venta_detalle`, `pago_venta`, `metodo_pago_digital`, `metodo_pago_banco`, `metodo_pago_asesor`, `metodo_pago`, `otro_venta`, `paquete_venta`, `paquete`, `vehiculo_venta`, `vehiculo_tarifa`, `vehiculo`, `vehiculo_agencia`, `traslado_venta`, `traslado`, `excursion_venta`, `excursion`, `ferry_venta`, `vuelo_venta`, `aerolinea`, `hotel_venta`, `tarifa_habitacion`, `habitacion_hotel`, `hotel_regla_comercial`, `hotel`, `ubicacion`, `persona_venta`, `comisiones_venta`, `ventas`, `referidos`, `cotizaciones_rapidas`, `token_device`, `login_logs`, `user_comision_config`, `user`, `freelancer`, `ci_sessions`, `callback_kommo`, `site_settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. MODULO DE CONFIGURACION, SISTEMA Y LOGS
-- --------------------------------------------------------

CREATE TABLE `site_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ci_sessions` (
  `id` varchar(128) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `data` blob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ci_sessions_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `callback_kommo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `json` text NOT NULL,
  `method` varchar(20) NOT NULL,
  `ip` text NOT NULL,
  `referer` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. MODULO DE USUARIOS, ASESORES
-- --------------------------------------------------------

CREATE TABLE `freelancer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `rif` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `telefono_1` varchar(100) NOT NULL,
  `telefono_2` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  -- Campos de personalización visual (Branding)
  `color_primario` varchar(100) NOT NULL,
  `logo_url` varchar(100) NOT NULL,
  `hoja_membrete_config` text NOT NULL, -- Configuración base para reportes
  `notify_link` text DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_freelancer_rif` (`rif`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_freelancer` int(11) NOT NULL, -- Vínculo limpio a su empresa
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `email` varchar(70) NOT NULL,
  `password` text NOT NULL,
  `level` varchar(100) NOT NULL, -- 'admin', 'asesor', etc.
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_email` (`email`),
  CONSTRAINT `fk_user_freelancer` FOREIGN KEY (`id_freelancer`) REFERENCES `freelancer` (`id`) RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_comision_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `tipo_servicio` enum('hotel', 'ferry', 'vuelo', 'excursion', 'vehiculo', 'traslado', 'paquete', 'otro') NOT NULL,
  `porcentaje_comision` decimal(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_servicio` (`id_user`, `tipo_servicio`),
  CONSTRAINT `fk_comision_usuario` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `email` varchar(200) NOT NULL,
  `ip` text NOT NULL,
  `data` text NOT NULL,
  `method` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_login_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `token_device` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `token` text NOT NULL,
  `device` text NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_token_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cotizaciones_rapidas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_asesor` int(11) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `data` text NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cotizacion_asesor` FOREIGN KEY (`id_asesor`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. ENTORNO CRM Y GESTION DE REFERIDOS
-- --------------------------------------------------------

CREATE TABLE `referidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `id_externo` varchar(100) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_codigo_referidos` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. CONTROL TRANSACCIONAL PRINCIPAL (VENTAS)
-- --------------------------------------------------------

CREATE TABLE `ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,    -- Asesor
  `id_referidos` int(11) DEFAULT NULL, -- Vinculo limpio al referidos
  `numero_ficha` int(5) UNSIGNED ZEROFILL NOT NULL,
  `localizador` varchar(100) NOT NULL,
  `estado` varchar(100) NOT NULL DEFAULT 'Cotizacion',
  `tipo_pago` varchar(50) NOT NULL, -- Ej: 'Financiado', 'Contado'
  -- Fechas operacionales básicas de la orden global
  `checkin` datetime NOT NULL,
  `checkout` datetime NOT NULL,
  `fecha_limite_hotel` timestamp NOT NULL DEFAULT '1970-01-01 00:00:01',
  `fecha_limite_cliente` timestamp NOT NULL DEFAULT '1970-01-01 00:00:01',
  -- Parámetros de descuento aplicados en esta transacción
  `descuento_porcentaje` varchar(20) DEFAULT NULL,
  `descuento_monto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `descuento_referidos_monto` decimal(10,2) NOT NULL DEFAULT 0.00,
  -- Auditoría básica
  `observacion` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_confirmacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ventas_asesor` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) RESTRICT,
  CONSTRAINT `fk_ventas_referidos` FOREIGN KEY (`id_referidos`) REFERENCES `referidos` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `comisiones_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `tipo_servicio` varchar(50) NOT NULL, -- 'hotel', 'ferry', 'vuelo', 'excursion', etc.
  `monto_comision` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_comision_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `persona_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `nombres` varchar(30) NOT NULL,
  `apellidos` varchar(30) NOT NULL,
  `tipo_documento` varchar(30) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `edad` int(3) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo` varchar(70) NOT NULL,
  `principal` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_persona_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. MODULO DE INFRAESTRUCTURA TURISTICA, HOTELES Y TARIFAS
-- --------------------------------------------------------

CREATE TABLE `ubicacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ubicacion` varchar(200) NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `hotel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ubicacion` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `tipo` varchar(300) NOT NULL,            -- Ej: 'Todo Incluido', 'Solo Desayuno'
  `edad_adolescentes` varchar(50) NOT NULL,-- Rango de edad (Ej: '12-17')
  `edad_ninos` varchar(50) NOT NULL,       -- Rango de edad (Ej: '2-11')
  `edad_infantes` varchar(50) NOT NULL,    -- Rango de edad (Ej: '0-1')
  `nota` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_hotel_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id`) RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `hotel_regla_comercial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `id_freelancer` int(11) NOT NULL, -- Relación directa con el rediseño anterior
  `descuento_monto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `descuento_status` tinyint(1) NOT NULL DEFAULT 0,
  `aumento_bolivares` tinyint(1) NOT NULL DEFAULT 0,
  `aumento_bolivares_porcentaje` decimal(5,2) NOT NULL DEFAULT 0.00,
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hotel_freelancer` (`id_hotel`, `id_freelancer`),
  CONSTRAINT `fk_regla_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hotel` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_regla_freelancer` FOREIGN KEY (`id_freelancer`) REFERENCES `freelancer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `habitacion_hotel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `habitacion` varchar(200) NOT NULL,
  `cantidad_personas` int(11) NOT NULL,
  `minimo_noches` int(11) NOT NULL DEFAULT 1,
  `posicion` int(11) NOT NULL DEFAULT 0,
  `por_defecto` tinyint(1) NOT NULL DEFAULT 0,
  `nota` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_habitacion_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hotel` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tarifa_habitacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_habitacion` int(11) NOT NULL,
  `desde` datetime NOT NULL,
  `hasta` datetime NOT NULL,
  `desde_venta` datetime NOT NULL,
  `hasta_venta` datetime NOT NULL,
  `costo_noche_adulto` decimal(10,2) NOT NULL,
  `precio_noche_adulto` decimal(10,2) NOT NULL,
  `porcentaje_adulto` decimal(5,2) NOT NULL DEFAULT 0.00,
  `costo_noche_adolescente` decimal(10,2) NOT NULL,
  `precio_noche_adolescente` decimal(10,2) NOT NULL,
  `porcentaje_adolescente` decimal(5,2) NOT NULL DEFAULT 0.00,
  `costo_noche_nino` decimal(10,2) NOT NULL,
  `precio_noche_nino` decimal(10,2) NOT NULL,
  `porcentaje_nino` decimal(5,2) NOT NULL DEFAULT 0.00,
  `ninos_gratis` int(11) NOT NULL DEFAULT 0,
  `noches_gratis` int(11) NOT NULL DEFAULT 0,
  `promocion` tinyint(1) NOT NULL DEFAULT 0,
  `suplemento` tinyint(1) NOT NULL DEFAULT 0,
  `moneda` varchar(10) NOT NULL DEFAULT 'USD',
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tarifa_habitacion` FOREIGN KEY (`id_habitacion`) REFERENCES `habitacion_hotel` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. DETALLES DE PRODUCTOS ADQUIRIDOS (COMPRAS SATELITES)
-- --------------------------------------------------------

CREATE TABLE `hotel_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_hotel` int(11) NOT NULL,
  `id_habitacion` int(11) NOT NULL,
  `tipo` varchar(300) NOT NULL,
  `noches` int(11) NOT NULL,
  `adultos` int(11) NOT NULL,
  `adolescente` int(11) NOT NULL,
  `ninos` int(11) NOT NULL,
  `infantes` int(11) NOT NULL,
  `costo_noche_adulto` decimal(10,2) NOT NULL,
  `costo_noche_adolescente` decimal(10,2) NOT NULL,
  `costo_noche_nino` decimal(10,2) NOT NULL,
  `precio_noche_adolescente` decimal(10,2) NOT NULL,
  `precio_noche_adulto` decimal(10,2) NOT NULL,
  `precio_noche_nino` decimal(10,2) NOT NULL,
  `localizador` varchar(100) NOT NULL,
  `fecha_checkin` datetime NOT NULL,
  `fecha_checkout` datetime NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'Pendiente',
  `fecha_limite` datetime NOT NULL,
  `precio_noche_adulto_descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `precio_noche_adolescente_descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `precio_noche_nino_descuento` decimal(10,2) NOT NULL DEFAULT 0.00, --revisar si en la original existe el campo de descuento
  `total_descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ninos_gratis` int(11) NOT NULL DEFAULT 0,
  `noches_gratis` int(11) NOT NULL DEFAULT 0,
  `promocion` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_hventa_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hventa_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hotel` (`id`) RESTRICT,
  CONSTRAINT `fk_hventa_habitacion` FOREIGN KEY (`id_habitacion`) REFERENCES `habitacion_hotel` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `aerolinea` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vuelo_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_aerolinea` int(11) NOT NULL,
  `itinerario` text NOT NULL,
  `localizador` varchar(100) NOT NULL,
  `adultos` int(11) NOT NULL DEFAULT 0,
  `ninos` int(11) NOT NULL DEFAULT 0,
  `infantes` int(11) NOT NULL DEFAULT 0,
  `costo_adulto` decimal(10,2) NOT NULL,
  `costo_nino` decimal(10,2) NOT NULL,
  `costo_infante` decimal(10,2) NOT NULL,
  `precio_adulto` decimal(10,2) NOT NULL,
  `precio_nino` decimal(10,2) NOT NULL,
  `precio_infante` decimal(10,2) NOT NULL,
  `fecha_vuelo` datetime NOT NULL,
  `boleto_internacional` tinyint(1) NOT NULL DEFAULT 0,
  `comision_internacional` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_vuelo_v_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vuelo_v_aerolinea` FOREIGN KEY (`id_aerolinea`) REFERENCES `aerolinea` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ferry_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `ruta` varchar(100) NOT NULL,
  `clase` varchar(100) NOT NULL,
  `adultos` int(11) NOT NULL DEFAULT 0,
  `ninos` int(11) NOT NULL DEFAULT 0,
  `infantes` int(11) NOT NULL DEFAULT 0,
  `vehiculos` int(11) NOT NULL DEFAULT 0,
  `itinerario` varchar(100) NOT NULL,
  `costo_adulto` decimal(10,2) NOT NULL,
  `costo_nino` decimal(10,2) NOT NULL,
  `costo_infante` decimal(10,2) NOT NULL,
  `costo_vehiculo` decimal(10,2) NOT NULL,
  `precio_adulto` decimal(10,2) NOT NULL,
  `precio_nino` decimal(10,2) NOT NULL,
  `precio_infante` decimal(10,2) NOT NULL,
  `precio_vehiculo` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ferry_v_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `excursion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ubicacion` int(11) NOT NULL,
  `tipo_excursion` varchar(200) NOT NULL,
  `costo_adulto` decimal(10,2) NOT NULL,
  `costo_nino` decimal(10,2) NOT NULL,
  `precio_adulto` decimal(10,2) NOT NULL,
  `precio_nino` decimal(10,2) NOT NULL,
  `porcentaje_adulto` decimal(5,2) DEFAULT NULL,
  `porcentaje_nino` decimal(5,2) DEFAULT NULL,
  `aplica_descuento_referidos` tinyint(1) DEFAULT 1,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_excursion_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id`) RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `excursion_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_excursion` int(11) NOT NULL,
  `fecha` varchar(50) NOT NULL,
  `adultos` int(11) NOT NULL DEFAULT 0,
  `ninos` int(11) NOT NULL DEFAULT 0,
  `infantes` int(11) NOT NULL DEFAULT 0,
  `costo_adulto` decimal(10,2) NOT NULL,
  `costo_nino` decimal(10,2) NOT NULL,
  `precio_adulto` decimal(10,2) NOT NULL,
  `precio_nino` decimal(10,2) NOT NULL,
  `total_descuento` decimal(10,2) DEFAULT 0.00,
  `estado` varchar(20) NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_excursion_v_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_excursion_v_maestra` FOREIGN KEY (`id_excursion`) REFERENCES `excursion` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chofer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `telefono` varchar(200) NOT NULL,
  `vehiculo_modelo` varchar(200) NOT NULL, -- Ej: 'Toyota HiAce'
  `vehiculo_placa` varchar(200) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_placa` (`vehiculo_placa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `traslado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ubicacion` int(11) NOT NULL,
  `ruta_origen` varchar(255) NOT NULL,      -- Ej: 'Aeropuerto Internacional PMV'
  `ruta_destino` varchar(255) NOT NULL,     -- Ej: 'Hotel El Yaque'
  `costo` decimal(10,2) NOT NULL,
  `precio_publico` decimal(10,2) NOT NULL,
  `tipo_servicio` enum('privado', 'compartido') NOT NULL DEFAULT 'privado',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_traslado_master_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `traslado_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_traslado` int(11) NOT NULL,           -- Vinculo a la ruta estandarizada
  `id_chofer` int(11) DEFAULT NULL,          -- Vinculo al chofer (puede ser NULL antes de asignar)
  `id_vuelo` int(11) DEFAULT NULL,           -- FK al vuelo que intercepta (normalizado antes)
  `fecha_traslado` datetime NOT NULL,
  `adultos` int(11) NOT NULL DEFAULT 0,
  `ninos` int(11) NOT NULL DEFAULT 0,
  `infantes` int(11) NOT NULL DEFAULT 0,
  -- Valores financieros congelados al momento del cierre de venta
  `costo_historico` decimal(10,2) NOT NULL,
  `precio_historico` decimal(10,2) NOT NULL,
  `total_descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `observacion` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tventa_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tventa_ruta` FOREIGN KEY (`id_traslado`) REFERENCES `traslado` (`id`) RESTRICT,
  CONSTRAINT `fk_tventa_chofer` FOREIGN KEY (`id_chofer`) REFERENCES `chofer` (`id`) SET NULL,
  CONSTRAINT `fk_tventa_vuelo` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelo_venta` (`id`) SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehiculo_agencia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ubicacion` int(11) NOT NULL,
  `agencia` varchar(200) NOT NULL,
  `nota` text DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_vagencia_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id`) RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehiculo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_vehiculo_agencia` int(11) NOT NULL,
  `marca` varchar(200) NOT NULL,
  `vehiculo` varchar(200) NOT NULL,
  `ano` varchar(200) NOT NULL,
  `tipo_vehiculo` varchar(200) NOT NULL,
  `tipo_transmision` varchar(200) NOT NULL,
  `nota` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_vehiculo_agencia` FOREIGN KEY (`id_vehiculo_agencia`) REFERENCES `vehiculo_agencia` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehiculo_tarifa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_vehiculo` int(11) NOT NULL,
  `desde` datetime NOT NULL,
  `hasta` datetime NOT NULL,
  `desde_venta` datetime NOT NULL,
  `hasta_venta` datetime NOT NULL,
  `costo` decimal(10,2) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `porcentaje` decimal(5,2) NOT NULL DEFAULT 0.00,
  `promocion` int(1) NOT NULL DEFAULT 0,
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tarifa_vehiculo` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehiculo_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_vehiculo` int(11) NOT NULL,
  `desde` datetime NOT NULL,
  `hasta` datetime NOT NULL,
  `dias` int(11) NOT NULL,
  `costo` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL, -- Normalizado para romper cálculo estricto
  `observacion` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_vehiculo_v_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vehiculo_v_maestro` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculo` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `paquete` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ubicacion` int(11) NOT NULL,
  `paquete` varchar(200) NOT NULL,
  `costo_adulto` decimal(10,2) NOT NULL,
  `costo_nino` decimal(10,2) NOT NULL,
  `precio_adulto` decimal(10,2) NOT NULL,
  `precio_nino` decimal(10,2) NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_paquete_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id`) RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `paquete_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_paquete` int(11) NOT NULL,
  `fecha` varchar(50) NOT NULL,
  `adultos` int(11) NOT NULL DEFAULT 0,
  `ninos` int(11) NOT NULL DEFAULT 0,
  `infantes` int(11) NOT NULL DEFAULT 0,
  `costo_adulto` decimal(10,2) NOT NULL,
  `costo_nino` decimal(10,2) NOT NULL,
  `precio_adulto` decimal(10,2) NOT NULL,
  `precio_nino` decimal(10,2) NOT NULL,
  `total_descuento` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_paquete_v_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_paquete_v_maestro` FOREIGN KEY (`id_paquete`) REFERENCES `paquete` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `otro_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `fecha` varchar(50) NOT NULL,
  `descripcion` text NOT NULL,
  `adultos` int(11) NOT NULL DEFAULT 0,
  `ninos` int(11) NOT NULL DEFAULT 0,
  `infantes` int(11) NOT NULL DEFAULT 0,
  `costo` decimal(10,2) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_otro_v_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. FINANZAS MULTI-MONEDA, CAJA Y PASARELAS DE COBROS
-- --------------------------------------------------------

CREATE TABLE `metodo_pago` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,          -- Ej: 'Banesco', 'Zelle', 'Efectivo USD'
  `nombre_publico` varchar(200) NOT NULL,  -- Lo que ve el cliente en la app
  `tipo` enum('banco', 'digital', 'efectivo') NOT NULL, -- Clasificación operativa
  `logo` varchar(200) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `metodo_pago_banco` (
  `id_metodo` int(11) NOT NULL,
  `titular` varchar(200) NOT NULL,
  `tipo_documento` varchar(10) NOT NULL,   -- V, J, E, P
  `documento` varchar(20) NOT NULL,        -- Cédula o RIF
  `numero_cuenta` varchar(20) DEFAULT NULL, -- Los 20 dígitos del banco
  `tipo_cuenta` varchar(50) DEFAULT NULL,   -- Corriente / Ahorros
  `pago_movil_telefono` varchar(50) DEFAULT NULL, -- Teléfono asociado a Pago Móvil
  PRIMARY KEY (`id_metodo`),
  CONSTRAINT `fk_ext_banco_metodo` FOREIGN KEY (`id_metodo`) REFERENCES `metodo_pago` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `metodo_pago_digital` (
  `id_metodo` int(11) NOT NULL,
  `correo_cuenta` varchar(200) NOT NULL,    -- Correo de la cuenta destino
  `tipo_comision` enum('porcentaje', 'fijo', 'mixto') NOT NULL DEFAULT 'porcentaje',
  `comision_valor` decimal(5,2) NOT NULL DEFAULT 0.00, -- Ej: 5.00 por el 5%
  `codigo_postal` varchar(20) DEFAULT NULL, -- Datos de facturación requeridos por algunas plataformas
  `direccion_facturacion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_metodo`),
  CONSTRAINT `fk_ext_digital_metodo` FOREIGN KEY (`id_metodo`) REFERENCES `metodo_pago` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `metodo_pago_asesor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_metodo` int(11) NOT NULL,
  `id_asesor` int(11) NOT NULL,
  `asesor` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mpago_maestro` FOREIGN KEY (`id_metodo`) REFERENCES `metodo_pago` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mpago_asesor` FOREIGN KEY (`id_asesor`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pago_venta` (
  `id` int(5) UNSIGNED ZEROFILL NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_metodo` int(11) NOT NULL,
  `numero_transaccion` varchar(100) NOT NULL,
  -- EL CAMPO CLAVE PARA ELIMINAR LA TABLA ABONO:
  `tipo_pago` enum('pago_inicial', 'abono_cuota', 'pago_total') NOT NULL DEFAULT 'pago_total',
  `moneda_pago` varchar(10) NOT NULL DEFAULT 'USD',
  `monto_original` decimal(12,2) NOT NULL,
  `tasa_cambio` decimal(10,4) NOT NULL DEFAULT 1.0000,
  `monto_usd` decimal(10,2) NOT NULL,
  `comision_bancaria` decimal(10,2) NOT NULL DEFAULT 0.00,
  `quien_envia` varchar(200) NOT NULL,
  `observacion` text DEFAULT NULL,
  `id_credito` int(11) DEFAULT NULL, -- Enlace al módulo de financiamiento si aplica
  `fecha_pago` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pago_venta_general` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pago_venta_metodo` FOREIGN KEY (`id_metodo`) REFERENCES `metodo_pago` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pago_venta_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_pago` int(5) UNSIGNED ZEROFILL NOT NULL,
  `tipo_servicio` enum('hotel', 'ferry', 'vuelo', 'excursion', 'vehiculo', 'traslado', 'paquete', 'otro') NOT NULL,
  `monto_asignado_usd` decimal(10,2) NOT NULL, -- Fracción del pago destinada a este servicio
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_detalle_pago_padre` FOREIGN KEY (`id_pago`) REFERENCES `pago_venta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gastos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gasto` varchar(200) NOT NULL,
  `agencia` varchar(100) NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_moneda` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tasa` decimal(10,2) NOT NULL DEFAULT 1.00,
  `moneda` varchar(10) NOT NULL DEFAULT 'USD',
  `imagen_recibo` varchar(200) NOT NULL,
  `fecha_gasto` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. ANALITICA COMPLETA DE RENDIMIENTO (KPI RANKINGS)
-- --------------------------------------------------------

CREATE TABLE `ranking_semanal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `fecha_calculo` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_periodo_ranking` (`fecha_inicio`, `fecha_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ranking_semanal_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ranking` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `posicion` tinyint(2) NOT NULL,
  `total_vendido_usd` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_posicion_periodo` (`id_ranking`, `posicion`),
  CONSTRAINT `fk_detalle_ranking_padre` FOREIGN KEY (`id_ranking`) REFERENCES `ranking_semanal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_ranking_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. OPTIMIZACIONES DE RENDIMIENTO (Índices)
-- --------------------------------------------------------

ALTER TABLE `tarifa_habitacion` 
  ADD INDEX `idx_busqueda_tarifa` (`id_habitacion`, `desde`, `hasta`);

ALTER TABLE `vehiculo_tarifa` 
  ADD INDEX `idx_busqueda_vehiculo` (`id_vehiculo`, `desde`, `hasta`);

COMMIT;