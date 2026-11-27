# F2a · Página 79:3 · 02 Planificador, primera mitad (solo lectura)

Cobertura: 63 de 63 familias de las líneas 64 a 128 de `docs/rediseno_flujos_ids_prototipos.md`, de «Planificador diario» (204:622) a «Tablero Kanban · Aviso · Columna inexistente» (2142:20870 / 2142:21192). Última familia cubierta: 2142:21192. Las 63 en claro; las 63 con ids de oscuro, Rosa y Enfoque; la lectura de los temas es por muestra (3), no por familia. Cupo: 20 de 22 (1 `get_figma_skill`, 19 `use_figma`; 0 de `get_design_context`, `get_screenshot`, `get_metadata`). Lectura: 26-nov-2026 (hora Colombia). Marco de pantalla 1093x560; modales y overlays M-xx 600x256.
Huellas: `.trabajo/figma/huellas/` con 66 archivos de esta tanda (ids `204-…`, `217-…`, `2039-…`, `2142-…`, `2144-…`, `2152-…`, `2251-…`, `2257-…`, `233-13970`). Bases completas: las 21 pantallas y modales distintos (204-622 a 204-2239). Formato diff (`base`, `el`, `quitados`): 13 del Planificador (contra 204-622), 16 del Kanban (contra 204-704), 5 de Windi (contra 204-25611). Overlays M-xx y Windi base: filas clave, no árbol completo. Las muestras de tema llevan `tema` rosa, enfoque u oscuro. Las marcadas `"truncado":true` conservan solo las primeras filas añadidas (ver «No medido»).

## Ids por familia (claro | oscuro | Rosa | Enfoque)

Los ids de oscuro, Rosa y Enfoque de las 63 familias están en `docs/rediseno_flujos_ids_prototipos.md` líneas 66-128 y no cambian; se verificaron por muestra (ver temas). Claro de cada familia, con su fila en ese archivo:

| Familia | Claro |
|---|---|
| Planificador diario | 204:622 |
| Tablero Kanban | 204:704 |
| Calendario | 204:805 |
| Agenda diaria | 204:916 |
| Reportes | 204:1005 |
| Etiquetas | 204:1078 |
| Tablero Kanban · Expandida | 204:1139 |
| Calendario · Semana | 204:1249 |
| Panel del día | 204:1316 |
| Mes y año | 204:1442 |
| Más reportes | 204:1581 |
| Rango de fechas | 204:1683 |
| Filtrar etiquetas | 204:1766 |
| Detalle de tarjeta · Nueva tarjeta · Editar tarjeta | 204:1849 · 204:1915 · 204:1981 |
| Nueva etiqueta · Editar etiqueta · Nueva columna · Editar columna | 204:2047 · 204:2095 · 204:2143 · 204:2191 |
| Mover a | 204:2239 |
| Overlays M-08, M-09, M-10, M-13, M-14, M-11 | 204:25533, 25546, 25559, 25572, 25585, 25598 |
| Overlay M-14 · Usada en 1 tarjeta | 2144:29098 |
| Windi (base, Propuesta, Escribiendo, Sin conexión, Error, Propuesta descartada) | 204:25611, 25622, 25637, 25648, 25659, 25670 |
| Planificador diario · 13 variantes | 217:10646 Vacío, 217:10802 Cargando, 217:10958 Sin conexión, 217:11114 Vencida, 217:11270 Recordatorio, 217:11426 Arrastre, 217:11582 Densidad cómoda, 2152:30309 Todas completadas, 2039:14528 Nombre emergente, 2142:21514, 2142:21674, 2251:146090, 2251:146250 (avisos) |
| Tablero Kanban · 16 variantes | 217:12764, 217:12977, 217:13190, 217:13403, 217:13616, 2152:30825, 217:13829, 217:14042, 220:22023, 2152:30457, 2039:14836, 2039:15548, 2257:50523, 2257:50712, 2142:20870, 2142:21192 |

## Estructura común

