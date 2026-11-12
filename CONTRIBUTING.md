Este repositorio no acepta contribuciones externas hasta la entrega del proyecto.

# Cómo contribuir

Reglas de `docs/convenciones.md`, sección «Commits y ramas».

## Ramas

- `main` está protegida: no se hace push directo.
- Una rama por paso del plan (`docs/plan_construccion.md`): `paso-NN-<tema>`, por ejemplo `paso-02-reglas-transversales`.

## Commits

Un commit por HU (historia de usuario). Formatos:

- `HE-nn-HUnn: <verbo y objeto de la HU>` para una HU de la épica HE-nn.
- `RT-nn: <tema>` para una regla transversal (RT-01 a RT-04, en `docs/RT.md`).
- `infra: <tema>` para infraestructura y todo lo demás.

## Pull requests

- Un pull request por paso, con la lista de HU cerradas y sus pruebas en verde. Usa la plantilla.
- Necesita 1 aprobación de otro integrante y el check `ci` en verde.
- Si llega un push después de la aprobación, la aprobación se descarta y hay que revisar de nuevo.
- Se fusiona con «Squash and merge». La rama se borra al fusionar.

## Reportar un «NO DEFINIDO»

«NO DEFINIDO» es un dato que `docs/` no fija (ver `docs/AGENTS.md`).

1. Agrega una línea en `docs/DUDAS.md`: HU, qué falta y qué valor neutro usaste.
2. Abre un issue con la plantilla «Duda» y la etiqueta `duda`.
