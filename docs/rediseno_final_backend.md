# Rediseño final de Windgets · Cambios de funcionalidad y backend al implementar los prototipos

> **Para quién es este documento:** para la IA (o la persona) que implemente en el repositorio `Forkthec/windgets`
> los prototipos del rediseño final descritos en `rediseno_final_prototipos.md`. Aquí está **lo que no es solo
> visual**: lógica del Núcleo (Rust, `apps/desktop/src-tauri`), base local (SQLite), nube (Supabase: migraciones,
> RPC, Edge Functions), contratos IPC (`docs/contratos.md`), reglas de negocio, bugs de funcionamiento y las
> funcionalidades nuevas que necesitan HU antes de construirse. Los dos documentos usan los mismos números de
> decisión (D-nn), de punto abierto (A-nn) y de sugerencia (Pnn).
>
> **Fecha:** 24-nov-2026. **Fuentes:** HU v12 (`21112026_v12_historias_usuario.xlsx`), glosario v4, repositorio en
> `d9f4955` (P37), `docs/rediseno.md` (RD-01 a RD-61), Figma «Windgets (Copy)» `QJviaE6yNPefYqtdeepYZZ` y una prueba
> manual de `windgets.exe` con sesión real. Los nombres de comandos, tablas, columnas y archivos de este documento se
> verificaron contra el repositorio en `d9f4955`; lo que todavía no existe está marcado **(nuevo)**.

---

## Cómo ejecutar este documento

**Objetivo:** dejar la aplicación funcionando como los prototipos del rediseño final, sin romper las HU v12 vigentes,
con cada cambio trazado a una decisión de Paula (D-nn), a un RD nuevo o a una HU v13.

**Orden de prioridad cuando dos textos chocan:** §0.1 (decisiones D-nn) > §0 (reglas) > resto de este documento >
`rediseno_final_prototipos.md` > HU v12 > código actual. Si un choque no está resuelto aquí, anótalo en
`docs/DUDAS.md` y sigue con lo demás; no lo resuelvas por tu cuenta.

**Pasos (en este orden):**

1. Lee §0, §0.1, §0.2 y §2 completas y las secciones 0.1 y 2 de `rediseno_final_prototipos.md` (nombres únicos).
2. Corrige los bugs P0 de §3 (sincronización, widgets por defecto, aviso del wallpaper) con sus pruebas.
3. Implementa los cambios [RD] de §4 en el orden de §1, registrando cada uno como RD-62 en adelante en
   `docs/rediseno.md`.
4. Para cada funcionalidad 🆕 de §5: redacta la HU con CA y ET en la hoja v13 y en `docs/HE-nn.md` usando el
   borrador; cuando Paula apruebe la HU, impleméntala con su prueba por CA. Empieza por §5.12 (Personalización por
   pasos), porque §5.10, §5.11, §5.14 y D-19 dependen de que los widgets pasen por el borrador.
5. Actualiza contratos, tipos, esquemas y pruebas según la lista de §6.
6. Corre `herramientas/verificacion/verificar.sh` hasta `=== fin (0)`.

**Definición de terminado** (todo debe cumplirse):
- [ ] Cada fila de §6 está hecha o tiene su motivo en `docs/DUDAS.md`.
- [ ] Cada cambio [RD] tiene su RD-nn en `docs/rediseno.md` con «Reemplaza RD-xx» cuando corresponde.
- [ ] Cada 🆕 tiene su HU v13 aprobada antes de su código; ninguna 🆕 se implementó sin HU.
- [ ] Ningún texto de la interfaz usa un nombre distinto a los de `rediseno_final_prototipos.md` §2 (por ejemplo, no
      queda «Editar escritorio» en `types/messages.es.json`).
- [ ] Las pruebas nuevas de §3 y §5 pasan y `verificar.sh` termina en `=== fin (0)`.
- [ ] Los puntos abiertos de §0.2 que sigan sin respuesta están en `docs/DUDAS.md`.

---

## 0. Reglas de trabajo (se suman a `AGENTS.md` / `docs/AGENTS.md`)

1. **No inventes funciones** (`AGENTS.md` regla 1). Este documento separa tres tipos de cambio:
   - **[RD]** Cambio del rediseño que no agrega funcionalidad: se anota como RD-nn en `docs/rediseno.md` (desde
     RD-62; «Reemplaza RD-xx» cuando corresponda) y se implementa.
   - **[BUG]** Defecto de lo que ya tiene HU: se corrige con su prueba.
   - **[🆕 HU]** Funcionalidad nueva **aprobada por Paula** en §0.1: antes de construirla se escribe la HU con CA y
     ET en la hoja v13 y en `docs/HE-nn.md`; aquí está el borrador de CA/ET para facilitar esa redacción. No se
     implementa hasta que Paula apruebe la HU.
2. **Nunca edites una migración aplicada:** cada cambio de esquema va en una migración nueva en
   `supabase/migrations/` (la siguiente es `0009_…`; hoy la última es `0008_catalogo_p29.sql`) y su equivalente en
   `docs/local/sqlite_esquema.sql` y `apps/desktop/src-tauri/sqlite_esquema.sql`. Para cambiar una función de la nube
   (por ejemplo `public._sync_apply_change`), la migración nueva la redefine con `CREATE OR REPLACE FUNCTION`.
3. **Analiza antes de cambiar:** si algo de este documento resulta innecesario o ya está resuelto en el código,
   anótalo en `docs/DUDAS.md` con el motivo en vez de forzarlo.
4. Una prueba por CA/RD, como siempre (`herramientas/verificacion/verificar.sh` en `=== fin (0)`).

---

## 0.1 Decisiones cerradas por Paula (24-nov-2026) y su impacto técnico — mandan sobre el resto

El texto completo de cada decisión está en `rediseno_final_prototipos.md` §0.1. Las 🆕 quedan **aprobadas por
Paula** como funcionalidad: se redacta su HU (v13) con los borradores de §5 y luego se implementan.

| D | Decisión | Impacto técnico |
|---|---|---|
| D-01 | Toda la app usa los colores del tema; sin Claro/Oscuro con sesión | RD-62 reemplaza RD-28/RD-29 (§4.1). |
| D-02 | Se mantienen 3 colores del tema | Sin cambio de esquema; solo derivar más tokens en `apps/desktop/src/ui/tema/derivar.ts`. |
| D-03 | Amarillo = pendiente que vence hoy o mañana | Regla de presentación [RD]: la interfaz calcula «próxima a vencer» con la fecha local (`due_date` = hoy o mañana y sin completar). Misma regla en los widgets Tareas del día y Kanban. El color por día del Calendario sigue HE-10-HU05 (A-02). §4.6. |
| D-04 | Ventana no redimensionable, solo minimizar/maximizar, abre maximizada, zoom bloqueado | §4.9. |
| D-05 | 🆕 Recordatorio = notificación a la hora en punto del bloque horario, solo a la hora | §5.2, sin cambio de esquema. |
| D-06 | Pantalla principal = Planificador diario ampliado; no hay pantalla «Inicio» | §5.4 ([RD], sin HU nueva). |
| D-07 | 🆕 Windi: botón flotante con panel de chat + widget de escritorio; «Agente de IA» sale del menú | §5.5 y §4.2. |
| D-08 | «+» de nueva tarjeta solo en «Por hacer» | Sin cambio de contrato: `card_create` como hoy (crea en la columna `todo`). |
| D-09, D-10, D-11 | «+» columna fantasma; columnas se estrechan; barras de color por etiqueta | Solo interfaz: `card_list_board` ya devuelve `Card.labels` con `color_hex` de cada etiqueta (§4.4). |
| D-12 | 🆕 Más reportes: las 6 secciones | §5.3. |
| D-13 | Rangos de Reportes solo los de la HU | Sin cambios (§4.8). |
| D-14 | 🆕 Máximo 3 etiquetas por tarjeta y en el filtro de Reportes; recortar las existentes | §5.1: hoy el límite es 5 (`ETIQUETAS_MAX`, regla R7 de `public._sync_apply_change`); se baja a 3 y se recortan las existentes. |
| D-15 | 🆕 Reloj 12/24 h e inicio de semana del Calendario | §5.8. |
| D-16 | 🆕 Orden de tarjetas definido por el usuario; por defecto la más próxima a vencer; se mantiene | §5.9 (A-05, A-06). |
| D-17 | 🆕 Distribución predefinida (no es plantilla) | §5.10. |
| D-18 | 🆕 Apariencia del widget: paleta, colores libres, transparencia; se guarda en el tema | §5.11. |
| D-19 | 🆕 Vista previa del widget antes de agregar | Se dibuja en la vista previa del borrador (§5.12), sin persistir hasta «Agregar». |
| D-20 | Bloque horario en el Formulario de tarjeta | §4.5: reutiliza `card_assign_time_block` / `card_unassign_time_block`; CA nuevo en HE-07-HU01 y HE-07-HU04. |
| D-21 | 🆕 Personalización en una sola pantalla por pasos; **todo** (también widgets) por el tema en edición + «Aplicar» | §5.12: cambio grande de HE-02, HE-04 y HE-05. §4.7 cubre solo la parte de interfaz. |
| D-22 | Plantillas fuera de la interfaz | §5.13. |
| D-23 | Botones de ventanas emergentes abajo a la derecha, principal a la derecha | Interfaz (`ui/VentanaEmergente`, `ui/Confirmacion`); actualizar las pruebas de RD-34/RD-50. |
| D-24 | «Organizar widgets» = nombre único del botón y de la pantalla; dentro del paso 4 Widgets | Renombrar textos («Editar escritorio» → «Organizar widgets») en `types/messages.es.json`, `docs/HE-05.md`, `docs/interfaz.md` y pruebas. |
| D-25 | Recordar menú contraído en este computador | Tabla local `device_setting` (no se sincroniza), clave nueva `menu_collapsed` (§4.2). |
| D-26 | Tira semanal en la Agenda | Solo interfaz; `agenda_get_day` por día. |
| D-27 | Reparar cuentas sin widgets por defecto | §3.2: reparación idempotente al iniciar sesión. |
| D-28 | 🆕 Oscurecer/desenfocar fondo, forma de widgets, tamaño de texto por widget | §5.14. |
| D-29 | 🆕 Densidad Compacta/Cómoda | §5.15 (A-08). |
| D-30 | Tamaño del tema = por defecto de app y widgets; el del widget es excepción («Igual que el tema») | §5.14. |
| D-31 | Se eliminan «Crear un tema desde este» y «Recuperar mi tema guardado» | Nada que construir. |
| D-32 | Frase P33 descartada | — |

