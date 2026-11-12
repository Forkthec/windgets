# AGENTS.md

La entrada única es [`docs/AGENTS.md`](docs/AGENTS.md). Léela completa antes de escribir código. Este resumen no la reemplaza; si difieren, gana `docs/`.

1. No inventes funciones: lo que no está en un CA (criterio de aceptación), una ET (especificación técnica), un contrato o un modelo de `docs/` no se construye.
2. Un commit por HU (historia de usuario): `HE-nn-HUnn: <verbo y objeto>`; `RT-nn: <tema>` para reglas transversales; `infra: <tema>` para lo demás.
3. Pruebas antes de cerrar: una prueba por CA, ejecutada y en verde.
4. Secretos fuera del repositorio (D-192, secretos fuera del repositorio): solo `.env.example` con valores vacíos.
5. Nunca edites una migración aplicada: crea una nueva en `supabase/migrations/` y su equivalente en `docs/local/`.
6. Trabaja en una rama `paso-NN-<tema>`, nunca en `main`.
7. Lo «NO DEFINIDO» se registra en `docs/DUDAS.md` con el valor neutro usado.
