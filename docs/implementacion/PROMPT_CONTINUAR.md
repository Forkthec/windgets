# Prompt para continuar el rediseño en otro chat

Pega el bloque de abajo, completo, en un chat nuevo de Claude Code abierto en `C:\Users\paanm\Documents\universidad\GPI\windgets`.
Cada vez que se cierra una tanda, la sección «Dónde quedó» se pone al día.

```text
Soy Paula (PO y Backend de CAMEIA). Vamos a seguir el rediseño de Windgets justo donde lo dejó el chat anterior, sin repetir
trabajo. El objetivo es que la app quede igual a los prototipos del Figma A3Z03L20swFyo8qdP9jETF («Windgets (Copy)»), desde
las fases que faltan del plan hasta las pruebas finales contra los prototipos. La entrega es el martes 1-dic a las 4:00 p. m.
(hora Colombia, UTC-5).

1. Lee primero, en este orden:
   - docs/implementacion/PLAN.md (fases 0 a 9, reglas y riesgos)
   - docs/implementacion/TRASPASO_NOCHE.md
   - .trabajo/ESTADO.md, sección «Noche 26-nov»
   - .trabajo/figma/ENCARGO_PAGINA.md
   - la cabecera de cada .trabajo/figma/F*.md (no las leas completas: busca en ellas lo que necesites)
   Usa la skill «retomar» para conciliar ESTADO.md con git y con los PR abiertos.

2. Orden de autoridad: Figma → docs/rediseno.md y sus RD → HU y contratos.md → docs/rediseno_cambios_implementacion.md.

3. Reglas que no se negocian:
   - El Figma es solo de lectura. Con use_figma, nada que cree, mueva, renombre ni borre. Nunca get_metadata de páginas
     enteras. El cupo es de unas 200 llamadas al día y 10 por minuto.
   - Los agentes, siempre con modelos menores (sonnet, o haiku para leer) y uno o dos a la vez. El chat principal planea,
     pregunta y revisa; cada pieza de código la hace el agente «implementador», de una en una. La verificación la corre
     «verificador», y «revisor» mira los lotes de riesgo.
   - Nada generado con IA sube al repo, al Drive ni a un PR sin mi sí explícito para ese archivo. docs/implementacion/ y
     .trabajo/ siguen solo en local hasta que yo lo apruebe (fase 5). No se borra nada para siempre: solo a la papelera.
   - Los commits van sin [IA-ASISTIDO] y terminan con el trailer Co-Authored-By. Títulos: «rediseno: …», «HE-nn-HUnn: …»
     o «infra: …». El título del PR termina en [IA-ASISTIDO]. El hook guardia_git.py solo deja abrir PR en borrador y no
     deja hacer push a main ni a develop: no lo esquives ni lo debilites.
   - Errores visibles: ningún fallo previsible termina en el error genérico. Es un hallazgo, por ejemplo, que Windi · Error
     (204:25659) diga «Ocurrió un error inesperado.» sin «Reintentar».
   - La hora se mira con PowerShell Get-Date, porque Git Bash muestra UTC. Las decisiones me las preguntas juntas, con
     opciones seleccionables, al empezar cada lote.

4. Dónde quedó (26-nov-2026, madrugada):
   - Código: la rama paso-44-componentes-base tiene el PR #68 en borrador, con Auto-fix encendido. Sus commits son
     af1a38a (RD-106: pedir el descarte con datos escritos, en 6 formularios) y 50a7616 (RD-103: e2e del fondo bloqueado).
     Verificación verde, salvo windows, que falla por lib.exe ausente en el contenedor (problema del entorno). Revisa su CI
     y sus comentarios antes de nada.
   - Inventario del Figma (fase 2): hechos F0 (variables, componentes y radios), F1, F2a, F2b, F3, F4a (con F4a2), F4b, F5, F6, F7 y F8: inventario COMPLETO,
     con 443 huellas JSON válidas en .trabajo/figma/huellas/.
   - Fase 3, documentos en docs/implementacion/, en este orden: CONSISTENCIA → TEMAS_Y_TOKENS → ANIMACIONES → 8 SPEC_<área>
     (Marco y componentes base, Planificador, Personalización y widgets, Windi, Cuenta y Acceso, Configuración, Escritorio y
     capa, Instalador y web) → ERRORES_Y_PRUEBAS → DECISIONES → TRAZABILIDAD → COLA → RELEVO → PRUEBAS_Y_CIERRE → LEEME.
     Se escriben a partir de los F*.md y las huellas, cada uno con un agente sonnet y una pasada de «revisor» como IA sin
     contexto. CONSISTENCIA.md quedó como borrador completo pero sin revisar (8 grupos y decisiones D1-D17); los demás no están empezados.
   - Después vienen las fases 4 (auditoría con tres piezas S, M y L), 5 (yo apruebo DECISIONES.md y las specs y se sube con
     un commit infra:), 6 (herramientas de prueba: tokens, geometría ±2 px, comparación con get_screenshot y animaciones),
     7 (implementación por relevos según COLA.md), 8 (pruebas finales contra los prototipos con TRAZABILIDAD.md) y 9
     (documentación final y entrega).

5. Decisiones que me tienes que preguntar, con opciones:
   - Contradicción de M-12: F5 dice que se vuelve principal en otros temas; F8 dice que es destructiva en los 4.
   - Elegir una ciudad cuenta como cambio en RD-106 aunque sea la misma: ¿se queda así? Anotarlo en docs/DUDAS.md.
   - Qué hacer con los hallazgos del inventario: reacciones con URL externa a «Windgets--Copy-», botones sin destino,
     colores fijos sin variable, radios y bordes distintos (widgets con unos 13 contra la variable 9), Rosa con Quicksand y
     Enfoque con Space Grotesk y a veces otra geometría, Rubik contra Nunito, reportes duplicados (204:1005, 204:1683 y
     204:1581), la Vencida (217:11114) que se sale del marco, y que no haya estados de foco, hover ni cargando.

Empieza por: conciliar el estado (skill retomar), revisar el PR #68, revisar con «revisor» el borrador de
docs/implementacion/CONSISTENCIA.md (contrastar con los F*.md; sus valores de foco, ancho de aviso y ámbar son propuesta, no medida), preguntarme sus decisiones D1-D17 y seguir con TEMAS_Y_TOKENS.md. Antes de lanzar el primer lote, pregúntame juntas las decisiones del punto 5.
```