---

## 0.2 Puntos A-01 a A-11 (resueltos por Paula el 24-nov-2026)

A-01 a A-07 son los mismos de `rediseno_final_prototipos.md` §0.3; A-08 a A-11 son técnicos. Paula respondió todos:
la columna «Decisión» manda igual que D-01 a D-32. Registra cada uno como RD (o en la HU v13 si es 🆕); ya no van a
`docs/DUDAS.md`.

| A | Tema | Decisión de Paula | Dónde |
|---|---|---|---|
| A-01 | Botones de Organizar widgets con D-21 (ya no guarda en el tema) | «Cancelar» y «Listo»; «Listo» devuelve la distribución al borrador. | §5.12 |
| A-02 | Color por día del Calendario (HE-10-HU05) frente a D-03 (amarillo solo hoy o mañana) | El Calendario conserva la regla por día de HE-10-HU05; D-03 rige la marca de cada tarjeta. | §4.6 |
| A-03 | Texto del botón de HE-02-HU13 («Cancelar» en la HU, «Cancelar cambios» en D-31) | «Cancelar cambios»; la v13 actualiza el texto. | §4.7 |
| A-04 | Miga de Configuración («Preferencias» en RD-32, «Configuración» en el menú) | «Configuración». | §4.2 |
| A-05 | Orden por defecto del Planificador diario (HE-12-HU01-ET03: por hora del bloque) frente a D-16 (más próxima a vencer) | Por hora del bloque, luego las sin hora por fecha límite; el orden manual se mantiene. | §5.9 |
| A-06 | ¿Un solo orden manual para todo o uno por vista? | **Un solo orden para todo:** se reutiliza `card.position` en todas las vistas; no se crea `day_position`. | §5.9 |
| A-07 | Widget de Windi: ¿uno solo por cuenta? | Uno solo (se agrega a `uq_widget_singleton`). | §5.5 |
| A-08 | Densidad (D-29): ¿preferencia de la cuenta (se sincroniza) o del computador? | De la cuenta, en `user_preference`. | §5.15 |
| A-09 | Rango de años del selector de mes y año | 1970–2100. | §4.6 |
| A-10 | D-21 y los widgets de la cuenta: hoy `widget` es de la cuenta (eliminar lo quita de todos los temas, M-07) y `theme_widget` es del tema | **Todo del tema:** cada tema tiene sus propios widgets; eliminar un widget lo quita solo de ese tema. | §5.12 |
| A-11 | Recordatorios con la aplicación cerrada con «Salir» o sin sesión | No suenan ni se muestran los perdidos al volver; se documenta en la HU. | §5.2 |

---

## 1. Resumen de prioridades

| Prioridad | Tema | Tipo | Sección |
|---|---|---|---|
| P0 | Estados que vuelven al valor anterior al cambiarlos rápido (sincronización) | BUG | 3.1 |
| P0 | Lista de widgets vacía / widgets por defecto ausentes; reparación (D-27) | BUG | 3.2 |
| P0 | Selector Claro/Oscuro con sesión: el modo cambió solo; «Sincronizando…» atascado | BUG + RD | 3.3, 4.1 |
| P0 | Aviso «No pudimos mostrar tu wallpaper…» que nunca se va | BUG + RD | 3.4, 4.3 |
| P1 | La app usa los colores del tema (RD-62 reemplaza RD-28/RD-29) | RD | 4.1 |
| P1 | Menú en dos bloques, sin «Agente de IA», cerrar sesión, menú contraído recordado | RD | 4.2 |
| P1 | Mensajes emergentes con tipos, duración y cola | RD | 4.3 |
| P1 | Validaciones: fecha pasada en el selector, fecha inválida en Reportes | BUG/RD | 3.6, 4.5, 4.8 |
| P1 | Orden estable al completar tarjetas | BUG | 3.5 |
| P1 | Kanban: todas las etiquetas, clic en toda la tarjeta, vista expandida | BUG/RD | 4.4 |
| P1 | Bloque horario en el Formulario de tarjeta (D-20) | RD + CA nuevo | 4.5 |
| P1 | Ventana maximizada, no redimensionable, zoom bloqueado (D-04) | RD | 4.9 |
| P1 | Planificador diario ampliado como pantalla principal (D-06) | RD | 5.4 |
| P1 | Personalización por pasos con todo por el borrador (D-21) | 🆕 HU | 4.7, 5.12 |
| P1 | Plantillas fuera de la interfaz (D-22) | 🆕 HU (reescritura de HE-02-HU02/HU08) | 5.13 |
| P2 | Límite de 3 etiquetas por tarjeta y recorte (D-14) | 🆕 HU | 5.1 |
| P2 | Recordatorios reales a la hora del bloque horario (D-05) | 🆕 HU | 5.2 |
| P2 | Más reportes (D-12) | 🆕 HU | 5.3 |
| P2 | Windi: botón flotante, panel y widget (D-07) | 🆕 HU | 5.5 |
| P2 | Orden de tarjetas definido por el usuario (D-16) | 🆕 HU | 5.9 |
| P2 | Ajustes de Reloj y Calendario (D-15) | 🆕 HU | 5.8 |
| P3 | Distribución predefinida (D-17) | 🆕 HU | 5.10 |
| P3 | Apariencia del widget (D-18) | 🆕 HU | 5.11 |
| P3 | Oscurecer/desenfocar fondo, forma de widgets, tamaño de texto por widget (D-28, D-30) | 🆕 HU | 5.14 |
| P3 | Densidad Compacta/Cómoda (D-29) | 🆕 HU | 5.15 |
| — | Crear tarjeta desde el «+» de cualquier columna | Descartada (D-08) | 5.6 |
| — | Cuarto color del tema | Descartada (D-02) | 5.7 |

---

## 2. Glosario técnico: dónde vive cada concepto (para no volver a mezclarlos)

Los nombres que ve el usuario son los de `rediseno_final_prototipos.md` §2; esta tabla dice dónde están en el código.

