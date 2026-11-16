# Política de privacidad (borrador)

> Borrador. Lo que no está definido en `docs/` queda anotado en `docs/DUDAS.md` y se completa cuando el equipo lo decida.

Windgets es una aplicación para Windows 11 que combina un wallpaper personalizable con un planificador.

## Qué datos usa

- **Cuenta:** alias, correo electrónico y contraseña. La sesión se guarda cifrada con DPAPI en tu computador (`%APPDATA%\Windgets\session.bin`).
- **Tus datos de planificación:** tarjetas, etiquetas, columnas y temas. Se guardan en tu computador y se sincronizan con la nube de Windgets (Supabase) para que los tengas en otro equipo.
- **Windi, el agente de IA:** al usarlo, se envía a Gemini (Google), a través de una función de Supabase, tu mensaje, el historial de la sesión y solo las tarjetas y etiquetas necesarias para responder. La clave de Gemini nunca está en la aplicación.
- **Clima y noticias:** las consulta una función de Supabase con claves que solo ella conoce.

## Qué no hace

- Windgets no envía datos a otros sistemas distintos de los anteriores.
- No hay servidor propio: todo el lado del servidor es Supabase.

## Tus datos

Las reglas de acceso de Supabase (RLS) limitan cada fila a su dueño. Para preguntas sobre tus datos, escribe al equipo por [GitHub](https://github.com/Forkthec/windgets/issues).

## Por definir

- Cómo se desactiva el envío de datos de Windi y la sincronización (ver `docs/DUDAS.md`).
- Dónde se muestra esta política durante la instalación (requisito de SignPath Foundation).
