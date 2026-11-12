# Especificación de construcción

Todo lo que un agente de código necesita para construir la aplicación, la landing page y el instalador por vibecoding sin hacer preguntas. Empiece por AGENTS.md. Los archivos conservan los nombres que lee el agente de código y sus herramientas (D-200); esta carpeta corresponde a la emisión del 09/11/2026, versión 1.

**Versión vigente:** `AGENTS.md`, `CD-01.md`, `CD-02.md`, `HE-01.md`, `HE-02.md`, `HE-03.md`, `HE-04.md`, `HE-05.md`, `HE-06.md`, `HE-07.md`, `HE-08.md`, `HE-09.md`, `HE-10.md`, `HE-11.md`, `HE-12.md`, `HE-13.md`, `HE-14.md`, `HE-15.md`, `HE-16.md`, `HE-17.md`, `README.md`, `RT.md`, `arquitectura.md`, `contratos.md`, `convenciones.md`, `datos.md`, `interfaz.md`, `pendientes_definicion.md`, `plan_construccion.md`, `producto.md`, `tipos.ts`, `trazabilidad_contratos.csv`, `windgets_local.dbml`, `windgets_nube.dbml` (09/11/2026).

## Archivos y versiones

| Archivo | Fecha | Estado |
| --- | --- | --- |
| AGENTS.md | — | Vigente |
| arquitectura.md | — | Vigente |
| CD-01.md | — | Vigente |
| CD-02.md | — | Vigente |
| contratos.md | — | Vigente |
| convenciones.md | — | Vigente |
| datos.md | — | Vigente |
| HE-01.md | — | Vigente |
| HE-02.md | — | Vigente |
| HE-03.md | — | Vigente |
| HE-04.md | — | Vigente |
| HE-05.md | — | Vigente |
| HE-06.md | — | Vigente |
| HE-07.md | — | Vigente |
| HE-08.md | — | Vigente |
| HE-09.md | — | Vigente |
| HE-10.md | — | Vigente |
| HE-11.md | — | Vigente |
| HE-12.md | — | Vigente |
| HE-13.md | — | Vigente |
| HE-14.md | — | Vigente |
| HE-15.md | — | Vigente |
| HE-16.md | — | Vigente |
| HE-17.md | — | Vigente |
| interfaz.md | — | Vigente |
| pendientes_definicion.md | — | Vigente |
| plan_construccion.md | — | Vigente |
| producto.md | — | Vigente |
| RT.md | — | Vigente |
| tipos.ts | — | Vigente |
| trazabilidad_contratos.csv | — | Vigente |
| windgets_local.dbml | — | Vigente |
| windgets_nube.dbml | — | Vigente |

## Subcarpetas

- [img](<img/README.md>): img
- [local](<local/README.md>): local
- [marca](<marca/README.md>): marca
- [pruebas](<pruebas/README.md>): pruebas
- [secuencias](<secuencias/README.md>): secuencias
- [supabase](<supabase/README.md>): supabase

## Dependencias y regeneración

- **Depende de:** Historias de usuario v11 y modelos de 04-diseno-desarrollo.
- **Cómo se regenera:** Los archivos por épica (HE-nn.md, CD-nn.md, RT.md) y el plan se generan con `GPI/_trabajo/scripts/gen_especificacion.py` y `GPI/_trabajo/scripts/ensamblar_especificacion.py`; ver `00-gobierno-plantillas/00.5-fuentes-regeneracion/09112026_v1_fuente_especificacion_construccion.md`.
- **Paquete del EDT:** 1.3.7 Especificación de construcción para vibecoding