| Concepto (nombre en la interfaz) | Dónde vive | Notas para el código |
|---|---|---|
| **Tema** | `public.theme` (nube) / `theme` (local): `name`, `template_id`, `background_source` + imagen, `color_primary`, `color_secondary`, `color_text`, `palette_id`, `font_id`, `font_size`; sus widgets en `public.theme_widget` | El tema define wallpaper, widgets **y la ventana principal** (HE-03-HU06). Máximo 10 por cuenta. |
| **Tema aplicado** | `public.applied_theme` (una fila por usuario, `id = user_id`): `theme_id` + copia del contenido aplicado | Siempre existe. |
| **Tema en edición** | Borrador en el Núcleo (`theme_draft_open`, `theme_draft_update`, `theme_draft_apply`; HE-02-HU09 a HU13) | No cambia el escritorio hasta «Aplicar». Con D-21 también incluye los widgets (§5.12). |
| **Colores del tema** | Las tres columnas `color_*` | Con ellas se derivan los tokens (`apps/desktop/src/ui/tema/derivar.ts`, `docs/interfaz.md` «Tema a tokens»). |
| **Paleta** | `public.catalog_palette`; `theme.palette_id` (NULL = «Personalizada») | «Claro» y «Oscuro» (RD-14, migración `0007`) **son paletas**. |
| **Plantilla** | `public.catalog_template`; `theme.template_id` | Con D-22 deja de mostrarse (§5.13). Las plantillas `claro` y `oscuro` las creó `0008_catalogo_p29.sql`. |
| **Imagen de fondo / Catálogo de imágenes** | `theme.background_source` (`template_default`, `catalog`, `own`), `public.catalog_image`, `public.uploaded_image` | «Sin imagen» = `template_default`. |
| **Widget** | `public.widget` (de la **cuenta**: tipo, `is_default`, configuración) | `widget.type` es un `CHECK`; no hay tabla de catálogo de widgets: el catálogo lo arma `widget_catalog_get` (IPC-WID-02). |
| **Widget del tema** (activo, distribución; 🆕 apariencia y tamaño de texto) | `public.theme_widget` (`theme_id`, `widget_id`, `is_active`, `x`, `y`, `width`, `height`, `ref_width`, `ref_height`); servicio `servicio_de_personalizacion_y_configuracion/distribucion.rs` | Aquí van los campos nuevos de §5.11 y §5.14. |
| **Organizar widgets** (antes «Editar escritorio» / «Pantalla de edición») | Contenedor C-03; HE-05 | Solo cambia el nombre (D-24) y, con D-21, el destino de lo que guarda (§5.12). |
| **Apariencia Claro/Oscuro** | `localStorage` clave `wg.modo_cuenta` (RD-03) | Solo para pantallas sin sesión y para la paleta del tema inicial (RD-15). Con sesión **no** existe (§4.1). |
| **Color de etiqueta / columna** | `public.catalog_color` | No es del tema. |
| **Colores de estado** | Tokens derivados (`estado_vencida`, `estado_pendiente`, `estado_completada`, `relleno_estado`) | Fijos en tono, ajustados al contraste del tema. |
| **Preferencias** | `public.user_preference` (se sincroniza; hoy `board_card_view`) y `device_setting` local (no se sincroniza) | §4.2, §5.15. |

Error de nomenclatura a corregir: `apps/desktop/src/screens/cuenta/textosDelRediseno.ts` (≈ línea 48,
`TEMA_INICIAL_NO_APLICADO`) dice «No pudimos aplicar el **tema** ${paleta}. Puedes elegirlo en **Personalización**.» →
mezcla tema con paleta. Con §4.1 este texto solo queda para la creación de cuenta (RD-15) y debe decir «No pudimos
aplicar la paleta ${paleta}. Puedes elegirla en Personalización › 3 Colores y tipografía.» (⚠ texto a confirmar en la
v13).

---

## 3. Bugs de funcionamiento (encontrados en la prueba manual y en el código)

### 3.1 [BUG · P0] Cambiar un estado rápido hace que vuelva al anterior («¿problema con la BD en la nube?», P32)

**Síntomas observados:**
- Al marcar/desmarcar una casilla rápido o al cambiar Claro/Oscuro varias veces, el valor vuelve al anterior o la
  interfaz salta; el indicador quedó en «Sincronizando…» más de 10 s.
- Al iniciar sesión, el modo pasó solo de Oscuro a Claro sin que el usuario lo tocara, y la lista del Planificador
  pasó de «No tienes tarjetas para hoy» a mostrar tarjetas segundos después (la descarga inicial llegó tarde y
  reemplazó lo que se veía).

**Hipótesis técnica a verificar** (`apps/desktop/src-tauri/src/motor_de_sincronizacion.rs`):
- `enviar()` (≈ línea 171) borra el `pending_change` cuando la nube confirma (`DELETE FROM pending_change WHERE id = ?
  AND modified_at = ?`, ≈ línea 257).
- `aplicar_filas()` (≈ línea 429) solo protege los campos que **todavía** tienen un cambio pendiente local
  (`mas_reciente_local`, ≈ línea 490). Si el usuario hace A → B → A en poco tiempo, puede ocurrir:
  1. Se envía B y se borra su pendiente.
  2. Una descarga (`descargar()`, ≈ línea 344) que se pidió antes trae una fila con `updated_seq` mayor que el cursor
     pero con el valor A o B intermedio.
  3. Como ya no hay pendiente local para ese campo, la fila descargada **pisa** el valor local más reciente hasta la
     siguiente descarga. Visualmente «vuelve al estado anterior».
- Además, la interfaz aplica la respuesta optimista y luego recarga con lo que devuelve el Núcleo tras cada evento de
  sincronización: si la recarga llega con la fila vieja, la pantalla parpadea.

**Corrección:**
1. En `aplicar_filas`, comparar también con la **hora de modificación local ya confirmada**: actualizar
   `field_mods` de la fila local al enviar (no solo al descargar) y no aplicar un campo remoto cuyo
   `field_mods[campo]` sea **anterior o igual** al local. Es la regla del glosario («Conflicto de sincronización:
   prevalece el cambio con la hora de modificación más reciente»).
2. Serializar el ciclo enviar/descargar: no aplicar una página de `sync_pull` pedida antes de un `sync_push` que
   terminó después (comparar el `updated_seq` devuelto por el push con el de la página).
3. En la interfaz: «debounce» de 300 ms para interruptores y casillas que se cambian repetidamente (se envía solo el
   último valor) y no recargar la vista desde el evento de sincronización si hay una acción local en curso sobre la
   misma entidad.
4. Pruebas nuevas en `motor_de_sincronizacion.rs` (junto a la existente
   `descargar_aplica_sin_pisar_un_cambio_pendiente_mas_reciente`): «A→B→A en < 1 s termina en A local y en la nube»,
   «una descarga tardía no pisa un campo más nuevo ya enviado», «el indicador vuelve a Sincronizado después de N
   cambios rápidos».

### 3.2 [BUG · P0] La lista de widgets aparece vacía (P44, D-27)
- En la prueba, Personalización > Widgets mostraba solo «Agregar widget» y «Editar escritorio», **sin los cuatro
  widgets por defecto y sin estado vacío**.
- La nube sí los crea al crear el perfil (`supabase/migrations/0003_funciones.sql`, ≈ línea 238: `INSERT INTO
  public.widget (id, user_id, type, is_default) VALUES (…, true)` para `clock`, `calendar`, `daily_tasks`, `kanban`;
  `widget_default_ck` en `0001_esquema.sql`). Revisar:
  - si la cuenta de prueba nació antes de ese disparador o con un error en él;
  - si `sync_pull` descarga `widget` y `theme_widget` y la tabla local los guarda (orden de tablas en
    `motor_de_sincronizacion.rs`);
  - si `widget_list` (IPC-WID-01, «del tema aplicado») no encuentra filas de `theme_widget` para el tema aplicado;
  - qué muestra la pantalla cuando `widget_list` devuelve error (hoy parece tragarse el error y no mostrar nada: viola
    la regla 7 de `rediseno.md` «nunca se queda en silencio»).
- **Cuenta nueva (P44):** deben existir los widgets por defecto **(Reloj, Calendario, Tareas del día, Kanban)**
  activos y el tema «Windgets» con la paleta del modo elegido (Claro u Oscuro, RD-15). Verificar de punta a punta
  (registro con correo y con Google) con una prueba E2E.
- **Reparación (D-27):** al iniciar sesión, después de la primera descarga, el Núcleo comprueba que existan los cuatro
  widgets por defecto y sus filas de `theme_widget` en cada tema; si faltan, los crea con la distribución por defecto
  (la misma de `0003_funciones.sql`, ≈ línea 232) como cambios pendientes normales. Debe ser idempotente (respeta
  `uq_widget_singleton`) y tener prueba: «una cuenta sin widgets por defecto los tiene después de iniciar sesión».

### 3.3 [BUG · P0] Selector Claro/Oscuro con sesión
- El modo cambió solo de Oscuro a Claro durante la sesión; varios cambios seguidos dejaron «Sincronizando…» colgado.
- El flujo (RD-29) abre un borrador, cambia `palette_id` y aplica con `theme_draft_apply { mode: 'save_and_apply' }`;
  varios clics seguidos abren borradores en paralelo.
- **Resolución:** el selector se elimina con sesión (D-01, §4.1). El mismo flujo se sigue usando una vez al crear la
  cuenta (`screens/cuenta/temaInicial.ts`, RD-15): ahí basta con que no se pueda lanzar dos veces (deshabilitar el
  control mientras se aplica).

