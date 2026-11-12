# AGENTS.md · Entrada para el agente que construye Windgets

## Misión

Construir Windgets completo: la aplicación de escritorio para Windows (wallpaper personalizable y planificador), la landing page (CD-01) y el instalador .exe (CD-02), sin hacer preguntas al equipo. Esta carpeta es `docs/` del repositorio `windgets` (D-200). Todo lo que necesitas está aquí; lo que no está se marca «NO DEFINIDO».

## Orden de lectura

1. `README.md`: mapa de la carpeta y glosario mínimo.
2. `producto.md`: qué es Windgets, roles, alcance y lo que queda fuera.
3. `arquitectura.md`: contenedores, Núcleo en Rust y vistas en React, decisiones D-185 a D-200.
4. `convenciones.md`: estructura del repositorio, estilo, nombres, pruebas, secretos y cómo ejecutar, empaquetar, desplegar.
5. `plan_construccion.md`: el orden de los pasos. Empieza por el spike de WorkerW y Raw Input.
6. `datos.md`, `contratos.md`, `interfaz.md`: modelos de referencia. Los consultas cuando una HU los cita.
7. `RT.md`: reglas transversales RT-01 a RT-04 (menú, ventanas emergentes, formularios, mensajes). Se construyen primero.
8. El archivo de la épica que toca el paso (`HE-nn.md` o `CD-nn.md`): una sección por HU con todo lo que necesitas.
9. `pendientes_definicion.md`: vacíos conocidos.

## Reglas duras

1. **No inventes funciones.** Si algo no está en un CA, una ET, un contrato o un modelo de esta carpeta, no se construye. Tampoco agregues pantallas, campos, opciones ni mensajes.
2. **Los textos entre «…» son literales.** Cópialos carácter por carácter desde el CA o la ET (mayúsculas, tildes, puntuación, comillas curvas “…” dentro del texto). Los marcadores `<alias>`, `<cantidad>` y similares son datos variables.
3. **Los CA y las ET mandan.** Cuando un resumen de esta carpeta y un CA o una ET difieran, gana el CA o la ET del archivo de la épica. Cada HU se cierra solo cuando todos sus CA pasan (Dado, Cuando, Entonces) y todas sus ET de la lista de verificación están marcadas.
4. **Un commit por HU.** Mensaje: `HE-nn-HUnn: <verbo y objeto de la HU>`. Los commits de infraestructura usan `infra: <tema>`; los de reglas transversales, `RT-nn: <tema>`.
5. **Pruebas antes de cerrar una HU.** Escribe una prueba por CA (cargo test para el Núcleo, Vitest para las vistas, Playwright para recorridos) y ejecútalas. No cierres una HU con una prueba en rojo ni omitida. Los RNF aplicables de la HU se miden con el método que indica su tabla.
6. **Las reglas de negocio viven en el Núcleo (Rust).** React presenta y repite solo las validaciones de campo para mostrar el mensaje al instante; el Núcleo vuelve a validar (D-188). Las vistas nunca llaman a la nube ni a servicios externos.
7. **Los tipos se definen una vez en Rust** y se generan a TypeScript con ts-rs. `tipos.ts` es la referencia de lo que debe resultar.
8. **Secretos fuera del repositorio** (D-192). El ejecutable solo contiene la URL del proyecto de Supabase y la clave pública (anon). Nunca escribas claves de Gemini, clima, noticias, la contraseña de aplicación de Gmail ni la clave de servicio en código, `.env` versionado, registros o capturas. Usa `.env.example` con valores vacíos.
9. **Respeta la identidad visual** (`interfaz.md`): sin transparencias apiladas, desenfoque ni vidrio; el significado nunca depende solo del color.
10. **Cambios al esquema**: solo con una migración nueva en `supabase/migrations/` y su equivalente en `local/`; nunca edites una migración ya aplicada.

## Cómo tratar «NO DEFINIDO»

«NO DEFINIDO» significa que el backlog y los modelos no fijan ese dato. No lo inventes con criterio propio:

1. Usa el valor neutro: campo vacío, sin formato especial, sin límite adicional al de la base de datos (`datos.md`), obligatoriedad según los mensajes del CA.
2. Deja un comentario `// DUDA: <HU> <qué falta>` en el código.
3. Agrega una línea a `DUDAS.md` (en la raíz de `docs/`) con: HU, qué falta, qué valor neutro usaste.
4. Sigue con la siguiente HU; no te detengas.

## Cómo ejecutar

Los comandos están en `convenciones.md`. Resumen:

```
pnpm install
pnpm --filter desktop tauri dev      # aplicación en desarrollo
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm --filter desktop test           # Vitest
pnpm --filter desktop test:e2e       # Playwright
pnpm --filter landing dev            # landing page
```

## Cómo reportar dudas

Una duda es algo que bloquea o cambia el comportamiento visible y que ni un CA, ni una ET, ni un modelo resuelve, o dos fuentes que se contradicen.

- Si no bloquea: sigue con el valor neutro y regístrala en `DUDAS.md` (formato arriba).
- Si bloquea (por ejemplo, el spike de WorkerW falla): detente en ese paso, escribe en `DUDAS.md` la evidencia (sistema operativo, versión, qué pasó) y avisa al Gerente de Proyecto y al patrocinador (HE-02-HU01-ET11, D-186). No sigas construyendo sobre una técnica que no funciona.
- Si dos fuentes se contradicen: gana, en este orden, el CA, la ET, el contrato (`contratos.md`), el modelo de datos, la interfaz. Registra la contradicción en `DUDAS.md`.
