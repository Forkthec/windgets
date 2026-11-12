# Seguridad

## Reportar una vulnerabilidad

No abras un issue público. Escribe al equipo a paulamunoz@unicauca.edu.co con:

- Qué encontraste y dónde (archivo, versión o enlace).
- Cómo reproducirlo.

Respondemos por correo y publicamos la corrección cuando esté lista.

## Secretos

Los secretos nunca se versionan (D-192, secretos fuera del repositorio). Van en archivos `.env`, que están en `.gitignore`. En el repositorio solo hay `.env.example` con valores vacíos. El ejecutable contiene únicamente la URL del proyecto de Supabase y su clave pública (anon).

Si un secreto llega al repositorio, avisa al equipo y rótalo de inmediato.