### 3.4 [BUG · P0] «No pudimos mostrar tu wallpaper» no se va (P45)
- `apps/desktop/src/ventana_principal/AvisoDelWallpaper.tsx` muestra el `Aviso` mientras `wallpaper_get_status`
  (IPC-DESK-02) sea `fallback_default`; no tiene cierre ni tiempo, y el estado no cambia hasta que se aplique otro
  wallpaper, así que el aviso queda para siempre.
- Revisar **por qué** el wallpaper cae a `fallback_default` (imagen propia no descargada, plantilla no encontrada,
  error del host del wallpaper) y registrarlo en el log.
- Convertirlo en mensaje emergente de advertencia (§4.3) que se muestra una vez por cambio de estado.

### 3.5 [BUG · P1] El Planificador diario se reordena al completar
- Al marcar varias casillas rápido, la fila se movió y el clic siguiente marcó **otra tarjeta** («dormir»). Las
  completadas se mueven de posición al instante.
- HE-12-HU01-ET03 ordena por hora del bloque horario y después las sin hora (`planner_get_today`,
  `servicio_del_planificador.rs`). Mantener la posición de la fila durante la interacción (orden estable con
  desempate por `id`) y mover las completadas solo al recargar la pantalla, sin cambiar el destino de un clic en
  curso. Lo mismo en el widget Tareas del día. El orden manual de §5.9 se apoya en esta corrección.

### 3.6 [BUG · P1] Otros defectos funcionales vistos
| # | Dónde | Defecto | Corrección |
|---|---|---|---|
| 1 | Formulario de tarjeta | El selector deja elegir días pasados y luego da «La fecha límite no puede ser anterior a hoy» | Deshabilitar en `ui/SelectorFecha` los días anteriores a hoy (HE-07-HU01-ET08/ET09); la validación del Núcleo (`due_date.in_past`) se mantiene. |
| 2 | Reportes > Personalizado | El campo acepta texto libre («hola») | Selector de fecha que solo permite fechas válidas; validar rango ≤ 366 días y fin ≥ inicio antes de llamar a los `report_*` (§4.8). |
| 3 | Reportes | Al cambiar a «Personalizado», la gráfica cambia antes de pulsar «Aplicar» | No recalcular hasta aplicar. |
| 4 | Kanban | Tarjeta sin etiquetas con barra roja; la barra usa solo la primera etiqueta | §4.4. |
| 5 | Calendario | En Semana falta «Semana» como opción | §4.6. |
| 6 | Agenda diaria | Al abrir hace scroll a la hora actual escondiendo la cabecera | Fijar cabecera; scroll solo de la cuadrícula. |
| 7 | Toda la app | Errores que llegan sin texto se quedan en silencio en algunas pantallas (Widgets) | Mostrar el genérico (RT-04 / RD-24). |
| 8 | Inicio de sesión | Falta el ojo para ver la contraseña | Solo interfaz, sin cambio de contrato. |

---

## 4. Cambios del rediseño con impacto en lógica [RD]

### 4.1 [RD · P1] La aplicación usa los colores del tema; sin Claro/Oscuro con sesión (D-01; P04, P05, P35)
- Crear **RD-62 «Reemplaza RD-28 y RD-29»**:
  - Quitar el selector Apariencia del encabezado con sesión (`ventana_principal/EncabezadoDePantalla.tsx`, que usa
    `screens/cuenta/SelectorDeModo.tsx`; el selector se queda solo en las pantallas de cuenta).
  - Quitar el bloque de colores fijos por modo de `ventana_principal/marco.css` y volver a los tokens derivados del
    tema (`ui/tema/temaAplicado.ts` ya calcula `derivarTokens` con HE-03-HU06; hoy RD-28 los redefine encima).
  - Revisar que **ningún** color de marca (cian `#00D9E2`) se use como acción con sesión (R-04).
  - Contraste: los tokens ya cumplen R-13 por construcción (`interfaz.md`); agregar pruebas con los 3 temas de
    ejemplo del documento de prototipos (Windgets, una paleta clara y una oscura) y con las paletas Claro y Oscuro.
  - El modo elegido en las pantallas de cuenta (`wg.modo_cuenta`) solo decide la paleta del **tema inicial** de una
    cuenta nueva (RD-15) y la apariencia de las pantallas sin sesión.
- Actualizar `docs/HE-03.md` (HE-03-HU06) y `docs/interfaz.md` («No hay modo claro ni oscuro» vuelve a valer con
  sesión) en «Pendiente para la edición final».
- Tamaños (P07, P13, P31, P41, P55): la escala tipográfica vuelve a depender de `font_size` del tema
  (HE-02-HU06-ET05) **con la escala compacta** de `rediseno_final_prototipos.md` §3.1 (Mediano = esa tabla;
  Pequeño −1 px; Grande +2 px). Es CSS, pero las pruebas de geometría de Playwright (`apps/desktop/e2e/rediseno-*.spec.ts`)
  fijan las medidas viejas: actualizarlas.

### 4.2 [RD · P1] Menú lateral (D-07, D-25; P08, P09, P57)
- Menú en dos bloques, **Planificador** (Planificador diario, Tablero Kanban, Calendario, Agenda diaria, Reportes,
  Etiquetas) y **Personalización** (una sola entrada «Personalización», §4.7), y Configuración al pie. **Quitar «Agente
  de IA»** del menú (D-07). Ajustar `ui/MenuPrincipal/MenuPrincipal.tsx`, `ui/MenuPrincipal/IconosDelMenu.tsx`,
  `reglas/ruta.tsx` (RT-01) y la tabla «Inventario · 2» de `docs/interfaz.md` (hoy: Planificador con «Agente de IA»;
  Personalización con «Personalización del wallpaper», «Temas», «Widgets»).
- Miga de pan: «Planificador › <opción>», «Personalización › <n Paso>», «Configuración» (A-04; reemplaza
  «Preferencias» de RD-32).
- `app_open_screen` (IPC-DESK-03) y la última pantalla (`app_set_last_screen`): `ScreenId` hoy incluye `'windi'`,
  `'widgets'`, `'personalization'` y `'themes'`. Con el rediseño: `'windi'` abre la pantalla actual (o el Planificador
  diario) con el panel de Windi abierto; `'themes'` abre Personalización › 1 Tema; `'widgets'` abre Personalización ›
  4 Widgets; `'personalization'` abre el paso 1. Mantener los valores del contrato para no romper la capa (C-02) y
  documentar el mapeo en `docs/contratos.md`.
- «Cerrar sesión» en el menú: reutiliza el flujo de HE-16-HU03 (`auth_get_sign_out_info` + `auth_sign_out` +
  M-11/M-12). Sin cambio de contrato.
- Botón ocultar/ampliar junto al logo y **recordar el estado en este computador** (D-25): guardar en la tabla local
  `device_setting` la clave `menu_collapsed` (`true`/`false`); no se sincroniza. Reemplaza el punto de RD-31 que dice
  que no se recuerda.

### 4.3 [RD · P1] Mensajes emergentes (P03, P12, P45)
- Unificar en un **servicio de mensajes de interfaz** (`ui/MensajeResultado` → cola global montada en la raíz, por
  encima de `ui/VentanaEmergente` y del panel de Windi), con tipos `exito | info | advertencia | error`, duración 4 s
  (éxito, información) / 6 s (advertencia, error), pausa al pasar el mouse, máximo 3 visibles, `role=status` /
  `role=alert`.
- Asignar un tipo a cada texto existente de `apps/desktop/src/types/messages.es.json` y de los CA, según la tabla de
  `rediseno_final_prototipos.md` §3.5. Los errores de IPC (`ErrorDto` con `code`) son `error`; `net.offline` es
  `advertencia`.
- Los `ui/Aviso` persistentes (RT-04) solo para estados duraderos y con cierre.
- Prueba: el aviso del wallpaper ya no queda fijo (§3.4).

### 4.4 [RD/BUG · P1] Tablero Kanban (D-08 a D-11; P10, P14, P37, P42)
- **Todas las etiquetas (D-11):** `screens/kanban/Kanban.tsx` (≈ línea 72, `const primera = suyas[0]`, RD-48) pinta la
  barra con la primera etiqueta. Pintar una barra por etiqueta (hasta 3). No hace falta cambiar el contrato:
  `card_list_board` (IPC-CARD-05) devuelve `Card`, y `Card.labels` (`docs/tipos.ts`) ya trae `{ id, name, color_hex }`
  de cada etiqueta. Sin etiquetas, sin barra (hoy sale roja).
