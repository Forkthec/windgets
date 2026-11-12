# Contratos

## Cómo usar este archivo

Todo lo que cruza una frontera tiene un contrato con nombre, parámetros, retorno y errores con su texto literal y su CA:

- **(a) Comandos IPC** que las vistas invocan en el Núcleo (`dominio_accion` en snake_case).
- **(b) Eventos** que el Núcleo emite a las vistas (`emit` de Tauri).
- **(c) RPC de PostgreSQL y Edge Functions** de Supabase.
- **(d) Integraciones externas** (INT-01 a INT-13): Supabase Auth, SMTP de Gmail, Gemini, clima, noticias, SMTC, Win32, inicio automático, Storage, esquema `windgets://`, DPAPI y archivos, GitHub y el instalador.

Cada archivo de épica lista, por HU, los contratos que usa con su firma. Este archivo es el catálogo completo.

Material que lo acompaña, en esta carpeta:

- `tipos.ts`: tipos TypeScript de todos los parámetros, retornos, eventos y errores (lo que generaría ts-rs). El Núcleo define los tipos en Rust y los exporta con ts-rs; el resultado debe coincidir con este archivo. Ninguna vista define su propia copia.
- `secuencias/`: once diagramas de secuencia UML (`.png`, `.svg` y la fuente `.puml` de PlantUML, con `_estilo.iuml` y `_leyenda.iuml`) de los flujos críticos: inicio de sesión con correo y con Google (PKCE), registro con código, consulta a Windi, selección de un widget interactivo, aplicar tema o wallpaper, sincronización sin conexión, descarga desde la landing page e instalación.
- `trazabilidad_contratos.csv`: contrato, HU, CA y entidades.

Reglas que no puedes saltarte:

- Las vistas validan campos para mostrar el mensaje al instante; el Núcleo vuelve a validar y devuelve el código de error. El texto literal de cada error está en la columna Errores.
- Los comandos de escritura guardan en SQLite y en `pending_change` en una transacción y devuelven sin esperar a la nube. Los de lectura no usan la red.
- Solo exigen conexión los comandos `auth_*`, `widget_add` y `widget_configure` de Clima, `windi_*` y `catalog_refresh`.
- Cada comando tiene una lista de vistas autorizadas (capacidades de Tauri por ventana). La capa del wallpaper (C-02) solo invoca comandos de lectura de widgets, `card_set_completed`, `card_move`, los de música, `system_open_url` y `app_open_screen`.
- Las Edge Functions exigen el JWT del usuario (`verify_jwt = true`) y leen sus secretos de Supabase (D-192).

<!-- ANEXO GENERADO -->

## Catálogo · 0. Identificadores y abreviaturas

| Sigla | Significado |
| --- | --- |
| HE-nn, CD-nn, HE-nn-HUnn, -CAnn, -ETnn | Épica, componente de distribución, historia de usuario (HU), criterio de aceptación (CA) y especificación técnica (ET) del backlog; CA y ET se citan completos, por ejemplo `HE-01-HU03-CA04`. |
| RT-nn, RT-nn-CAnn, RNF-nn, D-nnn | Regla transversal (y su criterio de aceptación), requisito no funcional y decisión del proyecto. |
| Núcleo | Proceso en Rust (Tauri 2) con las reglas de negocio, SQLite, sincronización e integración con Windows (D-179, D-188). |
| Vista | Una de las tres ventanas WebView2 con React y TypeScript: **P** = ventana principal; **C** = capa del wallpaper y los widgets (anclada a WorkerW, D-131); **E** = ventana de edición de la distribución (temporal, D-185). |
| IPC | Comunicación entre una vista y el Núcleo: comandos de Tauri (`invoke`) y eventos (`emit` y `listen`). |
| RPC | Función de PostgreSQL expuesta por PostgREST en `POST {SUPABASE_URL}/rest/v1/rpc/<nombre>`. |
| Edge | Edge Function de Supabase (Deno y TypeScript) en `POST {SUPABASE_URL}/functions/v1/<nombre>`. |
| JWT | Token de acceso de Supabase Auth del usuario. |
| PKCE | Proof Key for Code Exchange: flujo OAuth sin secreto en el computador (RNF-36). |
| SMTC | System Media Transport Controls de Windows (API `Windows.Media.Control`, D-175). |
| DPAPI | Protección de datos de Windows para el usuario actual (RNF-19, D-192). |
| WorkerW | Ventana del escritorio de Windows detrás de los íconos donde se ancla la capa del wallpaper (D-131). |
| LWW | *Last write wins*: en un conflicto gana la modificación más reciente de cada campo (D-048). |
| ts-rs | Biblioteca que genera los tipos TypeScript a partir de los tipos de Rust (D-188). |
| IPC-<DOM>-nn, EV-nn, RPC-nn, EF-nn, INT-nn | Identificadores de contrato: comando IPC por dominio, evento, función RPC, Edge Function e integración externa. |
| DP-nn | Duda/propuesta: decisión que el backlog no toma. El texto indica la propuesta y su razón; la sección (h) las reúne. |

## Catálogo · 1. Convenciones

### 1.1 Nombres

- Comandos IPC: `dominio_accion` en snake_case (`card_create`). Eventos: `sustantivo_participio` en snake_case (`cards_changed`). RPC y tablas: snake_case. Edge Functions: kebab-case (`windi-chat`).
- Los tipos que cruzan el IPC se definen una sola vez en Rust y se exportan a TypeScript con ts-rs (D-188): ninguna vista define su propia copia. Los campos viajan en snake_case.
- Los valores enumerados son códigos en inglés (`task`, `todo`, `done`); la interfaz muestra el nombre en español.

### 1.2 Formatos que cruzan el IPC y las RPC

| Tipo | Formato | Nota |
| --- | --- | --- |
| `Uuid` | texto UUID en minúsculas | Los genera el Núcleo (UUID v4) para crear sin conexión. |
| `DateIso` | `YYYY-MM-DD` | Fecha local del computador (fecha límite, bloque horario, fecha de completado). Las vistas muestran «DD/MM/AAAA» y reciben del usuario texto en ese formato; la conversión y la comprobación de formato las hace la vista, y el Núcleo vuelve a comprobar que la fecha exista (`*.invalid`) (HE-07-HU01-ET09; D-188). |
| `Instant` | ISO 8601 en UTC con milisegundos y `Z` (`2026-11-09T15:04:05.120Z`) | Toda hora de modificación, de sincronización o de vencimiento. Coincide con la salida de `sync_push` y `sync_pull` (que fijan la zona horaria a UTC). |
| `Hex` | `#RRGGBB` | El Núcleo normaliza a mayúsculas. |
| Porcentajes | número con un decimal (`66.7`) | La vista pone coma y espacio antes de «%» (HE-13-HU03-ET04; D-170). |
| Horas | entero 0 a 23 (`hour`) | La vista muestra «HH:MM» (D-169). |
| `position` | número de coma flotante | Orden dentro de la columna o de la lista; admite insertar entre dos valores. |

### 1.3 Errores

Todo comando devuelve `Result<T, AppError>`:

```
AppError { code: string; message: string; field?: string; params?: Record<string, string | number> }
```

- `code`: `<campo o tema>.<motivo>` en snake_case. Es estable; las vistas ramifican por `code`.
- `message`: texto literal en español del backlog, con los marcadores `<…>` ya sustituidos con `params` (ver 1.4). Cuando el backlog no fija texto, `message` queda vacío y la fila lo indica con «sin texto».
- `field`: nombre del campo del formulario al que pertenece (la vista pone el mensaje de campo debajo de ese campo, RT-04). Sin `field` el mensaje es de resultado, aviso o confirmación según el caso.
- En las tablas de comandos, cada error se escribe **`código` → «mensaje literal» → criterio de aceptación**.
- Los textos literales viven en un solo archivo de Rust (`messages.rs`) que un paso de compilación exporta a `messages.es.json` para que las validaciones de campo de las vistas muestren exactamente los mismos textos al instante (D-188; DP-01).
- Códigos comunes a todos los comandos que escriben o llaman a la nube:
  - `net.offline`: la función exige conexión y no hay (el texto depende del flujo y se indica en cada fila).
  - `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 (D-205): el servicio de cuentas no responde (tiempo agotado o error 5xx). No avanza de paso, no se pierde lo diligenciado y la vista deshabilita el botón mientras se procesa. Aplica a los comandos `auth_*` que llaman a Supabase Auth.
  - `internal.unexpected`: error no previsto, sin texto en el backlog (DP-02).
  - `session.expired`: el token venció y no se pudo renovar con conexión; el Núcleo cierra a Inicio de sesión sin borrar datos locales (D-191).
- «Mensaje de resultado» (RT-04): texto que la vista muestra 4 s en la esquina inferior derecha (RNF-27). Los comandos lo devuelven en `Ok.result_message` (`{ code, message, params }`) para que la vista no lo escriba otra vez. En las tablas se abrevia **Msg:**.

### 1.4 Marcadores de los mensajes

Los mensajes con datos variables usan los marcadores del backlog; el Núcleo los sustituye con `params` (las claves van en snake_case).

| Marcador en el mensaje | Clave en `params` |
| --- | --- |
| `<alias>` | `alias` |
| `<segundos restantes>` | `seconds` |
| `<nombre del tema>`, `<nombre del tema en edición>` | `theme_name` |
| `<contraste>`, `<color sugerido>` | `ratio`, `color` |
| `<título de la tarjeta>` | `card_title` |
| `<nombre de la etiqueta>` | `label_name` |
| `<nombre de la columna>`, `<nombre de la columna destino>` | `column_name`, `destination_name` |
| `<nombre del widget>` | `widget_name` |
| `<cantidad>`, `<cantidad restante>` | `count`, `extra_count` |
| `<hora de inicio>`, `<hora de fin>` | `start`, `end` (formato «HH:00») |
| `<cantidad a tiempo>`, `<cantidad total>` | `on_time`, `total` |
| `<fecha de la primera tarjeta>` | `first_card_date` (formato «DD/MM/AAAA») |

Los mensajes de confirmación y los textos de estado vacío que no son errores los compone la vista con estos mismos marcadores y los datos de los comandos de información (`*_get_delete_info`, `report_get_meta` y similares).

### 1.5 Reglas generales de los comandos

1. Los comandos de escritura validan, escriben en SQLite junto con su cambio pendiente (`pending_change`) en una transacción y devuelven sin esperar a la nube (D-049, D-188). Disparan la sincronización 2 s después (D-189).
2. Los comandos que leen devuelven lo guardado en el computador, sin red.
3. Los únicos comandos que exigen conexión son los de cuenta (`auth_*`), `widget_add` y `widget_configure` de Clima (validar la ciudad), `windi_*` y `catalog_refresh` (HE-15-HU02-ET02).
4. Cada comando tiene una lista de **vistas** autorizadas (capacidades de Tauri por ventana): la capa C solo puede invocar los comandos de lectura de widgets, `card_set_completed`, `card_move`, los de música, `system_open_url` y `app_open_screen`; ningún comando de cuenta ni de personalización (mínimo privilegio; la capa vive en WorkerW y no recibe entrada directa, D-186).
5. Los instantes de modificación de cada campo los pone el Núcleo con la hora de su reloj; el servidor las corrige con `p_clock_offset_ms` (D-048, D-189).

### 1.6 Tipos compartidos (resumen)

La definición completa está en `tipos.ts`.

| Tipo | Campos |
| --- | --- |
| `Card` | `id, type('task'\|'reminder'\|'event'), title, description\|null, priority('high'\|'medium'\|'low')\|null, due_date, column_id, position, previous_column_id\|null, completed_on\|null, scheduled_date\|null, scheduled_hour\|null, label_ids[], is_completed, is_overdue, created_at` |
| `CardDetail` | `Card` + `labels[{id,name,color_hex}]`, `column{id,name,color_hex}`, `time_block{date,hour,label:'10:00 – 11:00'}\|null` |
| `Label` | `id, name, color_id, color_hex, card_count` |
| `Column` | `id, name, color_id, color_hex, role('todo'\|'in_progress'\|'done'\|'custom'), position, card_count, is_default` |
| `ThemeSummary` | `id, name, last_modified_at, is_applied, has_unapplied_changes, has_unsaved_changes` |
| `ThemeContent` | `template_id, background{source:'template_default'\|'catalog'\|'own', catalog_image_id\|null, uploaded_image_id\|null}, colors{primary,secondary,text}, palette_id\|null, font{id,size:'small'\|'medium'\|'large'}` |
| `ThemeDraftView` | `theme_id, name, content: ThemeContent, dirty, applied_unsaved, legibility{ok, items[{pair: 'ink_surface'\|'text_surface'\|'control_surface', ratio, min}], suggestion{pair, color, ratio}\|null}` |
| `WidgetItem` | `widget_id, type, display_name, distinguishing_value\|null, is_default, is_active, can_configure, can_delete, paused_by_load, config: WidgetConfig` (`config` precarga el Formulario de widget, D-202) |
| `WidgetRect` | `widget_id, type, x, y, width, height, is_active` |
| `SyncStatus` | `status('synced'\|'syncing'\|'offline'\|'error'), pending_count, last_sync_at\|null` |
| `WindiMessage` | `id, role('user'\|'assistant'), text, sent_at, failed` |
| `Monitor` | `id, x, y, width, height, scale_factor` (píxeles físicos y escala; D-187) |

## Catálogo · (a) Comandos IPC

Columnas: **ID**; **Comando**; **Parámetros** (tipos); **Retorno**; **Errores** `code` «texto literal del backlog» (CA); **Vistas**; **HU** que lo usan. «Msg:» = mensaje de resultado que devuelve el comando.

### a.1 Cuenta y sesión (`auth_*`) — Servicio de sesión; usa Supabase Auth (D-191)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-AUTH-01 | `auth_register_start` | `alias: string, email: string, password: string, password_confirmation: string` | `{ resend_available_at: Instant, expires_at: Instant }`. Msg: «Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.» (HE-01-HU01-CA01). Valida, comprueba que el correo no esté registrado (RPC-05) y pide el código | `alias.required` → «Este campo es obligatorio.» → HE-01-HU01-CA02; `alias.too_long` → «El alias no puede superar los 30 caracteres.» → CA03; `email.required` → «Este campo es obligatorio.» → CA05; `email.invalid` → «Diligencia un correo electrónico válido.» → CA06; `email.too_long` → «El correo electrónico no puede superar los 64 caracteres.» → CA07; `email.already_registered` → «Este correo electrónico ya está registrado.» con los hipervínculos «Iniciar sesión» y «Recuperar contraseña» → CA08; `password.required` → «Este campo es obligatorio.» → HE-01-HU02-CA03; `password.invalid` → «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» → HE-01-HU02-CA04 a CA06; `password_confirmation.required` → «Este campo es obligatorio.» → HE-01-HU02-CA07; `password_confirmation.mismatch` → «Las contraseñas no coinciden.» → CA08; `auth.rate_limited` → «Demasiados intentos. Espera unos minutos e intenta de nuevo.» (RNF-24); `net.offline` → «No hay conexión a internet. Conéctate para crear tu cuenta.» → HE-01-HU01-CA12; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU01, HE-01-HU02 | Escribe: cuenta de Supabase Auth (sin verificar). Lee: RPC-05 |
| IPC-AUTH-02 | `auth_register_verify` | `code: string` | `{ alias: string }`. Msg: «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.» (HE-01-HU03-CA01). Crea la cuenta, fija la contraseña, guarda la sesión, inicia la primera descarga y abre la pantalla principal (RT-01) | `code.required` → «Este campo es obligatorio.» → HE-01-HU03-CA02; `code.incorrect` → «El código no es correcto. Revísalo e intenta de nuevo.» → CA03; `code.expired` → «El código venció. Solicita uno nuevo.» → CA04; `auth.rate_limited` → «Demasiados intentos. Espera unos minutos e intenta de nuevo.» → CA05; `net.offline` → «No hay conexión a internet. Conéctate para crear tu cuenta.» → CA09; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU03 | Escribe: auth.users, profile, user_preference, kanban_column, theme, applied_theme, widget, theme_widget (semilla de la cuenta), session.bin, sync_state |
| IPC-AUTH-03 | `auth_register_resend` | — | `{ resend_available_at: Instant }`. Msg: «Te enviamos un nuevo código.» (HE-01-HU03-CA06). Invalida el código anterior | `code.resend_too_soon` → «Puedes pedir un nuevo código en <segundos restantes> s.» → CA07, `params.seconds`; `auth.rate_limited`; `net.offline` → «No hay conexión a internet. Conéctate para crear tu cuenta.»; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU03 | Escribe: código de verificación en Supabase Auth |
| IPC-AUTH-04 | `auth_register_cancel` | — | `void`. Al «Regresar» al paso Formulario descarta el registro pendiente en el Núcleo (la vista conserva alias y correo, HE-01-HU03-ET10) | — | P | HE-01-HU03 | Memoria del Núcleo (registro pendiente) |
| IPC-AUTH-05 | `auth_sign_in` | `email: string, password: string` | `SessionInfo { user_id, alias }`; abre la pantalla principal (RT-01-CA01) | `email.required`, `password.required` → «Este campo es obligatorio.» → HE-01-HU04-CA03 a CA05; `email.invalid` → «Diligencia un correo electrónico válido.» → CA06; `email.too_long` → «El correo electrónico no puede superar los 64 caracteres.» → CA07; `auth.invalid_credentials` → «Correo electrónico o contraseña incorrectos.» → CA08, mismo texto para correo no registrado y contraseña incorrecta, ET06; `auth.rate_limited` → «Demasiados intentos. Espera unos minutos e intenta de nuevo.» → CA09; `net.offline` → «No hay conexión a internet. Conéctate para iniciar sesión.» → CA10; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU04, RT-01 | Escribe: session.bin, sync_state. Lee: auth.users |
| IPC-AUTH-06 | `auth_google_start` | — | `{ expires_at: Instant }`. Genera el verificador PKCE, abre el navegador predeterminado y espera el regreso `windgets://auth/callback`; el resultado llega por el evento `auth_google_result` (EV-02) | `net.offline` (texto no definido: Duda/propuesta «No hay conexión a internet. Conéctate para iniciar sesión.», DP-03) | P | HE-01-HU05 | Escribe: session.bin, sync_state, profile (cuenta nueva) |
| IPC-AUTH-07 | `auth_google_cancel` | — | `void`. Si el usuario cierra la espera en la aplicación; emite `auth_google_result{status:'cancelled'}` | — | P | HE-01-HU05-CA05 | Memoria del Núcleo (espera de Google) |
| IPC-AUTH-08 | `auth_recovery_request` | `email: string` | `{ resend_available_at: Instant }`. Msg: «Si el correo está registrado, te enviamos un código de verificación.» (HE-01-HU06-CA01, CA02; mismo texto exista o no la cuenta, ET09) | `email.required` → «Este campo es obligatorio.» → CA03; `email.invalid` → «Diligencia un correo electrónico válido.» → CA04; `email.too_long` → «El correo electrónico no puede superar los 64 caracteres.» → CA05; `net.offline` → «No hay conexión a internet. Conéctate para recuperar tu contraseña.» → CA06; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU06 | Escribe: código de recuperación en Supabase Auth |
| IPC-AUTH-09 | `auth_recovery_verify` | `code: string` | `void` (el Núcleo guarda la sesión de recuperación solo en memoria) | `code.required` → «Este campo es obligatorio.» → HE-01-HU07-CA02; `code.incorrect` → «El código no es correcto. Revísalo e intenta de nuevo.» → CA03; `code.expired` → «El código venció. Solicita uno nuevo.» → CA04; `auth.rate_limited` → «Demasiados intentos. Espera unos minutos e intenta de nuevo.» → CA05; `net.offline` → «No hay conexión a internet. Conéctate para recuperar tu contraseña.» → CA09; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU07 | Memoria del Núcleo (sesión de recuperación) |
| IPC-AUTH-10 | `auth_recovery_resend` | — | `{ resend_available_at: Instant }`. Msg: «Te enviamos un nuevo código.» (HE-01-HU07-CA06) | `code.resend_too_soon` → «Puedes pedir un nuevo código en <segundos restantes> s.» → CA07; `net.offline` → «No hay conexión a internet. Conéctate para recuperar tu contraseña.»; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU07 | Escribe: código de recuperación en Supabase Auth |
| IPC-AUTH-11 | `auth_recovery_set_password` | `password: string, password_confirmation: string` | `void`. Msg: «Tu contraseña fue actualizada. Ya puedes iniciar sesión.» (HE-01-HU08-CA01). Cierra la sesión de recuperación y abre Inicio de sesión | `password.required` → «Este campo es obligatorio.» → CA02; `password.invalid` → «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» → CA03; `password_confirmation.mismatch` → «Las contraseñas no coinciden.» → CA04; `net.offline` → «No hay conexión a internet. Conéctate para recuperar tu contraseña.» → CA05, CA06: no actualiza la contraseña y conserva lo diligenciado; `password.same_as_current` → «Elige una contraseña distinta de la actual.» → HE-01-HU08-CA07; `service.unavailable` → «No pudimos completar la operación. Intenta de nuevo más tarde.» → RT-04-CA13 | P | HE-01-HU08 | Escribe: contraseña en auth.users |
| IPC-AUTH-12 | `auth_get_session` | — | `{ state: 'signed_out'\|'signed_in', user_id?, alias?, token: 'valid'\|'refresh_pending' }`. Se llama al abrir la aplicación; con sesión guardada no pide credenciales (HE-01-HU04-CA02, ET08) | — | P, C | HE-01-HU04, HE-02-HU01-CA05 | Lee: session.bin, profile |
| IPC-AUTH-13 | `auth_get_sign_out_info` | — | `{ pending_count: number }` (si es mayor que 0 la vista muestra el aviso de HE-16-HU03-CA03) | — | P | HE-16-HU03 | Lee: pending_change |
| IPC-AUTH-14 | `auth_sign_out` | — | `void`. Msg: «Sesión cerrada.» (HE-16-HU03-CA01, CA04). Borra la base local de la cuenta, los archivos del usuario y el token; oculta el wallpaper y los widgets y restaura el fondo original de Windows (D-190; RNF-19) | — | P | HE-16-HU03 | Borra: base local, local_file, session.bin |