Pantallas: marco 1093x560, barra lateral compartida (Rubik, ignorada en las huellas por el filtro de `Menú lateral`, `Nav · Windi`, `Ícono ·`), miga en (200,19), título en (200,49), `Sincronizado` en (1000,20), botón `+ Nueva tarjeta` en (1043,56). Planificador: «Hola, Paula» (201,104), «Martes, 24 de noviembre» (201,131), «Completadas: 2 de 8» (201,162), 104 filas en la base; 8 tarjetas con paso de 46.
Modales (hijos de primer nivel): `0 Pantalla de origen`, `1 Velo`, `2 miga`, `3 Sincronizado`, `4 Nav · Windi`, `5 Menú lateral compartido`, `6 Ícono · Sincronizado`, `7 Ventana · <nombre>`. Tarjeta (Detalle) 560x368 en (267,96); Nueva y Editar tarjeta 560x414 en (267,73); etiqueta y columna 420x314 en (337,123) con catálogo de 9 colores (Azul elegido); Mover a 420x198 en (337,181).
Overlays M-xx: marco 600x256, «Nota de confirmación» 424x160 en (88,48), papel con esquina doblada, título Nunito Bold 20, cuerpo Nunito Regular 14, botón Cancelar con `CLOSE`.
Windi: marco 1093x560 sobre el Planificador diario, velo al 0,4, panel 351x551 en (737,4), `superficie_alta`, borde 1,5, radio 12.
Colores fijos: etiquetas Proyecto #b04f7d, Universidad #2b7a8c, Personal #b8692a, Salud #2e8b57; catálogo Gris #8a8d98, Rojo #e5484d, Naranja #f76b15, Amarillo #dcba04, Verde #30a46c, Cian #00d9e2, Azul #3e63dd, Morado #6604e6, Rosa #dc026c.

## Textos literales, estados y destinos (overlays y modales)