- **Clic en cualquier parte de la tarjeta** abre el Detalle de tarjeta (HE-07-HU03); el «⋮» y el arrastre no deben
  disparar el clic (detener propagación y distinguir clic de arrastre con umbral de 5 px). Accesibilidad: la tarjeta
  entera es un botón con el título como nombre accesible.
- **Vista expandida (HE-09-HU07):** ya existe y se recuerda en `user_preference.board_card_view` (se sincroniza,
  `servicio_del_planificador/preferencias.rs`). Ajustar los campos que muestra (`rediseno_final_prototipos.md` §6.2) y el control
  (interruptor de dos estados con `aria-pressed`).
- **«+» de nueva tarjeta solo en «Por hacer» (D-08):** `card_create` como hoy. **«+» de nueva columna** como columna
  fantasma (D-09) y **columnas que se estrechan** (D-10): solo interfaz.
- **Orden manual dentro de la columna (D-16):** §5.9.

### 4.5 [RD] Formulario y Detalle de tarjeta (D-14, D-20; P06, P38, P39, P47, P48)
- Etiquetas con desplegable múltiple; el límite pasa de 5 a 3 (§5.1).
- Tipo y prioridad como controles segmentados; fecha con calendario flotante y días pasados deshabilitados (§3.6-1).
- **Bloque horario en el formulario (D-20):** campo opcional fecha + hora en punto. Al guardar, el formulario crea o
  edita la tarjeta (`card_create` / `card_update`) y después llama a `card_assign_time_block` (HE-11-HU02) o
  `card_unassign_time_block` si cambió el bloque. Validaciones existentes: `time_block.past`,
  `time_block.after_due_date` y el `CHECK card_schedule_due_ck` (`scheduled_date ≤ due_date`). La interfaz muestra las
  dos operaciones como una sola; si la segunda falla, la tarjeta queda guardada y se muestra el error del bloque.
  Requiere un CA nuevo en HE-07-HU01 y HE-07-HU04 (v13).
- Ventanas emergentes con fondo oscurecido, «×», Esc y botones abajo a la derecha (D-23): solo interfaz
  (`ui/VentanaEmergente/VentanaEmergente.tsx`, `ui/Confirmacion/Confirmacion.tsx`).

### 4.6 [RD] Calendario y Agenda diaria (D-03, D-26; P11, P15, P16, P17, P18, P49, P50, P51)
- **Selector de mes y año** (Figma «Elegir mes · 2026/2027», más escribir el año): el Calendario ya pide el mes o la
  semana con un parámetro (`calendar_get_month` / `calendar_get_week`); saltar a cualquier mes es un cambio de
  navegación sin contrato nuevo. Validar el año (1970–2100, A-09).
- Control Mes | Semana siempre visible (hoy en Semana falta «Semana»); «Ir a hoy» como ícono; navegación arriba.
- Agenda diaria: saltar a cualquier día con el mini calendario y con la tira semanal (D-26); mismo `agenda_get_day`.
- Panel del día como panel lateral: solo interfaz.
- **Colores de estado:** el Núcleo ya entrega el estado por día (HE-10-HU05); la interfaz usa `estado_vencida` /
  `estado_pendiente`. La marca «próxima a vencer» de cada tarjeta (D-03: vence hoy o mañana, sin completar) es una
  regla de presentación que se anota como RD y se calcula en la interfaz con la fecha local; el color por día del
  Calendario conserva HE-10-HU05 (A-02).

### 4.7 [RD · P1] Personalización unificada: la parte de interfaz (D-21, D-24; P24 a P29, P43, P59)
> El cambio de modelo (widgets por el borrador) está en §5.12; aquí solo lo que es interfaz y navegación.
- Una sola pantalla «Personalización» **con el menú lateral** (revierte RD-42, que la sacó a pantalla completa sin
  menú), por pasos **1 Tema · 2 Fondo · 3 Colores y tipografía · 4 Widgets**, sobre el borrador del tema en edición
  (`theme_draft_open` / `theme_draft_update` / `theme_draft_apply`, HE-02-HU09 a HU13). Une las pantallas actuales
  `screens/personalization/*`, `screens/themes/*` y `screens/widgets/*`.
- Barra de acciones fija: «Cancelar cambios» (HE-02-HU13, A-03) · «Guardar» (HE-02-HU11) · «Aplicar» (HE-02-HU12).
  «Guardar como tema» (HE-03-HU02) en el paso 1.
- Aplicar un tema desde el paso 1 con cambios sin guardar abre M-04/M-15 como ya hace Personalización; salir de la
  pantalla con cambios sin guardar abre M-02/M-03 (RT-01-CA08/CA09), ahora desde el menú lateral.
- «Organizar widgets» (D-24) abre la pantalla completa C-03 (HE-05) sin información extra (P27); el botón solo está
  en el paso 4.
- **Clima en tiempo real (P34):** `screens/widgets/CampoCiudad.tsx` ya hace debounce (≈ línea 57) al agregar.
  Verificar que «Configurar widget» (IPC-WID-05 `widget_configure`) use el mismo componente y el mismo comando
  `weather_city_search` (IPC-WID-08, Edge Function `weather-geocode`) mientras se escribe; respetar los errores
  `city.not_found`, `city.duplicate`, `net.offline`, `city.too_long`. Cuidar el cupo de la API externa (debounce
  300 ms, mínimo 2 caracteres, cancelar la petición anterior).
- Agregar widget en un solo panel (catálogo de `widget_catalog_get` + configuración + vista previa, D-19): la vista
  previa del widget antes de agregarlo se dibuja en la vista previa del borrador sin persistir (§5.12).

### 4.8 [RD] Reportes (D-12 a D-14; P19, P53, P56)
- Rango de fechas: solo las opciones de HE-13-HU01 (7 días, 30 días por defecto, 12 meses, personalizado ≤ 366
  días) (D-13). El Figma «Esta semana / Este mes / Mes anterior» **no** se implementa.
- Validación de fechas (§3.6-2) en la interfaz (`screens/reports/SelectorRango.tsx`) y en el Núcleo
  (`servicio_del_planificador/reportes.rs`), con los códigos existentes `range.invalid_date`,
  `range.start_after_end` y `range.too_long`.
- Filtro de etiquetas como desplegable múltiple con máximo 3 (D-14, §5.1).
- Organización de un vistazo: solo interfaz (`screens/reports/Reports.tsx`). «Ver más reportes»: §5.3.

### 4.9 [RD · P1] Ventana maximizada, no redimensionable y sin zoom (D-04; P58)
- `apps/desktop/src-tauri/tauri.conf.json`, ventana principal: `"resizable": false`, `"maximized": true`,
  `"maximizable": true`, `"minimizable": true`. Hoy tiene `minWidth 960` y `minHeight 600`: se pueden dejar como
  respaldo.
- **No** quitar el botón minimizar: HE-17 (cerrar/abrir la ventana desde el área de notificación) y las convenciones
  de Windows lo necesitan. Al abrir desde el área de notificación, la ventana vuelve maximizada.
- Zoom: en Tauri 2 la opción de ventana `zoomHotkeysEnabled` (hoy no está en `tauri.conf.json`, así que vale `false`)
  controla Ctrl +/−. Comprobar en la app si Ctrl + rueda o Ctrl +/− todavía cambian el zoom del WebView2; si lo hacen,
  prevenir `wheel` con `ctrlKey` y esas teclas en la raíz de la ventana principal.
- Choca con la regla 4 de `rediseno.md` («el diseño aguanta el zoom del WebView de 90 a 125 %», usada para cubrir el
  tamaño de texto de Windows por accesibilidad): anotar como RD que esa accesibilidad la cubre el tamaño «Grande» de
  la tipografía del tema.
- Pruebas E2E a 1366 × 768 y 1920 × 1080 con la ventana maximizada.

### 4.10 [RD] Windi en la interfaz (D-07; P22)
- Tamaños nuevos y panel lateral en vez de pantalla: §5.5. Sin cambio de contrato `windi_*`.

---

## 5. Funcionalidades nuevas aprobadas por Paula [🆕 HU] — borradores para redactar la HU

> Paula ya aprobó cada funcionalidad (D-nn). Para cada una: se redacta la HU en la v13 con estos borradores, Paula
> aprueba la HU y recién entonces se implementa. Los CA siguen el formato «Dado / Cuando / Entonces» de la v12.
> Las secciones §5.4 y §5.13 son [RD] o reescrituras de HU existentes; §5.6 y §5.7 quedan como registro de lo
> descartado.