Textos de confirmación de la vista (no son errores): «Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?» (HE-16-HU03-CA03) cuando `pending_count > 0`.

### a.2 Tarjetas, agenda, calendario y planificador diario (`card_*`, `agenda_*`, `calendar_*`, `planner_*`) — Servicio del planificador

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-CARD-01 | `card_create` | `{ type?: CardType (def. 'task'), title: string, due_date: DateIso, description?: string, priority?: Priority, label_ids?: Uuid[] }` | `Card`, al final de la columna `todo`. Msg: «Tarjeta creada.» (HE-07-HU01-CA01, CA02, CA12; HE-10-HU04-CA01) | `title.required` → «Este campo es obligatorio.» → HE-07-HU01-CA04, CA05 (el título de solo espacios cuenta como vacío); `title.too_long` → «El título no puede superar los 100 caracteres.» → CA06; `due_date.required` → «Este campo es obligatorio.» → CA07; `due_date.invalid` → «Diligencia una fecha válida.» → CA08; `due_date.in_past` → «La fecha límite no puede ser anterior a hoy.» → CA09; `description.too_long` → «La descripción no puede superar los 1000 caracteres.» → CA10; `labels.too_many` → «Puedes asignar máximo 5 etiquetas por tarjeta.» → HE-07-HU02-CA02; `labels.not_found` (sin texto: la vista solo ofrece etiquetas existentes, ET03) | P | HE-07-HU01, HE-07-HU02, HE-10-HU04 | Escribe: card, card_label, pending_change. Lee: kanban_column, label |
| IPC-CARD-02 | `card_update` | `{ id: Uuid, patch: { type?, title?, due_date?, description?\|null, priority?\|null, label_ids? } }` | `Card`. Msg: «Tarjeta actualizada.» (HE-07-HU04-CA01, CA03). Si la nueva fecha límite es anterior al día del bloque horario asignado: guarda, quita el bloque y el mensaje es «Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.» (CA10). Una tarjeta vencida se guarda sin cambiar la fecha límite (ET08) | `title.required` → «Este campo es obligatorio.» → CA04; `title.too_long` → «El título no puede superar los 100 caracteres.» → CA05; `due_date.required` → «Este campo es obligatorio.» → CA06; `due_date.in_past` → «La fecha límite no puede ser anterior a hoy.» → CA07, solo si cambió; `due_date.invalid` → «Diligencia una fecha válida.»; `description.too_long` → «La descripción no puede superar los 1000 caracteres.» → CA08; `labels.too_many` → «Puedes asignar máximo 5 etiquetas por tarjeta.»; `card.not_found` → «Esta tarjeta ya no existe.» → HE-07-HU04-CA11 | P | HE-07-HU04, HE-07-HU02 | Escribe: card, card_label, pending_change |
| IPC-CARD-03 | `card_delete` | `{ id: Uuid }` | `void`. Msg: «Tarjeta eliminada.» (HE-07-HU05-CA02). Definitivo (ET03). La confirmación «¿Deseas eliminar la tarjeta “<título de la tarjeta>”? Esta acción no se puede deshacer.» la muestra la vista (CA01) | `card.not_found` → «Esta tarjeta ya no existe.» (DP-04) | P | HE-07-HU05 | Escribe: card, card_label (eliminación), pending_change |
| IPC-CARD-04 | `card_get` | `{ id: Uuid }` | `CardDetail` (HE-07-HU03-CA01) | `card.not_found` → «Esta tarjeta ya no existe.» (DP-04) | P | HE-07-HU03 | Lee: card, card_label, label, kanban_column |
| IPC-CARD-05 | `card_list_board` | `{}` | `{ columns: [ { column: Column, cards: Card[] } ] }`, columnas por `position` y tarjetas por `position`. Vacío: texto «No hay tarjetas en esta columna.» y «Tu tablero no tiene tarjetas.» los pone la vista (HE-09-HU01-CA01, CA03; HE-06-HU05-CA04) | — | P | HE-09-HU01 | Lee: kanban_column, card |
| IPC-CARD-06 | `card_move` | `{ card_id: Uuid, column_id: Uuid, placement: { kind: 'end' } \| { kind: 'before', card_id: Uuid } }` | `Card`. Una sola operación para drag-and-drop del tablero y del widget Kanban («before») y para «Mover a» («end», HE-09-HU02-ET12). Al llegar a la columna `done`: completada, `completed_on` = hoy, guarda `previous_column_id`; al salir: borra `completed_on` (HE-09-HU02-ET04 a ET07; HE-06-HU06-ET03, ET04) | `column.not_found` (sin texto); `card.not_found` → «Esta tarjeta ya no existe.» (DP-04) | P, C | HE-09-HU02, HE-06-HU04, HE-06-HU06 | Escribe: card, pending_change. Lee: kanban_column |
| IPC-CARD-07 | `card_set_completed` | `{ card_id: Uuid, completed: boolean }` | `Card`. Msg al marcar: «¡Bien hecho! Tarjeta completada.» (HE-12-HU02-CA01). Marcar mueve a `done`; desmarcar devuelve a `previous_column_id` o, si ya no existe, a `todo` (HE-12-HU02-ET02 a ET04; HE-06-HU03-ET01, ET02) | `card.not_found` → «Esta tarjeta ya no existe.» (DP-04) | P, C | HE-12-HU02, HE-06-HU03 | Escribe: card. Lee: kanban_column |
| IPC-CARD-08 | `planner_get_today` | `{}` | `{ date: DateIso, items: [ { card: Card, hour: number\|null } ], summary: { total, completed, remaining, percent: number } }`. Incluye tarjetas con fecha límite hoy y las asignadas a un bloque de hoy, sin duplicados; orden por hora y luego sin hora (HE-12-HU01-ET02, ET03; HE-12-HU03-ET02, ET03). `percent` entero redondeado. Vacío: «No tienes tarjetas para hoy.» lo pone la vista (HE-12-HU01-CA03). Con `remaining = 0` y `total > 0` la vista agrega «¡Completaste todas tus tarjetas de hoy!» (HE-12-HU03-CA04) | — | P, C | HE-12-HU01, HE-12-HU03, HE-06-HU02 | Lee: card, kanban_column |
| IPC-CARD-09 | `agenda_get_day` | `{ date: DateIso }` | `{ date, is_today, current_hour: number\|null, blocks: [ { hour, cards: Card[], is_past } ] (24), unscheduled: Card[] }`. Vacío: «No tienes tarjetas pendientes por programar.» (HE-11-HU01-CA04) | — | P | HE-11-HU01 | Lee: card |
| IPC-CARD-10 | `card_assign_time_block` | `{ card_id: Uuid, date: DateIso, hour: number }` | `Card`. Msg: «Tarjeta asignada al bloque <hora de inicio> – <hora de fin>.» (HE-11-HU02-CA01, CA03; también al cambiar de bloque, D-169) | `time_block.past` → «No puedes asignar tarjetas a un bloque horario que ya pasó.» → HE-11-HU02-CA04; `time_block.after_due_date` → «No puedes programar la tarjeta después de su fecha límite.» → CA05; `card.not_found` → «Esta tarjeta ya no existe.» (DP-04) | P | HE-11-HU02 | Escribe: card (scheduled_date, scheduled_hour) |
| IPC-CARD-11 | `card_unassign_time_block` | `{ card_id: Uuid }` | `Card`. Msg: «Tarjeta quitada del horario.» (HE-11-HU03-CA01) | `card.not_found` → «Esta tarjeta ya no existe.» (DP-04) | P | HE-11-HU03 | Escribe: card (scheduled_date, scheduled_hour) |
| IPC-CARD-12 | `calendar_get_month` | `{ year: number, month: number }` | `{ days: [ { date, preview: [ {id, title} ] (hasta 3), extra_count, overdue_count, pending_count, has_overdue, has_pending } ] }`. `extra_count` alimenta «+<cantidad restante> más» (HE-10-HU01-ET05). `overdue_count` alimenta «<cantidad> vencidas» (HE-10-HU05-ET06, ET07) y cuenta todas las vencidas del día, sin el límite de `preview`; `has_overdue = overdue_count > 0` resalta en rojo y `has_pending = pending_count > 0 and overdue_count = 0` en amarillo (HE-10-HU05). «Hoy» es la fecha del computador (zona horaria local) | — | P, C | HE-10-HU01, HE-10-HU05, HE-06-HU07 | Lee: card |
| IPC-CARD-13 | `calendar_get_week` | `{ week_start: DateIso }` (lunes) | `{ days: [ { date, cards: [ { card: Card, start_hour: number\|null } ], overdue_count, pending_count, has_overdue, has_pending } ] }` (mismas reglas de conteo que IPC-CARD-12) | — | P | HE-10-HU02 | Lee: card |
| IPC-CARD-14 | `calendar_get_day` | `{ date: DateIso }` | `{ date, cards: [ { id, type, title, priority, column_name } ], can_create: boolean }`. `can_create=false` en días anteriores a hoy («No puedes crear tarjetas en días pasados.», HE-10-HU04-CA04, texto de opción deshabilitada). Vacío: «No tienes tarjetas para este día.» (HE-10-HU03-CA03) | — | P, C | HE-10-HU03, HE-10-HU04 | Lee: card, kanban_column |
| IPC-CARD-15 | `kanban_widget_get` | `{}` | `{ columns: [ { column: Column, titles: [ {card_id, title} ] (hasta 5), extra_count } ] }`. «+N más» (HE-06-HU05-ET02) | — | C | HE-06-HU05 | Lee: kanban_column, card |

### a.3 Etiquetas (`label_*`)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-LABEL-01 | `label_list` | `{}` | `Label[]` en orden alfabético por nombre de la A a la Z (D-165). Vacío: «Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.» (HE-08-HU01-CA02) y, en el campo Etiquetas del Formulario de tarjeta, «Aún no tienes etiquetas.» (HE-07-HU02-CA03) | — | P | HE-08-HU01, HE-07-HU02, HE-13-HU05 | Lee: label, card_label |
| IPC-LABEL-02 | `label_create` | `{ name: string, color_id: string }` | `Label`. Msg: «Etiqueta creada.» (HE-08-HU02-CA01, CA08) | `name.required` → «Este campo es obligatorio.» → CA02; `name.too_long` → «El nombre de la etiqueta no puede superar los 30 caracteres.» → CA03; `name.duplicate` → «Ya existe una etiqueta con ese nombre.» → CA04; `color.required` → «Este campo es obligatorio.» → CA05; `label.limit_reached` → «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.» → CA06 (la vista deshabilita la opción) | P | HE-08-HU02 | Escribe: label |
| IPC-LABEL-03 | `label_update` | `{ id: Uuid, name: string, color_id: string }` | `Label`. Msg: «Etiqueta actualizada.» (HE-08-HU03-CA01) | `name.required` → «Este campo es obligatorio.» → CA02; `name.too_long` → «El nombre de la etiqueta no puede superar los 30 caracteres.» → CA03; `name.duplicate` → «Ya existe una etiqueta con ese nombre.» → CA04, no se cuenta la propia; `color.required` → «Este campo es obligatorio.» → CA05 | P | HE-08-HU03 | Escribe: label |
| IPC-LABEL-04 | `label_get_delete_info` | `{ id: Uuid }` | `{ name, card_count }` para elegir el texto de confirmación: «¿Deseas eliminar la etiqueta “<nombre de la etiqueta>”? Esta acción no se puede deshacer.» (0 tarjetas, CA01); «La etiqueta “<nombre de la etiqueta>” está asignada a <cantidad> tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?» (CA03); versión «La etiqueta “<nombre de la etiqueta>” está asignada a 1 tarjeta. Se quitará de ella, pero la tarjeta no se eliminará. ¿Deseas continuar?» (CA04) | — | P | HE-08-HU04 | Lee: label, card_label |
| IPC-LABEL-05 | `label_delete` | `{ id: Uuid }` | `void`. Msg: «Etiqueta eliminada.» (HE-08-HU04-CA02, CA05). Quita la etiqueta de las tarjetas y del filtro de Reportes (evento `labels_changed`) | `label.not_found` | P | HE-08-HU04, HE-13-HU05-CA06 | Escribe: label, card_label |

### a.4 Columnas del tablero (`column_*`)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-COL-01 | `column_list` | `{}` | `Column[]` por `position` | — | P, C | HE-09-HU01, HE-06-HU04-ET02 | Lee: kanban_column |
| IPC-COL-02 | `column_create` | `{ name: string, color_id?: string (def. 'gray') }` | `Column`, al final. Msg: «Columna creada.» (HE-09-HU03-CA01, CA02) | `name.required` → «Este campo es obligatorio.» → CA03; `name.too_long` → «El nombre de la columna no puede superar los 30 caracteres.» → CA04; `name.duplicate` → «Ya existe una columna con ese nombre.» → CA05; `column.limit_reached` → «Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.» → CA06 (la vista deshabilita «Nueva columna») | P | HE-09-HU03 | Escribe: kanban_column |
| IPC-COL-03 | `column_update` | `{ id: Uuid, name?: string, color_id?: string }` | `Column`. Msg: «Columna actualizada.» (HE-09-HU04-CA01, CA02). Renombrar `done` no cambia su función (CA03) | `name.required` → «Este campo es obligatorio.» → CA04; `name.too_long` → «El nombre de la columna no puede superar los 30 caracteres.» → CA05; `name.duplicate` → «Ya existe una columna con ese nombre.» → CA06 | P | HE-09-HU04 | Escribe: kanban_column |
| IPC-COL-04 | `column_reorder` | `{ column_ids: Uuid[] }` (orden completo) | `Column[]`. Sin mensaje de resultado en el backlog (DP-05) | `column.order_invalid` (sin texto) | P | HE-09-HU05 | Escribe: kanban_column (position) |
| IPC-COL-05 | `column_get_delete_info` | `{ id: Uuid }` | `{ name, card_count, destination_name }`. Textos: «¿Deseas eliminar la columna “<nombre de la columna>”? Esta acción no se puede deshacer.» (HE-09-HU06-CA01) y «La columna “<nombre de la columna>” tiene <cantidad> tarjetas. Se moverán a “<nombre de la columna destino>”. ¿Deseas continuar?» (CA03, CA07) | — | P | HE-09-HU06 | Lee: kanban_column, card |
| IPC-COL-06 | `column_delete` | `{ id: Uuid }` | `void`. Msg: «Columna eliminada.» (HE-09-HU06-CA02, CA04). Las tarjetas pasan al final de `todo` (ET05) | `column.default_not_deletable` → «Las columnas por defecto no se pueden eliminar.» → CA05 (la vista deshabilita «Eliminar») | P | HE-09-HU06 | Escribe: kanban_column, card |

