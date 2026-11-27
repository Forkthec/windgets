# Encargo común: inventario de una página del Figma (solo lectura)

Repositorio `C:\Users\paanm\Documents\universidad\GPI\windgets`. Escribe en español. Archivo Figma `A3Z03L20swFyo8qdP9jETF`,
sessionId `e377bb50-1d3d-457b-912a-e69f2aee6bf1` en cada llamada.

## Reglas duras

1. **SOLO LECTURA.** Ningún guion de `use_figma` crea, mueve, renombra, borra ni cambia nodos, variables o páginas. Nada de
   `figma.createX`, `.remove()`, asignaciones a propiedades, `setPluginData`, `notify` que modifique, ni hojas temporales.
2. Antes de `use_figma`, obtén la guía figma-use (`get_figma_skill` o recurso `skill://figma/figma-use/SKILL.md`) y pasa
   `skillNames: "resource:figma-use"`. Notas: un `setCurrentPageAsync` por llamada; respuesta > 44 000 bytes falla
   (pagina); guiones de menos de ~22 s; `figma.skipInvisibleInstanceChildren=true`; `loadAllPagesAsync` no funciona;
   `findAll` sobre toda la página 79:5 falla (recorre hijos por id); la variable BOOLEAN «texto» no es color.
3. **Cupo:** 10 llamadas por minuto y unas 200 al día para toda la noche. Usa el tope que diga tu encargo. Nada de
   `get_metadata` de páginas enteras; `get_design_context`/`get_screenshot` solo si un dato no sale por guion (máximo 3).
4. Ignora los marcos de «Descartado».
5. Lee primero `.trabajo/figma/F0.md` (variables, componentes y radios ya inventariados) para nombrar variables y
   componentes igual. Los ids de familias están en `docs/rediseno_flujos_ids_prototipos.md`, en la sección de tu página
   (formato `familia | claro | oscuro | Rosa | Enfoque`). El flujo de cada pantalla, en `docs/rediseno_flujos_prototipos.md`.

## Qué sacar

Del marco **claro** de cada familia (y del oscuro si la familia no tiene Rosa ni Enfoque, solo para ver diferencias):

- **Huella JSON** en `.trabajo/figma/huellas/<id-con-guion>.json` (por ejemplo `204-622.json`), compacta:
  `{"id","nombre","pagina","tema":"claro","w","h","el":[...]}`. Cada elemento de `el` es un nodo con nombre propio
  (marcos, textos, instancias; **no** entres dentro de las instancias de íconos ni en vectores: la instancia cuenta como
  una caja): `{"n":nombre,"ruta":"Padre/Hijo","t":tipo,"x","y","w","h"` (relativos al marco, redondeados a 0,5),
  `"fill":"variable|#hex","stroke":"variable|#hex","sw":grosor,"r":radio,"sh":"x,y,blur,spread,color","font":"Familia
  Peso Tamaño/altoLínea","txt":"texto literal","comp":"componente:variante","layout":"auto: dir gap pad"}` — solo las
  claves que apliquen. Para colores: el nombre de la variable enlazada si la hay; si no, el hex (eso es una incoherencia:
  anótala).
- **Tabla de la página** en `.trabajo/figma/<tu-código>.md`, por familia: id claro/oscuro/Rosa/Enfoque, estructura en una
  línea, textos literales (todos, entre «…»), medidas clave (tamaño de letra, padding, alto de control, radio, gap),
  estados que muestra (vacío, cargando, error, sin conexión, deshabilitado, foco, hover), y sus interacciones de prototipo
  (disparador → acción → destino, transición, duración, curva). Los textos de error con el campo donde aparecen.
- **Muestras de otros temas:** 3 familias por tema (Rosa, Enfoque, oscuro) con su huella (`"tema":"rosa"` etc.) para
  detectar lo que no sigue las variables (fuente, íconos, rellenos fijos). Lista los desvíos.
- **Incoherencias** al final: radios, bordes, sombras, alturas, letras o espaciados distintos para el mismo tipo de
  control; colores fijos no enlazados; textos con erratas.

## Informe final (menos de 20 líneas)

Llamadas gastadas por herramienta; familias inventariadas / total; huellas escritas; lo «no medible» con motivo; las 5
incoherencias más importantes. Si te quedas sin cupo o sin tiempo, deja en la cabecera de tu `.md` hasta qué familia
llegaste para que otro agente continúe.