### 5.1 Límite de 3 etiquetas por tarjeta y en el filtro de Reportes (D-14; P48)
- **HU:** modificar HE-07-HU02 «Asignar etiquetas a una tarjeta» (hoy CA02/ET04/ET06: máximo **5**).
- **CA borrador:** Dado que tengo abierto el Formulario de tarjeta con 3 etiquetas elegidas, cuando intento elegir
  otra, entonces las demás etiquetas se ven deshabilitadas con el motivo «Puedes asignar hasta 3 etiquetas.».
- **Lo que existe hoy y hay que cambiar de 5 a 3:**
  - Núcleo: `ETIQUETAS_MAX: usize = 5` en `servicio_del_planificador.rs` (≈ línea 52) y el error `labels.too_many`
    de `card_create` / `card_update` (IPC-CARD-01/02), con su texto en `messages.rs` y `docs/contratos.md` («Puedes
    asignar máximo 5 etiquetas por tarjeta.» → «Puedes asignar hasta 3 etiquetas.»).
  - Nube: la regla R7 de `public._sync_apply_change` (`0003_funciones.sql`, ≈ línea 640) recorta `card_label` a 5 por
    tarjeta conservando las más antiguas (`ORDER BY created_at, id`). La migración `0009` redefine la función con
    `rn > 3`.
  - Windi (`supabase/functions/windi-chat/logica.ts`): las propuestas de crear/editar no deben superar 3 etiquetas.
- **Datos existentes (D-14):** la migración `0009` marca `deleted_at` en las filas vivas de `card_label` que sobren
  de 3 por tarjeta (se conservan las 3 asignadas primero, por `created_at, id`, igual que R7) y les da `updated_seq`
  nuevo para que baje a todos los computadores. El Núcleo aplica la misma regla a los cambios pendientes locales
  antes de enviarlos.
- **Filtro de Reportes:** máximo 3 etiquetas también en el filtro; los `report_*` rechazan más de 3 con
  `labels.too_many` (texto «Puedes elegir hasta 3 etiquetas.», ⚠ a confirmar en la v13).

### 5.2 Recordatorios reales a la hora del bloque horario (D-05; P40)
- **Regla (D-05):** una tarjeta de tipo `reminder` **con bloque horario** genera una notificación de Windows a las
  `scheduled_hour`:00 del día `scheduled_date`. Solo a la hora, sin anticipación. Sin bloque horario no hay
  notificación. **Sin cambio de esquema** (se descartó el campo `remind_at`).
- **Comportamiento:** el Núcleo programa la notificación (plugin de notificaciones de Tauri) con el título de la
  tarjeta, «Recordatorio · HH:00» y las acciones «Abrir» (abre el Detalle de tarjeta en la app) y «Marcar como
  completada»; funciona con la ventana cerrada mientras la app sigue en el área de notificación (HE-17).
  Reprogramar al editar, mover, completar, eliminar, asignar o quitar el bloque horario, y al recibir por
  sincronización cambios de otro computador. Con la app cerrada con «Salir» o sin sesión no suena (A-11). Si la app
  arranca después de la hora, no se muestra la notificación atrasada (⚠ confirmar en la HU).
- **Dentro de la app:** a la misma hora, el Planificador diario muestra la franja de recordatorio (`rediseno_final_prototipos.md` §6.1).
- **CA borrador:** Dado que tengo una tarjeta de tipo Recordatorio asignada hoy al bloque de las 16:00 y la
  aplicación se está ejecutando, cuando llegan las 16:00, entonces Windows muestra la notificación «<título>» con
  «Abrir» y «Marcar como completada».
- Permisos: agregar la capacidad de notificaciones en `apps/desktop/src-tauri/capabilities/default.json`.
- Depende de D-20 (bloque horario en el formulario, §4.5).

### 5.3 Más reportes (D-12; P19, P56)
- El glosario prevé que «una gráfica nueva se agrega como otra sección». Cada sección es una HU de HE-13:
  1. Completadas por etiqueta.
  2. Completadas por tipo (Tarea, Recordatorio, Evento).
  3. Vencidas por prioridad (incluida «Sin prioridad»: `priority` es opcional).
  4. Tarjetas por columna (estado actual).
  5. Carga de los próximos 7 días (pendientes por día).
  6. Tiempo medio de completado (usa `card.created_at` —ya existe en `0001_esquema.sql`— y `card.completed_on`).
- **Backend:** funciones nuevas en `servicio_del_planificador/reportes.rs` sobre la base local (los reportes ya se
  calculan sin conexión), con los mismos filtros (rango + hasta 3 etiquetas), DTO nuevos en `tipos/ipc_reportes.rs` y
  `docs/tipos.ts`, comandos nuevos `report_get_*` **(nuevo)** en `docs/contratos.md` y pruebas en
  `servicio_del_planificador/pruebas_de_reportes.rs`. Sin cambios en la nube.
- El detalle «Cumplimiento por estado» del Figma (Vencidas · Pendientes · Completadas · A tiempo) ya se arma con
  `report_get_status_breakdown` + `report_get_compliance` existentes.
- Pantalla «Reportes › Más reportes»: ruta nueva en `reglas/ruta.tsx`.

### 5.4 Planificador diario ampliado como pantalla principal (D-06; P23) [RD]
- **No** hay pantalla «Inicio» nueva ni entrada de menú nueva. Se amplía el Planificador diario (pantalla principal,
  glosario) con un saludo y una columna lateral que **reutiliza** consultas existentes:
  - Avance del día: `planner_get_today` (`summary`).
  - Próximas a vencer: las 3 siguientes tarjetas pendientes por `due_date`. Si no hay consulta que las dé, agregar una
    IPC ligera de lectura `card_list_upcoming { limit }` **(nuevo)** sobre la base local; anotarla como RD (no agrega
    funcionalidad, solo reúne datos existentes).
  - Mini calendario: `calendar_get_month` (HE-10-HU05).
  - Acceso a Windi: abre el panel (§5.5).
- Cuenta nueva: llega a esta pantalla con el tema «Windgets» con la paleta Claro u Oscuro y los widgets por defecto
  (§3.2).

### 5.5 Windi: botón flotante, panel de chat y widget de escritorio (D-07; P22, P36)
- **Panel en la app:** botón flotante (ojos con `accion` del tema) en todas las pantallas con sesión salvo Organizar
  widgets; abre un panel lateral que reutiliza `windi_send_message`, `windi_confirm_proposal` y
  `windi_reject_proposal` (IPC-WIN-*); sin cambios en la nube. La pantalla `P-IA-01 Agente de IA` (`docs/interfaz.md`)
  se reemplaza por el panel; actualizar el inventario y RT-01. El historial y la propuesta activa se conservan al
  cerrar y abrir el panel (como hoy en memoria).
- **Widget de escritorio «Windi»:** nuevo valor `windi` en el `CHECK` de `widget.type` (migración `0009`, SQLite local)
  y en el catálogo que devuelve `widget_catalog_get` (IPC-WID-02, grupo `local`). Uno solo por cuenta (A-07): agregar
  `windi` al índice `uq_widget_singleton`. Es interactivo: al seleccionarlo llama a `app_open_screen { screen: 'windi' }`
  (HE-06-HU08), que abre la ventana principal con el panel abierto (§4.2). Dibujo: dos ojos con `accion` del tema (o
  su apariencia, §5.11), sin la ilustración de Windi; parpadean mientras Windi responde.
- La HU nueva va en HE-14 (Windi) para el panel y en HE-04 para el widget.

### 5.6 [Descartada por D-08] Crear tarjeta desde el «+» de cualquier columna (P10)
- Paula decidió que el «+» de nueva tarjeta está solo en «Por hacer» y que las tarjetas nacen allí, como dice
  HE-07-HU01. No se agrega `column_id` a `card_create`. Se deja el registro para la trazabilidad de P10.

### 5.7 [Descartada por D-02] Cuarto color del tema (P05)
- Se mantienen 3 colores. Solo se derivan más tonos en `ui/tema/derivar.ts` (§4.1). No hay `color_accent`.

### 5.8 Ajustes de widgets: Reloj 12/24 h e inicio de semana del Calendario (D-15)
- Hoy el Reloj sigue el formato de Windows (`integracion_con_el_sistema/formato_de_hora.rs`) y HE-04-HU12 solo
  configura Clima y Texto (`widget_configure` acepta `WeatherConfig | TextConfig`). Columnas nuevas en `public.widget`
  (migración `0009`, SQLite local, `field_mods`, sincronización): `clock_format` (`system` por defecto, `12h`, `24h`)
  y `calendar_week_start` (`monday` por defecto, `sunday`). Con A-10 son **del tema**, como toda la configuración
  del widget (ver §5.12).
- Extender `widget_configure` (IPC-WID-05) con `ClockConfig` y `CalendarConfig` **(nuevos)** y permitir «Configurar»
  en Reloj y Calendario (son widgets por defecto: se configuran pero no se eliminan).