### a.5 Reportes (`report_*`) — cada sección se pide por separado para mostrarse apenas termina (HE-13-HU02-ET16)

Estructura del filtro `ReportFilter = { range: RangeInput, label_ids: Uuid[] }` (vacío = «Todas las etiquetas», ET05 de HE-13-HU05). `RangeInput = { kind: 'last_7'|'last_30'|'last_12_months' } | { kind: 'custom', start: string, end: string }` (fechas ya convertidas a `DateIso` por la vista).

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-REP-01 | `report_resolve_range` | `{ range: RangeInput }` | `{ start: DateIso, end: DateIso, days: number, grouping: 'day'\|'week'\|'month', clipped_start: DateIso\|null }`. Agrupa por día hasta 31 días, por semana de 32 a 183 y por mes de 184 a 366 (HE-13-HU02-ET06 a ET08). `clipped_start` es la fecha de la primera tarjeta cuando el rango empieza antes (HE-13-HU02-ET13) | `range.start_required` → «Este campo es obligatorio.» → HE-13-HU01-CA04; `range.end_required` → «Este campo es obligatorio.» → CA05; `range.invalid_date` → «Diligencia una fecha válida.» → CA07, CA08; `range.start_after_end` → «La fecha de inicio no puede ser posterior a la fecha de fin.» → CA03; `range.too_long` → «El rango máximo es de un año.» → CA06, más de 366 días contados ambos extremos | P | HE-13-HU01 | Sin entidad (calcula el rango) |
| IPC-REP-02 | `report_get_meta` | `{}` | `{ has_cards: boolean, first_card_date: DateIso\|null, has_labels: boolean }`. Textos de la vista: «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.» (HE-13-HU02-CA05); «Mostrando datos desde el <fecha de la primera tarjeta>, cuando creaste tu primera tarjeta.» (CA06); «Aún no tienes etiquetas.» (HE-13-HU05-CA05) | — | P | HE-13-HU02, HE-13-HU05 | Lee: card, label |
| IPC-REP-03 | `report_get_completed` | `{ filter: ReportFilter }` | `{ grouping, points: [ { period_start: DateIso, period_end: DateIso, count: number } ], is_empty: boolean }`. Cuenta por `completed_on`; incluye Tarea, Recordatorio y Evento (HE-13-HU02-ET04, ET05). Regla de 0 y de vacío (ET09, ET10): `is_empty=true` si no hay tarjetas que evaluar; el texto «No hay datos para este rango de fechas y estos filtros.» lo pone la vista | los de `report_resolve_range` | P | HE-13-HU02 | Lee: card, card_label |
| IPC-REP-04 | `report_get_compliance` | `{ filter: ReportFilter }` | `{ percent: number\|null, on_time: number, total: number, is_empty }`. Fórmula de HE-13-HU03-ET03 (por fecha límite, solo completadas o vencidas). Textos de la vista: «<cantidad a tiempo> de <cantidad total> tarjetas completadas a tiempo» y «1 de 1 tarjeta completada a tiempo» (D-163) | idem | P | HE-13-HU03 | Lee: card, card_label |
| IPC-REP-05 | `report_get_status_breakdown` | `{ filter: ReportFilter }` | `{ overdue, pending, completed, total, percent_overdue, percent_pending, percent_completed (1 decimal), is_empty }` (HE-13-HU04-ET04, ET05) | idem | P | HE-13-HU04 | Lee: card, card_label |

### a.6 Personalización y temas (`theme_*`)

El tema en edición vive en un borrador en el Núcleo (`ThemeDraft`; no se guarda en la base local, DP-16), porque «Salir» del área de notificación y el menú principal necesitan saber si hay cambios sin guardar (HE-17-HU03-ET07; RT-01-ET05).

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-THEME-01 | `theme_list` | `{}` | `ThemeSummary[]`, del más reciente al más antiguo por `last_modified_at` (HE-03-HU01-ET02). Con un solo tema la vista muestra «Guarda otra personalización con “Guardar como tema” para tener más temas.» (CA02) | — | P | HE-03-HU01 | Lee: theme, applied_theme |
| IPC-THEME-02 | `theme_get_applied` | `{}` | `{ theme_id, name, content: ThemeContent (copia aplicada), has_unapplied_changes, has_unsaved_changes }`. Colores y tipografía de toda la aplicación salen de aquí (HE-03-HU06-ET01) | — | P, C, E | HE-03-HU06, HE-02-HU01 | Lee: applied_theme |
| IPC-THEME-03 | `theme_draft_open` | `{ theme_id?: Uuid }` (omitido = tema aplicado) | `ThemeDraftView` | — | P | HE-02-HU10 | Lee: theme, applied_theme, catalog_*. Memoria: borrador |
| IPC-THEME-04 | `theme_draft_select` | `{ theme_id: Uuid, discard_changes?: boolean }` | `ThemeDraftView` (no cambia el escritorio) | `draft.unsaved_changes` → «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?» con las opciones «Cambiar sin guardar» y «Seguir editando» → HE-02-HU10-CA03, CA04, CA06: la vista repite con `discard_changes=true` | P | HE-02-HU10 | Lee: theme. Memoria: borrador |
| IPC-THEME-05 | `theme_draft_update` | `{ patch: { template_id?, background?: { source, catalog_image_id?, uploaded_image_id? }, colors?: { primary?, secondary?, text? }, palette_id?: string\|null, font_id?, font_size? } }` | `ThemeDraftView` con `legibility`. Actualiza la vista previa en ≤ 1 s (RNF-02). La paleta pone los tres colores y `palette_id`; un color cambiado después deja `palette_id = null` («Personalizada») (HE-02-HU07). Un color vacío llega como cadena vacía (`''`). Pares, mínimos y color sugerido: `interfaz.md`, «Tema a tokens». Aviso de legibilidad, no error: «El contraste de estos colores es bajo (<contraste>:1). Prueba con <color sugerido>.» (HE-02-HU05-CA05) | `color.invalid` → «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).» → HE-02-HU05-CA03 (no actualiza la vista previa); `color.required` → «Este campo es obligatorio.» → CA04 (deshabilita Guardar, Guardar como tema y Aplicar); `template.not_found`, `font.not_found`, `image.not_found` (sin texto); `background.already_default` → «Esta plantilla ya muestra su imagen de fondo por defecto.» → HE-02-HU04-CA02 (texto de la opción «Quitar imagen» deshabilitada) | P | HE-02-HU02 a HE-02-HU07, HE-02-HU09 | Lee: catalog_*, uploaded_image. Memoria: borrador |
| IPC-THEME-06 | `theme_draft_reset` | `{ part: 'colors'\|'typography' }` | `ThemeDraftView` con los valores por defecto de la plantilla; la tipografía vuelve a tamaño mediano (HE-02-HU08-ET01, ET02) | — | P | HE-02-HU08 | Lee: catalog_template. Memoria: borrador |
| IPC-THEME-07 | `theme_draft_save` | `{}` | `{ theme_id, is_applied }`. Msg: «Cambios guardados en el tema “<nombre del tema>”.» (tema no aplicado, HE-02-HU11-CA01) o «Cambios guardados. Selecciona Aplicar para verlos en tu escritorio.» (tema aplicado, CA02; marca «Cambios sin aplicar»). No cambia el escritorio | `draft.no_changes` → «No hay cambios para guardar.» → CA03 (texto de la opción «Guardar» deshabilitada); `color.required` | P | HE-02-HU11 | Escribe: theme, pending_change |
| IPC-THEME-08 | `theme_draft_save_as` | `{ name: string }` | `{ theme_id }`. Crea un tema nuevo con la vista previa y lo deja en edición sin cambiar el escritorio. Msg: «Tema “<nombre del tema>” guardado.» (HE-03-HU02-CA01) | `name.required` → «Este campo es obligatorio.» → HE-03-HU02-ET02; `name.too_long` → «El nombre no puede superar los 40 caracteres.» → CA03; `name.duplicate` → «Ya existe un tema con ese nombre. Elige otro.» → CA04; `theme.limit_reached` → «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.» → CA05 | P | HE-03-HU02 | Escribe: theme, pending_change |
| IPC-THEME-09 | `theme_draft_apply` | `{ mode: 'apply'\|'save_and_apply'\|'apply_without_saving' }` | `{ theme_id }`. Escribe `applied_theme` y avisa a escritorio y aplicación en ≤ 5 s (RNF-01). Msg por modo: «Tema “<nombre del tema>” aplicado.» (`apply`, sin cambios sin guardar, HE-02-HU12-CA01); «Tema “<nombre del tema>” guardado y aplicado.» (`save_and_apply`, CA03); «Cambios aplicados. Recuerda guardarlos para no perderlos.» (`apply_without_saving`, CA04; marca «Cambios sin guardar») | `draft.unsaved_changes_on_apply` con `mode='apply'` y cambios sin guardar: «Tienes cambios sin guardar en el tema “<nombre del tema>”. ¿Qué deseas hacer?» con «Guardar y aplicar», «Aplicar sin guardar» y «Cancelar» → CA02 (D-155); `theme.already_applied` → «Este tema ya está aplicado.» → CA06 (texto de «Aplicar» deshabilitado); `color.required` | P | HE-02-HU12 | Escribe: applied_theme, theme |
| IPC-THEME-10 | `theme_draft_get_status` | `{}` | `{ dirty: boolean, applied_unsaved: boolean, theme_name: string }`. La vista (y el menú del área de notificación) decide si muestra «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» (HE-02-HU13-CA02; HE-17-HU03-CA02) o «Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?» (HE-02-HU13-CA05) | — | P | HE-02-HU13, RT-01-ET05, HE-17-HU03 | Memoria: borrador |
| IPC-THEME-11 | `theme_draft_discard` | `{}` | `ThemeDraftView` con lo último guardado (Cancelar, HE-02-HU13-ET02). Msg: «No se guardaron cambios.» (HE-02-HU13-CA01) | — | P | HE-02-HU13 | Memoria: borrador. Lee: theme |
| IPC-THEME-12 | `theme_apply` | `{ theme_id: Uuid, discard_draft?: boolean }` | `{ theme_id }`. Aplica un tema guardado (copia su contenido a `applied_theme`). Msg: «Tema “<nombre del tema>” aplicado.» (HE-03-HU03-CA01, CA04). La confirmación de aplicar la muestra la vista (RT-04-ET18) | `theme.already_applied` → «Este tema ya está aplicado.» → HE-03-HU03-CA03; `draft.unsaved_changes` → «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Qué deseas hacer?» → HE-03-HU03-CA05 | P | HE-03-HU03 | Escribe: applied_theme. Lee: theme |
| IPC-THEME-13 | `theme_rename` | `{ theme_id: Uuid, name: string }` | `ThemeSummary`. Msg: «Tema renombrado.» (HE-03-HU04-CA01; también cuando solo cambian mayúsculas o minúsculas, CA06) | `name.required` → «Este campo es obligatorio.»; `name.too_long` → «El nombre no puede superar los 40 caracteres.» → CA03; `name.duplicate` → «Ya existe un tema con ese nombre. Elige otro.» → CA04 (no se cuenta el propio) | P | HE-03-HU04 | Escribe: theme |
| IPC-THEME-14 | `theme_delete` | `{ theme_id: Uuid }` | `void`. Msg: «Tema eliminado.» (HE-03-HU05-CA01). No cambia el escritorio | `theme.applied_not_deletable` → «No puedes eliminar el tema aplicado. Aplica otro tema primero.» → CA02 | P | HE-03-HU05 | Escribe: theme (eliminación), theme_widget |

### a.7 Catálogos e imágenes propias (`catalog_*`, `image_*`)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-CAT-01 | `catalog_list` | `{ kind: 'template'\|'image'\|'font'\|'palette'\|'animation'\|'color' }` | `CatalogItem[]` con `{ id, name, thumbnail_url, is_cached, ...campos propios (hex, colores de la paleta) }`. `thumbnail_url` es una URL local del protocolo de assets de Tauri; si falta el archivo, el Núcleo lo pide a Storage | — | P | HE-02-HU02, HE-02-HU03, HE-02-HU06, HE-02-HU07, HE-04-HU09, HE-08-HU02, HE-09-HU03 | Lee: catalog_template, catalog_font, catalog_palette, catalog_image, catalog_animation, catalog_color |
| IPC-CAT-02 | `catalog_refresh` | `{}` | `{ changed: boolean }` (compara `catalog_meta.version`) | `net.offline` (sin texto; se usa la caché, DP-06) | P | HE-02-HU02 | Escribe: catálogos locales, sync_state.catalog_version, local_file |
| IPC-CAT-03 | `image_import` | `{ path: string, purpose: 'background'\|'static_image'\|'carousel_item' }` | `{ uploaded_image_id: Uuid, preview_url: string }`. Valida extensión, firma, 20 MB y legibilidad; copia a `%APPDATA%\Windgets\files`; crea `uploaded_image` y la entrada de `file_upload_queue` (sube al haber conexión). Nada se sube ni cambia si falla (HE-02-HU03-ET10) | `image.format_not_allowed` → «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» → HE-02-HU03-CA05 (HE-04-HU07-CA03; HE-04-HU08-CA05); `image.too_large` → «La imagen supera el tamaño máximo de 20 MB.» → CA06; `image.unreadable` → «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» → CA07 | P | HE-02-HU03, HE-04-HU07, HE-04-HU08 | Escribe: uploaded_image, local_file, file_upload_queue |
| IPC-CAT-04 | `asset_resolve` | `{ kind: 'catalog_image'\|'catalog_template'\|'catalog_font'\|'catalog_animation'\|'uploaded_image', id: string }` | `{ url: string, state: 'ready'\|'downloading'\|'unavailable' }` | `asset.unavailable` (sin texto) | P, C, E | HE-02-HU01, HE-04-HU07 | Lee: local_file, catalog_*, uploaded_image |

### a.8 Widgets (`widget_*`)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-WID-01 | `widget_list` | `{}` | `WidgetItem[]` del tema aplicado: primero los widgets por defecto y luego los agregados (HE-04-HU01-CA02) | — | P | HE-04-HU01 | Lee: widget, theme_widget |
| IPC-WID-02 | `widget_catalog_get` | `{}` | `{ external: [ {type, name, description, enabled, disabled_reason} ], local: [...] }` con Clima y Noticias en «Widgets externos», y Animación, Carrusel de imágenes, Imagen estática, Reproductor de música y Texto en «Widgets locales». `disabled_reason = «Ya agregaste este widget.»` para Noticias y Reproductor de música ya agregados (HE-04-HU04-CA01, CA02; D-038) | — | P | HE-04-HU04 | Lee: widget |
| IPC-WID-03 | `widget_set_active` | `{ widget_id: Uuid, active: boolean }` | `WidgetItem`. Refleja en el escritorio en ≤ 5 s (RNF-01). Al activar vuelve a su última posición y tamaño (HE-04-HU02-ET03) | `widget.not_found` | P | HE-04-HU02 | Escribe: theme_widget (is_active) |
| IPC-WID-04 | `widget_add` | `{ type: 'weather'\|'news'\|'music_player'\|'animation'\|'image_carousel'\|'static_image'\|'text', config: WidgetConfig }` donde `WidgetConfig` es: Clima `{ city }`; Noticias y Reproductor de música `{}`; Animación `{ animation_id }`; Imagen estática `{ source: 'catalog'\|'own', catalog_image_id?\|uploaded_image_id? }`; Carrusel `{ items: [{source, catalog_image_id?\|uploaded_image_id?}], interval_seconds?: number (def. 5) }`; Texto `{ text }` | `WidgetItem`; lo deja activo, con el tamaño inicial de su tipo en una posición libre (tabla siguiente) y regresa a la pantalla Widgets (RT-03-CA05) | Clima: `city.not_found` → «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» → HE-04-HU05-CA04; `city.duplicate` → «Ya tienes un widget Clima para esa ciudad.» → CA05; `net.offline` (para validar la ciudad; texto no definido, DP-07). Todos: `widget.already_added` → «Ya agregaste este widget.» → HE-04-HU04-CA02: Noticias, Reproductor de música. Texto: `text.too_long` → «El texto no puede superar los 200 caracteres.» → HE-04-HU10-CA03. Carrusel: `carousel.too_few` → «Selecciona al menos 2 imágenes para el carrusel.» → HE-04-HU08-CA03; `carousel.too_many` → «Puedes agregar máximo 10 imágenes al carrusel.» → CA04; `interval.out_of_range` → «El intervalo debe estar entre 3 y 60 segundos.» → CA07; `interval.required` → «Este campo es obligatorio.» → CA08. Las opciones «Agregar» deshabilitadas sin ciudad, sin texto, sin imagen o con menos de 2 imágenes (RT-04) no llaman al comando. Imágenes: errores de `image_import`; `city.too_long` → «La ciudad no puede superar los 100 caracteres.» → HE-04-HU05-CA09 | P | HE-04-HU05 a HE-04-HU11 | Escribe: widget, theme_widget, widget_carousel_item. Lee: uploaded_image |
| IPC-WID-05 | `widget_configure` | `{ widget_id: Uuid, config: WeatherConfig \| TextConfig }` | `WidgetItem`. La opción «Configurar» de la lista abre la ventana emergente Formulario de widget con los mismos campos que la subpantalla de agregar y precargada con `WidgetItem.config` (D-202). Solo Clima (ciudad) y Texto (texto) tienen «Configurar» (`can_configure`, HE-04-HU12). Texto en el escritorio en ≤ 5 s (HE-04-HU12-ET03) | Clima: `city.not_found` → «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» → HE-04-HU12-CA04; `city.duplicate` → «Ya tienes un widget Clima para esa ciudad.» → HE-04-HU12-CA05; `text.too_long` → «El texto no puede superar los 200 caracteres.» → HE-04-HU10-CA03 (mismo campo); `net.offline` → «No hay conexión a internet. Conéctate para validar la ciudad.» (DP-07); `city.too_long` → «La ciudad no puede superar los 100 caracteres.» (mismo campo que HE-04-HU05-CA09) | P | HE-04-HU12 | Escribe: widget, widget_carousel_item |
| IPC-WID-06 | `widget_delete` | `{ widget_id: Uuid }` | `void`. Msg: «Widget eliminado.» (HE-04-HU13-CA01, CA04, CA05). Lo quita de todos los temas y deja de consultar su servicio. Confirmación de la vista: «¿Deseas eliminar el widget “<nombre del widget>”? Se quitará de todos tus temas.» (CA06) | `widget.default_not_deletable` → «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» → CA02 (la vista deshabilita «Eliminar» con ese texto, ET04) | P | HE-04-HU13 | Escribe: widget, theme_widget, widget_carousel_item (eliminación) |
| IPC-WID-07 | `widget_get_data` | `{ widget_id: Uuid }` | `{ status: 'ok'\|'error'\|'offline', payload: WeatherData\|NewsData\|null, fetched_at\|null }` desde la caché local; avisos de la vista: «No pudimos cargar el clima. Intenta de nuevo más tarde.» (HE-04-HU05-CA07), «No pudimos cargar las noticias. Intenta de nuevo más tarde.» (HE-04-HU06-CA03), «Sin conexión. El widget se actualizará al reconectarte.» (HE-04-HU05-CA08; HE-04-HU06-CA04; HE-15-HU02-CA06) | — | P, C | HE-04-HU05, HE-04-HU06 | Lee: external_widget_cache |

