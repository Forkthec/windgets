# Revisión de SPEC_Planificador.md (revisor, 26-nov, UTC-5). l. = línea del borrador (1071 l.).

## A. Construiría mal
1. l.563/577 PL-07: el anillo 120×120 va en la tarjeta de estados («Vencidas, pendientes y completadas», «20 / tarjetas», leyenda «Completadas · 12 · 60 %»), no en «Tasa de cumplimiento» (número `83,3 %` Bold 46 + «10 de 12 tarjetas completadas a tiempo»). Huella 204-1005. Reutilizable `EstadosTarjetas.tsx:78` (PieChart 240×240).
2. l.595-604: faltan literales de Reportes: «Tarjetas completadas», «Tasa de cumplimiento», «Vencidas, pendientes y completadas», «Tarjetas con fecha límite en el periodo elegido.», «tarjetas» bajo el total, «Completadas · n · p %», formato `83,3 %`.
3. l.409-414/438 PL-05 Escribir año (huella 219-14757): marco 360×364; «Listo» Principal 66×36; «Cancelar» 91×36 en (252,314); campo «Año» 110×36 lo abre. «Escribe un año entre 1970 y 2100.» es ayuda permanente `texto` 13, campo `borde_campo` 1,5 (no error). `date.year_out_of_range` inventado: RD-77 = meses deshabilitados sin error. Validación ya existe `screens/calendar/SelectorMesAnio.tsx:10-11,43-44`.
4. l.88/105/1065: «Tarjeta actualizada» MEDIDO en F2a l.76: «Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.» 660×42, Información.
5. l.697/212: avisos medidos: Etiquetas «Máximo» 474×42 (595,4) Advertencia 6 s, «inexistente» 232×42 (837,4) Información 4 s (F2b l.724/752); Kanban 474×42 (595,4) y 234×42 (835,4) (F2a l.96-97).
6. l.78/80-81 PL-01 (huella 204-622): barra pista `linea` 365×7 r4, relleno `detalle` 91×7; mini calendario `superficie` + trazo `linea` 1 r8; resaltados `relleno_completada/vencida/pendiente`. Solo «Próximas a vencer» es `superficie_alta`.
7. l.1010: `planificador-lista` (201,186) 529×368.
8. l.742-744: modal etiqueta 314→352 si error bajo nombre (y=226), 336 solo «Color no disponible» (y=350); y cambia 123→104/112. «Nueva tarjeta» con errores 414→496 y 414→452.

## B. Contradicciones
9. D7 de CONSISTENCIA: sin banda «Sin conexión» 523×37; indicador «Sin conexión · N pendientes» + aviso «Se muestran los datos guardados.». Recordatorio = píldora Información y=4 flotante, 4 s (G5). Conflicto interno l.86 vs l.117.
10. l.241: `KeyboardSensor` no existe (`Kanban.tsx:389` solo PointerSensor) → trabajo en parte 9.
11. l.580-591/832-833: R6 (radio 9, `borde_campo` 1,5) y T8 vs huella 204-1442 (`linea` 1 r8).
12. l.657/1043: «Ver más reportes ›» 116×36 (953,48) fondo `seleccion` (A4, huella 204-1005). No hay incoherencia.
13. l.316: E9 «No tienes tarjetas este mes.» y 5 barras en Calendario, Agenda, Panel del día; E18 hover `superficie_baja`.
14. l.1035/116: A17 Vencida: fila mín. 32, ocultar secundarios, «Ver más», no scroll.
15. l.585: filtro de etiquetas: popover 204:1766 (298×271, 4 opciones 273×36, «Hasta 3 etiquetas», Aplicar 81×36) vs lista 2161:33045 (248×148 (689,88), «Todas las etiquetas», sin Aplicar; Máximo 248×178 «Puedes elegir hasta 3 etiquetas.»; Sin etiquetas 248×40). RD-80 «hasta Aplicar».

## C. Errores
16. Códigos inventados `*.load_failed`, `card.complete_failed`, `card.save_failed`, `report.load_failed`; CONSISTENCIA G1h `OPERACION_FALLIDA`, G1i `REPORTE_NO_CARGA`. Convención doble `a.b` (contratos.md) vs MAYÚSCULAS (CONSISTENCIA). `date.*`, `schedule.*`, `due_date.in_past` no están en contratos.md.
17. Recordatorio sin disparador (evento, hora, permisos, minimizada): sin CA/ET/RD.

## D. Sin definir / pruebas
18. Próximas a vencer: IPC-CARD-16 `card_list_upcoming` (`ipc/simulado.ts:543`, RD-98); falta fila, vacío, clic, límite 3. Mini calendario sin comportamiento.
19. l.836: modal 496 a 960×600 sin calcular alto útil; regla si no cabe.
20. l.912: «Sin descripción/prioridad/etiquetas» ya existen `screens/tarjeta/DetalleTarjeta.tsx:89-95`.
21. l.689-715: filas Etiquetas 44→52 con error/máximo (F2b l.702/726).
22. PL-13: «(actual)» deshabilitada NO MEDIDO; ventana del Figma gana (Pendiente 7 decidido).

## E. Pendientes
23. P1 (D7) sobra; P6 lo resuelve el 16; P8 depende de Q2.
24. P3 arrastre de filas: solo `ON_DRAG → 217:11426 SMART_ANIMATE 0.2 EASE_OUT` (204-622). Preguntar con opciones.
25. P4 teclado Agenda/Calendario sin CA: preguntar o «no se construye».

Lecturas de Figma: 204:622 (mini calendario, Próximas), 2161:33045 vs 204:1766, 204:1581 (textos), 2148:26578 (horas), 204:2239 (actual), 204:1915 (tipos), 204:1316 (día seleccionado, vacío).