- La capa (`capa/Reloj.tsx`, `capa/WidgetCalendario.tsx`) lee los campos.
- **CA borrador:** Dado que tengo el widget Reloj con formato 12 h, cuando consulto el escritorio, entonces veo la
  hora como «3:05 p. m.».

### 5.9 Orden de tarjetas definido por el usuario (D-16)
- **Regla:** por defecto, las tarjetas se ordenan por fecha límite más próxima (desempate: prioridad alta → baja,
  luego creación). En el Planificador diario y en Tareas del día el orden por defecto es el de HE-12-HU01-ET03 (por
  hora del bloque y después las sin hora, A-05). Si el usuario **arrastra** una tarjeta para reordenarla, ese orden
  manual se conserva.
- **Datos (A-06: un solo orden para todo):** se reutiliza `card.position` (HE-09-HU02-ET08) como **orden global** de
  las tarjetas. El Kanban muestra cada columna ordenada por `position`; el Planificador diario y los widgets Tareas
  del día y Kanban usan el mismo `position`. No se crea `day_position`. Mientras el usuario no reordene, `position`
  se calcula con la regla por defecto; un campo `manual_order boolean` (o el valor de `field_mods.position`) indica
  si el orden ya es manual y no se debe recalcular. ⚠ Al mover una tarjeta de columna (`card_move`) se conserva su
  `position` relativa.
- Al crear una tarjeta sin orden manual en su lista, se inserta en la posición que le corresponde por la regla por
  defecto.
- **Contrato:** comando nuevo `card_reorder { card_id, before_id?, after_id? }` **(nuevo)** que actualiza el orden
  global, usado desde el Kanban, el Planificador diario y los widgets.
- **Interfaz:** arrastre para reordenar en el Planificador diario y en el widget Tareas del día (con el reenvío de
  arrastre de la capa, `ipc/arrastreReenviado.ts`). Se apoya en el orden estable de §3.5.

### 5.10 Distribución predefinida (D-17)
- Catálogo nuevo `public.catalog_layout` **(nuevo)** (id, nombre, posiciones relativas por tipo de widget en % del
  área visible) con 3 entradas iniciales («Original», «Reloj a la derecha», «Kanban centrado») o las que Paula
  defina, y su copia local.
- Aplicar una distribución predefinida al **borrador** del tema calcula posiciones y tamaños para los widgets activos
  (respetando mínimo 100 × 100 y sin superposición, R-09 / HE-05) y los muestra en la vista previa; se ajustan luego en
  «Organizar widgets» y se guardan/aplican con el flujo normal (§5.12).

### 5.11 Apariencia del widget (D-18)
- Columnas nuevas en `public.theme_widget` (la apariencia es del tema, como la distribución; servicio
  `distribucion.rs`): `appearance_mode` (`theme` por defecto, `palette`, `custom`), `palette_id`, `color_primary`,
  `color_secondary`, `color_text`, `background_opacity` (0–100). Migración `0009`, SQLite local, `field_mods`,
  sincronización.
- La capa deriva los tokens del widget con `derivarTokens` a partir de esos colores en vez de los del tema.
- Legibilidad: aplicar las mismas reglas de contraste (HE-02-HU05-ET07) por widget y advertir en el panel.

### 5.12 Personalización unificada por pasos, todo por el borrador (D-21)
- **Cambio de modelo:** hoy los widgets (HE-04: agregar, activar, configurar, eliminar) y la distribución (HE-05)
  cambian el tema **aplicado** al instante, fuera del borrador. Paula decidió **una sola forma**: todo cambio de
  Personalización entra al **borrador del tema en edición** (`theme_draft_*`), se ve en la vista previa, «Guardar» lo
  persiste en el tema y «Aplicar» lo lleva al escritorio.
- Implicaciones:
  1. El borrador incluye los widgets del tema (altas, bajas, activo/inactivo, configuración, apariencia, tamaño de
     texto, distribución). Ampliar `ThemeContent` (`docs/tipos.ts`), el estado del borrador y `theme_draft_update`
     (IPC-THEME-05) con operaciones de widgets.
  2. **A-10 · Todo del tema:** hoy los widgets son de la **cuenta** (`public.widget`; «Eliminar widget: se quita de
     todos los temas», M-07) y su estado por tema está en `public.theme_widget`. Paula decidió que **cada tema tiene
     sus propios widgets**. Cambios:
     - Modelo: `public.widget` pasa a pertenecer a un tema (`theme_id` NOT NULL, migración `0009`) o se fusiona con
       `theme_widget`; la configuración (ciudad, texto, imágenes, servicio de música, formato del Reloj, inicio de
       semana), la apariencia, el tamaño y la posición viven por tema. Migrar los datos actuales copiando cada widget
       de la cuenta a cada tema donde aparece.
     - Widgets por defecto (Reloj, Calendario, Tareas del día, Kanban): **cada tema** los tiene; no se eliminan, solo
       se desactivan (HE-04-HU13). «Guardar como tema» copia los widgets del tema de origen. La reparación de D-27 se
       hace por tema.
     - Unicidad: «uno por ciudad» del Clima y «uno solo» de Noticias, Reproductor de música y Windi (A-07) pasan a ser
       **por tema** (ajustar `uq_widget_singleton` y la unicidad de ciudad).
     - Reproductor de música: la conexión con Spotify/YouTube Music sigue siendo de la cuenta (es una credencial); el
       widget de cada tema la usa.
     - M-07 cambia a «¿Deseas eliminar el widget “<nombre>” de este tema?» (texto a confirmar en la v13).
     - Reescribir HE-04 (HU01 a HU13) y HE-05 con «del tema en edición».
  3. Los widgets externos que validan en internet (Clima, Noticias, Reproductor de música) validan al agregarlos al
     borrador; sin conexión, el paso muestra el aviso y deshabilita «Agregar».
  4. «Organizar widgets» (C-03) trabaja sobre el borrador y vuelve a Personalización › 4 Widgets con la distribución
     en la vista previa (hoy guarda directo: cambia HE-05-HU04). Sus botones: «Cancelar» y «Listo» (A-01).
  5. Sincronización: el borrador es local; solo «Guardar» (o «Aplicar» con guardado) crea cambios pendientes
     (`pending_change`) del tema y de los widgets, en una sola transacción, para que otro computador nunca vea un tema
     a medias.
  6. Las confirmaciones M-02/M-03/M-04/M-15 cubren también los cambios de widgets.
  7. Reescribir en la v13 HE-02-HU09 a HU13, HE-04-HU02, HE-04-HU04 a HU13 y HE-05-HU01 a HU05.
- La vista previa muestra los widgets **reales** (los componentes de `apps/desktop/src/capa/`) escalados, para que sea
  fiel; ahí también se dibuja el widget elegido en el catálogo antes de «Agregar» (D-19).

### 5.13 Plantillas fuera de la interfaz (D-22)
- Mantener `public.catalog_template` con una sola plantilla interna (la de `is_default = true`) que todos los temas
  usan; las plantillas `claro` y `oscuro` (migración `0008_catalogo_p29.sql`) dejan de ofrecerse (`is_active =
  false`, no borrar: hay temas que las usan) y la migración `0009` pasa esos temas a la plantilla por defecto
  conservando su imagen de fondo y sus colores.
- La imagen de fondo de las plantillas `claro` y `oscuro` (`default_background_path`) pasa al **catálogo de
  imágenes** (`public.catalog_image`) para no perderla.
- HE-02-HU02 «Seleccionar una plantilla del catálogo de plantillas» se retira y HE-02-HU08 «Restablecer los colores y
  la tipografía del tema a los valores por defecto de la plantilla» se reescribe: «Restablecer» vuelve a los colores y
  la tipografía de la plantilla interna (o de la paleta elegida, ⚠ confirmar en la v13). `theme_draft_update` deja
  de recibir `template_id` desde la interfaz.
- Glosario: actualizar «Plantilla», «Plantilla por defecto», «Wallpaper» y «Restablecer».

### 5.14 Personalización fácil del escritorio y tamaño de letra (D-28, D-30)
- **Tema** (`public.theme` y `public.applied_theme`): columnas nuevas `background_dim` (0–80 %), `background_blur`
  (0–20 px), `widget_corner` (`square`, `soft`, `round`), `widget_shadow` (boolean). Migración `0009`, SQLite local,
  sincronización, `ThemeContent`, vista previa y capa del wallpaper (el oscurecido y el desenfoque se aplican en la
  capa, no a la imagen guardada).
- **Widget del tema** (`public.theme_widget`, junto a §5.11): `font_size` (`theme` por defecto, `small`, `medium`,
  `large`).