**Tamaño inicial y posición libre de un widget nuevo** (IPC-WID-04; píxeles lógicos sobre 1920 × 1080, como la semilla; se escalan con `ref_width` y `ref_height`): Clima 320 × 160; Noticias 480 × 360; Imagen estática 320 × 180; Carrusel de imágenes 480 × 270; Animación 320 × 180; Texto 320 × 160; Reproductor de música 320 × 160. Posición: se recorre el escritorio en pasos de 20 px, por filas de arriba abajo y de izquierda a derecha, y se toma la primera posición donde el rectángulo cabe entero en el área visible y no se superpone a ningún widget activo del tema (D-042). Si no hay ninguna, el widget se agrega en (0, 0) y la superposición se corrige en «Editar escritorio» (Duda/propuesta DP-20).

`WeatherData = { city, temperature_c: number, condition_code: string, condition_text: string }`; `NewsData = { headlines: [ { title, source, url, published_at } ] (5) }`.

### a.9 Edición de la distribución (`layout_edit_*`) — vista E (D-185)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-LAY-01 | `layout_edit_open` | `{}` | `{ monitor: Monitor, widgets: WidgetRect[] }`. Oculta la ventana principal, crea la vista E a pantalla completa por encima del escritorio sin menú principal; sin widgets activos solo muestra el wallpaper y la barra «Guardar»/«Cancelar» (HE-05-HU01-ET06; D-159) | — | P | HE-05-HU01 | Lee: theme_widget |
| IPC-LAY-02 | `layout_edit_move` | `{ widget_id: Uuid, x: number, y: number }` | `{ rect: WidgetRect, collided: boolean }`. Mantiene el widget dentro del área visible y, si se suelta sobre otro, lo devuelve a su última posición libre; `collided` enciende el indicador de colisión (HE-05-HU02-ET02, ET03; D-042) | — | E | HE-05-HU02 | Memoria: distribución en edición |
| IPC-LAY-03 | `layout_edit_resize` | `{ widget_id: Uuid, x: number, y: number, width: number, height: number }` | `{ rect: WidgetRect, collided: boolean }`. Mínimo 100 × 100 px, máximo el área visible; se detiene en el borde de otro widget (HE-05-HU03-ET02 a ET04) | — | E | HE-05-HU03 | Memoria: distribución en edición |
| IPC-LAY-04 | `layout_edit_get_status` | `{}` | `{ dirty: boolean }` (decide el mensaje «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» con la tecla Esc, HE-05-HU05-CA02, y con «Cancelar», D-204) | — | E | HE-05-HU05 | Memoria: distribución en edición |
| IPC-LAY-05 | `layout_edit_save` | `{}` | `void`. Msg: «Cambios guardados.» (HE-05-HU04-CA01, CA02, CA04). Guarda la distribución en el tema aplicado y encola el cambio una sola vez; sin cambios cierra sin mensaje (HE-05-HU04-CA03). Cierra la vista E y restaura la ventana principal | — | E | HE-05-HU04 | Escribe: theme_widget, pending_change |
| IPC-LAY-06 | `layout_edit_cancel` | `{}` | `void`. Msg: «No se guardaron cambios.» (HE-05-HU05-CA01, CA03). Cada widget vuelve a su posición y tamaño anteriores; sin cambios cierra sin mensaje (CA05) | — | E | HE-05-HU05 | Memoria: distribución en edición |

### a.10 Escritorio, wallpaper y sistema (`wallpaper_*`, `desktop_*`, `app_*`, `system_*`)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-DESK-01 | `layer_get_initial_state` | `{}` | `{ applied: ThemeContent, widgets: WidgetRect[], monitors: Monitor[], wallpaper_state }`. Primer pintado de la capa a partir de lo guardado, sin red (RNF-08; D-049) | — | C | HE-02-HU01, HE-15-HU04-CA03 | Lee: applied_theme, theme_widget |
| IPC-DESK-02 | `wallpaper_get_status` | `{}` | `{ state: 'ok'\|'fallback_default'\|'hidden' }`. Con `fallback_default` la ventana principal muestra el aviso «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.» (HE-02-HU01-CA04) | — | P, C | HE-02-HU01 | Estado del Host del wallpaper |
| IPC-DESK-03 | `app_open_screen` | `{ screen: ScreenId, params?: { card_id?: Uuid, date?: DateIso, calendar_view?: 'month' } }` donde `ScreenId ∈ {'planner_daily','kanban','calendar','agenda','reports','windi','labels','widgets','personalization','themes','settings'}` | `void`. Muestra la ventana principal al frente aunque esté minimizada o solo en el área de notificación (HE-06-HU08-CA07, ET06); emite `navigate_requested` (EV-23) | — | C, E | HE-06-HU08 | Sin entidad (navegación) |
| IPC-DESK-04 | `app_get_last_screen` | `{}` | `{ screen: ScreenId\|null }` (D-156) | — | P | HE-17-HU02 | Lee: device_setting |
| IPC-DESK-05 | `app_set_last_screen` | `{ screen: ScreenId }` | `void` | — | P | HE-17-HU02-ET05 | Escribe: device_setting |
| IPC-DESK-06 | `app_hide_main_window` | `{}` | `void`. Botón «×»: cierra la ventana, mantiene la sesión y la aplicación en segundo plano con su ícono (HE-17-HU01-CA01) | — | P | HE-17-HU01 | Sin entidad |
| IPC-DESK-07 | `app_request_exit` | `{}` | `{ requires_confirmation: boolean }`. Opción «Salir» del ícono del área de notificación (llega como el evento `exit_requested`, EV-24). Con cambios sin guardar o sin aplicar de la vista previa: la vista muestra «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» con «Salir sin guardar» y «Seguir editando» (HE-17-HU03-CA02, CA04) | — | P | HE-17-HU03 | Lee: borrador del tema y de la distribución (memoria) |
| IPC-DESK-08 | `app_exit` | `{ discard_changes: boolean }` | `void`. Cierra el programa sin cerrar la sesión y restaura el fondo original de Windows (HE-17-HU03-CA01, CA03) | — | P | HE-17-HU03 | Sin entidad (cierra el proceso) |
| IPC-DESK-09 | `system_open_url` | `{ url: string }` | `void`. Abre en el navegador predeterminado; solo `https://` y `http://` (HE-06-HU10-CA01; ET01) | `url.not_allowed` (sin texto) | C | HE-06-HU10 | Sin entidad |
| IPC-DESK-10 | `autostart_get` | `{}` | `{ enabled: boolean }`. Lee el estado real de Windows (HE-16-HU02-ET06, CA03) | — | P | HE-16-HU02 | Lee: registro de Windows (Run, StartupApproved) |
| IPC-DESK-11 | `autostart_set` | `{ enabled: boolean }` | `{ enabled: boolean }`. Msg: «Inicio automático activado.» / «Inicio automático desactivado.» (HE-16-HU02-CA01, CA02). No se sincroniza (CA04) | `autostart.failed` → «No pudimos cambiar el inicio automático. Intenta de nuevo.» → HE-16-HU02-CA05 | P | HE-16-HU02 | Escribe: registro de Windows (Run) |
| IPC-DESK-12 | `preference_get` | `{}` | `{ board_card_view: 'compact'\|'expanded' }` | — | P | HE-09-HU07 | Lee: user_preference |
| IPC-DESK-13 | `preference_set` | `{ board_card_view: 'compact'\|'expanded' }` | `void` (HE-09-HU07-CA03) | — | P | HE-09-HU07 | Escribe: user_preference |
| IPC-DESK-14 | `connectivity_get` | `{}` | `{ online: boolean }` (para deshabilitar el agente de IA y los widgets externos sin conexión, RT-01-ET07) | — | P, C | HE-15-HU02 | Lee: estado de red (memoria) |

### a.11 Música (`media_*`) — Controlador multimedia (SMTC)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-MED-01 | `media_get_session` | `{}` | `{ has_session: boolean, title\|null, artist\|null, thumbnail_url\|null, status: 'playing'\|'paused'\|'stopped', can_previous: boolean, can_next: boolean, can_play_pause: boolean }`. Sin sesión la vista muestra «No hay música en reproducción.» y deshabilita los controles (HE-04-HU11-CA03, ET07) | — | P, C | HE-04-HU11 | Sin entidad (sesión de Windows) |
| IPC-MED-02 | `media_toggle_play_pause` | `{}` | `void` | `media.no_session` → «No hay música en reproducción.» (estado vacío) | C | HE-06-HU09 | Sin entidad (sesión de Windows) |
| IPC-MED-03 | `media_skip_next` | `{}` | `void` | `media.no_session`; `media.action_unsupported` (sin texto: el control aparece deshabilitado, HE-06-HU09-ET04) | C | HE-06-HU09 | Sin entidad (sesión de Windows) |
| IPC-MED-04 | `media_skip_previous` | `{}` | `void` | `media.no_session`; `media.action_unsupported` | C | HE-06-HU09 | Sin entidad (sesión de Windows) |

### a.12 Agente de IA Windi (`windi_*`) — Servicio de Windi

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-WIN-01 | `windi_get_conversation` | `{}` | `{ messages: WindiMessage[], proposal: WindiProposal\|null, online: boolean }`. La primera vez desde que se abrió la aplicación agrega el saludo, que incluye el alias, el nombre «Windi» y una oferta de ayuda (HE-14-HU01-ET07, ET08). Sin conexión muestra el historial y la vista pone el aviso «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» (HE-14-HU01-CA07) | — | P | HE-14-HU01 | Memoria: historial de la sesión |
| IPC-WIN-02 | `windi_send_message` | `{ message: string }` | `{ reply: WindiMessage, proposal: WindiProposal\|null }`. Elige las tarjetas necesarias, llama a `windi-chat` (EF-01) con un tiempo máximo de 15 s (RNF-11; D-172) y valida la respuesta (HE-14-HU04 a HE-14-HU09). Un mensaje nuevo con propuesta deja la anterior como «Descartada» (HE-14-HU03-ET04). Reintentar repite el mismo mensaje | `message.too_long` → «Tu mensaje no puede superar los 2000 caracteres.» → HE-14-HU01-CA05 (la vista deshabilita «Enviar»); `net.offline` → «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» → CA07; `windi.unavailable` → «No pude responder en este momento. Intenta de nuevo.» → CA08, tiempo agotado, cuota o error del servicio (la vista agrega «Reintentar» y conserva el mensaje) | P | HE-14-HU01 a HE-14-HU09 | Lee: card, label, kanban_column. Memoria: historial y propuesta |
| IPC-WIN-03 | `windi_confirm_proposal` | `{ proposal_id: Uuid }` | `{ outcome: 'applied'\|'stale', reply: WindiMessage, new_proposal: WindiProposal\|null }`. Antes de aplicar hace una consulta inmediata a la nube y compara el estado actual de las tarjetas con el de la propuesta (D-047; HE-14-HU03-ET05). `applied`: ejecuta las operaciones con las mismas reglas de `card_*` y el agente confirma el cambio (CA01). `stale`: no aplica, explica qué cambió y propone de nuevo si aún es posible (CA03) | `net.offline` → «Se perdió la conexión. No se hizo ningún cambio.» → HE-14-HU03-CA02 (HE-14-HU04-CA07; la vista deshabilita «Confirmar» y «Rechazar»); `proposal.discarded` (la propuesta es «Descartada», sin texto) | P | HE-14-HU03 a HE-14-HU07 | Escribe: card, card_label. Lee: kanban_column |
| IPC-WIN-04 | `windi_reject_proposal` | `{ proposal_id: Uuid }` | `{ reply: WindiMessage }` (no aplica cambios) | — | P | HE-14-HU03 | Memoria: propuesta |

`WindiProposal = { id, action: 'create'|'edit'|'move'|'delete', items: [ { card_id|null, current: Partial<Card>|null, changes: Partial<Card>|null, title } ], warnings: string[], state: 'active'|'confirmed'|'rejected'|'discarded' }`. Los avisos literales los agrega el Núcleo por regla (no el modelo): «Esta tarjeta está completada. Editarla no cambia su columna.» (HE-14-HU05-CA06); «Esta tarjeta está completada. Si la mueves, dejará de estar completada y se borrará su fecha de completado.» (HE-14-HU06-CA06); «Esta acción no se puede deshacer.» y, si hay completadas, «Esta tarjeta está completada. Si la eliminas, dejará de contar en tus reportes.» (HE-14-HU07-CA01, CA02, CA06).

### a.13 Sincronización (`sync_*`)

| ID | Comando | Parámetros | Retorno | Errores | Vistas | HU | Entidad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPC-SYNC-01 | `sync_get_status` | `{}` | `SyncStatus`. Textos de la vista: «Sincronizado», «Sincronizando…», «Sin conexión» con «<cantidad> cambios pendientes de sincronizar» / «1 cambio pendiente de sincronizar» (0 no muestra cantidad), «Error de sincronización. Reintentaremos automáticamente.» (HE-16-HU01-CA01 a CA05; D-160) | — | P | HE-16-HU01 | Lee: sync_state, pending_change |

## Catálogo · (b) Eventos que el Núcleo emite a las vistas

Los eventos se emiten con `emit` de Tauri a las vistas que los escuchan. Las vistas no consultan por intervalos: reaccionan a estos eventos y, al abrirse, leen el estado con los comandos de (a). Todos los eventos de datos llevan `origin: 'local'|'remote'` (un cambio descargado por `sync_pull` es `remote`) y se emiten en ≤ 5 s desde el cambio (RNF-01).

