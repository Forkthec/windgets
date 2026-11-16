# Traspaso · estado tras aprobar P01 (15-nov-2026, noche)

Continúa `traspaso-sofia-2026-11-15.md`, que no se edita. Las horas son de Colombia (UTC-5).

## 1. Qué cambió

- **P01 aprobado** en un equipo real con Windows 11 (compilación 26200) y 2 monitores. Evidencia: PR #21,
  `docs/DUDAS.md` y `docs/evidencia/p01-spike/`.
- **Soporte solo para Windows 11** (D-207, PR #22). Los textos literales y el código ya dicen «Windows 11»
  (D-208, rama `paso-01-textos-win11`). El instalador solo pasa con la compilación 22000 o posterior.
- **El spike en Actions** se dispara solo a mano (`workflow_dispatch`). Su código se queda hasta que P06 integre
  la técnica.
- **Windows 10:** la VM `Windgets-Win10-22H2`, su disco, la ISO y los `PROMPT_SPIKE_P01*` están en la papelera.

## 2. Qué se desbloqueó

P06, P07, P09, P11 completo, P13 a P15, P17, P21, P22 y HE-15-HU04. P19 y P20 ya estaban libres. P12 sigue en el
PR #17 de juanvec06.

Para P06 y P07, el spike ya resolvió el anclaje a WorkerW, el Raw Input con `LVM_HITTEST` y la lista de
monitores (`host_del_wallpaper/spike.rs`, `geometria.rs`, `public/spike/capa.html`). `MonitorMap` y
`RawInputSink` no existen como tipos: hay que extraerlos del spike. Observación de P01: el contenido de la capa
se ve desplazado 8 px a la derecha y 1 px hacia abajo.

## 3. Pruebas manuales pendientes

- P10 con Supabase real y dos computadores; P10 en Windows (EV-03).
- P18 en Windows 11: teclado y colores del anillo.
- Interfaz del instalador a mano en un Windows 11 de escritorio (opcional; la CI la cubre).

## 4. Dependabot

8 alertas abiertas. Las corrige la rama `paso-NN-dependabot` (PR en borrador, aparte de este).

## 5. Firma de código (D-194)

Sin cambios: sin firma. La propuesta SignPath Foundation espera la verificación en dos pasos (2FA) de Ana y la
solicitud. Está en `docs/DUDAS.md`.
