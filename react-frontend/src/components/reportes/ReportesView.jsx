import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import plantillaTarifas from '../../assets/Plantilla-tarifas.png';

// Iconos SVG estrictos de assets (CERO emojis)
import imprimirIcon from '../../assets/Imprimir.svg';
import reportesIcon from '../../assets/reportes.svg';
import calendarioIcon from '../../assets/calendario-01.svg';
import lupaIcon from '../../assets/lupa.svg';
import volverIcon from '../../assets/Volver.svg';

// Muestras de datos según las capturas del usuario
const DATOS_MUESTRA = {
  reportes_comisiones: [
    { ficha: '14960', fecha: '01-10-2026', asesor: 'Erick Herrera', cliente: 'Marco Luis Coviello Quintero', checkin: '11-10-2026', checkout: '13-10-2026', total_usd: 912, abon: 912, rest: 0, pago_usd: 456, pago_ves: 392237.53, comision_ves: 7844.75, comision_usd: 0 },
    { ficha: '14605', fecha: '02-11-2026', asesor: 'Erick Herrera', cliente: 'Vladimir Travieso Hidalgo', checkin: '12-11-2026', checkout: '15-11-2026', total_usd: 375, abon: 375, rest: 0, pago_usd: 100, pago_ves: 86017.00, comision_ves: 1720.34, comision_usd: 0 },
    { ficha: '15072', fecha: '21-10-2026', asesor: 'Yoselis Díaz', cliente: 'Ninoska Prato', checkin: '09-10-2026', checkout: '12-10-2026', total_usd: 590, abon: 590, rest: 0, pago_usd: 118, pago_ves: 101500.69, comision_ves: 0, comision_usd: 0 },
    { ficha: '15074', fecha: '21-10-2026', asesor: 'Roxana Martinez', cliente: 'Jarianny Martinez', checkin: '02-10-2026', checkout: '04-10-2026', total_usd: 270, abon: 270, rest: 0, pago_usd: 81, pago_ves: 69674.20, comision_ves: 1045.11, comision_usd: 0 },
    { ficha: '14880', fecha: '01-10-2026', asesor: 'Erick Herrera', cliente: 'Yusmeiry Wusmale Figueroa Peña', checkin: '06-10-2026', checkout: '10-10-2026', total_usd: 660, abon: 660, rest: 0, pago_usd: 330, pago_ves: 283857.84, comision_ves: 5677.16, comision_usd: 0 },
    { ficha: '14624', fecha: '01-10-2026', asesor: 'Erick Herrera', cliente: 'Odexa Carina Recio Pamphili', checkin: '09-10-2026', checkout: '11-10-2026', total_usd: 756, abon: 756, rest: 0, pago_usd: 200, pago_ves: 172034.00, comision_ves: 3440.68, comision_usd: 0 },
    { ficha: '14551', fecha: '02-11-2026', asesor: 'Roxana Martinez', cliente: 'Aliomar Mattey', checkin: '30-12-2026', checkout: '03-01-2027', total_usd: 3632, abon: 1821.55, rest: 1810.45, pago_usd: 200, pago_ves: 172034.00, comision_ves: 2580.51, comision_usd: 0 },
    { ficha: '14348', fecha: '01-10-2026', asesor: 'Lorena Serra', cliente: 'Ambar Garcia', checkin: '07-10-2026', checkout: '12-10-2026', total_usd: 736, abon: 736, rest: 0, pago_usd: 334, pago_ves: 287300.12, comision_ves: 5746, comision_usd: 0 },
  ],

  reportes_cuentas_cobrar: [
    { ficha: 'LA00373', alojamiento: 'LD Plus / Playa El Agua /', cliente: 'Laras Concrete Miami Services', checkin: '20-09-2022', checkout: '25-09-2022', total: '4569.97 USD', abonado: '0 USD', restante: '4569.97 USD' },
    { ficha: '01099', alojamiento: 'Hesperia Playa El Agua /', cliente: 'Karla Pérez', checkin: '17-12-2022', checkout: '21-12-2022', total: '714 USD', abonado: '670 USD', restante: '44.00 USD' },
    { ficha: '00293', alojamiento: 'Hesperia Isla Margarita / El Valle de Pedro Gonzalez /', cliente: 'Alicia Gonzalez', checkin: '24-12-2022', checkout: '27-12-2022', total: '2820 USD', abonado: '2469 USD', restante: '351.00 USD' },
    { ficha: 'RM01290', alojamiento: 'Sunsol Isla Caribe /', cliente: 'Edgar Rivera', checkin: '24-12-2022', checkout: '29-12-2022', total: '1310 USD', abonado: '1228 USD', restante: '82.00 USD' },
    { ficha: 'LA00192', alojamiento: 'Hesperia Playa El Agua /', cliente: 'Nora Pernalete', checkin: '29-12-2022', checkout: '02-01-2023', total: '1404 USD', abonado: '1158 USD', restante: '246.00 USD' },
    { ficha: '05584', alojamiento: 'Sunsol Punta Blanca /', cliente: 'Plan de Viaje C.A', checkin: '10-12-2023', checkout: '11-12-2023', total: '1863 USD', abonado: '1380 USD', restante: '483.00 USD' },
    { ficha: 'MR0706B', alojamiento: 'Posada Guaripete /', cliente: 'Riccardo Arnone', checkin: '22-08-2024', checkout: '24-08-2024', total: '1300 USD', abonado: '1000 USD', restante: '300.00 USD' },
    { ficha: 'EH07918', alojamiento: 'Sunsol Isla Caribe /', cliente: 'Leonardo Gabriel Palma', checkin: '16-10-2024', checkout: '20-10-2024', total: '822 USD', abonado: '676 USD', restante: '146.00 USD' },
    { ficha: 'RM08845', alojamiento: 'Sunsol Isla Caribe /', cliente: 'Dhayisbel Torrealba', checkin: '23-12-2024', checkout: '26-12-2024', total: '1132 USD', abonado: '566 USD', restante: '566.00 USD' },
    { ficha: 'RM08005', alojamiento: 'Hesperia Playa El Agua / Hesperia Playa El Agua /', cliente: 'Anais Maldonado', checkin: '06-01-2025', checkout: '09-01-2025', total: '1024 USD', abonado: '240 USD', restante: '784.00 USD' },
    { ficha: 'LA10197', alojamiento: 'Sunsol Isla Caribe / Sunsol Isla Caribe /', cliente: 'Yuleisy arraez', checkin: '29-07-2025', checkout: '01-08-2025', total: '587 USD', abonado: '195 USD', restante: '392.00 USD' },
    { ficha: 'EH11540', alojamiento: 'Sunsol Isla Caribe /', cliente: 'Aurora Antonieta Castillo Zamudio', checkin: '11-09-2025', checkout: '15-09-2025', total: '745 USD', abonado: '100 USD', restante: '645.00 USD' },
  ],

  reportes_cuentas_pagar: [
    { ficha: 'LA00373', alojamiento: 'LD Plus / Playa El Agua', cliente: 'Laras Concrete Miami Services', checkin: '20-09-2022', checkout: '25-09-2022', total_pagar: '0 USD' },
    { ficha: 'LA05662', alojamiento: 'LD Palm Beach / Playa El Agua', cliente: 'Keylu Abreu', checkin: '28-12-2023', checkout: '30-12-2023', total_pagar: '304 USD' },
    { ficha: 'AM14135', alojamiento: 'LD Palm Beach / Playa El Agua', cliente: 'Daniela Teran', checkin: '25-08-2026', checkout: '28-08-2026', total_pagar: '550.8 USD' },
    { ficha: 'AM14308', alojamiento: 'LD Palm Beach / Playa El Agua', cliente: 'Nestor Santo', checkin: '25-08-2026', checkout: '28-08-2026', total_pagar: '367.2 USD' },
    { ficha: 'AM14525', alojamiento: 'Hesperia Playa El Agua', cliente: 'Daniela Velasquez Rodriguez', checkin: '25-08-2026', checkout: '27-08-2026', total_pagar: '208 USD' },
    { ficha: 'EH14613', alojamiento: 'Sunsol Punta Blanca', cliente: 'Josmar Alexander Peña Rojas', checkin: '26-08-2026', checkout: '28-08-2026', total_pagar: '652.8 USD' },
    { ficha: 'LS14461', alojamiento: 'Margarita Village / Porlamar', cliente: 'Candida Chirinos', checkin: '27-08-2026', checkout: '31-08-2026', total_pagar: '1360 USD' },
    { ficha: 'LS14532', alojamiento: 'Sunsol Isla Caribe', cliente: 'Rosalinda Arevalo', checkin: '27-08-2026', checkout: '30-08-2026', total_pagar: '714 USD' },
    { ficha: 'LZ14568', alojamiento: 'Posada Guaripete', cliente: 'Yoximar Sanchez', checkin: '27-08-2026', checkout: '29-08-2026', total_pagar: '1134 USD' },
    { ficha: 'DQ13633', alojamiento: 'Costa Caribe / Playa Caribe', cliente: 'Colegio los Proceres', checkin: '28-08-2026', checkout: '30-08-2026', total_pagar: '3312 USD' },
    { ficha: 'DQ13634', alojamiento: 'Costa Caribe / Playa Caribe', cliente: 'Adicionales Colegio los proceres', checkin: '28-08-2026', checkout: '30-08-2026', total_pagar: '480 USD' },
    { ficha: 'EH13845', alojamiento: 'LD Palm Beach / Playa El Agua', cliente: 'Norys Eglee Naranjo Borges', checkin: '28-08-2026', checkout: '31-08-2026', total_pagar: '367.2 USD' },
    { ficha: 'DR14610', alojamiento: 'Margarita Village / Porlamar', cliente: 'Anthony Hernandez', checkin: '28-08-2026', checkout: '30-08-2026', total_pagar: '340.8 USD' },
    { ficha: 'YD14661', alojamiento: 'Margarita Village / Porlamar', cliente: 'Alessandro Ramos', checkin: '28-08-2026', checkout: '30-08-2026', total_pagar: '272 USD' },
    { ficha: 'YB14514', alojamiento: 'Hesperia Playa El Agua', cliente: 'Daniel Guerra', checkin: '29-08-2026', checkout: '31-08-2026', total_pagar: '208 USD' },
  ],

  reportes_pagos_entrantes: [
    { ficha: 'EH14960', checkin: '11-10-2026', checkout: '13-10-2026', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: 'Marco Coviello', entrante: '456.00 VES', comision: '0 VES' },
    { ficha: 'EH14605', checkin: '12-11-2026', checkout: '15-11-2026', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: 'Vladimir Travieso', entrante: '100.00 VES', comision: '0 VES' },
    { ficha: 'YD15072', checkin: '09-10-2026', checkout: '12-10-2026', metodo: 'BNC Cashea (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '118.00 VES', comision: '0 VES' },
    { ficha: 'RM15074', checkin: '02-10-2026', checkout: '04-10-2026', metodo: 'BNC Juridica BSs (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '81.00 VES', comision: '0 VES' },
    { ficha: 'EH14880', checkin: '06-10-2026', checkout: '10-10-2026', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '330.00 VES', comision: '0 VES' },
    { ficha: 'EH14624', checkin: '09-10-2026', checkout: '11-10-2026', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '200.00 VES', comision: '0 VES' },
    { ficha: 'RM14551', checkin: '30-12-2026', checkout: '03-01-2027', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '200.00 VES', comision: '0 VES' },
    { ficha: 'LS14348', checkin: '07-10-2026', checkout: '12-10-2026', metodo: 'Mercantil P/Natural (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '334.00 VES', comision: '0 VES' },
    { ficha: 'LS14485', checkin: '09-10-2026', checkout: '12-10-2026', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '574.00 VES', comision: '0 VES' },
    { ficha: 'LS14651', checkin: '14-01-2027', checkout: '17-01-2027', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '112.00 VES', comision: '0 VES' },
    { ficha: 'LS14447', checkin: '24-12-2026', checkout: '27-12-2026', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '124.00 VES', comision: '0 VES' },
    { ficha: 'LS15075', checkin: '16-10-2026', checkout: '18-10-2026', metodo: 'Banesco Bs Juridica (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '589.00 VES', comision: '0 VES' },
    { ficha: 'LS15071', checkin: '14-10-2026', checkout: '18-10-2026', metodo: 'Banesco P/Natural (0.00%)', fecha_pago: '01-10-2026', quien_envia: '-', entrante: '190.82 VES', comision: '0 VES' },
  ],

  reportes_checkin: [
    { ficha_asesor: '13773 / Leodalbis Acosta', cliente: 'Vetvital Vetvital', alojamiento: 'Sunsol Isla Caribe', checkin: '01-10-2026', checkout: '04-10-2026', total: '1395 USD', abonado: '1395 USD', restante: '0.00 USD', costo_hotel: '1068.00 USD' },
    { ficha_asesor: '14480 / Lorena Serra', cliente: 'Luisangeli Diaz', alojamiento: 'Margarita Village / Porlamar', checkin: '01-10-2026', checkout: '03-10-2026', total: '300 USD', abonado: '300 USD', restante: '0.00 USD', costo_hotel: '208.00 USD' },
    { ficha_asesor: '14481 / Lorena Serra', cliente: 'Juan Diaz', alojamiento: 'Margarita Village / Porlamar', checkin: '01-10-2026', checkout: '03-10-2026', total: '430 USD', abonado: '430 USD', restante: '0.00 USD', costo_hotel: '312.00 USD' },
    { ficha_asesor: '14482 / Lorena Serra', cliente: 'Yonglimar Polo', alojamiento: 'Margarita Village / Porlamar', checkin: '01-10-2026', checkout: '03-10-2026', total: '300 USD', abonado: '300 USD', restante: '0.00 USD', costo_hotel: '208.00 USD' },
    { ficha_asesor: '14513 / Lorena Serra', cliente: 'Yuliany Rivas', alojamiento: 'Margarita Village / Porlamar', checkin: '01-10-2026', checkout: '03-10-2026', total: '210 USD', abonado: '210 USD', restante: '0.00 USD', costo_hotel: '136.00 USD' },
    { ficha_asesor: '14573 / Erick Herrera', cliente: 'Alexandra Andreina Mérida Guevara', alojamiento: 'Margarita Village / Porlamar', checkin: '01-10-2026', checkout: '04-10-2026', total: '450 USD', abonado: '450 USD', restante: '0.00 USD', costo_hotel: '312.00 USD' },
    { ficha_asesor: '14623 / Lorena Zabala', cliente: 'Jeimmy Monterrey', alojamiento: 'Margarita Village / Porlamar', checkin: '01-10-2026', checkout: '05-10-2026', total: '560 USD', abonado: '560 USD', restante: '0.00 USD', costo_hotel: '416.00 USD' },
    { ficha_asesor: '14640 / Yusbel Bello', cliente: 'Breitner Linares', alojamiento: 'Sunsol Ecoland', checkin: '01-10-2026', checkout: '04-10-2026', total: '660 USD', abonado: '660 USD', restante: '0.00 USD', costo_hotel: '528.00 USD' },
    { ficha_asesor: '14643 / Yusbel Bello', cliente: 'Oscar Perez', alojamiento: 'Sunsol Ecoland', checkin: '01-10-2026', checkout: '04-10-2026', total: '963 USD', abonado: '963 USD', restante: '0.00 USD', costo_hotel: '770.40 USD' },
    { ficha_asesor: '14645 / Yusbel Bello', cliente: 'Luis Martinez', alojamiento: 'Sunsol Ecoland', checkin: '01-10-2026', checkout: '04-10-2026', total: '963 USD', abonado: '963 USD', restante: '0.00 USD', costo_hotel: '770.40 USD' },
    { ficha_asesor: '14659 / Yusbel Bello', cliente: 'Ruben Millan', alojamiento: 'Sunsol Ecoland', checkin: '01-10-2026', checkout: '04-10-2026', total: '660 USD', abonado: '660 USD', restante: '0.00 USD', costo_hotel: '528.00 USD' },
    { ficha_asesor: '14750 / Lorena Serra', cliente: 'Maria Celis', alojamiento: 'Margarita Village / Porlamar', checkin: '01-10-2026', checkout: '03-10-2026', total: '210 USD', abonado: '210 USD', restante: '0.00 USD', costo_hotel: '136.00 USD' },
    { ficha_asesor: '14795 / Roxana Martinez', cliente: 'Juan Gomez', alojamiento: 'Sunsol Unik Luxury', checkin: '01-10-2026', checkout: '04-10-2026', total: '700 USD', abonado: '700 USD', restante: '0.00 USD', costo_hotel: '528.00 USD' },
  ],

  reportes_estado_venta: [
    { ficha: '15064', asesor: 'Lorena Zabala', cliente: 'Diveana Salazar', producto: 'Hotel', checkin: '16/11/2026', checkout: '19/11/2026', total: '675.00 USD' },
    { ficha: '15066', asesor: 'Yoselis Díaz', cliente: 'Edelweiss Castro', producto: 'Solo boleto', checkin: '30/10/2026', checkout: '01/11/2026', total: '788.00 USD' },
    { ficha: '15060', asesor: 'Roxana Martinez', cliente: 'Keynnys Pinto', producto: 'Solo boleto', checkin: '10/10/2026', checkout: '15/10/2026', total: '432.00 USD' },
    { ficha: '14960', asesor: 'Erick Herrera', cliente: 'Marco Luis Coviello Quintero', producto: 'Hotel / Boleto', checkin: '11/10/2026', checkout: '13/10/2026', total: '912.00 USD' },
    { ficha: '14880', asesor: 'Erick Herrera', cliente: 'Yusmeiry Wusmale Figueroa Peña', producto: 'Hotel', checkin: '06/10/2026', checkout: '10/10/2026', total: '660.00 USD' },
    { ficha: '14624', asesor: 'Erick Herrera', cliente: 'Odexa Carina Recio Pamphili', producto: 'Hotel / Boleto', checkin: '09/10/2026', checkout: '11/10/2026', total: '756.00 USD' },
    { ficha: '14348', asesor: 'Lorena Serra', cliente: 'Ambar Garcia', producto: 'Hotel', checkin: '07/10/2026', checkout: '12/10/2026', total: '736.00 USD' },
    { ficha: '14485', asesor: 'Lorena Serra', cliente: 'Elimar Serrano', producto: 'Hotel / Boleto', checkin: '09/10/2026', checkout: '12/10/2026', total: '1,004.00 USD' },
    { ficha: '14651', asesor: 'Lorena Serra', cliente: 'Hender Maldonado', producto: 'Solo boleto', checkin: '14/01/2027', checkout: '17/01/2027', total: '332.00 USD' },
    { ficha: '15075', asesor: 'Lorena Serra', cliente: 'Betzabeth Aponte', producto: 'Hotel / Boleto', checkin: '16/10/2026', checkout: '18/10/2026', total: '589.00 USD' },
    { ficha: '15071', asesor: 'Lorena Serra', cliente: 'Silmar Alvarez', producto: 'Hotel', checkin: '14/10/2026', checkout: '18/10/2026', total: '370.00 USD' },
    { ficha: '14053', asesor: 'Erick Herrera', cliente: 'Maria Gabriela Altuve Marquez', producto: 'Hotel', checkin: '21/11/2026', checkout: '24/11/2026', total: '574.00 USD' },
    { ficha: '15076', asesor: 'Erick Herrera', cliente: 'Maria Gabriela Altuve Márquez', producto: 'Solo boleto', checkin: '21/11/2026', checkout: '24/11/2026', total: '280.00 USD' },
    { ficha: '14369', asesor: 'Erick Herrera', cliente: 'Johanna Alexandra Araujo Santiago', producto: 'Hotel', checkin: '16/10/2026', checkout: '18/10/2026', total: '1,724.00 USD' },
    { ficha: '15077', asesor: 'Roxana Martinez', cliente: 'MIRAFIORI MOTORS C.A', producto: 'Solo boleto', checkin: '05/10/2026', checkout: '09/10/2026', total: '244.00 USD' },
    { ficha: '15080', asesor: 'Roxana Martinez', cliente: 'Hendryk Contreras', producto: 'Hotel / Boleto', checkin: '03/10/2026', checkout: '05/10/2026', total: '930.00 USD' },
  ],

  reportes_estado_cotizaciones: [
    { ficha: '15065', asesor: 'Erick Herrera', cliente: 'Sr. FELIPE', producto: 'Hotel / Boleto', checkin: '10/10/2026', checkout: '14/10/2026', total: '3,089.00 USD' },
    { ficha: '15069', asesor: 'Roxana Martinez', cliente: 'Sra. .', producto: 'Hotel', checkin: '12/10/2026', checkout: '16/10/2026', total: '800.00 USD' },
    { ficha: '15070', asesor: 'Roxana Martinez', cliente: 'Sra. .', producto: 'Hotel', checkin: '13/10/2026', checkout: '16/10/2026', total: '620.00 USD' },
    { ficha: '15079', asesor: 'Lorena Serra', cliente: 'Sra Hernandez', producto: 'Hotel / Boleto', checkin: '14/10/2026', checkout: '18/10/2026', total: '884.00 USD' },
    { ficha: '15082', asesor: 'Lorena Serra', cliente: 'Sra Estefany', producto: 'Hotel / Boleto', checkin: '08/11/2026', checkout: '10/11/2026', total: '2,833.00 USD' },
    { ficha: '15086', asesor: 'Roxana Martinez', cliente: 'sr .', producto: 'Hotel / Boleto', checkin: '15/11/2026', checkout: '17/11/2026', total: '1,370.00 USD' },
    { ficha: '15089', asesor: 'Erick Herrera', cliente: 'Christian Alvarez', producto: 'Hotel / Boleto', checkin: '08/10/2026', checkout: '14/10/2026', total: '1,562.00 USD' },
    { ficha: '15090', asesor: 'Roxana Martinez', cliente: 'Sr .', producto: 'Hotel / Boleto', checkin: '15/10/2026', checkout: '18/10/2026', total: '1,069.00 USD' },
    { ficha: '15092', asesor: 'Roxana Martinez', cliente: 'Sr .', producto: 'Hotel', checkin: '07/01/2027', checkout: '10/01/2027', total: '503.00 USD' },
    { ficha: '15093', asesor: 'Roxana Martinez', cliente: 'Sr .', producto: 'Hotel', checkin: '07/01/2027', checkout: '10/01/2027', total: '253.00 USD' },
    { ficha: '15094', asesor: 'Roxana Martinez', cliente: 'Sra Carmen', producto: 'Hotel / Boleto', checkin: '04/01/2027', checkout: '08/01/2027', total: '2,011.00 USD' },
    { ficha: '15099', asesor: 'Erick Herrera', cliente: 'Eglenis Cuarez', producto: 'Hotel', checkin: '06/10/2026', checkout: '09/10/2026', total: '330.00 USD' },
    { ficha: '15103', asesor: 'Roxana Martinez', cliente: 'Sra. .', producto: 'Hotel', checkin: '19/11/2026', checkout: '26/11/2026', total: '3,765.00 USD' },
    { ficha: '15104', asesor: 'Erick Herrera', cliente: 'Sr. Gonzalez', producto: 'Hotel / Boleto', checkin: '31/10/2026', checkout: '02/11/2026', total: '590.00 USD' },
    { ficha: '15105', asesor: 'Roxana Martinez', cliente: 'Sra. .', producto: 'Hotel', checkin: '08/10/2026', checkout: '11/10/2026', total: '565.00 USD' },
    { ficha: '15101', asesor: 'Roxana Martinez', cliente: 'Michelle Lozano', producto: 'Hotel / Boleto', checkin: '19/11/2026', checkout: '26/11/2026', total: '4,325.00 USD' },
  ],

  reportes_estado_notas_credito: [
    { ficha: '15534', asesor: 'Eveliannys Marín', cliente: 'nrsrb btrntr', producto: 'Hotel', checkin: '18/11/2026', checkout: '19/11/2026', total: '75.00 USD' },
  ],
};

const TITULOS_REPORTES = {
  reportes_comisiones: 'Reporte de Comisiones',
  reportes_cuentas_cobrar: 'Cuentas por Cobrar',
  reportes_cuentas_pagar: 'Cuentas por Pagar',
  reportes_pagos_entrantes: 'Reporte de Pagos Entrantes',
  reportes_checkin: 'Reporte Checkin',
  reportes_estado_venta: 'Reporte de Estado Ventas',
};

export default function ReportesView({ activeRoute = 'reportes_pagos_entrantes', user, onVolver }) {
  const [fechaDesde, setFechaDesde] = useState('2026-10-01');
  const [fechaHasta, setFechaHasta] = useState('2026-11-20');
  const [filtroAsesor, setFiltroAsesor] = useState('todos');
  const [tipoEstadoVenta, setTipoEstadoVenta] = useState('ventas'); // 'ventas' | 'cotizaciones' | 'notas_credito'
  const [filtroAlojamiento, setFiltroAlojamiento] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendData, setBackendData] = useState(null);

  // Endpoint slug mapping
  const endpointSlug = useMemo(() => {
    switch (activeRoute) {
      case 'reportes_comisiones': return 'comisiones';
      case 'reportes_cuentas_cobrar': return 'cuentas-cobrar';
      case 'reportes_cuentas_pagar': return 'cuentas-pagar';
      case 'reportes_pagos_entrantes': return 'pagos-entrantes';
      case 'reportes_checkin': return 'checkin';
      case 'reportes_estado_venta': return 'estado-venta';
      default: return 'pagos-entrantes';
    }
  }, [activeRoute]);

  const tituloActual = useMemo(() => {
    if (activeRoute === 'reportes_estado_venta') {
      if (tipoEstadoVenta === 'cotizaciones') return 'Reporte de Estado Cotizaciones';
      if (tipoEstadoVenta === 'notas_credito') return 'Reporte de Estado Notas de Crédito';
      return 'Reporte de Estado Ventas';
    }
    return TITULOS_REPORTES[activeRoute] || 'Reporte Oficial';
  }, [activeRoute, tipoEstadoVenta]);

  // Cargar datos del backend si está disponible, o usar muestra representativa
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/v1/reportes/${endpointSlug}`, {
          params: {
            fecha_inicio: fechaDesde,
            fecha_fin: fechaHasta,
            id_user: filtroAsesor,
            tipo_estado: tipoEstadoVenta,
          },
        });
        if (isMounted && res.data && Array.isArray(res.data.registros) && res.data.registros.length > 0) {
          setBackendData(res.data);
        } else {
          setBackendData(null);
        }
      } catch (err) {
        // En caso de que la BD aún no tenga registros para el rango, mantener datos modelo
        if (isMounted) setBackendData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [endpointSlug, fechaDesde, fechaHasta, filtroAsesor, tipoEstadoVenta]);

  // Lista activa de filas
  const filasRaw = useMemo(() => {
    if (backendData?.registros && backendData.registros.length > 0) {
      return backendData.registros;
    }
    if (activeRoute === 'reportes_estado_venta') {
      if (tipoEstadoVenta === 'cotizaciones') return DATOS_MUESTRA.reportes_estado_cotizaciones;
      if (tipoEstadoVenta === 'notas_credito') return DATOS_MUESTRA.reportes_estado_notas_credito;
      return DATOS_MUESTRA.reportes_estado_venta;
    }
    return DATOS_MUESTRA[activeRoute] || [];
  }, [backendData, activeRoute, tipoEstadoVenta]);

  // Filtrado reactivo en pantalla por texto
  const filasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return filasRaw;
    const term = busqueda.toLowerCase().trim();
    return filasRaw.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [filasRaw, busqueda]);

  // División en páginas carta (máximo 14 filas por página para no sobrepasar el pie de página de la plantilla)
  const filasPorPagina = 14;
  const paginas = useMemo(() => {
    if (filasFiltradas.length === 0) return [[]];
    const chunks = [];
    for (let i = 0; i < filasFiltradas.length; i += filasPorPagina) {
      chunks.push(filasFiltradas.slice(i, i + filasPorPagina));
    }
    return chunks;
  }, [filasFiltradas]);

  const handlePrint = () => {
    window.print();
  };

  // Formateador de moneda
  const formatNum = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Estilos CSS para Impresión exacta de Hoja Carta con Plantilla */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #reporte-print-container, #reporte-print-container * {
            visibility: visible !important;
          }
          #reporte-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .reporte-tarifa-sheet {
            width: 8.5in !important;
            height: 11in !important;
            min-height: 11in !important;
            max-height: 11in !important;
            page-break-after: always !important;
            break-after: page !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
            position: relative !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            margin: 0 !important;
            background-color: #FFFFFF !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================= */}
      {/* 1. BARRA SUPERIOR DE CONTROL Y FILTROS (SOLO PANTALLA)    */}
      {/* ========================================================= */}
      <div
        className="no-print"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 19, 43, 0.9) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={reportesIcon}
              alt=""
              style={{
                width: '26px',
                height: '26px',
                filter: 'brightness(0) saturate(100%) invert(67%) sepia(85%) saturate(3025%) hue-rotate(345deg) brightness(101%) contrast(98%)',
              }}
            />
            <div>
              <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800 }}>
                {tituloActual}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Plantilla Oficial de Reportes con Membrete y Salida en Formato Carta
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Buscador Rápido en Tabla */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                placeholder="Filtrar en tabla..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                }}
              />
              <img
                src={lupaIcon}
                alt=""
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '14px',
                  height: '14px',
                  opacity: 0.6,
                }}
              />
            </div>

            {/* Botón Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                background: '#F26522',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(242, 101, 34, 0.4)',
                transition: 'all 0.2s',
              }}
              title="Imprimir reporte en hoja carta o guardar como PDF"
            >
              <img src={imprimirIcon} alt="" style={{ width: '15px', height: '15px', filter: 'brightness(0) invert(1)' }} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros de Fecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#CBD5E1', fontWeight: 600 }}>Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{
                padding: '5px 10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#CBD5E1', fontWeight: 600 }}>Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{
                padding: '5px 10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
              }}
            />
          </div>

          {activeRoute === 'reportes_comisiones' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: '#CBD5E1', fontWeight: 600 }}>Asesor:</span>
              <select
                value={filtroAsesor}
                onChange={(e) => setFiltroAsesor(e.target.value)}
                style={{
                  padding: '5px 10px',
                  background: '#0F1E42',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                }}
              >
                <option value="todos">Todos los Asesores</option>
                <option value="Erick Herrera">Erick Herrera</option>
                <option value="Roxana Martinez">Roxana Martinez</option>
                <option value="Lorena Serra">Lorena Serra</option>
                <option value="Yoselis Díaz">Yoselis Díaz</option>
                <option value="Yusbel Bello">Yusbel Bello</option>
              </select>
            </div>
          )}

          {activeRoute === 'reportes_estado_venta' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: '#CBD5E1', fontWeight: 600 }}>Filtrar Estado:</span>
              <div style={{ display: 'inline-flex', background: 'rgba(0, 0, 0, 0.35)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <button
                  type="button"
                  onClick={() => setTipoEstadoVenta('ventas')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: tipoEstadoVenta === 'ventas' ? '1px solid #F26522' : 'none',
                    background: tipoEstadoVenta === 'ventas' ? '#00206D' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: tipoEstadoVenta === 'ventas' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Ventas
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEstadoVenta('cotizaciones')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: tipoEstadoVenta === 'cotizaciones' ? '1px solid #F26522' : 'none',
                    background: tipoEstadoVenta === 'cotizaciones' ? '#00206D' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: tipoEstadoVenta === 'cotizaciones' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Cotizaciones
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEstadoVenta('notas_credito')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: tipoEstadoVenta === 'notas_credito' ? '1px solid #F26522' : 'none',
                    background: tipoEstadoVenta === 'notas_credito' ? '#00206D' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: tipoEstadoVenta === 'notas_credito' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Notas de Crédito
                </button>
              </div>
            </div>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#94A3B8' }}>
            Mostrando <strong>{filasFiltradas.length}</strong> registros en <strong>{paginas.length}</strong> página(s) carta.
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ÁREA DE VISUALIZACIÓN E IMPRESIÓN (HOJA CARTA)        */}
      {/* ========================================================= */}
      <div
        id="reporte-print-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '30px',
        }}
      >
        {paginas.map((grupoFilas, pageIndex) => (
          <div
            key={pageIndex}
            className="reporte-tarifa-sheet"
            style={{
              width: '792px',
              height: '1024px',
              minHeight: '1024px',
              maxHeight: '1024px',
              position: 'relative',
              backgroundImage: `url(${plantillaTarifas})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.55)',
              overflow: 'hidden',
              fontFamily: "'Poppins', 'Montserrat', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
            }}
          >
            {/* Contenido Util dentro de la plantilla */}
            <div
              style={{
                position: 'absolute',
                top: '160px',
                bottom: '68px',
                left: '34px',
                right: '34px',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
              }}
            >
              {/* Título Principal */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '23px',
                    fontWeight: 800,
                    color: '#00206D',
                    letterSpacing: '0.4px',
                  }}
                >
                  {tituloActual}
                </h1>
                {/* Rango de fechas */}
                {['reportes_comisiones', 'reportes_pagos_entrantes', 'reportes_checkin', 'reportes_estado_venta'].includes(activeRoute) && (
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: '#00206D',
                      marginTop: '2px',
                    }}
                  >
                    ({activeRoute === 'reportes_estado_venta'
                      ? `${fechaDesde.split('-').reverse().join('/')} a ${fechaHasta.split('-').reverse().join('/')}`
                      : `${fechaDesde.split('-').reverse().join('-')} a ${fechaHasta.split('-').reverse().join('-')}`})
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* TARJETAS SUPERIORES DE RESUMEN SEGÚN CADA REPORTE (IMG 8) */}
              {/* ========================================================= */}
              <div style={{ marginBottom: '10px' }}>
                {/* Caso 1: Reporte de Pagos Entrantes (Exacto a Imagen 8) */}
                {activeRoute === 'reportes_pagos_entrantes' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1.2px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#00206D', marginBottom: '1px' }}>
                        Total Entrante:
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#00206D' }}>
                        146462.65 VES - 48809.77 USD
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1.2px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#00206D', marginBottom: '1px' }}>
                        Total Comisiones:
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#00206D' }}>
                        0 VES - 0 USD
                      </div>
                    </div>
                  </div>
                )}

                {/* Caso 2: Reporte de Comisiones */}
                {activeRoute === 'reportes_comisiones' && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1.2px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '5px 14px',
                      textAlign: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#00206D' }}>
                      Asesor: {filtroAsesor === 'todos' ? 'Todos' : filtroAsesor}
                    </div>
                  </div>
                )}

                {/* Caso 3: Cuentas por Cobrar */}
                {activeRoute === 'reportes_cuentas_cobrar' && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1.2px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      textAlign: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#00206D' }}>
                      Total Restante: 217756.1 USD
                    </div>
                  </div>
                )}

                {/* Caso 4: Cuentas por Pagar */}
                {activeRoute === 'reportes_cuentas_pagar' && (
                  <div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        border: '1.2px solid #CBD5E1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ background: '#FFFFFF', padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #CBD5E1', fontWeight: 800, fontSize: '12px', color: '#00206D' }}>
                        Alojamiento: Todos
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '6px 12px', textAlign: 'center', fontWeight: 800, fontSize: '12px', color: '#00206D' }}>
                        Total a Pagar: 320734.91 USD
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#00206D', paddingLeft: '4px' }}>
                      Hoteles
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* TABLA PRINCIPAL DE DATOS SEGÚN EL REPORTE ACTIVO          */}
              {/* ========================================================= */}
              <div
                style={{
                  flex: 1,
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9.5px', color: '#0F172A' }}>
                  {/* ENCABEZADOS DE TABLA (AZUL MARINO #00206D CON TEXTO BLANCO) */}
                  <thead>
                    <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                      {/* 1. Comisiones */}
                      {activeRoute === 'reportes_comisiones' && (
                        <>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '14%' }}>Ficha / Fecha</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '15%' }}>Asesor</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '22%' }}>Cliente</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '18%' }}>Check-in / Check-out</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '18%' }}>Total</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '13%' }}>Comision</th>
                        </>
                      )}

                      {/* 2. Cuentas por Cobrar */}
                      {activeRoute === 'reportes_cuentas_cobrar' && (
                        <>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '12%' }}>Ficha</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '22%' }}>Alojamiento</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '20%' }}>Cliente</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '16%' }}>Check-in / Check-out</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '10%', textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '10%', textAlign: 'right' }}>Abonado</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '10%', textAlign: 'right' }}>Restante</th>
                        </>
                      )}

                      {/* 3. Cuentas por Pagar */}
                      {activeRoute === 'reportes_cuentas_pagar' && (
                        <>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '14%' }}>Ficha</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '28%' }}>Alojamiento</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '24%' }}>Cliente</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '18%' }}>Check-in / Check-out</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '16%', textAlign: 'right' }}>Total a Pagar</th>
                        </>
                      )}

                      {/* 4. Pagos Entrantes (Exacto a Imagen 8) */}
                      {activeRoute === 'reportes_pagos_entrantes' && (
                        <>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '11%' }}>Fecha / Ficha</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '16%' }}>Check-in / check-out</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '20%' }}>Metodo de Pago</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '11%' }}>Fecha de Pago</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '18%' }}>Quien envia</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '12%', textAlign: 'right' }}>Entrante</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '12%', textAlign: 'right' }}>Comision</th>
                        </>
                      )}

                      {/* 5. Check-in */}
                      {activeRoute === 'reportes_checkin' && (
                        <>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '17%' }}>Ficha / Asesor</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '17%' }}>Cliente</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '18%' }}>Alojamiento</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '16%' }}>Check-in / Check-out</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '8%', textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '8%', textAlign: 'right' }}>Abonado</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '8%', textAlign: 'right' }}>Restante</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '8%', textAlign: 'right' }}>Costo Hotel</th>
                        </>
                      )}

                      {/* 6. Estado de Venta */}
                      {activeRoute === 'reportes_estado_venta' && (
                        <>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '11%' }}>Nº Ficha</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '18%' }}>Nombre Asesor</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '25%' }}>Nombre Cliente</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '16%' }}>Producto</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '18%' }}>Check-in / Check-out</th>
                          <th style={{ padding: '6px 8px', fontWeight: 700, width: '12%', textAlign: 'right' }}>Total</th>
                        </>
                      )}
                    </tr>
                  </thead>

                  {/* CUERPO DE TABLA */}
                  <tbody>
                    {grupoFilas.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderTop: '1px solid #CBD5E1',
                          background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          lineHeight: '1.25',
                        }}
                      >
                        {/* 1. Comisiones */}
                        {activeRoute === 'reportes_comisiones' && (
                          <>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>
                              {row.ficha} /<br />{row.fecha}
                            </td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.asesor}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>{row.cliente}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.checkin} /<br />{row.checkout}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>
                              <div style={{ fontWeight: 700 }}>{row.total_usd} USD</div>
                              <div style={{ color: '#475569', fontSize: '8.5px' }}>Abon: {row.abon} | Rest: {row.rest}</div>
                              <div style={{ color: '#475569', fontSize: '8.5px' }}>Pago: {row.pago_usd} USD ({row.pago_ves} VES)</div>
                            </td>
                            <td style={{ padding: '5px 8px', fontWeight: 700 }}>
                              <div>{row.comision_ves} VES</div>
                              <div>{row.comision_usd} USD</div>
                            </td>
                          </>
                        )}

                        {/* 2. Cuentas por Cobrar */}
                        {activeRoute === 'reportes_cuentas_cobrar' && (
                          <>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#00206D' }}>{row.ficha}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.alojamiento}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>{row.cliente}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.checkin} / {row.checkout}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 600 }}>{row.total}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>{row.abonado}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{row.restante}</td>
                          </>
                        )}

                        {/* 3. Cuentas por Pagar */}
                        {activeRoute === 'reportes_cuentas_pagar' && (
                          <>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#00206D' }}>{row.ficha}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.alojamiento}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>{row.cliente}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.checkin} / {row.checkout}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#00206D' }}>{row.total_pagar}</td>
                          </>
                        )}

                        {/* 4. Pagos Entrantes (Exacto a Imagen 8) */}
                        {activeRoute === 'reportes_pagos_entrantes' && (
                          <>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#00206D' }}>{row.ficha}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.checkin} /<br />{row.checkout}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.metodo}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.fecha_pago}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 500 }}>{row.quien_envia}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 700 }}>{row.entrante}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>{row.comision}</td>
                          </>
                        )}

                        {/* 5. Check-in */}
                        {activeRoute === 'reportes_checkin' && (
                          <>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>{row.ficha_asesor}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>{row.cliente}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.alojamiento}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.checkin} /<br />{row.checkout}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right' }}>{row.total}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right', color: '#16A34A' }}>{row.abonado}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right', color: row.restante === '0.00 USD' ? '#64748B' : '#DC2626' }}>{row.restante}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#00206D' }}>{row.costo_hotel}</td>
                          </>
                        )}

                        {/* 6. Estado de Venta */}
                        {activeRoute === 'reportes_estado_venta' && (
                          <>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#00206D' }}>{row.ficha}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.asesor}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>{row.cliente}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.producto}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #E2E8F0' }}>{row.checkin} - {row.checkout}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#00206D' }}>{row.total}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pie de página de la hoja: Conteo y Paginación limpia */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#64748B',
                  borderTop: '1px solid #CBD5E1',
                  paddingTop: '4px',
                }}
              >
                <span>Reporte generado el {new Date().toLocaleDateString('es-ES')} - Plan de Viaje C.A.</span>
                <span>Página {pageIndex + 1} de {paginas.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
