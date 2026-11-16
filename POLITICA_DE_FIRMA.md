# Política de firma de código (borrador)

> Borrador para la solicitud a SignPath Foundation. Los roles los define Paula con el equipo antes de enviarla.

Free code signing provided by [SignPath.io](https://signpath.io), certificate by [SignPath Foundation](https://signpath.org).

## Qué se firma

Solo `Windgets-Setup.exe`, el instalador de Windgets que compila `release.yml` en GitHub Actions a partir de este repositorio. No se firma nada de otros proyectos ni ningún binario que no salga de ese flujo.

## Roles

| Rol | Qué hace | Quién |
| --- | --- | --- |
| Autores | Modifican el código | Equipo ForkTech: Juan Diego Gómez Garcés, Juan David Vela Coronado, Ana Sofía Arango Yanza y Paula Andrea Muñoz Delgado |
| Revisores | Revisan los cambios de quien no tiene permiso de commit (pull requests) | Por definir |
| Aprobadores | Aprueban cada solicitud de firma | Por definir |

Todos los miembros del equipo usan verificación en dos pasos (2FA) en GitHub y en SignPath.

## Cómo se firma

1. Una versión nueva se compila en un runner de GitHub (`release.yml`), con el código y los scripts de este repositorio.
2. El instalador se sube como artefacto y se envía a SignPath.
3. Un aprobador revisa la solicitud y la aprueba a mano. Sin esa aprobación no hay firma.
4. El flujo descarga el instalador firmado y lo publica como `Windgets-Setup.exe` en la release de GitHub.

## Privacidad

Ver [`PRIVACIDAD.md`](PRIVACIDAD.md).
