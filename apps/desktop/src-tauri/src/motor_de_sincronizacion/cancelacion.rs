//! HE-16-HU03-CA06, ET08: cerrar la sesión detiene la sincronización en curso y no espera más de 5 segundos.
//!
//! El ciclo de sincronización corre `hasta_que_se_cancele`; el cierre de sesión pide detenerlo y toma el turno del
//! ciclo con un plazo. Un ciclo detenido suelta sus transacciones sin confirmarlas (sqlx las revierte al soltarlas),
//! así que no escribe en la base que el cierre vacía. Solo usa `tokio::sync` y un hilo para el plazo.

use std::future::Future;
use std::pin::pin;
use std::sync::atomic::{AtomicBool, Ordering};
use std::task::Poll;
use std::time::Duration;

use tokio::sync::{Mutex, MutexGuard, Notify};

/// Cuánto espera el cierre de sesión a que el ciclo en curso se detenga (HE-16-HU03-ET08).
pub const PLAZO_DEL_CIERRE: Duration = Duration::from_secs(5);

/// El pedido de detener el ciclo de sincronización.
#[derive(Default)]
pub struct Cancelacion {
    pedida: AtomicBool,
    aviso: Notify,
}

impl Cancelacion {
    /// Pide detener el ciclo en curso y que no empiece otro hasta `terminar`.
    pub fn pedir(&self) {
        self.pedida.store(true, Ordering::SeqCst);
        self.aviso.notify_waiters();
    }

    /// El cierre terminó: los ciclos vuelven a correr.
    pub fn terminar(&self) {
        self.pedida.store(false, Ordering::SeqCst);
    }

    pub fn pedida(&self) -> bool {
        self.pedida.load(Ordering::SeqCst)
    }

    /// Termina cuando se pide detener el ciclo (o de inmediato si ya se pidió).
    pub async fn esperar(&self) {
        let mut aviso = pin!(self.aviso.notified());
        aviso.as_mut().enable();
        if self.pedida() {
            return;
        }
        aviso.await;
    }

    /// Corre `ciclo` hasta que termine (`Some`) o hasta que se pida detenerlo (`None`).
    pub async fn hasta_que_se_cancele<F: Future>(&self, ciclo: F) -> Option<F::Output> {
        if self.pedida() {
            return None;
        }
        salvo(ciclo, self.esperar()).await
    }

    /// Pide detener el ciclo en curso y toma su turno. `None` si el ciclo no lo soltó dentro de `plazo`: el
    /// cierre sigue igual y deja la limpieza pendiente para el próximo inicio (HE-16-HU03-ET09).
    pub async fn tomar_el_turno<'a>(
        &self,
        turno: &'a Mutex<()>,
        plazo: Duration,
    ) -> Option<MutexGuard<'a, ()>> {
        self.pedir();
        salvo(turno.lock(), esperar(plazo)).await
    }
}

/// El resultado de `a` si termina antes que `b`; `None` si `b` termina primero.
pub async fn salvo<A: Future, B: Future>(a: A, b: B) -> Option<A::Output> {
    let mut a = pin!(a);
    let mut b = pin!(b);
    std::future::poll_fn(|cx| {
        if let Poll::Ready(valor) = a.as_mut().poll(cx) {
            return Poll::Ready(Some(valor));
        }
        if b.as_mut().poll(cx).is_ready() {
            return Poll::Ready(None);
        }
        Poll::Pending
    })
    .await
}

/// Termina cuando pasa `plazo`, medido en un hilo aparte (el crate no usa el temporizador de tokio).
pub async fn esperar(plazo: Duration) {
    let (aviso, llegada) = tokio::sync::oneshot::channel::<()>();
    std::thread::spawn(move || {
        std::thread::sleep(plazo);
        let _ = aviso.send(());
    });
    let _ = llegada.await;
}

#[cfg(test)]
mod pruebas {
    use super::*;
    use crate::servicio_del_planificador::pruebas::bloquear;
    use std::sync::Arc;
    use std::time::Instant;

    #[test]
    fn ca_he_16_hu03_ca06() {
        // HE-16-HU03-CA06 · Cerrar sesión mientras se sincroniza: el ciclo en curso se detiene y el cierre toma su
        // turno mucho antes de 5 s (ET08).
        let turno = Arc::new(Mutex::new(()));
        let cancelacion = Arc::new(Cancelacion::default());
        let (listo, en_curso) = std::sync::mpsc::channel();
        let ciclo = {
            let (turno, cancelacion) = (turno.clone(), cancelacion.clone());
            std::thread::spawn(move || {
                bloquear(async {
                    let _turno = turno.lock().await;
                    listo.send(()).unwrap();
                    // Un ciclo que no termina solo (por ejemplo, una red muy lenta).
                    cancelacion
                        .hasta_que_se_cancele(std::future::pending::<()>())
                        .await
                })
            })
        };
        en_curso.recv().unwrap();
        let inicio = Instant::now();
        let tomado = bloquear(cancelacion.tomar_el_turno(&turno, PLAZO_DEL_CIERRE));
        assert!(tomado.is_some());
        assert!(inicio.elapsed() < PLAZO_DEL_CIERRE);
        assert_eq!(
            ciclo.join().unwrap(),
            None,
            "el ciclo se detuvo sin terminar"
        );
        // Mientras el cierre no termina no empieza otro ciclo; después sí.
        assert_eq!(
            bloquear(cancelacion.hasta_que_se_cancele(async { 1 })),
            None
        );
        cancelacion.terminar();
        assert_eq!(
            bloquear(cancelacion.hasta_que_se_cancele(async { 1 })),
            Some(1)
        );
    }

    #[test]
    fn ca_he_16_hu03_et08() {
        // HE-16-HU03-ET08 · Si el ciclo no suelta el turno, el cierre no espera más que el plazo.
        let turno = Mutex::new(());
        let _ocupado = bloquear(turno.lock());
        let cancelacion = Cancelacion::default();
        let plazo = Duration::from_millis(100);
        let inicio = Instant::now();
        assert!(bloquear(cancelacion.tomar_el_turno(&turno, plazo)).is_none());
        assert!(inicio.elapsed() >= plazo && inicio.elapsed() < PLAZO_DEL_CIERRE);
    }
}
