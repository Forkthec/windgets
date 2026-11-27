# Estrategia de ejecución de los lotes (25-nov-2026, UTC-5)

Alcance que pidió Paula: **todo** (cierre de L1 y L2 a L10) para el jueves 26-nov. Plan: `docs/rediseno_plan_codigo.md` §2 y §3.

## Cómo se trabaja (reglas globales en `~/.claude/CLAUDE.md`, «Gasto de tokens»)

Por lote, en este orden:

1. **Preparar (principal).** Leer solo la sección del lote y los IM o D que cite. Juntar todas las dudas y preguntarlas una vez.
2. **Rama** `paso-NN-<tema>`, apilada sobre el lote anterior si aún no está fusionado.
3. **Piezas, de una en una** con `implementador` (una pieza = un commit). Encargo: objetivo, archivos, fuente (IM/D/RD con
   líneas), pruebas, número de RD reservado, prefijo y trailer. La fila RD, la línea «Pendiente» y DUDAS van en el mismo commit.
4. **Revisión** con `revisor` donde la tabla dice «sí», apenas esté el primer tercio.
5. **Vista en vivo** (principal), una tanda, solo lo visible, 1200 × 800, claro y oscuro. Los datos simulados van en la pieza.
6. **Verificación** completa con `verificador`, una vez sobre la punta. Un fallo vuelve a `implementador`.
7. **Cierre:** ESTADO.md y entregas en el chat (orden de lectura, requisito → prueba, resultado, prueba manual). Push y PR solo
   con el sí de Paula.

Relevo: `ESTADO.md` se actualiza después de cada pieza, así un corte por el límite no pierde nada.

## Orden y piezas

Orden recomendado: primero lo que protege la entrega y, antes de L6, los dos lotes pequeños; si falta tiempo, falta menos.
Tamaño relativo frente a L0 + L1 (= 1), estimado sin medir.

| Orden | Lote | Piezas (una por commit) | Tamaño | Revisor | Vista en vivo | Preguntar antes |
|---|---|---|---|---|---|---|
| 1 | L1 cierre | RD-92; RD-93; DUDAS | 0,2 | no | mensajes | — |
| 2 | L2 datos | `0010` temas Windgets + local + tokens; `0011` máximo 3 etiquetas (V-02); `is_day`; `card_list_upcoming` | 0,8 | sí | no | IM-01, D-06 |
| 3 | L3 base | `Boton`; `NombreEmergente`; íconos; ranura `acciones` + `Panel`; mensajes arriba a la derecha; ojos de Windi | 0,8 | no | al juntar con L4 | — |
| 4 | L4 aplicar | botones a ícono (por grupo de pantallas); controles a la línea del título; `Panel` por pantalla | 1 | no | una tanda L3 + L4 | inventario IM-03 |
| 5 | L5 planificador | Diario ampliado; Calendario con información; Kanban; anillo de Reportes | 1,2 | sí | sí | choque 4 de §0 |
| 6 | L7 Windi | chat en panel; chat en widget; cerrar y enviar como íconos | 0,4 | no | sí | — |
| 7 | L8 cuenta | esquina doblada; «Regresar» como flecha + e2e | 0,2 | no | sí | — |
| 8 | L6 personalización | comprobar Núcleo de D-21 (solo lectura); entrada única en el menú; pasos como pestañas y vista previa; borrador y widgets por tema; «Organizar widgets»; «Mis temas»; widgets del escritorio | 2 | sí | sí | D-21, DI-02 |
| 9 | L10 HU v13 | una pieza por HU elegida | 2 o más | sí | sí | **cuáles entran** (el plan lo exige) |
| 10 | L9 Figma | por marco tocado: diferencia → RD + Playwright | ? | no | no | acceso al Figma |

## Cabe o no cabe

L2 a L10 suman unas 8 a 10 veces lo que costó L0 + L1 (unos 90 minutos de sesión). Aun con menos contexto por petición, no es
realista tenerlo todo el 26-nov. Puntos de corte para decidir con Paula: al cerrar L2, L4 y L5. Lo que no entre queda en
`docs/DUDAS.md` con su destino.

## Cómo saber si el ahorro funciona

Después de L2, repetir la medición (contexto medio por petición del chat principal y de los agentes). Referencia: 185 mil de media,
84 mil en la primera petición. Si delegar no baja el total, se vuelve a trabajar en el chat principal y se le avisa a Paula.
