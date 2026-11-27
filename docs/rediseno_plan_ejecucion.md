# Rediseño · plan de ejecución con un chat coordinador (25-nov-2026, hora de Colombia)

Borrador local de Paula (sin commit). Complementa `docs/rediseno_plan_codigo.md` (lotes L0 a L10); no lo reemplaza.

## Decisiones de Paula (25-nov)

1. El Figma vigente pasa a `A3Z03L20swFyo8qdP9jETF` («Windgets (Copy)»). Se anota un RD nuevo que reemplaza RD-82.
2. Se continúa el plan por lotes desde L4 hasta L10, más un lote de ajuste con las diferencias de A3Z03.
3. El diff A3Z03 contra `GdUKUwVHz3Wm0Dqw16UX8k` se hace cuando el Figma esté cerrado.

## Punto de partida

Rama `paso-44-componentes-base`, última RD-101. L0 a L3 casi hechos (botones, íconos, errores visibles, catálogo de temas).
Antes de L4: confirmar la punta, correr la verificación completa una vez y partir de verde.

## Un chat que delega (gasto de tokens)

- Un solo chat coordinador: planea, pregunta y revisa. No escribe código de más de una pieza.
- `implementador`: una pieza (un commit) por encargo, de una en una. `verificador`: verificación al cerrar el lote.
  `revisor`: solo en lotes de riesgo (datos, migraciones, sesión, sincronización).
- Encargo corto: objetivo, archivos, RD y reglas, pruebas que deben pasar, «terminado». Sin historial.
- Figma: cada agente lee solo sus nodos con `get_design_context` y guarda lo útil como texto. Nunca `get_metadata` de
  una página entera en el chat principal (la página 02 pesa unos 100 000 caracteres): se hace dentro de un subagente.
- Capturas y vista en vivo: una sola tanda al cierre del lote, claro y oscuro.

## Orden

| Paso | Qué | Nota |
|---|---|---|
| 0 | RD nuevo de fuente de verdad A3Z03 | Primer commit del lote |
| 1 | Cuando el Figma cierre: subagente genera la tabla de diferencias por pantalla (nueva, cambiada, igual) | Sale a `.trabajo/`, no al repo |
| 2 | Discrepancias entre Figma y HU/RD: se preguntan juntas, con opciones, al empezar cada lote | Lo aprobado se vuelve RD |
| 3 | L4 · aplicar componentes base a todas las pantallas | Mecánico: va en lotes por área |
| 4 | L5 Planificador · L6 Personalización · L7 Windi · L8 Cuenta | Una hoja de estilos por área |
| 5 | L9 · ajuste al Figma cerrado | Solo lo que dé la tabla del paso 1 |
| 6 | L10 · HU v13 | Aparte, no es estético |

Un PR por paso. Verificación completa una vez por lote, sobre la punta.

## Casos borde que todo lote revisa

Error, vacío, cargando, sin conexión, deshabilitado y foco; claro y oscuro; 1200×800 y mínimo 960×600; escala de
Windows 100 a 150 %; sin scroll horizontal; ningún camino previsible al error genérico.
