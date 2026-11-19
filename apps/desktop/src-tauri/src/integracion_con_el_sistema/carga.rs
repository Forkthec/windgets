//! Pausa de las animaciones por alto consumo de recursos (HE-04-HU09-CA04, CA05; RNF-06; D-054).
//! La regla es pura y se prueba sin Windows; la lectura del uso de CPU está en `uso_de_cpu` (solo Windows).
//!
//! DUDA: HE-04-HU09 pide medir CPU o GPU. Windows no da el uso de la GPU con una llamada simple (requiere los
//! contadores de rendimiento «GPU Engine»). Valor usado: solo la CPU; la GPU queda como `None` (docs/DUDAS.md).

/// Las animaciones van en pausa por alto consumo (lo lee la lista de widgets, `paused_by_load`).
pub static EN_PAUSA: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

/// ET05: se pausa cuando el uso supera el 80 % durante 10 s seguidos.
pub const UMBRAL_DE_PAUSA: f64 = 80.0;
pub const ESPERA_PARA_PAUSAR_MS: i64 = 10_000;
/// ET06: se reanuda cuando el uso baja del 60 % durante 30 s seguidos.
pub const UMBRAL_DE_REANUDACION: f64 = 60.0;
pub const ESPERA_PARA_REANUDAR_MS: i64 = 30_000;

/// Sigue el uso de CPU y GPU y decide si las animaciones van en pausa.
#[derive(Debug, Default)]
pub struct VigilanteDeCarga {
    alto_desde: Option<i64>,
    bajo_desde: Option<i64>,
    en_pausa: bool,
}

impl VigilanteDeCarga {
    pub fn en_pausa(&self) -> bool {
        self.en_pausa
    }

    /// Registra una muestra del uso (0 a 100) y devuelve el estado nuevo si cambió. Para pausar basta CPU **o**
    /// GPU sobre el 80 %; para reanudar, CPU **y** GPU bajo el 60 %.
    pub fn muestra(&mut self, cpu: f64, gpu: Option<f64>, ahora_ms: i64) -> Option<bool> {
        let mayor = gpu.map_or(cpu, |g| g.max(cpu));
        if mayor > UMBRAL_DE_PAUSA {
            self.alto_desde.get_or_insert(ahora_ms);
        } else {
            self.alto_desde = None;
        }
        if mayor < UMBRAL_DE_REANUDACION {
            self.bajo_desde.get_or_insert(ahora_ms);
        } else {
            self.bajo_desde = None;
        }
        let pausar = !self.en_pausa
            && self
                .alto_desde
                .is_some_and(|d| ahora_ms - d >= ESPERA_PARA_PAUSAR_MS);
        let reanudar = self.en_pausa
            && self
                .bajo_desde
                .is_some_and(|d| ahora_ms - d >= ESPERA_PARA_REANUDAR_MS);
        if pausar || reanudar {
            self.en_pausa = pausar;
            return Some(self.en_pausa);
        }
        None
    }
}

#[cfg(test)]
mod pruebas {
    use super::*;

    /// Muestras de un mismo uso, una por segundo, desde `desde` hasta `hasta` (en segundos).
    fn durante(v: &mut VigilanteDeCarga, cpu: f64, desde: i64, hasta: i64) -> Vec<(i64, bool)> {
        (desde..=hasta)
            .filter_map(|s| v.muestra(cpu, None, s * 1000).map(|e| (s, e)))
            .collect()
    }

    #[test]
    fn ca_he_04_hu09_ca04() {
        // HE-04-HU09-CA04 · Más del 80 % durante 10 s seguidos pausa (ET05, ET08); 9 s o una bajada en medio no.
        let mut v = VigilanteDeCarga::default();
        assert!(durante(&mut v, 90.0, 0, 9).is_empty());
        assert_eq!(durante(&mut v, 90.0, 10, 10), [(10, true)]);
        assert!(v.en_pausa());
        let mut v = VigilanteDeCarga::default();
        durante(&mut v, 90.0, 0, 5);
        durante(&mut v, 50.0, 6, 6);
        assert!(durante(&mut v, 90.0, 7, 15).is_empty());
        // La GPU sola también pausa.
        let mut v = VigilanteDeCarga::default();
        let cambios: Vec<_> = (0..=10)
            .filter_map(|s| v.muestra(10.0, Some(95.0), s * 1000))
            .collect();
        assert_eq!(cambios, [true]);
    }

    #[test]
    fn ca_he_04_hu09_ca05() {
        // HE-04-HU09-CA05 · En pausa, bajo el 60 % durante 30 s seguidos reanuda (ET06); entre 60 y 80 % no.
        let mut v = VigilanteDeCarga::default();
        durante(&mut v, 90.0, 0, 10);
        assert!(durante(&mut v, 70.0, 11, 60).is_empty());
        assert!(durante(&mut v, 40.0, 61, 90).is_empty());
        assert_eq!(durante(&mut v, 40.0, 91, 91), [(91, false)]);
        assert!(!v.en_pausa());
    }
}
