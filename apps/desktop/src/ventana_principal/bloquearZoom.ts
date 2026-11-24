// rediseno_final_backend.md §4.9 (D-04, RD-69): la página de la ventana principal no cambia de zoom. Tauri ya
// desactiva los atajos de zoom (`zoomHotkeysEnabled: false`); por si el WebView2 los atiende igual, se cancelan Ctrl +
// rueda y Ctrl + «+», «−» y «0». Quien necesita letra más grande usa el tamaño «Grande» de la tipografía del tema.

const TECLAS_DE_ZOOM = new Set(['+', '-', '=', '0', 'Add', 'Subtract']);

export function esZoom(evento: { ctrlKey: boolean; key?: string; type: string }): boolean {
  if (!evento.ctrlKey) return false;
  return evento.type === 'wheel' || TECLAS_DE_ZOOM.has(evento.key ?? '');
}

/** Cancela el zoom en `destino`; devuelve la función que lo deja de cancelar. */
export function bloquearZoom(destino: Window = window): () => void {
  const cancelar = (evento: Event) => {
    if (esZoom(evento as KeyboardEvent)) evento.preventDefault();
  };
  destino.addEventListener('wheel', cancelar, { passive: false });
  destino.addEventListener('keydown', cancelar);
  return () => {
    destino.removeEventListener('wheel', cancelar);
    destino.removeEventListener('keydown', cancelar);
  };
}