| Id | Texto | Reacción |
|---|---|---|
| 204:25533 M-08 | «Eliminar tarjeta» / «¿Deseas eliminar la tarjeta “Entregar ensayo”? Esta acción no se puede deshacer.» Botones «Eliminar tarjeta» (borde error 1,5, texto #ffffff) y «Cancelar» | NODE 204:622; Cancelar CLOSE |
| 204:25546 M-09 | «Eliminar columna» / «¿Deseas eliminar la columna “En revisión”? …» | NODE 204:704 |
| 204:25559 M-10 | «Eliminar etiqueta» / «¿Deseas eliminar la etiqueta “Universidad”? …» | NODE 204:1078 |
| 204:25572 M-13 | «La columna “En revisión” tiene 3 tarjetas. Se moverán a “Por hacer”. ¿Deseas continuar?» | NODE 204:704 |
| 204:25585 M-14 | «La etiqueta “Universidad” está asignada a 3 tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?» | NODE 204:1078 |
| 2144:29098 | igual con «1 tarjeta … la tarjeta no se eliminará»; nota 424x175 | NODE 204:1078 |
| 204:25598 M-11 | «Cerrar sesión» / «¿Deseas cerrar sesión?»; botón «Cerrar sesión» | URL externa |
| 204:25611 Windi | «Windi», «¿Qué organizamos hoy?», «Escribe un mensaje», «Enviar», «0 / 2000» | campo NODE 204:25637; Enviar NODE 204:25622; × CLOSE |
| 204:25622 | persona: «Pasa «Enviar la presentación» a Por hacer.»; Windi: «¿Muevo la tarjeta a Por hacer?»; «Rechazar», «Confirmar» | Rechazar NODE 204:25670; Confirmar NODE 204:25611 |
| 204:25637 | «Escribiendo…» | |
| 204:25648 | «Sin conexión» (Estado=Sin conexión o error) | |
| 204:25659 | «Ocurrió un error inesperado.» (genérico; ver incoherencia 6) | |
| 204:25670 | «Propuesta descartada» (Estado=Descartada) | |

Modales de tarjeta: Detalle muestra «Editar» → NODE 204:1981, «Eliminar» (ícono 44x44) → OVERLAY M-08 (204:25533), «Cerrar» → 204:622. Nueva y Editar tarjeta: Guardar, Cancelar y Cerrar → 204:622. Etiquetas: botones → 204:1078. Columnas: → 204:704. Todas las reacciones leídas de modales son NODE; las URL externas están solo en la barra lateral y en M-11.

## Estados de las variantes del Planificador diario (contra 204:622)

| Id | Estado y texto literal | Medidas |
|---|---|---|
| 217:10646 Vacío | «Completadas: 0 de 0», «No tienes tarjetas para hoy.» (la capa dice «No hay tarjetas para hoy.») | |
| 217:10802 Cargando | «Cargando…» | 5 barras `linea` de 16 de alto en x=208, anchos 324/300/276/252/228, y=200+54k |
| 217:10958 Sin conexión | «Sin conexión · Se muestran los datos guardados.» | aviso 523x37 en (201,104), barra #c68700 de 4; contenido +45 px |
| 217:11114 Vencida | «Vencida · 23 nov · Universidad» en error, primera tarjeta «Responder correo del profesor» | desborda: filas en y=554, 558 y 579 |
| 217:11270 Recordatorio | «Recordatorio · 16:30 · Compartir el prototipo» | aviso 320x37 en (757,86), barra #c68700 |
| 217:11426 Arrastre | fila «Preparar la entrega» a (216,223) 530x53 | línea de inserción 518x3 en (203,231) |
| 217:11582 Densidad cómoda | filas de 60, paso 64 | |
| 2152:30309 Todas completadas | «Completadas: 8 de 8», «¡Completaste todas tus tarjetas de hoy!» | barra a 365; lista +30 px |
| 2039:14528 Nombre emergente | «Nueva tarjeta» | globo 99x36 en (986,92), fill tinta, Nunito 13 |
| 2142:21514 | «Esta tarjeta ya no existe.» | 221x42 en (848,4), borde #00d9e2 |
| 2142:21674 | «Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.» | 660x42 en (409,4), #00d9e2 |
| 2251:146090 | «¡Bienvenido, Paula! Tu cuenta fue creada correctamente.» | 426x42 en (643,4), #168451 |
| 2251:146250 | «No pudimos aplicar el tema Rosa pastel. Puedes elegirlo en Personalización.» | 544x42 en (525,4), #b47700 |

Los avisos usan Rubik 13 y reacciones NODE (217:17651/17645 para los cian, 217:17637/17631 Bienvenida, 217:17665/17659 los ámbar).

## Estados de las variantes del Kanban (contra 204:704)

| Id | Estado y texto |
|---|---|
| 217:12764 Tablero vacío | columna 208 de ancho en lugar de 259; sin tarjetas añadidas completas (74 filas cambian) |
| 217:12977 Columna vacía | una columna sin tarjetas; tarjetas en x=480 |
| 217:13190 Muchas columnas | columnas de 201 de ancho; tarjetas de 183 |
| 217:13403 Menú de tarjeta | menú 181x164 en (266,190): «Ver detalle» (NODE 204:1849), «Mover a» (204:2239), «Editar» (204:1981), «Eliminar» (OVERLAY 204:25533) |
| 217:13616 Menú de columna | menú 181x88 en (536,148): «Editar columna» (NODE 204:2191), «Eliminar columna» (NODE 204:25546) |
| 2152:30825 Columna predefinida | «Eliminar columna» deshabilitado; globo «Las columnas por defecto no se pueden eliminar.» 306x36 |
| 217:13829 / 217:14042 | arrastre de tarjeta (línea 239x3 en (481,147)) y de columna (columna a 494,99 de 267x384) |
| 220:22023 Densidad cómoda | filas de 78 en lugar de 70 |
| 2152:30457 Sin tablero descargado | «Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.» 473x19 en (398,300) |
| 2039:14836, 2039:15548, 2257:50523, 2257:50712 | globos de nombre; 2257:50523 «Vista expandida» 115x36 en (954,92); 2257:50712 «Vista compacta» cambia miga y título a «Tablero Kanban · Expandida» |
| 2142:20870 | «Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.» 474x42 en (595,4), #b47700 |
| 2142:21192 | «Esta columna ya no existe.» 234x42 en (835,4), #00d9e2 |

## Muestras de tema (Planificador diario 204:622 contra)

| Tema | Id | Fondo | Fuente | Desvíos |
|---|---|---|---|---|
| Rosa pastel | 204:19460 | #fbeff3 | Quicksand | tinta #17131d a #3a1528; texto #554f5e a #6b3550; acento #6604e6 a #f2b3cb (2); sin filas nuevas; 32 textos cambian de ancho 1 a 12 px |
| Enfoque rojo y negro | 204:19542 | #1e1d22 | Space Grotesk | tinta a #ffffff; texto a #c9c4be; acento a #d1202f; verdes a #205535; 30 desvíos de ancho (hasta 8 px) |
| Windgets oscuro | 233:13970 | #201b2b | Nunito | tinta a #f8f5ff; superficie #2b2534; texto #cec7d6; acento #00d9e2; 0 desvíos de geometría |

Las huellas `204-19460`, `204-19542` y `233-13970` guardan el mapa de paleta y los desvíos. Las 104 filas de cada muestra coinciden con la base (mismas capas): el tema solo cambia relleno y fuente.

## Incoherencias

1. Reportes: los fondos de 204:1005 y 204:1683 son distintos, con anillo y leyendas duplicados y fuentes y colores distintos (Rubik, #ca4353, #ce9b18, #188450).
2. Más reportes (204:1581): 462 filas con texto plano duplicado de las cifras, barras residuales ocultas bajo el anillo y Evento con 1 o 2 según la capa.
3. Botones ícono con texto desbordado: «Ver más reportes» de 101 de ancho en un botón de 36 que sobrepasa 1093; «← Reportes».
4. Capas cuyo nombre no coincide con el texto: «27/11/2026» con texto 24/11/2026, «Preparar la entrega del equipo», «En revisión» con texto «En progreso» en Mover a; la capa «27 nov · Media» muestra «24 nov · Baja» o «Vence mañana · Baja». El Detalle muestra «Revisar los bocetos» con descripción distinta de Nueva tarjeta.
5. Residuos en modales: «Tipo · botones» y «Prioridad · botones» sobre el campo de texto del Detalle; «Color» y «Catálogo de colores» en Mover a; la miga de 204:1442 omite el último nivel; 204:1316 muestra «Día seleccionado» y «24».
6. Windi · Error (204:25659) dice «Ocurrió un error inesperado.», el genérico que la regla de errores visibles reserva para lo imprevisible; un fallo de Windi es previsible y necesita texto y código propios.
7. Los modales no tienen cierre por clic fuera ni reacción en el velo; los selectores flotantes sí.
8. El catálogo de colores tiene 9 entradas y el comentario dice «8 chips»; su Rosa #dc026c choca con el tema Rosa.
9. 217:11114 Vencida desborda el marco (filas en y=554 a 579 sobre 560).
10. Las reacciones URL de la barra lateral apuntan al archivo «Windgets--Copy-»; M-11 usa URL externa en lugar de NODE.
11. «Entregar ensayo» tiene fechas distintas en el modal y en el Planificador.
12. Capas con nombre equivocado: la capa «No hay tarjetas para hoy.» contiene «No tienes tarjetas para hoy.» (Vacío), el aviso de Sin tablero descargado y «¡Completaste todas…» (Todas completadas).
13. El aviso de cierre de columna con tarjetas (M-13) y el de M-14 usan comillas “ ” mientras el mensaje de Windi usa « »; no hay regla unificada.
14. «Sin conexión» del Planificador reutiliza la barra #c68700 pero el aviso del Kanban de máximo de columnas usa #b47700: dos ámbar distintos.

## No medido

- Truncados por tamaño de respuesta: 217:10958, 217:11114, 217:11582 y 2152:30309 (Planificador) pierden el final de la lista de filas; la huella conserva solo las primeras filas y lo inferido (desplazamiento uniforme). Variantes del Kanban con `"truncado":true`: guardan las 12 primeras filas añadidas y los recuentos `n_el` y `n_quitados`.
- Interacciones de prototipo: se leyó destino y tipo (NODE, URL, CLOSE, OVERLAY) pero no transición, duración ni curva (el recorrido no pidió `action.transition`); no hay dato de esos tres campos en esta tanda.
- Estados de error y vacío por pantalla: solo los de las variantes listadas; Reportes, Calendario, Agenda y Etiquetas no tienen variante de vacío o carga en esta mitad.
- Temas: Rosa, Enfoque y oscuro solo por muestra (Planificador diario); las otras 62 familias no se compararon.
- Radios de vectores (papel con esquina doblada), sombras y sombra dura de los overlays: no leídos en esta tanda (ver F8.md para el mismo componente).
- Ningún `get_design_context`, `get_screenshot` ni `get_metadata`; sin verificación visual.