| ID | Evento | Carga | Cuándo se emite | Escuchan | HU |
| --- | --- | --- | --- | --- | --- |
| EV-01 | `session_changed` | `{ state: 'signed_out'\|'signed_in', alias?: string, reason: 'sign_in'\|'sign_out'\|'token_expired'\|'registered' }` | Al iniciar o cerrar sesión, al crear la cuenta o cuando el token no se puede renovar con conexión | P, C | HE-01-HU04, HE-16-HU03, HE-02-HU01-CA05 |
| EV-02 | `auth_google_result` | `{ status: 'success'\|'cancelled'\|'error'\|'email_too_long', is_new_account?: boolean, alias?: string, message: string }`. Textos: éxito de cuenta nueva «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.» (HE-01-HU05-CA01, CA03, CA04); `cancelled` «Se canceló el inicio de sesión con Google.» (CA05); `error` «No fue posible iniciar sesión con Google. Intenta de nuevo.» (CA06); `email_too_long` «No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.» (CA08) | Al llegar `windgets://auth/callback` (o al vencer la espera, o con `auth_google_cancel`) | P | HE-01-HU05 |
| EV-03 | `connectivity_changed` | `{ online: boolean }` | Al perder o recuperar la conexión (la sesión de red se comprueba con la última llamada a la nube y con el estado de red de Windows). Al perder la conexión la vista muestra el aviso «Estás sin conexión. Tus cambios se guardarán y se sincronizarán al reconectarte.» (HE-15-HU02-CA01) | P, C | HE-15-HU02, RT-01-ET07 |
| EV-04 | `sync_status_changed` | `SyncStatus` | En cada cambio de estado del indicador o de la cantidad de cambios pendientes. El indicador está siempre visible en la ventana principal, junto al menú principal (D-203) | P | HE-16-HU01, HE-15-HU02-CA02, HE-15-HU02-CA03 |
| EV-05 | `sync_completed` | `{ pushed: number, pulled: number, after_reconnect: boolean }`. Mensaje «Tus cambios se sincronizaron.» solo si `after_reconnect` (HE-15-HU03-CA01) | Al terminar un ciclo | P | HE-15-HU03 |
| EV-06 | `sync_conflicts_resolved` | `{ count: number }`. Mensaje «Algunas tarjetas se actualizaron con cambios más recientes de otro computador.» (HE-15-HU03-CA02, CA05, CA06) | Cuando una respuesta de `sync_push` marca `conflict` en una tarjeta propia | P | HE-15-HU03 |
| EV-07 | `cards_changed` | `{ ids: Uuid[], op: 'upsert'\|'delete', origin }` | Tras crear, editar, mover, completar, asignar bloque, eliminar o descargar tarjetas, y tras eliminar una etiqueta o columna que las toca | P, C | HE-07-HU01, HE-07-HU04, HE-07-HU05, HE-08-HU04, HE-09-HU02, HE-09-HU06, HE-11-HU02, HE-11-HU03, HE-12-HU02, HE-06-HU02, HE-15-HU03 |
| EV-08 | `labels_changed` | `{ ids: Uuid[], op, origin }`. Al eliminar una etiqueta, la vista de Reportes la quita del filtro (HE-13-HU05-ET07, ET08) | Cambios de etiquetas | P | HE-08-HU02 a HE-08-HU04, HE-13-HU05 |
| EV-09 | `columns_changed` | `{ ids: Uuid[], op, origin }` | Cambios de columnas (nombre, color, orden, alta, baja) | P, C | HE-09-HU03 a HE-09-HU06, HE-06-HU05 |
| EV-10 | `themes_changed` | `{ ids: Uuid[], op, origin }` | Guardar, guardar como tema, renombrar, eliminar, descarga | P | HE-03-HU02 a HE-03-HU05, HE-15-HU04 |
| EV-11 | `applied_theme_changed` | `{ theme_id, origin, has_unsaved_draft: boolean }`. Si `origin='remote'` y `has_unsaved_draft`, la vista muestra el aviso «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.» (HE-15-HU04-CA08) | Al aplicar un tema o recibir uno más reciente | P, C, E | HE-02-HU12, HE-03-HU06, HE-15-HU04 |
| EV-12 | `widgets_changed` | `{ widget_ids: Uuid[], op, origin }` | Activar, desactivar, agregar, configurar, eliminar, descargar | P, C | HE-04-HU02, HE-04-HU05 a HE-04-HU13 |
| EV-13 | `layout_changed` | `{ theme_id, origin }` | Al guardar la distribución o recibirla de otro computador (con el reajuste por resolución, HE-15-HU04-CA05) | C, E | HE-05-HU04, HE-15-HU04-CA04, CA05 |
| EV-14 | `draft_changed` | `{ dirty: boolean, applied_unsaved: boolean }` | Al cambiar el borrador del tema en edición | P | HE-02-HU09, HE-02-HU13 |
| EV-15 | `layout_edit_state_changed` | `{ open: boolean, dirty: boolean }` | Al abrir, cerrar, mover o redimensionar en la pantalla de edición | P, E | HE-05-HU02 a HE-05-HU05 |
| EV-16 | `wallpaper_status_changed` | `{ state: 'ok'\|'fallback_default'\|'hidden' }`. Con `fallback_default` la vista principal muestra «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.» (HE-02-HU01-CA04) | Al fallar la visualización, al restaurar o al cerrar sesión | P | HE-02-HU01 |
| EV-17 | `monitors_changed` | `{ monitors: Monitor[] }` | Al conectar, desconectar o cambiar la resolución o la escala de un monitor (D-187; RNF-34) | C, E | HE-02-HU01-ET12, RNF-34 |
| EV-18 | `pointer_forwarded` | `{ x: number, y: number, monitor_id: string, button: 'primary' }` en coordenadas de la capa | Cuando Raw Input detecta una selección con el botón principal sobre el escritorio, dentro del rectángulo de un widget interactivo y sin ícono bajo el cursor (D-186; HE-06-HU01-ET03 a ET08) | C | HE-06-HU01 |
| EV-19 | `media_session_changed` | Igual a la respuesta de `media_get_session` | Al cambiar la sesión actual de Windows, la canción o el estado de reproducción; ≤ 5 s (HE-04-HU11-ET08) | P, C | HE-04-HU11, HE-06-HU09 |
| EV-20 | `widget_data_changed` | `{ widget_id, status: 'ok'\|'error'\|'offline', payload? }` | Tras cada consulta de Clima (cada 30 min) o Noticias (cada 60 min), al reconectar o al fallar (RNF-09; HE-04-HU05-ET07, ET08; HE-04-HU06-ET05, ET06). La falla de un widget no afecta a los demás (RNF-13) | P, C | HE-04-HU05, HE-04-HU06 |
| EV-21 | `animation_pause_changed` | `{ widget_ids: Uuid[], paused: boolean }` | Al pausar (CPU o GPU sobre 80 % durante 10 s) o reanudar (CPU y GPU bajo 60 % durante 30 s) las animaciones (RNF-06). La vista Principal muestra «En pausa por alto consumo de recursos.» junto al widget (HE-04-HU09-CA04) | P, C | HE-04-HU09 |
| EV-22 | `day_changed` | `{ date: DateIso }` | Cuando la hora local pasa a las 00:00 (HE-06-HU02-ET04; HE-10-HU05-ET09) | P, C | HE-06-HU02, HE-10-HU05 |
| EV-23 | `navigate_requested` | `{ screen: ScreenId, params? }` | Cuando la capa o el ícono del área de notificación piden abrir una pantalla (HE-06-HU08; HE-17-HU02) | P | HE-06-HU08, HE-17-HU02 |
| EV-24 | `exit_requested` | `{ requires_confirmation: boolean }` | Cuando el usuario elige «Salir» en el menú del ícono del área de notificación (HE-17-HU03) | P | HE-17-HU03 |
| EV-25 | `catalog_updated` | `{ kinds: string[] }` | Cuando `catalog_pull` descarga una versión nueva | P | HE-02-HU02, HE-02-HU03 |
| EV-26 | `preference_changed` | `{ board_card_view, origin }` | Al guardar o descargar la preferencia | P | HE-09-HU07 |

Total de eventos: 26.

## Catálogo · (c) Funciones RPC de PostgreSQL y Edge Functions de Supabase

### c.1 RPC de PostgreSQL (`POST /rest/v1/rpc/<nombre>`)

Autenticación común: cabeceras `apikey: <anon>` y `Authorization: Bearer <JWT del usuario>` salvo donde se indique «anon». Todas fijan `search_path = public, pg_temp`. `sync_push`, `email_is_registered` y `keepalive` son `SECURITY DEFINER` y `sync_push` usa siempre `auth.uid()`: nunca confía en un `user_id` del cliente (RNF-21). `sync_pull` y `catalog_pull` son `SECURITY INVOKER`: la seguridad por fila limita lo que devuelven. El permiso de ejecución está concedido solo a los roles indicados en la columna Autenticación. Errores: ver los ejemplos; el Núcleo los traduce a los `AppError` de (a). Todas sobre TLS 1.2 o 1.3 (RNF-18).

| ID | Función | Entrada | Salida | Errores | Autenticación | HU que la usan |
| --- | --- | --- | --- | --- | --- | --- |
| RPC-01 | `server_time()` | — | `timestamptz` (`clock_timestamp()` del servidor, en JSON una cadena `Instant`) | — | `authenticated` (JWT) | HE-15-HU03 (CA08) |
| RPC-02 | `sync_push(p_device_id uuid, p_clock_offset_ms bigint, p_changes jsonb)` | `p_changes`: lista de hasta 200 `{ change_id: number, entity_kind, entity_id: uuid, op: 'upsert'\|'delete', modified_at: Instant, fields: { "<campo>": { value, modified_at } } }`. `p_device_id` queda en la firma sin efecto en la combinación | `{ server_now: Instant, results: [ { change_id, status: 'applied'\|'merged'\|'superseded'\|'deleted'\|'rejected', conflict: boolean, reason?: string, row?: { entity_kind, entity_id, fields, field_mods, deleted_at, updated_seq } } ], max_seq: number }` | Toda la llamada (HTTP 400, `message`): `clock_out_of_range`, `too_many_changes`, `invalid_field`, `unauthorized` (`code` WG401). Por cambio (`results[].reason`): `not_owner`, `incomplete_create`, `unknown_entity`, `parent_deleted`, `duplicate_name`, `duplicate_widget`, `duplicate_role`, `limit_columns`, `limit_labels`, `limit_themes`, `applied_theme`, `invalid_field`. El Núcleo ya validó en el cliente, así que casi todos ocurren solo con un cliente alterado | `authenticated` (JWT); `SECURITY DEFINER` | HE-15-HU01 (CA01, CA02), HE-15-HU03 (CA01 a CA07), HE-15-HU04 (CA04) |
| RPC-03 | `sync_pull(p_since_seq bigint, p_limit integer default 500)` | `p_limit` entre 1 y 1000 | `{ server_now: Instant, rows: [ { entity_kind, entity_id, fields, field_mods, deleted_at, updated_seq } ], next_seq: number, has_more: boolean }`; `entity_kind` incluye `profile` | `invalid_limit`, `unauthorized` (HTTP 400, `message`) | `authenticated` (JWT); `SECURITY INVOKER` con seguridad por fila | HE-15-HU04 (CA01 a CA03, CA07, CA08), HE-15-HU03 (CA02) |
| RPC-04 | `catalog_pull(p_known_version integer)` | versión que tiene el cliente (0 si no tiene ninguna) | Si coincide: `{ version, unchanged: true }`; si no: `{ version, unchanged: false, templates: [], fonts: [], palettes: [], images: [], animations: [], colors: [] }` con las filas activas de cada catálogo, ordenadas por `sort_order` | — | `authenticated` (JWT); `SECURITY INVOKER` | HE-02-HU02 (CA01), HE-02-HU03, HE-02-HU06, HE-02-HU07 (catálogos) y HE-02-HU01 (plantilla por defecto sin conexión, D-198) |
| RPC-05 | `email_is_registered(p_email text)` | correo ya recortado, de 1 a 64 caracteres y con `@` | `boolean`: `true` si existe una cuenta con el correo **verificado**; los correos sin verificar cuentan como no registrados | `invalid_email` (HTTP 400, `message`) | `anon` y `authenticated` (se usa antes de tener cuenta). Expone la existencia de la cuenta porque HE-01-HU01 lo exige para el registro y no se usa en recuperar contraseña (HE-01-HU06-ET09). La función no limita las consultas por sí misma (DP-08) | HE-01-HU01 (CA08) |
| RPC-06 | `keepalive()` | — | `{ ok: true, at: Instant }` (lee una fila de `catalog_meta`) | — | `anon` y `authenticated`; la llama un flujo programado de GitHub Actions una vez al día (D-197) | HE-15-HU01 (ET09) |

Trabajos internos sin API (no se invocan desde el cliente): `purge_tombstones()` (diaria) y `purge_unconfirmed_users()` (cada hora) (`datos.md`, sección 7). Son funciones `SECURITY DEFINER` programadas con `pg_cron` y sin permiso de ejecución para `anon` ni `authenticated`. No son contratos de comunicación y no tienen HU propia: cumplen la eliminación definitiva a los 90 días y el descarte de altas sin verificar (HE-01-HU03-ET09).

### c.2 Edge Functions (`POST /functions/v1/<nombre>`)

