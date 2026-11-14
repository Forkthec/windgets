---
name: siguiente-paso
description: Construye el siguiente paso del plan de windgets (docs/plan_construccion.md) que no esté bloqueado. Crea la rama paso-NN-tema y construye HU por HU, con una prueba por CA y un commit por HU. Úsala cuando ESTADO.md no tenga un paso en curso o el actual esté cerrado.
---

# Siguiente paso

## 0. Antes de empezar
- Si en esta sesión no leíste `.trabajo/ESTADO.md`, corre primero `/retomar`.
- Reglas que siempre aplican: `docs/AGENTS.md` (reglas duras), `CLAUDE.md` del repositorio y el global.
  `docs/` no se edita, salvo agregar líneas a `docs/DUDAS.md`.

## 1. Elegir el paso (sin depender de nadie)
El estado de los pasos vive en GitHub, no en un archivo local. Cualquier persona o cuenta obtiene el mismo resultado:
- Corre `bash herramientas/estado.sh`. Muestra cada paso del plan como `fusionado`, `en PR abierto`,
  `en rama sin PR` o `libre`. Lo que ya tomó otra persona no se repite.
- Toma el primer paso `libre`, en el orden de `docs/plan_construccion.md`, que cumpla:
  - sus dependencias («Depende de» en el plan) están `fusionado` o en un PR abierto;
  - no tiene una condición de entrada sin cumplir. Se lee en la sección del paso y en `docs/DUDAS.md`
    (ejemplo: P06 y P07 piden la evidencia aprobada del spike P01 pegada en `docs/DUDAS.md`; si no está, se detiene
    y se avisa a quien te dirige y al Gerente de Proyecto, como manda `docs/AGENTS.md`);
  - no es un paso que pide cuentas externas que faltan (Supabase, Gmail): en ese caso se usan dobles de prueba y
    se anota la DUDA, como dice el plan.
- Decide la base:
  - Si las dependencias están fusionadas: `origin/main`.
  - Si una dependencia está en un PR sin fusionar y el paso usa su código: apílalo sobre esa rama.
  - Si no usa su código: `origin/main` (no se apila sin necesidad).
- **Reserva el paso antes de construir:** `git switch -c paso-NN-<tema> <base>`, un commit inicial vacío
  (`git commit --allow-empty -m "infra: reservar el paso PNN"` con el trailer `Co-Authored-By`), `git push -u origin paso-NN-<tema>` y un PR en
  borrador con título `PNN · <tema> [IA-ASISTIDO]`. Desde ese momento `estado.sh` lo muestra `en PR abierto` y nadie más lo toma.
  Si al hacer push la rama ya existe, otra persona lo tomó: vuelve a correr `estado.sh` y elige otro.
- Anota la base y su SHA en tu `.trabajo/ESTADO.md` (opcional: es un apunte tuyo, no la fuente de verdad).

## 2. Leer solo lo necesario
- La sección del paso en `plan_construccion.md`.
- `RT.md` (reglas transversales) si los CA lo citan.
- La sección completa de cada HU en `docs/HE-nn.md` o `docs/CD-nn.md`: CA, ET (especificaciones técnicas),
  «Datos de prueba mínimos» y mensajes. Busca la HU con grep y lee solo su sección.
- En `contratos.md`, los comandos, eventos y códigos de error que la HU cita. En `datos.md`, las tablas que cita.

## 3. Por cada HU, en el orden del plan
1. Copia a ESTADO («HU en curso») la lista de CA y ET con casillas.
2. Primero las pruebas: una por CA, con el ID en el nombre (`ca_he_07_hu01_ca05` en Rust;
   `HE-07-HU01-CA05` en Vitest y Playwright).
3. Implementa:
   - Reglas de negocio en el Núcleo en Rust (D-188, validación en el Núcleo). React solo presenta y repite
     las validaciones de campo.
   - Textos literales copiados del CA, carácter por carácter, en `messages.rs`.
   - Errores previsibles con su código de `contratos.md`. Nunca `internal.unexpected` para algo previsible.
     Los errores de forma de un formulario se devuelven todos a la vez, uno por campo.
   - Tipos en Rust y generados a TS con ts-rs. Si el Núcleo simulado (`simulado.ts`) responde un comando, la
     respuesta es la que define la HU.
   - Código Win32 dentro de `#[cfg(windows)]`, con `#![allow(unsafe_code)]` solo en ese módulo y un
     comentario `// SAFETY:` por bloque.
4. Si algo es «NO DEFINIDO»: valor neutro, `// DUDA: <HU> <qué falta>` y una línea en `docs/DUDAS.md`.
5. Verifica solo lo que tocaste: `/verificar` con `PASOS` reducidos (`test` o `vitest`, más `clippy` si
   cambió Rust).
6. Repasa las ET: cada una con su prueba o con una comprobación manual anotada en ESTADO.
7. Commit `HE-nn-HUnn: <verbo y objeto>` (o `RT-nn: <tema>`), con la descripción de los IDs en el cuerpo.
   Sin `[IA-ASISTIDO]`. Termina con `Co-Authored-By: Claude <modelo> <noreply@anthropic.com>`.
8. Actualiza ESTADO (HU cerrada, «Próxima acción»), agrega una línea a la bitácora y haz
   `git push -u origin paso-NN-<tema>`.

## 4. Punto de guardado
Cada 45 minutos, y antes de cualquier tarea larga, reescribe «Próxima acción» en ESTADO. Debe ser una orden
concreta: archivo, función y la prueba que falta. Si el cupo se acaba, la cuenta siguiente sigue desde ahí.

## 5. Al terminar la última HU
Corre `/cerrar-paso`.

## Prohibido
Inventar pantallas, campos o mensajes. Editar `docs/` (salvo DUDAS.md) o una migración aplicada (0001 a
0005). Escribir secretos. Bajar una regla de lint o borrar una prueba. Fusionar un PR. Hacer push a `main`
o con fuerza.
