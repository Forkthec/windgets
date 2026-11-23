import { urlDeArchivo } from '@/ipc/archivos';

// Miniatura de una imagen o animación del catálogo en las subpantallas de Agregar widget (HE-04-HU07-ET03,
// HE-04-HU08, HE-04-HU09-ET01). `thumbnail_url` es la ruta del archivo en el computador (INT-09); mientras el
// archivo no se ha descargado llega vacía y se muestra un espacio en lugar de una imagen rota (como en
// Personalización del wallpaper, HE-02-HU02).
export function MiniaturaDelCatalogo({ ruta }: { ruta: string }) {
  if (!ruta) return <span className="wg-subpantalla-widget__sin-miniatura" aria-hidden="true" />;
  return <img src={urlDeArchivo(ruta)} alt="" width={96} height={54} />;
}