Autenticación común: `Authorization: Bearer <JWT del usuario>` y `apikey: <anon>`; `verify_jwt = true` en `supabase/config.toml` (D-192). Los secretos (`GEMINI_API_KEY`, `GEMINI_MODEL`, `NEWS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; la contraseña de aplicación de Gmail es del SMTP de Auth) viven en los secretos de Supabase y solo los leen estas funciones. Formato `application/json; charset=utf-8`. Errores con cuerpo `{ "error": { "code": "<código>", "message": "<texto técnico en inglés, no se muestra>" } }`.

| ID | Función | Entrada | Salida | Errores | Autenticación | HU que la usan |
| --- | --- | --- | --- | --- | --- | --- |
| EF-01 | `windi-chat` | `{ client_request_id: uuid, message: string (1 a 2000), history: [ { role: 'user'\|'assistant', text: string } ] (últimos 20 turnos), context: { alias, today: DateIso, now_hour: number, columns: [ {id, name, role} ], labels: [ {id, name} ], cards: [ {id, type, title, due_date, priority, column_id, label_ids, completed_on, scheduled_date, scheduled_hour, description} ] (solo las necesarias para la pregunta), totals: { total, overdue, pending, completed }, active_proposal: object\|null } }` | `{ reply: string, intent: 'answer'\|'clarify'\|'propose'\|'out_of_scope', proposal: { action: 'create'\|'edit'\|'move'\|'delete', items: [ { card_id: uuid\|null, changes: object\|null } ] }\|null }`. No hace cambios: solo propone (D-047). Llama a Gemini (INT-03) con la personalidad de HE-14-HU02 | `unauthorized` (401), `invalid_request` (400: mensaje fuera de 1 a 2000), `quota_exceeded` (429), `provider_error` (502), `timeout` (504, a los 13 s). Todo error se muestra al usuario como «No pude responder en este momento. Intenta de nuevo.» (HE-14-HU01-CA08) | JWT | HE-14-HU01, HE-14-HU03 a HE-14-HU07, HE-14-HU09 (D-132, D-193; RNF-11) |
| EF-02 | `weather-geocode` | `{ query: string (1 a 100, recortado) }` | `{ results: [ { geo_id: string, name: string, admin1: string\|null, country: string, latitude: number, longitude: number } ] }` (hasta 5; el Núcleo toma la primera). Lista vacía = ciudad no reconocida | `unauthorized`, `invalid_request`, `provider_error` (502), `timeout` (504, a los 8 s). `results=[]` → el Núcleo devuelve `city.not_found` «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | JWT | HE-04-HU05 (CA04, ET06), HE-04-HU12 (CA04) |
| EF-03 | `weather-current` | `{ geo_id: string, latitude: number, longitude: number }` | `{ geo_id, temperature_c: number, condition_code: string, condition_text: string, observed_at: Instant, cache: 'hit'\|'miss' }`. Guarda en `external_cache` con `expires_at = now + 30 min` (RNF-09) | `unauthorized`, `invalid_request`, `provider_error`, `timeout`. El widget muestra «No pudimos cargar el clima. Intenta de nuevo más tarde.» (HE-04-HU05-CA07) | JWT | HE-04-HU05 (CA07, ET07, ET08; RNF-09) |
| EF-04 | `news-headlines` | `{ edition?: string }` (Duda/propuesta DP-18: `'co'` por defecto) | `{ headlines: [ { title, source, url, published_at } ] (exactamente 5), fetched_at: Instant, cache: 'hit'\|'miss' }`. Guarda en `external_cache` con `expires_at = now + 60 min` | `unauthorized`, `provider_error`, `timeout`. El widget muestra «No pudimos cargar las noticias. Intenta de nuevo más tarde.» (HE-04-HU06-CA03) | JWT | HE-04-HU06 (CA03, ET05, ET06; RNF-09) |

#### Ejemplos de las Edge Functions

**EF-01 `windi-chat`**

```json
POST /functions/v1/windi-chat
{ "client_request_id": "e3f4c2a0-7d0b-4c0a-9a27-5b8d1e6f4a33",
  "message": "Crea una tarea para entregar el informe el viernes",
  "history": [ { "role": "assistant", "text": "Hola, Estef. Soy Windi. ¿En qué te ayudo con tus tarjetas?" } ],
  "context": { "alias": "Estef", "today": "2026-11-09", "now_hour": 10,
               "columns": [ { "id": "c1…", "name": "Por hacer", "role": "todo" } ],
               "labels": [], "cards": [], "totals": { "total": 0, "overdue": 0, "pending": 0, "completed": 0 },
               "active_proposal": null } }
200
{ "reply": "Esto es lo que voy a crear. ¿Confirmas?", "intent": "propose",
  "proposal": { "action": "create", "items": [ { "card_id": null,
      "changes": { "type": "task", "title": "Entregar el informe", "due_date": "2026-11-13" } } ] } }
```

Error: `{ "error": { "code": "quota_exceeded", "message": "Gemini quota exceeded" } }` con HTTP 429.

**EF-02 `weather-geocode`**

```json
POST /functions/v1/weather-geocode    { "query": "Popayán" }
200 { "results": [ { "geo_id": "3673269", "name": "Popayán", "admin1": "Cauca", "country": "Colombia", "latitude": 2.4448, "longitude": -76.6147 } ] }
```

**EF-03 `weather-current`**

```json
POST /functions/v1/weather-current    { "geo_id": "3673269", "latitude": 2.4448, "longitude": -76.6147 }
200 { "geo_id": "3673269", "temperature_c": 21.4, "condition_code": "partly_cloudy", "condition_text": "Parcialmente nublado",
      "observed_at": "2026-11-09T15:00:00.000Z", "cache": "hit" }
```

**EF-04 `news-headlines`**

```json
POST /functions/v1/news-headlines     {}
200 { "headlines": [ { "title": "…", "source": "…", "url": "https://…", "published_at": "2026-11-09T14:20:00.000Z" } ],
      "fetched_at": "2026-11-09T15:00:00.000Z", "cache": "miss" }
```

(La respuesta real trae exactamente 5 titulares.)

Reglas comunes de las Edge Functions: tiempo máximo de ejecución 15 s menos el margen indicado (el Núcleo corta a los 15 s para `windi-chat`, RNF-11); no registran contenido de tarjetas ni mensajes (D-196); respuestas sin cachear por el navegador; `CORS` no se habilita (las llama el Núcleo, no una página web).

#### Ejemplos de las RPC

Errores de las RPC: PostgREST responde HTTP 400 con `{ "code": "WG001", "message": "<código>", "details": null, "hint": null }`; el Núcleo ramifica por `message`. La falta de sesión usa `code: "WG401"` y `message: "unauthorized"`. Sin JWT válido, PostgREST responde 401 antes de ejecutar la función. Un error no previsto se propaga sin ocultarse y el Núcleo lo registra como `internal.unexpected`.

**RPC-01 `server_time`**

```json
POST /rest/v1/rpc/server_time          {}
200 "2026-11-09T15:04:06.370Z"
```

El Núcleo mide `clock_offset_ms = servidor − computador` al reconectarse (HE-15-HU03-CA08).

**RPC-02 `sync_push`** (una tarjeta creada sin conexión y un título editado en otro computador)

```json
POST /rest/v1/rpc/sync_push
{
  "p_device_id": "0b6f2c1e-6a5d-4f0e-9d63-2c7a4f1b8e90",
  "p_clock_offset_ms": -1250,
  "p_changes": [
    { "change_id": 41, "entity_kind": "card", "entity_id": "5d1c9a52-8e43-4b8d-a1f0-3c9d7e2b6a14",
      "op": "upsert", "modified_at": "2026-11-09T15:04:05.120Z",
      "fields": {
        "title":    { "value": "Entregar informe", "modified_at": "2026-11-09T15:04:05.120Z" },
        "due_date": { "value": "2026-11-12",       "modified_at": "2026-11-09T15:04:05.120Z" },
        "position": { "value": 1024,               "modified_at": "2026-11-09T15:04:05.120Z" } } },
    { "change_id": 42, "entity_kind": "card", "entity_id": "a2e0f7b4-1c3d-4e55-8b19-6d0c5a7f3e21",
      "op": "upsert", "modified_at": "2026-11-09T15:04:06.000Z",
      "fields": { "title": { "value": "Estudiar simulación", "modified_at": "2026-11-09T15:04:06.000Z" } } }
  ]
}
```

```json
200
{
  "server_now": "2026-11-09T15:04:07.410Z",
  "max_seq": 1873,
  "results": [
    { "change_id": 41, "status": "applied", "conflict": false,
      "row": { "entity_kind": "card", "entity_id": "5d1c9a52-8e43-4b8d-a1f0-3c9d7e2b6a14",
               "fields": { "title": "Entregar informe", "due_date": "2026-11-12", "position": 1024,
                           "column_id": "c7a1…", "created_at": "2026-11-09T15:04:06.370Z" },
               "field_mods": { "title": "2026-11-09T15:04:06.370Z" }, "deleted_at": null, "updated_seq": 1872 } },
    { "change_id": 42, "status": "superseded", "conflict": true,
      "row": { "entity_kind": "card", "entity_id": "a2e0f7b4-1c3d-4e55-8b19-6d0c5a7f3e21",
               "fields": { "title": "Repasar simulación" }, "field_mods": { "title": "2026-11-09T15:04:40.000Z" },
               "deleted_at": null, "updated_seq": 1873 } }
  ]
}
```

- `status`: `applied` (se aplicó todo), `merged` (se aplicaron unos campos y otros perdieron), `superseded` (todo perdió; `row` trae la fila ganadora), `deleted` (la fila estaba eliminada y la eliminación gana), `rejected` (con `reason`). `conflict: true` hace que el Núcleo emita `sync_conflicts_resolved` (EV-06) si la fila es una tarjeta, y adopte `row`.
- `rejected.reason`: `not_owner`, `incomplete_create`, `unknown_entity`, `parent_deleted`, `duplicate_name` (trae la fila existente en `row`), `duplicate_widget` (trae el widget existente), `duplicate_role`, `limit_columns`, `limit_labels`, `limit_themes`, `applied_theme`, `invalid_field`. Salvo `parent_deleted` y los duplicados, ocurren solo con un cliente alterado, porque el Núcleo ya validó.
- Error de toda la llamada (HTTP 400, `message`): `clock_out_of_range` (desfase de más de 24 h), `too_many_changes` (más de 200), `invalid_field` (`p_changes` no es una lista), `unauthorized`.
- `entity_kind` admite: `user_preference`, `kanban_column`, `card`, `label`, `card_label`, `uploaded_image`, `theme`, `applied_theme`, `widget`, `theme_widget`, `widget_carousel_item`. `profile` solo baja.
- Los campos que una misma acción modifica se envían con la misma hora de modificación (grupos atómicos, por ejemplo las cuatro columnas del fondo de un tema).
- Idempotente: reenviar el mismo cambio no modifica la fila ni su `updated_seq`.

**RPC-03 `sync_pull`**

```json
POST /rest/v1/rpc/sync_pull           { "p_since_seq": 1860, "p_limit": 500 }
200
{ "server_now": "2026-11-09T15:05:07.410Z",
  "rows": [ { "entity_kind": "card", "entity_id": "a2e0f7b4-1c3d-4e55-8b19-6d0c5a7f3e21",
              "fields": { "title": "Repasar simulación", "due_date": "2026-11-10" },
              "field_mods": { "title": "2026-11-09T15:04:40.000Z" }, "deleted_at": null, "updated_seq": 1873 } ],
  "next_seq": 1873, "has_more": false }
```

Si `has_more` es `true`, el Núcleo repite la llamada con `p_since_seq = next_seq`. `p_limit` omitido vale 500; fuera de 1 a 1000 responde `invalid_limit`. Las filas eliminadas llegan con `deleted_at` distinto de `null`.

**RPC-04 `catalog_pull`**

```json
POST /rest/v1/rpc/catalog_pull        { "p_known_version": 1 }
200 { "version": 1, "unchanged": true }

POST /rest/v1/rpc/catalog_pull        { "p_known_version": 0 }
200 { "version": 1, "unchanged": false,
      "templates": [ { "id": "default", "name": "Windgets", "thumbnail_path": "templates/default/thumb.png", "bundle_path": "templates/default/",
                       "default_background_path": "images/default.jpg", "default_color_primary": "#1B3A5C",
                       "default_color_secondary": "#F2A33A", "default_color_text": "#121216", "default_font_id": "inter",
                       "is_default": true, "sort_order": 0, "is_active": true, "bundle_version": 1 } ],
      "fonts": [], "palettes": [], "images": [], "animations": [], "colors": [ { "id": "gray", "name": "Gris", "hex": "#6B7280", "sort_order": 0, "is_active": true } ] }
```

La RLS deja pasar solo las filas con `is_active = true`.

**RPC-05 `email_is_registered`**

```json
POST /rest/v1/rpc/email_is_registered { "p_email": "estef@example.com" }
200 true
```

**RPC-06 `keepalive`**

```json
POST /rest/v1/rpc/keepalive           {}
200 { "ok": true, "at": "2026-11-09T09:00:02.114Z" }
```

Total de funciones RPC: 6 (más 2 trabajos internos). Total de Edge Functions: 4.

## Catálogo · (d) Integraciones externas

### INT-01 Supabase Auth (cuentas) — D-180, D-191

**HU que la usan:** HE-01-HU01 a HE-01-HU08, HE-16-HU03 (cierre de sesión), HE-15-HU02 (renovación del token sin conexión), RT-01.

Base: `{SUPABASE_URL}/auth/v1`. Cabeceras: `apikey: <anon>`, `Content-Type: application/json`; en llamadas con sesión, `Authorization: Bearer <access_token>`. Lo llama el Núcleo con `reqwest` (nunca las vistas). TLS 1.2 o 1.3 (RNF-18).

| Flujo | Petición | Respuesta correcta | Mapa de fallas → `AppError` |
| --- | --- | --- | --- |
| Registro: enviar código | `POST /signup` `{ email, password, data: { alias } }` con «Confirm email» activo; antes, RPC-05 | 200 con el usuario **sin verificar**; Auth envía el correo con el código | Correo ya verificado → `email.already_registered` (por RPC-05); 429 `over_email_send_rate_limit` → `auth.rate_limited`; sin red → `net.offline` |
| Registro: reenviar | `POST /resend` `{ type: 'signup', email }` | 200 | 429 `over_email_send_rate_limit` antes de 60 s → `code.resend_too_soon` con `seconds` calculados por el Núcleo; otro 429 → `auth.rate_limited` |
| Registro: verificar | `POST /verify` `{ type: 'signup', email, token }` | 200 con `access_token`, `refresh_token`, `expires_in`, `user` → se dispara `on_account_confirmed` (crea perfil y datos semilla) | 403/422 `otp_expired` (Auth no distingue entre código incorrecto y vencido): el Núcleo decide con `expires_at` guardado al enviar: pasado → `code.expired`, vigente → `code.incorrect`; 429 → `auth.rate_limited` |
| Inicio con correo | `POST /token?grant_type=password` `{ email, password }` | 200 con la sesión | 400 `invalid_credentials` (cubre correo no registrado y contraseña incorrecta con el mismo código) → `auth.invalid_credentials`; 429 → `auth.rate_limited` |
| Renovar token | `POST /token?grant_type=refresh_token` `{ refresh_token }` | 200 con la sesión nueva | Sin red: se conserva la sesión y se trabaja con lo guardado (HE-15-HU02); 400 `refresh_token_not_found` / `session_expired` con red → `session.expired` y pantalla Inicio de sesión |
| Recuperar: enviar código | `POST /recover` `{ email }` | 200 siempre (Auth no revela si existe la cuenta) | Mismo mensaje exista o no (HE-01-HU06-ET09); 429 → `auth.rate_limited` |
| Recuperar: verificar | `POST /verify` `{ type: 'recovery', email, token }` | 200 con sesión de recuperación | Como el registro |
| Recuperar: nueva contraseña | `PUT /user` `{ password }` con el `access_token` de recuperación | 200 | 422 `same_password` → «Elige una contraseña distinta de la actual.» (HE-01-HU08-CA07); sin red → `net.offline` y no se actualiza (HE-01-HU08-CA06) |
| Cerrar sesión | `POST /logout?scope=local` | 204 | Sin red: igual se cierra la sesión local y se borra el token (HE-16-HU03) |

Inicio con Google (PKCE, D-191, RNF-20, RNF-36):
1. El Núcleo genera `code_verifier` (43 a 128 caracteres aleatorios) y `code_challenge = BASE64URL(SHA256(code_verifier))`, y guarda `state`.
2. Abre en el **navegador predeterminado** (no en una ventana embebida): `GET {SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=windgets%3A%2F%2Fauth%2Fcallback&code_challenge=<challenge>&code_challenge_method=s256&scopes=openid%20email%20profile`. Solo se piden `openid`, `email` y `profile` (RNF-20).
3. Google autentica y Supabase redirige a `windgets://auth/callback?code=<auth_code>` (o `?error=access_denied&error_description=...`). Windows entrega la URL a la aplicación: el instalador registró el esquema `windgets` en `HKCU\Software\Classes\windgets`; el plugin de instancia única reenvía la URL a la instancia en ejecución (no se abren puertos locales, D-191).
4. El Núcleo intercambia: `POST /token?grant_type=pkce` `{ auth_code, code_verifier }` → sesión. Si el correo no tenía cuenta, el disparador `on_account_confirmed` la crea ya verificada, sin código (HE-01-HU05-ET04); el alias sale del nombre de Google recortado a 30 (D-024).
5. Fallas: `error=access_denied` o ventana cerrada → `auth_google_result{cancelled}`; cualquier otro error del proveedor o `invalid_grant` → `error`; correo de más de 64 caracteres → `validate_new_user` rechaza el alta con `email_too_long` y el resultado es `email_too_long`. Sin respuesta en 5 min el Núcleo vence la espera y devuelve `cancelled` (Duda/propuesta, DP-09).

Configuración de Auth que debe quedar en `supabase/config.toml` o en el panel (valores del backlog; los nombres de clave se confirman al construir):

| Ajuste | Valor | Fuente |
| --- | --- | --- |
| Verificación de correo obligatoria | Activa | HE-01-HU03-ET09 |
| Longitud del código (OTP) | 6 | HE-01-HU03-ET02; D-004 |
| Vigencia del código | 600 s | HE-01-HU03-ET03; RNF-25 |
| Frecuencia mínima de envío al mismo correo | 60 s | HE-01-HU03-ET05; RNF-25 |
| Límite por IP | 30 solicitudes de registro o inicio y 30 verificaciones cada 5 minutos | D-176; RNF-24 |
| Contraseña mínima y composición | 8 caracteres con mayúscula, minúscula y número (el máximo de 64 lo valida el Núcleo) | HE-01-HU02-ET02, ET03 |
| Hash de contraseñas | bcrypt (por defecto de Supabase; factor mínimo 10) | RNF-17; D-176 |
| URL de redirección permitida | `windgets://auth/callback` | D-191 |
| Proveedor Google | Activo con `openid email profile` | RNF-20 |
| Vigencia del token de acceso / rotación del token de renovación | Valores por defecto de Supabase | Duda/propuesta |
| SMTP propio | Cuenta de Gmail del proyecto (INT-02) | D-195 |

**Ejemplos de INT-01**

```json
POST /auth/v1/signup        { "email": "estef@example.com", "password": "Clave123", "data": { "alias": "Estef" } }
200 { "id": "…", "email": "estef@example.com", "confirmation_sent_at": "2026-11-09T15:00:00.000Z" }

POST /auth/v1/verify        { "type": "signup", "email": "estef@example.com", "token": "482913" }
200 { "access_token": "eyJ…", "token_type": "bearer", "expires_in": 3600, "refresh_token": "…", "user": { "id": "…", "email": "estef@example.com" } }

POST /auth/v1/token?grant_type=password   { "email": "estef@example.com", "password": "Clave123" }
400 { "code": 400, "error_code": "invalid_credentials", "msg": "Invalid login credentials" }
```

Límites: los de la tabla de configuración. Comportamiento ante falla: sin red, `net.offline` con el texto del flujo; sin respuesta o 5xx, `service.unavailable` (D-205); 429, `auth.rate_limited`.

### INT-02 Gmail (correo de Auth) — D-195, SH-06

**HU que la usan:** HE-01-HU03, HE-01-HU06, HE-01-HU07.

No lo llama el Núcleo: es el SMTP propio de Supabase Auth. Configuración: host `smtp.gmail.com`, puerto 465 (TLS), usuario = dirección de la cuenta de Gmail del proyecto, contraseña = contraseña de aplicación de esa cuenta (requiere verificación en dos pasos; se guarda solo en la configuración SMTP de Supabase Auth), remitente `Windgets <cuenta del proyecto>`. No se necesita dominio (D-195). Plantillas de correo de «Confirm signup» y «Reset password» en español con el código `{{ .Token }}` (6 dígitos) y su vigencia de 10 minutos. Límites: el límite diario de envío de Gmail y el de 30 mensajes por hora de Supabase Auth con SMTP propio, que se puede ajustar en el panel (RI-29). Si Gmail rechaza los envíos, la configuración SMTP se cambia a otra cuenta del proyecto sin cambiar el código; Resend con un subdominio de la universidad es la última opción. Falla del correo: el usuario no recibe el código; no hay mensaje definido en el backlog (DP-10). Asunto y texto de los correos: no definidos (DP-11).

### INT-03 Gemini (agente de IA) — D-132, D-180, D-193

**HU que la usan:** HE-14-HU01, HE-14-HU02, HE-14-HU03 a HE-14-HU09.

La llama solo la Edge Function `windi-chat` (EF-01).
- Petición: `POST https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent` con cabecera `x-goog-api-key: {GEMINI_API_KEY}`. `GEMINI_MODEL` por defecto: un modelo Flash-Lite del nivel gratuito (por ejemplo `gemini-2.5-flash-lite`; el nombre exacto se fija al construir porque los modelos cambian, D-193).
- Cuerpo: `systemInstruction` (personalidad de HE-14-HU02, alcance de HE-14-HU01-ET23: solo tarjetas y funcionamiento de la aplicación, trato de tú, español neutro, máximo 3 oraciones antes de una lista, lista numerada de máximo 6 pasos, máximo un emoji solo en saludos o celebraciones); `contents` (historial y mensaje); `tools` con cuatro funciones declaradas (`propose_create_cards`, `propose_edit_card`, `propose_move_card`, `propose_delete_cards`) y `toolConfig.functionCallingConfig.mode = AUTO`; `generationConfig { temperature: 0.4, maxOutputTokens: 600 }`.
- Respuesta: texto del agente y, si pidió cambiar tarjetas, una llamada a función. La Edge Function la convierte en `proposal` (EF-01). Las reglas de validación (fecha límite no anterior a hoy, título 1 a 100, etiquetas existentes, no crear etiquetas) las vuelve a aplicar el Núcleo (HE-14-HU04-ET06, ET08; HE-14-HU05-ET04).
- Límites: nivel gratuito con límites por minuto, por día y por tokens que se consultan en Google AI Studio (D-132, RI-13); el contenido enviado en el nivel gratuito puede usarse para mejorar los productos del proveedor (D-132). Espera máxima: la función corta a los 13 s y el Núcleo a los 15 s (RNF-11; D-172).
- Fallas: HTTP 429 → `quota_exceeded`; 5xx o bloqueo de seguridad → `provider_error`; sin respuesta → `timeout`. Mensaje al usuario en todos los casos: «No pude responder en este momento. Intenta de nuevo.» con «Reintentar» (HE-14-HU01-CA08). No hay cuota por usuario (DP-12).

**Ejemplo de INT-03**

```json
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent
x-goog-api-key: <GEMINI_API_KEY>
{ "systemInstruction": { "parts": [ { "text": "Eres Windi, el agente de IA de Windgets… (personalidad de HE-14-HU02)" } ] },
  "contents": [ { "role": "user", "parts": [ { "text": "Crea una tarea para entregar el informe el viernes" } ] } ],
  "tools": [ { "functionDeclarations": [ { "name": "propose_create_cards", "description": "Propone crear tarjetas", "parameters": { "type": "OBJECT", "properties": { "cards": { "type": "ARRAY", "items": { "type": "OBJECT" } } } } } ] } ],
  "toolConfig": { "functionCallingConfig": { "mode": "AUTO" } },
  "generationConfig": { "temperature": 0.4, "maxOutputTokens": 600 } }
200
{ "candidates": [ { "content": { "parts": [
    { "text": "Esto es lo que voy a crear. ¿Confirmas?" },
    { "functionCall": { "name": "propose_create_cards", "args": { "cards": [ { "title": "Entregar el informe", "due_date": "2026-11-13" } ] } } } ] } } ] }
```

### INT-04 Clima — D-139, RNF-09 (proveedor: Duda/propuesta DP-17)

**HU que la usan:** HE-04-HU05, HE-04-HU12.

El backlog no nombra el proveedor (HE-04-HU05-ET06 dice «servicio de clima»). Propuesta: **Open-Meteo** (sin clave, sin costo para uso no comercial, cumple el presupuesto de $0). La llama la Edge Function `weather-geocode` / `weather-current`.
- Buscar ciudad: `GET https://geocoding-api.open-meteo.com/v1/search?name={query}&count=5&language=es&format=json` → `results[]` con `id`, `name`, `admin1`, `country`, `latitude`, `longitude`. Sin `results` = ciudad no encontrada.
- Clima actual: `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&timezone=auto` → `current.temperature_2m` (°C) y `current.weather_code` (código WMO). La Edge Function traduce el código a `condition_code` y `condition_text` en español (tabla siguiente).
- Tabla de equivalencias WMO → `condition_text` (la Edge Function la aplica; `condition_code` es el código WMO tal como llega): 0 «Despejado»; 1 «Mayormente despejado»; 2 «Parcialmente nublado»; 3 «Nublado»; 45 y 48 «Niebla»; 51, 53, 55, 56 y 57 «Llovizna»; 61, 63, 65, 66 y 67 «Lluvia»; 71, 73, 75 y 77 «Nieve»; 80, 81 y 82 «Chubascos»; 85 y 86 «Chubascos de nieve»; 95, 96 y 99 «Tormenta»; cualquier otro código «Condición no disponible». Sin ícono: el widget muestra solo texto (HE-04-HU05-ET02). La temperatura se redondea al entero más cercano y se muestra como «21 °C».
- Varias ciudades en `geocode`: se usa la primera de `results` y se muestra su `name` sin `admin1` ni `country`.
- Límites: uso gratuito sin clave sujeto a límites por IP del proveedor (la Edge Function comparte la caché de 30 min entre usuarios, por lo que las llamadas al proveedor son pocas). Verificar términos de uso al construir.
- Razón de la propuesta: gratuito, sin registro ni clave, sin dato personal enviado (solo el nombre de la ciudad). Alternativa: WeatherAPI o OpenWeather con nivel gratuito y clave.
- Fallas: proveedor caído o con error → `provider_error` → aviso «No pudimos cargar el clima. Intenta de nuevo más tarde.»; ciudad sin resultados → «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.»; sin conexión → «Sin conexión. El widget se actualizará al reconectarte.».

**Ejemplo de INT-04**

```json
GET https://geocoding-api.open-meteo.com/v1/search?name=Popay%C3%A1n&count=5&language=es&format=json
200 { "results": [ { "id": 3673269, "name": "Popayán", "admin1": "Cauca", "country": "Colombia", "latitude": 2.4448, "longitude": -76.6147 } ] }

GET https://api.open-meteo.com/v1/forecast?latitude=2.4448&longitude=-76.6147&current=temperature_2m,weather_code&timezone=auto
200 { "current": { "time": "2026-11-09T10:00", "temperature_2m": 21.4, "weather_code": 2 } }
```

### INT-05 Noticias — D-139, RNF-09 (proveedor y edición: Duda/propuesta DP-18)

**HU que la usan:** HE-04-HU06, HE-06-HU10.

El backlog no nombra el proveedor ni la edición (país, idioma, categoría) de los titulares (HE-04-HU06-ET04). Propuesta: **GNews** con nivel gratuito (requiere clave guardada en el secreto `NEWS_API_KEY`). La llama `news-headlines`.
- Petición: `GET https://gnews.io/api/v4/top-headlines?category=general&lang=es&country=co&max=5&apikey={NEWS_API_KEY}` → `articles[]` con `title`, `url`, `publishedAt`, `source.name`.
- Respuesta de la Edge Function: 5 titulares `{ title, source, url, published_at }` ordenados del más reciente al más antiguo (HE-04-HU06-ET02).
- Límites a verificar al construir: el nivel gratuito tiene tope diario de solicitudes y puede retrasar los artículos. Con la caché compartida de 60 min el servidor hace unas 24 solicitudes al día, sin importar cuántos usuarios haya.
- Alternativa sin clave: leer un canal RSS público de un medio y convertirlo en titulares (sin límite fijo, pero depende del formato del medio).
- Fallas: igual que el clima, con el aviso «No pudimos cargar las noticias. Intenta de nuevo más tarde.» y, sin conexión, «Sin conexión. El widget se actualizará al reconectarte.». Abrir un titular: `system_open_url` (navegador predeterminado, HE-06-HU10-ET01).

**Ejemplo de INT-05**

```json
GET https://gnews.io/api/v4/top-headlines?category=general&lang=es&country=co&max=5&apikey=<NEWS_API_KEY>
200 { "totalArticles": 5, "articles": [ { "title": "…", "url": "https://…", "publishedAt": "2026-11-09T14:20:00Z", "source": { "name": "…" } } ] }
429 { "errors": ["You have reached your request limit for today"] }
```

### INT-06 Controles multimedia de Windows (SMTC) — D-175

**HU que la usan:** HE-04-HU11, HE-06-HU09.

El Controlador multimedia del Núcleo usa la API `Windows.Media.Control` (crate `windows`).
- Inicio: `GlobalSystemMediaTransportControlsSessionManager::RequestAsync()`. Sesión actual: `GetCurrentSession()` (la que Windows marca como actual, HE-04-HU11-ET06).
- Eventos de WinRT: `CurrentSessionChanged` (del administrador); `MediaPropertiesChanged` y `PlaybackInfoChanged` (de la sesión) → emiten `media_session_changed` (EV-19) en ≤ 5 s.
- Lectura: `TryGetMediaPropertiesAsync()` → `Title`, `Artist`, `Thumbnail` (flujo de la carátula; si la aplicación no la publica, `thumbnail_url = null`); `GetPlaybackInfo()` → `PlaybackStatus` y `Controls` (`IsPreviousEnabled`, `IsNextEnabled`, `IsPlayPauseToggleEnabled`).
- Control: `TryTogglePlayPauseAsync()`, `TrySkipNextAsync()`, `TrySkipPreviousAsync()`; si la aplicación no admite la acción, el control aparece deshabilitado (HE-06-HU09-ET04).
- Límites: no requiere internet ni iniciar sesión en ningún servicio (HE-04-HU11-ET05); depende de que la aplicación publique su reproducción (RI-17); el spike debe probar Spotify de escritorio y YouTube Music en Chrome y Edge (HE-04-HU11-ET09).
- Falla: sin sesión → `has_session = false` y el texto «No hay música en reproducción.» con los controles deshabilitados (HE-04-HU11-CA03).

### INT-07 Win32: wallpaper detrás de los íconos, entrada del mouse, monitores y energía — D-131, D-185, D-186, D-187

**HU que la usan:** HE-02-HU01, HE-04-HU09, HE-05-HU01, HE-06-HU01, HE-15-HU04, HE-17-HU01 a HE-17-HU03.

El Host del wallpaper del Núcleo usa la API de Windows con el crate `windows`. Riesgo RI-16: la técnica no está documentada y debe validarse en el spike de HE-02-HU01 en Windows 10 22H2 y Windows 11 con permisos estándar (HE-02-HU01-ET08, ET10, ET11).
1. **Anclaje:** buscar la ventana `Progman`; `SendMessageTimeoutW(progman, 0x052C, 0xD, 0x1, SMTO_NORMAL, 1000, …)` para crear el `WorkerW` detrás de los íconos; `EnumWindows` hasta hallar la ventana que contiene `SHELLDLL_DefView` y tomar el `WorkerW` hermano siguiente; `SetParent(hwnd_capa, workerw)`; mover y dimensionar la ventana de la capa al rectángulo del **escritorio virtual** (una sola ventana para todos los monitores, D-187). Windows 11 con cambios recientes del explorador puede modificar esa jerarquía; el spike debe comprobar la forma exacta en cada versión.
2. **Restauración:** al «Salir» o cerrar sesión se destruye la ventana de la capa; el fondo original de Windows nunca se modificó (HE-17-HU03-ET02; HE-16-HU03-ET03).
3. **Entrada del mouse (D-186):** `RegisterRawInputDevices` con la página de uso genérica `0x01`, uso `0x02` (mouse) y `RIDEV_INPUTSINK` hacia una ventana oculta del Núcleo; en cada `WM_INPUT` con botón principal presionado: `GetCursorPos`, `WindowFromPoint`; solo si la ventana bajo el cursor es el escritorio (clase `SysListView32` dentro de `SHELLDLL_DefView`), el punto cae en el rectángulo de un widget interactivo y `LVM_HITTEST` (mensaje enviado al `SysListView32` con una estructura `LVHITTESTINFO` en memoria del proceso del explorador, con `VirtualAllocEx`/`ReadProcessMemory`) no encuentra un ícono, el Núcleo emite `pointer_forwarded` (EV-18). Si hay un ícono, el evento queda para el escritorio (HE-02-HU01-ET04; HE-06-HU01-ET04, ET08; RNF-35). Si el spike falla, se informa al Gerente de Proyecto y al patrocinador antes de construir (HE-02-HU01-ET11; D-186).
4. **Monitores:** `EnumDisplayMonitors` + `GetDpiForMonitor` para el rectángulo y la escala de cada monitor; escucha de `WM_DISPLAYCHANGE` y `WM_DPICHANGED` → `monitors_changed` (EV-17). Se dibuja la misma configuración en cada monitor (D-135). Resoluciones 1366 × 768 a 3840 × 2160 y escalas 100 % a 200 % (RNF-34).
5. **Suspensión y bloqueo (D-189):** `WM_POWERBROADCAST` (`PBT_APMSUSPEND`, `PBT_APMRESUMEAUTOMATIC`) y `WTSRegisterSessionNotification` (`WTS_SESSION_LOCK`, `WTS_SESSION_UNLOCK`) para no consultar a la nube con el equipo suspendido o bloqueado y hacer una consulta inmediata al volver (HE-15-HU04-ET07, ET08).
6. **Carga de CPU y GPU (RNF-06, D-054):** contadores PDH `\Processor Information(_Total)\% Processor Utility` y `\GPU Engine(*)\Utilization Percentage` (máximo entre motores) leídos cada segundo; pausa con más de 80 % durante 10 s seguidos y reanuda con menos de 60 % durante 30 s seguidos (HE-04-HU09-ET05, ET06).
7. **Área de notificación:** ícono con menú «Abrir» y «Salir» (HE-17-HU02, HE-17-HU03). Instancia única.
Falla de visualización del wallpaper: se muestra el wallpaper de la plantilla por defecto y el aviso «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.» (HE-02-HU01-ET05, CA04).

### INT-08 Inicio automático con Windows — D-051, D-081

**HU que la usan:** HE-16-HU02, CD-02-HU02.

- Activar: valor de cadena `Windgets` en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` con `"<ruta>\Windgets.exe" --autostart`. Desactivar: borrar ese valor.
- Estado real (HE-16-HU02-ET06, CA03): además del valor anterior, se lee `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run\Windgets` (binario; el primer byte `02` o `06` = habilitado, `03` = deshabilitado en la configuración de Aplicaciones de inicio de Windows). El interruptor muestra «activo» solo si existe el valor de `Run` y no está deshabilitado en `StartupApproved`.
- Con `--autostart` la aplicación se abre sin mostrar la ventana principal si hay sesión y muestra el tema aplicado; sin sesión muestra Inicio de sesión y mantiene el fondo original de Windows (CD-02-HU02-ET06). Lo registra también el instalador según la casilla «Abrir la aplicación al iniciar Windows» (CD-02-HU02).
- Falla al escribir en el registro: el mensaje es «No pudimos cambiar el inicio automático. Intenta de nuevo.» (HE-16-HU02-CA05).

### INT-09 Almacenamiento de archivos (Supabase Storage) — D-180

**HU que la usan:** HE-02-HU03, HE-04-HU07, HE-04-HU08, HE-15-HU01.

Base `{SUPABASE_URL}/storage/v1/object`. Cabeceras como INT-01 con JWT.
- Subir imagen propia: `POST /user-images/{user_id}/{uploaded_image.id}.{ext}` con el cuerpo binario y `Content-Type: image/jpeg|image/png`. Respuesta `200 { Key }`. Errores: 413 (más de 20 MB) → no ocurre porque el Núcleo ya lo validó; 400 de tipo no permitido; 401/403 → sesión.
- Descargar: `GET /authenticated/user-images/{path}` y `GET /authenticated/catalog/{path}`; el Núcleo verifica `sha256` y tamaño y guarda en `%APPDATA%\Windgets\files` (`local_file`).
- Límite del plan: 1 GB de almacenamiento y 5 GB de salida de datos (D-133, RI-14).

**Ejemplo de INT-09**

```
POST {SUPABASE_URL}/storage/v1/object/user-images/6a1e…/5d1c9a52-8e43-4b8d-a1f0-3c9d7e2b6a14.png
Authorization: Bearer <JWT>        Content-Type: image/png        (cuerpo binario)
200 { "Key": "user-images/6a1e…/5d1c9a52-8e43-4b8d-a1f0-3c9d7e2b6a14.png" }

GET {SUPABASE_URL}/storage/v1/object/authenticated/catalog/images/aurora.jpg
200 (cuerpo binario)
```

Falla: sin conexión la imagen queda en `file_upload_queue` y el cambio que la usa espera (`depends_on_upload_id`); con 401 o 403 se renueva el token una vez y, si persiste, `session.expired`.

### INT-10 Registro del esquema `windgets://` e instancia única — D-191

**HU que la usan:** HE-01-HU05, CD-02-HU01.

El instalador crea `HKCU\Software\Classes\windgets` (valor `URL Protocol` vacío) con `shell\open\command` = `"<ruta>\Windgets.exe" "%1"`. La aplicación usa el plugin de instancia única de Tauri y el de enlaces profundos: una segunda ejecución con una URL `windgets://auth/callback?...` entrega la URL a la instancia en ejecución y termina. Solo se acepta la ruta `auth/callback` y solo mientras hay un inicio de sesión con Google en espera (verifica `state`).

### INT-11 DPAPI y archivos de la aplicación — D-192, D-196, RNF-19

**HU que la usan:** HE-01-HU04, HE-16-HU03.

- Token: `CryptProtectData` / `CryptUnprotectData` con el alcance del usuario actual; archivo `%APPDATA%\Windgets\session.bin` con `{ access_token, refresh_token, expires_at, user_id }`. Al cerrar sesión se borra el archivo y la base local (D-190).
- Base local: `%APPDATA%\Windgets\windgets.db` (SQLite WAL). Archivos: `%APPDATA%\Windgets\files\`.
- Registro técnico: `%LOCALAPPDATA%\Windgets\logs`, hasta 5 archivos de 1 MB rotados, sin tokens, contraseñas ni contenido de tarjetas (D-196).

### INT-12 GitHub Releases, GitHub Actions y landing page — D-195, D-197

**HU que la usan:** CD-01-HU01, CD-01-HU02, HE-15-HU01.

- Publicación del instalador: cada versión es una *release* de GitHub con el activo de nombre **fijo** `Windgets-Setup.exe` (el flujo de publicación renombra la salida de NSIS; el nombre fijo permite el enlace `…/releases/latest/download/Windgets-Setup.exe`). Sin firma de código (D-194).
- Botón «Descargar para Windows» (CD-01-HU02): enlaza `https://github.com/${WINDGETS_GITHUB_REPO}/releases/latest/download/Windgets-Setup.exe`, donde `WINDGETS_GITHUB_REPO` es `<organizacion>/windgets` y se configura en `apps/landing/.env.example` (se lee en la compilación; valor pendiente de Estef: `preguntas_abiertas.md`); GitHub responde 302 al archivo. Para mostrar «No pudimos iniciar la descarga. Intenta de nuevo.» (CD-01-HU02-ET03), la landing consulta, al seleccionar el botón y antes de iniciar la descarga (no al cargar la página), `GET https://api.github.com/repos/${WINDGETS_GITHUB_REPO}/releases/latest` (CORS permitido; 60 solicitudes por hora por IP sin autenticar) y comprueba que existe el activo; si falla la consulta o no existe el activo, muestra el mensaje y deja el botón habilitado. Duda/propuesta (DP-14).
- Detección del sistema operativo en la landing (CD-01-HU01-ET08 a ET10): solo con `navigator.userAgentData` / `navigator.userAgent`; sin Windows → el botón sigue habilitado y se muestra «Windgets está disponible solo para Windows 10 versión 22H2 y Windows 11, de 64 bits.»; Windows con arquitectura distinta de x64 → «Es posible que tu equipo no cumpla los requisitos. El instalador lo comprobará antes de instalar.» y descarga habilitada. Textos fijos de la landing: los de CD-01-HU01-ET02 y ET11.
- GitHub Actions `keepalive`: cron diario que ejecuta `POST {SUPABASE_URL}/rest/v1/rpc/keepalive` con `apikey: <anon>` y falla si la respuesta no es `{ ok: true }` (D-197).
- GitHub Actions `release`: compila el Núcleo y las vistas, genera el instalador NSIS, lo publica con el nombre fijo.

**Ejemplo de INT-12**

```json
GET https://api.github.com/repos/<organización>/windgets/releases/latest
200 { "tag_name": "v1.0.0", "assets": [ { "name": "Windgets-Setup.exe", "size": 94371840, "browser_download_url": "https://github.com/<organización>/windgets/releases/download/v1.0.0/Windgets-Setup.exe" } ] }
403 { "message": "API rate limit exceeded" }
```

Con 403 (límite de 60 por hora por IP) o sin el activo, la landing muestra «No pudimos iniciar la descarga. Intenta de nuevo.» y deja el botón habilitado (CD-01-HU02-ET03).

### INT-13 Instalador .exe todo en uno (CD-02) — D-194

**HU que la usan:** CD-02-HU01, CD-02-HU02, CD-02-HU03.

Contrato del instalador (NSIS de Tauri con plantilla propia). Instala por usuario, sin permisos de administrador, e incluye el instalador completo de WebView2 (se ejecuta en silencio si falta).

| Elemento | Contrato | Fuente |
| --- | --- | --- |
| Integridad | Verifica el archivo antes de cambiar nada; si está incompleto o dañado muestra «El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page.» y no instala | CD-02-HU01-ET17, CA12 |
| Comprobación previa | Windows 10 versión 22H2 (compilación 19045) o Windows 11 (compilación 22000 o posterior), 64 bits con procesador x64, 500 MB libres. Sin cumplir: «Este computador no es compatible. Necesitas Windows 10 versión 22H2 o Windows 11, de 64 bits (x64).» | CD-02-HU01-ET03, ET04, CA03; D-050 |
| Espacio | Menos de 500 MB: el paso Opciones muestra espacio disponible y requerido, el mensaje «No hay suficiente espacio en disco. Libera al menos 500 MB e intenta de nuevo.» y deshabilita «Instalar» | CD-02-HU01-ET05, CA04 |
| Paso Opciones | Casilla «Abrir la aplicación al iniciar Windows» (marcada por defecto, D-051), botones «Instalar» y «Cancelar» | CD-02-HU02-CA01, CA02 |
| Instalación | Copia por usuario a `%LOCALAPPDATA%\Programs\Windgets`; crea accesos directos en el escritorio y en el menú Inicio; registra el esquema `windgets://` (INT-10); registra el inicio automático solo si la casilla está marcada (INT-08); registra la entrada de desinstalación del usuario; no modifica ni borra el .exe descargado | CD-02-HU01-ET06, ET10, ET11, ET12 |
| Final | «Instalación completada.» con la opción «Abrir Windgets» y el texto «Ya puedes eliminar el archivo del instalador que descargaste.»; «Abrir Windgets» abre la aplicación en Inicio de sesión | CD-02-HU01-CA01, CA02 |
| Ya instalada | «Windgets ya está instalada. ¿Deseas reinstalarla?» con «Reinstalar» (repite la instalación completa y muestra «Instalación completada.») y «Cancelar» (se cierra sin cambios) | CD-02-HU01-ET08, ET18, CA05 a CA07 |
| Instalación incompleta | «Encontramos una instalación incompleta. Vamos a repararla.» con «Reparar» (borra los archivos incompletos e instala de nuevo) y «Cancelar» | CD-02-HU01-ET09, ET19, CA09 a CA11 |
| Falla | Revierte los cambios y muestra «No pudimos completar la instalación. No se hicieron cambios en tu computador.» con «Reintentar» y «Cerrar». Sin archivos ni entradas residuales (RNF-15) | CD-02-HU01-ET07, CA08 |
| Cancelar | «¿Deseas cancelar la instalación?» con «Cancelar instalación» (revierte; «La instalación se canceló.») y «Seguir instalando». Desde el paso Opciones, «Cancelar instalación» cierra sin cambios porque todavía no se instaló nada | CD-02-HU03-ET03, ET04, ET06, ET07, CA01 a CA06 |
| Códigos de salida | `0` instalada; `1` cancelada; `2` computador no compatible o sin espacio; `3` instalador dañado; `4` falla con reversión (Duda/propuesta DP-19, solo para pruebas automáticas) | — |
| Primera apertura | Sin sesión: pantalla Inicio de sesión y fondo original de Windows | CD-02-HU01-CA02; HE-02-HU01-CA05 |

Fuera de alcance: actualizar una instalación existente y desinstalar no tienen HU (D-194; DP-15).

## Catálogo · (e) Cobertura de historias de usuario por contratos

Cada fila indica los contratos que usa cada historia de usuario (una HU puede apoyarse en contratos citados solo por su criterio de aceptación o por su especificación técnica; el detalle, contrato por contrato y criterio por criterio, está en `trazabilidad_contratos.csv`).

| HU | Contratos |
| --- | --- |
| CD-01-HU01 | INT-12 |
| CD-01-HU02 | INT-12 |
| CD-02-HU01 | INT-10, INT-13 |
| CD-02-HU02 | INT-08, INT-13 |
| CD-02-HU03 | INT-13 |
| HE-01-HU01 | IPC-AUTH-01, RPC-05, INT-01 |
| HE-01-HU02 | IPC-AUTH-01, INT-01 |
| HE-01-HU03 | IPC-AUTH-02, IPC-AUTH-03, IPC-AUTH-04, INT-01, INT-02 |
| HE-01-HU04 | IPC-AUTH-05, IPC-AUTH-12, EV-01, INT-01, INT-11 |
| HE-01-HU05 | IPC-AUTH-06, IPC-AUTH-07, EV-02, INT-01, INT-10 |
| HE-01-HU06 | IPC-AUTH-08, RPC-05, INT-01, INT-02 |
| HE-01-HU07 | IPC-AUTH-09, IPC-AUTH-10, INT-01, INT-02 |
| HE-01-HU08 | IPC-AUTH-11, INT-01 |
| HE-02-HU01 | IPC-AUTH-12, IPC-CAT-04, IPC-DESK-01, IPC-DESK-02, IPC-THEME-02, EV-01, EV-16, EV-17, RPC-04, INT-07 |
| HE-02-HU02 | IPC-CAT-01, IPC-CAT-02, IPC-THEME-05, EV-25, RPC-04 |
| HE-02-HU03 | IPC-CAT-01, IPC-CAT-03, IPC-THEME-05, EV-25, RPC-04, INT-09 |
| HE-02-HU04 | IPC-THEME-05 |
| HE-02-HU05 | IPC-THEME-05 |
| HE-02-HU06 | IPC-CAT-01, IPC-THEME-05, RPC-04 |
| HE-02-HU07 | IPC-CAT-01, IPC-THEME-05, RPC-04 |
| HE-02-HU08 | IPC-THEME-06 |
| HE-02-HU09 | IPC-THEME-05, EV-14 |
| HE-02-HU10 | IPC-THEME-03, IPC-THEME-04 |
| HE-02-HU11 | IPC-THEME-07 |
| HE-02-HU12 | IPC-THEME-09, EV-11 |
| HE-02-HU13 | IPC-THEME-10, IPC-THEME-11, EV-14 |
| HE-03-HU01 | IPC-THEME-01 |
| HE-03-HU02 | IPC-THEME-08, EV-10 |
| HE-03-HU03 | IPC-THEME-12, EV-10 |
| HE-03-HU04 | IPC-THEME-13, EV-10 |
| HE-03-HU05 | IPC-THEME-14, EV-10 |
| HE-03-HU06 | IPC-THEME-02, EV-11 |
| HE-04-HU01 | IPC-WID-01 |
| HE-04-HU02 | IPC-WID-03, EV-12 |
| HE-04-HU03 | — |
| HE-04-HU04 | IPC-WID-02, IPC-WID-04 |
| HE-04-HU05 | IPC-WID-04, IPC-WID-05, IPC-WID-07, EV-12, EV-20, EF-02, EF-03, INT-04 |
| HE-04-HU06 | IPC-WID-04, IPC-WID-07, EV-12, EV-20, EF-04, INT-05 |
| HE-04-HU07 | IPC-CAT-03, IPC-CAT-04, IPC-WID-04, EV-12, INT-09 |
| HE-04-HU08 | IPC-CAT-03, IPC-WID-04, EV-12, INT-09 |
| HE-04-HU09 | IPC-CAT-01, IPC-WID-04, EV-12, EV-21, INT-07 |
| HE-04-HU10 | IPC-WID-04, EV-12 |
| HE-04-HU11 | IPC-MED-01, IPC-WID-04, EV-12, EV-19, INT-06 |
| HE-04-HU12 | IPC-WID-05, EV-12, EF-02, INT-04 |
| HE-04-HU13 | IPC-WID-06, EV-12 |
| HE-05-HU01 | IPC-LAY-01, INT-07 |
| HE-05-HU02 | IPC-LAY-02, EV-15 |
| HE-05-HU03 | IPC-LAY-03, EV-15 |
| HE-05-HU04 | IPC-LAY-05, EV-13, EV-15 |
| HE-05-HU05 | IPC-LAY-04, IPC-LAY-06, EV-15 |
| HE-06-HU01 | EV-18, INT-07 |
| HE-06-HU02 | IPC-CARD-08, EV-07, EV-22 |
| HE-06-HU03 | IPC-CARD-07 |
| HE-06-HU04 | IPC-CARD-06, IPC-COL-01 |
| HE-06-HU05 | IPC-CARD-05, IPC-CARD-15, EV-09 |
| HE-06-HU06 | IPC-CARD-06 |
| HE-06-HU07 | IPC-CARD-12 |
| HE-06-HU08 | IPC-DESK-03, EV-23 |
| HE-06-HU09 | IPC-MED-02, IPC-MED-03, IPC-MED-04, EV-19, INT-06 |
| HE-06-HU10 | IPC-DESK-09, INT-05 |
| HE-07-HU01 | IPC-CARD-01, EV-07 |
| HE-07-HU02 | IPC-CARD-01, IPC-CARD-02, IPC-LABEL-01 |
| HE-07-HU03 | IPC-CARD-04 |
| HE-07-HU04 | IPC-CARD-02, EV-07 |
| HE-07-HU05 | IPC-CARD-03, EV-07 |
| HE-08-HU01 | IPC-LABEL-01 |
| HE-08-HU02 | IPC-CAT-01, IPC-LABEL-02, EV-08 |
| HE-08-HU03 | IPC-LABEL-03, EV-08 |
| HE-08-HU04 | IPC-LABEL-04, IPC-LABEL-05, EV-07, EV-08 |
| HE-09-HU01 | IPC-CARD-05, IPC-COL-01 |
| HE-09-HU02 | IPC-CARD-06, EV-07 |
| HE-09-HU03 | IPC-CAT-01, IPC-COL-02, EV-09 |
| HE-09-HU04 | IPC-COL-03, EV-09 |
| HE-09-HU05 | IPC-COL-04, EV-09 |
| HE-09-HU06 | IPC-COL-05, IPC-COL-06, EV-07, EV-09 |
| HE-09-HU07 | IPC-DESK-12, IPC-DESK-13, EV-26 |
| HE-10-HU01 | IPC-CARD-12 |
| HE-10-HU02 | IPC-CARD-13 |
| HE-10-HU03 | IPC-CARD-14 |
| HE-10-HU04 | IPC-CARD-01, IPC-CARD-14 |
| HE-10-HU05 | IPC-CARD-12, EV-22 |
| HE-11-HU01 | IPC-CARD-09 |
| HE-11-HU02 | IPC-CARD-10, EV-07 |
| HE-11-HU03 | IPC-CARD-11, EV-07 |
| HE-12-HU01 | IPC-CARD-08 |
| HE-12-HU02 | IPC-CARD-07, EV-07 |
| HE-12-HU03 | IPC-CARD-08 |
| HE-13-HU01 | IPC-REP-01 |
| HE-13-HU02 | IPC-REP-01, IPC-REP-02, IPC-REP-03 |
| HE-13-HU03 | IPC-REP-04 |
| HE-13-HU04 | IPC-REP-05 |
| HE-13-HU05 | IPC-LABEL-01, IPC-LABEL-05, IPC-REP-02, EV-08 |
| HE-14-HU01 | IPC-WIN-01, IPC-WIN-02, EF-01, INT-03 |
| HE-14-HU02 | IPC-WIN-02, EF-01, INT-03 |
| HE-14-HU03 | IPC-WIN-02, IPC-WIN-03, IPC-WIN-04, EF-01, INT-03 |
| HE-14-HU04 | IPC-WIN-02, IPC-WIN-03, EF-01, INT-03 |
| HE-14-HU05 | IPC-WIN-02, IPC-WIN-03, EF-01, INT-03 |
| HE-14-HU06 | IPC-WIN-02, IPC-WIN-03, EF-01, INT-03 |
| HE-14-HU07 | IPC-WIN-02, IPC-WIN-03, EF-01, INT-03 |
| HE-14-HU08 | IPC-WIN-02, INT-03 |
| HE-14-HU09 | IPC-WIN-02, EF-01, INT-03 |
| HE-15-HU01 | RPC-02, RPC-06, INT-09, INT-12 |
| HE-15-HU02 | IPC-DESK-14, IPC-WID-07, EV-03, EV-04, INT-01 |
| HE-15-HU03 | EV-05, EV-06, EV-07, RPC-01, RPC-02, RPC-03 |
| HE-15-HU04 | IPC-DESK-01, EV-10, EV-11, EV-13, RPC-02, RPC-03, INT-07 |
| HE-16-HU01 | IPC-SYNC-01, EV-04 |
| HE-16-HU02 | IPC-DESK-10, IPC-DESK-11, INT-08 |
| HE-16-HU03 | IPC-AUTH-13, IPC-AUTH-14, EV-01, INT-01, INT-11 |
| HE-17-HU01 | IPC-DESK-06, INT-07 |
| HE-17-HU02 | IPC-DESK-04, IPC-DESK-05, EV-23, INT-07 |
| HE-17-HU03 | IPC-DESK-07, IPC-DESK-08, IPC-THEME-10, EV-24, INT-07 |

Total de contratos: 99 comandos IPC, 26 eventos, 6 funciones RPC, 4 Edge Functions y 13 integraciones externas.

## Catálogo · (f) Contratos sin historia de usuario

Ninguno: los 148 contratos citan al menos una historia de usuario o criterio de aceptación que los exige. Se conservan, con su justificación, los contratos cuya historia de usuario lo exige solo por una especificación técnica: `auth_register_cancel` (HE-01-HU03-ET10), `app_set_last_screen` (HE-17-HU02-ET05), `connectivity_get` (RT-01-ET07; HE-15-HU02-CA05), `asset_resolve` (HE-02-HU01-ET05), la RPC `server_time` (HE-15-HU03-CA08) y la RPC `keepalive` (HE-15-HU01-ET09). Los trabajos internos `purge_tombstones()` y `purge_unconfirmed_users()` no son contratos de comunicación (ver c.1).

## Catálogo · (g) Historias de usuario sin contrato

HE-04-HU03: la historia de usuario es solo de presentación. El widget Reloj muestra la hora del sistema que la capa ya conoce (HE-04-HU03-ET01): no lee ni escribe entidades, no llama a la nube y no necesita comando, evento ni RPC. Su activación o desactivación pasa por `widget_set_active` (HE-04-HU02), común a todos los widgets.

Las historias de usuario cuyo contrato es solo una regla o una integración, sin comando propio, son: HE-14-HU02 y HE-14-HU08 (personalidad y respuestas sobre el funcionamiento: se cumplen con la instrucción del sistema de INT-03), HE-06-HU01 (se apoya en EV-18 e INT-07), CD-01-HU01 y CD-01-HU02 (INT-12). Las reglas transversales RT-01 a RT-04 son reglas de presentación; solo `RT-04-CA13` produce el contrato `service.unavailable` (1.3).

## Catálogo · (h) Dudas y propuestas

| ID | Duda o propuesta | Razón |
| --- | --- | --- |
| DP-01 | Exportar los textos de `messages.rs` a `messages.es.json` en la compilación. | Las vistas validan campos al instante con el mismo texto del Núcleo, sin dos copias (D-188). |
| DP-02 | `internal.unexpected` sin texto de interfaz. | El backlog no define un mensaje para errores no previstos; se registra en el registro técnico (D-196). |
| DP-03 | `auth_google_start` sin conexión: «No hay conexión a internet. Conéctate para iniciar sesión.» | HE-01-HU05 no define el texto; se reutiliza el de HE-01-HU04-CA10. |
| DP-04 | `card.not_found` fuera de editar usa «Esta tarjeta ya no existe.» | El backlog solo lo define al editar (HE-07-HU04-CA11); el mismo hecho puede ocurrir al eliminar, mover o consultar. |
| DP-05 | `column_reorder` no devuelve mensaje de resultado. | HE-09-HU05 no define uno. |
| DP-06 | `catalog_refresh` sin conexión no muestra mensaje y se usa la caché. | HE-15-HU02-ET02 exige conexión pero no define texto. |
| DP-07 | `widget_add` y `widget_configure` de Clima sin conexión: «No hay conexión a internet. Conéctate para validar la ciudad.» | El backlog define solo el aviso del widget ya agregado. |
| DP-08 | `email_is_registered` no limita las consultas por sí misma; se propone limitar por IP en el borde de Supabase. | Expone la existencia de una cuenta, requisito de HE-01-HU01-CA08. |
| DP-09 | Si el regreso de Google no llega en 5 minutos, el Núcleo vence la espera y devuelve `cancelled`. | El backlog no fija el tiempo máximo. |
| DP-10 | Sin mensaje definido cuando el correo del código no llega. | El usuario puede pedir un nuevo código con «Reenviar código». |
| DP-11 | Asunto, texto y remitente de los correos de Auth. | El backlog no los define. |
| DP-12 | Sin cuota por usuario para Windi. | Solo aplica el límite del nivel gratuito de Gemini (D-132). |
| DP-14 | La landing consulta `api.github.com` antes de iniciar la descarga. | Es la forma de mostrar «No pudimos iniciar la descarga. Intenta de nuevo.» sin servidor propio (CD-01-HU02-ET03). |
| DP-15 | Actualizar una instalación existente y desinstalar no tienen HU. | D-194 deja la actualización automática fuera de alcance. |
| DP-16 | El borrador del tema en edición vive solo en memoria del Núcleo. | El modelo de datos no lo guarda; si la aplicación se cierra de forma inesperada, se pierde. |
| DP-17 | Clima: Open-Meteo. | Sin clave ni costo; el backlog no nombra proveedor. |
| DP-18 | Noticias: GNews con edición `co` y `lang=es`. | El backlog no nombra proveedor ni edición. |
| DP-19 | Códigos de salida del instalador (0 a 4). | Solo para pruebas automáticas. |
| DP-20 | Sin hueco libre al agregar un widget, el widget queda en (0, 0). | Ningún CA define qué ocurre cuando el escritorio no tiene espacio; el usuario lo acomoda en «Editar escritorio». |