- **Regla de tamaño (D-30):** `theme.font_size` es el tamaño por defecto de la aplicación y de todos los widgets; un
  widget con `font_size` distinto de `theme` lo sobrescribe solo para él. Ningún campo se elimina. Prueba: cambiar el
  tamaño del tema cambia la app y los widgets en «Igual que el tema», pero no los que tienen tamaño propio.

### 5.15 Densidad Compacta / Cómoda (D-29)
- Preferencia nueva `app_density` (`compact` por defecto, `comfortable`) en `public.user_preference` (se sincroniza,
  A-08; si Paula decide «del computador», va en `device_setting`), leída en `servicio_del_planificador/preferencias.rs`.
  Solo cambia espaciados y altos de fila en la interfaz; no el tamaño de letra. El interruptor está en Configuración.

---

## 6. Impacto en contratos, datos y pruebas (lista de verificación)

| Área | Archivo(s) | Cambio | Por |
|---|---|---|---|
| Sincronización | `src-tauri/src/motor_de_sincronizacion.rs` | Proteger campos confirmados más nuevos; serializar push/pull; pruebas A→B→A | 3.1 |
| Widgets por defecto | `0003_funciones.sql` (revisión), `servicio_de_personalizacion_y_configuracion/widgets.rs`, `screens/widgets/Widgets.tsx` | Verificar creación y descarga; estado de error/vacío; reparación al iniciar sesión | 3.2 |
| Tema en la app | `ventana_principal/marco.css`, `ui/tema/temaAplicado.ts`, `ventana_principal/EncabezadoDePantalla.tsx`, `screens/cuenta/SelectorDeModo.tsx`, `screens/cuenta/textosDelRediseno.ts` | RD-62: revertir RD-28/RD-29; texto de la paleta inicial | 4.1, 2 |
| Menú | `ui/MenuPrincipal/MenuPrincipal.tsx`, `ui/MenuPrincipal/IconosDelMenu.tsx`, `reglas/ruta.tsx`, `device_setting` | Dos bloques, sin «Agente de IA», cerrar sesión, `menu_collapsed`, mapeo de `ScreenId` | 4.2 |
| Mensajes | `ui/MensajeResultado`, `ui/Aviso`, `ventana_principal/AvisoDelWallpaper.tsx`, `types/messages.es.json` | Cola global con tipos; «Editar escritorio» → «Organizar widgets» | 4.3, 3.4, D-24 |
| Kanban | `screens/kanban/Kanban.tsx` | Todas las etiquetas, clic en toda la tarjeta, vista expandida | 4.4 |
| Tarjeta | `screens/tarjeta/FormularioTarjeta.tsx`, `ui/SelectorFecha`, `ui/VentanaEmergente`, `ui/Confirmacion` | Días pasados deshabilitados, desplegable de etiquetas, bloque horario, botones a la derecha | 4.5 |
| Etiquetas | `servicio_del_planificador.rs` (`ETIQUETAS_MAX`), `messages.rs`, `docs/contratos.md`, migración `0009` (`_sync_apply_change` R7 + recorte), `windi-chat/logica.ts` | Límite de 3 | 5.1 |
| Recordatorios | Plugin de notificaciones de Tauri, `capabilities/default.json`, servicio de tarjetas | Notificación a la hora del bloque horario | 5.2 |
| Reportes | `reportes.rs`, `tipos/ipc_reportes.rs`, `pruebas_de_reportes.rs`, `screens/reports/Reports.tsx`, `screens/reports/SelectorRango.tsx`, `docs/tipos.ts` | Validación de fechas; filtro de 3; secciones nuevas | 4.8, 5.3 |
| Calendario/Agenda | `screens/calendar/*`, `screens/agenda/*` | Selector de mes y año, Mes \| Semana, tira semanal, saltar a un día | 4.6 |
| Planificador diario | `screens/planner_daily/*`, `servicio_del_planificador.rs` (`planner_get_today`), `card_list_upcoming` (nuevo) | Pantalla principal ampliada, orden estable | 3.5, 5.4 |
| Windi | Panel nuevo, `widget.type` + `uq_widget_singleton` (`0009`), `widget_catalog_get`, `docs/interfaz.md` (P-IA-01) | Panel flotante y widget | 5.5 |
| Orden de tarjetas | `card.position` como orden global (+ marca de orden manual), `card_reorder` (nuevo), `ipc/arrastreReenviado.ts` | Orden manual único | 5.9 |
| Widgets | `widget.clock_format`, `widget.calendar_week_start` (`0009`), `widget_configure`, `capa/Reloj.tsx`, `capa/WidgetCalendario.tsx` | Ajustes de Reloj y Calendario | 5.8 |
| Distribución | `catalog_layout` (nuevo, `0009`), `distribucion.rs` | Distribución predefinida | 5.10 |
| Widget del tema | `theme_widget` (`0009`): apariencia y `font_size` | Apariencia y tamaño de texto por widget | 5.11, 5.14 |
| Personalización | `screens/personalization/*`, `screens/themes/*`, `screens/widgets/*`, `theme_draft_*`, `ThemeContent`, `reglas/ruta.tsx` | Pantalla por pasos con menú; widgets por el borrador | 4.7, 5.12 |
| Plantillas | `catalog_template`, `catalog_image`, `theme` (`0009`), `theme_draft_update` | Plantillas fuera de la interfaz | 5.13 |
| Tema | `theme`, `applied_theme` (`0009`): `background_dim`, `background_blur`, `widget_corner`, `widget_shadow` | Personalización fácil | 5.14 |
| Preferencias | `user_preference.app_density` (`0009`), `preferencias.rs` | Densidad | 5.15 |
| Ventana | `src-tauri/tauri.conf.json` | Maximizada, no redimensionable, sin zoom | 4.9 |
| Esquemas locales | `docs/local/sqlite_esquema.sql`, `src-tauri/sqlite_esquema.sql`, `docs/windgets_nube.dbml`, `docs/windgets_local.dbml` | Reflejar cada columna o tabla nueva de `0009` | §0 regla 2 |
| Docs | `docs/rediseno.md`, `docs/contratos.md`, `docs/interfaz.md`, `docs/HE-*.md`, `docs/DUDAS.md` | RD-62 en adelante; contratos nuevos; HU v13; puntos abiertos | Todas |
| Pruebas E2E | `apps/desktop/e2e/rediseno-*.spec.ts` | Medidas nuevas (escala compacta), ventana maximizada | 4.1, 4.9 |

---

## 7. Trazabilidad con las sugerencias de Paula (P01–P73 de `rediseno_final_prototipos.md` §12)

| Sugerencia | Impacto backend / lógica |
|---|---|
| P01, P02, P07, P13, P15, P17, P28, P31, P38, P39, P41, P52, P54, P55 | Solo interfaz (sin contrato); actualizar pruebas de geometría (§4.1) |
| P03, P12, P45 | §4.3, §3.4 |
| P04, P05, P30, P35, P46 | §4.1, §2, §3.3; P05 también §5.7 (descartada, D-02) |
| P06, P47 | §4.5 |
| P08, P09, P57 | §4.2 (D-25) |
| P10 | §4.4; §5.6 (descartada, D-08) |
| P11, P51 | §4.6 (D-03, A-02) |
| P14, P37, P42 | §4.4 |
| P16, P18, P49, P50 | §4.6 (D-26) |
| P19, P56 | §4.8, §5.3 |
| P20 | Solo interfaz (las acciones por fila ya existen, RD-54) |
| P21 | Inventario en `rediseno_final_prototipos.md` §11 |
| P22, P36 | §4.10, §5.5 |
| P23 | §5.4 (D-06) |
| P24, P25, P26, P27, P29, P43, P59 | §4.7, §5.12 |
| P32 | §3.1 |
| P33 | Descartada (D-32) |
| P34 | §4.7 (Clima en tiempo real también en «Configurar widget») |
| P40 | §5.2 (D-05), §4.5 (D-20) |
| P44 | §3.2 (D-27) |
| P48 | §5.1 (D-14) |
| P53 | §3.6-2, §4.8 |
| P58 | §4.9 (D-04) |
| P60 | Todo: este es el rediseño final; registrar cada decisión como RD o HU v13 |
| P61, P62, P66, P67, P68, P69, P70 | Interfaz y revisión de prototipos (`rediseno_final_prototipos.md` §0.2, §7); P69 también §4.1 (escala) |
| P63 | D-31: nada que construir |
| P64, P65 | §5.12 (D-21, D-24) |
| P71 | §5.13 (D-22) |
| P72 | §5.14 (D-30) |
| P73 | §5.14 (D-28), §5.15 (D-29) |
