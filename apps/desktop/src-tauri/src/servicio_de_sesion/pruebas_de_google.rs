//! Pruebas de HE-01-HU05 · Iniciar sesión con la cuenta de Google (IPC-AUTH-06, IPC-AUTH-07, EV-02).

use super::google::{
    self, ESPERA_MAXIMA_MS, PERMISOS, REGRESO, alias_de_google, base64_url, desafio, leer_regreso,
};
use super::pruebas::{AuthDePrueba, RelojDePrueba, esperar, servicio};
use super::*;
use crate::cliente_de_supabase::{SesionDeGoogle, leer_sesion_de_google};
use crate::tipos::EventMapAuthGoogleResult;
use crate::tipos::EventMapAuthGoogleResultStatus as Estado;

type Servicio = ServicioDeSesion<AuthDePrueba, RelojDePrueba>;

const AHORA: i64 = 1_794_663_000_000; // 2026-11-14T13:30:00.000Z, la hora de `servicio()`

/// La cuenta de Google que entrega Supabase: creada hace `creada_hace_ms` y con este nombre y correo.
fn cuenta(
    nombre: Option<&str>,
    correo: &str,
    alias_del_registro: &str,
    creada_hace_ms: i64,
) -> SesionDeGoogle {
    SesionDeGoogle {
        sesion: SesionDeAuth {
            access_token: "acceso-google".into(),
            refresh_token: "renovacion-google".into(),
            expires_in: 3_600,
            user_id: "7c1e2d3f-1111-4222-8333-444455556666".into(),
            alias: alias_del_registro.into(),
        },
        correo: correo.into(),
        nombre: nombre.map(str::to_string),
        creada_ms: Some(AHORA - creada_hace_ms),
        ingreso_ms: Some(AHORA),
    }
}

/// Inicia el flujo con conexión y devuelve el `state` que viaja en el regreso.
fn iniciar(servicio: &Servicio) -> String {
    let (direccion, _) = servicio.iniciar_google(true).unwrap();
    let estado = servicio.espera_de_google().unwrap().estado;
    assert!(
        direccion.contains(&format!("state%3D{estado}")),
        "{direccion}"
    );
    estado
}

/// Google autorizó: Supabase regresa con el código.
fn regresar_con_codigo(servicio: &Servicio, estado: &str) -> Option<EventMapAuthGoogleResult> {
    esperar(servicio.atender_regreso(&format!("{REGRESO}?state={estado}&code=codigo-google")))
}

fn con_cuenta(google: SesionDeGoogle) -> Servicio {
    let (servicio, _) = servicio();
    *servicio.auth().google.lock().unwrap() = Some(google);
    servicio
}

#[test]
fn ca_he_01_hu05_ca01() {
    // HE-01-HU05-CA01 · Sin cuenta previa: crea la cuenta con el nombre de Google como alias, sin código (ET02,
    // ET04, ET05), inicia la sesión y da la bienvenida.
    let servicio = con_cuenta(cuenta(Some("Ana Gómez"), "ana.gomez@gmail.com", "", 2_000));
    let estado = iniciar(&servicio);
    let r = regresar_con_codigo(&servicio, &estado).unwrap();
    assert_eq!(r.status, Estado::Success);
    assert_eq!(r.is_new_account, Some(true));
    assert_eq!(r.alias.as_deref(), Some("Ana Gómez"));
    assert_eq!(
        r.message,
        "¡Bienvenido, Ana Gómez! Tu cuenta fue creada correctamente."
    );
    let sesion = servicio.sesion_guardada().unwrap();
    assert_eq!(
        (sesion.access_token.as_str(), sesion.alias.as_str()),
        ("acceso-google", "Ana Gómez")
    );
    // ET04: no se pidió ni se verificó un código; solo el intercambio PKCE con el verificador de la espera.
    let llamadas = servicio.auth().llamadas();
    assert_eq!(llamadas.len(), 1);
    assert!(llamadas[0].starts_with("pkce codigo-google "));
    assert_eq!(servicio.espera_de_google(), None);
}

#[test]
fn ca_he_01_hu05_ca02() {
    // HE-01-HU05-CA02 · Cuenta existente (registrada con correo): inicia la sesión en esa misma cuenta, con su
    // alias, sin mensaje de cuenta creada (ET03).
    let servicio = con_cuenta(cuenta(
        Some("Ana Gómez"),
        "ana.gomez@gmail.com",
        "Anita",
        86_400_000,
    ));
    let estado = iniciar(&servicio);
    let r = regresar_con_codigo(&servicio, &estado).unwrap();
    assert_eq!(
        (r.status, r.is_new_account, r.alias.as_deref()),
        (Estado::Success, Some(false), Some("Anita"))
    );
    assert_eq!(r.message, "");
    assert_eq!(servicio.sesion_guardada().unwrap().alias, "Anita");
}

#[test]
fn ca_he_01_hu05_ca03() {
    // HE-01-HU05-CA03 · Nombre de Google de más de 30 caracteres: el alias se recorta a 30 (ET05).
    let nombre = "María Fernanda de los Ángeles Restrepo";
    let servicio = con_cuenta(cuenta(Some(nombre), "mafe@gmail.com", "", 0));
    let estado = iniciar(&servicio);
    let r = regresar_con_codigo(&servicio, &estado).unwrap();
    let alias = "María Fernanda de los Ángeles ";
    assert_eq!(alias.chars().count(), 30);
    assert_eq!(r.alias.as_deref(), Some(alias.trim()));
    assert_eq!(
        r.message,
        format!(
            "¡Bienvenido, {}! Tu cuenta fue creada correctamente.",
            alias.trim()
        )
    );
}

#[test]
fn ca_he_01_hu05_ca04() {
    // HE-01-HU05-CA04 · Cuenta de Google sin nombre: el alias es la parte del correo antes de la @ (ET06),
    // recortada a 30 caracteres (ET12).
    let servicio = con_cuenta(cuenta(None, "juan.vela@gmail.com", "", 0));
    let estado = iniciar(&servicio);
    let r = regresar_con_codigo(&servicio, &estado).unwrap();
    assert_eq!(r.alias.as_deref(), Some("juan.vela"));
    assert_eq!(
        r.message,
        "¡Bienvenido, juan.vela! Tu cuenta fue creada correctamente."
    );
    assert_eq!(
        alias_de_google(None, "abcdefghijklmnopqrstuvwxyz0123456789@gmail.com"),
        "abcdefghijklmnopqrstuvwxyz0123"
    );
    assert_eq!(alias_de_google(Some("   "), "luz@gmail.com"), "luz");
}

#[test]
fn ca_he_01_hu05_ca05() {
    // HE-01-HU05-CA05 · Sin autorizar el acceso (rechazo en Google o «Cancelar» de la espera): no se inicia la
    // sesión (ET08).
    let (servicio, _) = servicio();
    let estado = iniciar(&servicio);
    let r = esperar(servicio.atender_regreso(&format!(
        "{REGRESO}?state={estado}&error=access_denied&error_description=The+user+denied"
    )))
    .unwrap();
    assert_eq!(r.status, Estado::Cancelled);
    assert_eq!(r.message, "Se canceló el inicio de sesión con Google.");
    assert_eq!(servicio.sesion_guardada(), None);

    iniciar(&servicio);
    let r = servicio.cancelar_google();
    assert_eq!(
        (r.status, r.message.as_str()),
        (
            Estado::Cancelled,
            "Se canceló el inicio de sesión con Google."
        )
    );
    assert_eq!(servicio.espera_de_google(), None);
}

#[test]
fn ca_he_01_hu05_et13() {
    // HE-01-HU05-ET13 (CA05) · Al cerrar la ventana de Google no llega regreso: a los 5 minutos se cierra la
    // espera con `cancelled`; antes, no.
    let (servicio, reloj) = servicio();
    let (_, inicio) = servicio.iniciar_google(true).unwrap();
    assert_eq!(inicio.expires_at.0, "2026-11-14T13:35:00.000Z");
    let estado = servicio.espera_de_google().unwrap().estado;
    reloj.adelantar(ESPERA_MAXIMA_MS - 1);
    assert_eq!(servicio.vencer_google(&estado), None);
    reloj.adelantar(1);
    let r = servicio.vencer_google(&estado).unwrap();
    assert_eq!(r.status, Estado::Cancelled);
    assert_eq!(servicio.espera_de_google(), None);
    // Un regreso que llega tarde ya no inicia la sesión.
    assert_eq!(regresar_con_codigo(&servicio, &estado), None);
    assert_eq!(servicio.sesion_guardada(), None);
}

#[test]
fn ca_he_01_hu05_ca06() {
    // HE-01-HU05-CA06 · El servicio de Google no responde o devuelve un error (ET09): no se inicia la sesión.
    let (servicio, _) = servicio();
    let estado = iniciar(&servicio);
    let r = esperar(servicio.atender_regreso(&format!(
        "{REGRESO}?state={estado}&error=server_error&error_description=Error+getting+user+profile+from+external+provider"
    )))
    .unwrap();
    assert_eq!(
        (r.status, r.message.as_str()),
        (
            Estado::Error,
            "No fue posible iniciar sesión con Google. Intenta de nuevo."
        )
    );
    for falla in [
        FallaDeAuth::SinRespuesta,
        FallaDeAuth::SinConexion,
        FallaDeAuth::Rechazo {
            estado: 400,
            codigo: "invalid_grant".into(),
        },
    ] {
        let estado = iniciar(&servicio);
        servicio.auth().fallar(falla);
        let r = regresar_con_codigo(&servicio, &estado).unwrap();
        assert_eq!(r.status, Estado::Error);
        servicio.auth().sin_falla();
    }
    // Sin cuenta en el doble, Supabase responde `invalid_grant`.
    let estado = iniciar(&servicio);
    assert_eq!(
        regresar_con_codigo(&servicio, &estado).unwrap().status,
        Estado::Error
    );
    assert_eq!(servicio.sesion_guardada(), None);
}

#[test]
fn ca_he_01_hu05_ca07() {
    // HE-01-HU05-CA07 · Sin conexión: `net.offline` y no se abre la ventana de Google (ET10).
    let (servicio, _) = servicio();
    let error = servicio.iniciar_google(false).unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str()),
        (
            ErrorCode::NetOffline,
            "No hay conexión a internet. Conéctate para iniciar sesión."
        )
    );
    assert_eq!(servicio.espera_de_google(), None);
}

#[test]
fn ca_he_01_hu05_ca08() {
    // HE-01-HU05-CA08 · Correo de Google de más de 64 caracteres: `validate_new_user` rechaza el alta (ET07) y
    // no se crea la cuenta ni se inicia la sesión.
    let (servicio, _) = servicio();
    let mensaje = "No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.";
    let estado = iniciar(&servicio);
    let r = esperar(servicio.atender_regreso(&format!(
        "{REGRESO}?state={estado}&error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user"
    )))
    .unwrap();
    assert_eq!(
        (r.status, r.message.as_str()),
        (Estado::EmailTooLong, mensaje)
    );
    // Si llegara en el intercambio, el resultado es el mismo.
    let estado = iniciar(&servicio);
    servicio.auth().fallar(FallaDeAuth::Rechazo {
        estado: 422,
        codigo: "email_too_long".into(),
    });
    assert_eq!(
        regresar_con_codigo(&servicio, &estado).unwrap().status,
        Estado::EmailTooLong
    );
    assert_eq!(servicio.sesion_guardada(), None);
}

#[test]
fn ca_he_01_hu05_ca09() {
    // HE-01-HU05-CA09 · Desde Registro actúa igual (ET11): `auth_google_start` no lleva parámetros, así que no
    // toma los datos del formulario; una espera nueva reemplaza a la anterior.
    let (servicio, _) = servicio();
    let primero = iniciar(&servicio);
    let segundo = iniciar(&servicio);
    assert_ne!(primero, segundo);
    assert_eq!(regresar_con_codigo(&servicio, &primero), None);
    assert_eq!(
        regresar_con_codigo(&servicio, &segundo).unwrap().status,
        Estado::Error
    );
}

#[test]
fn int_10_solo_el_regreso_de_la_espera() {
    // INT-10 · Solo se acepta `windgets://auth/callback`, mientras hay una espera y con su `state`.
    let servicio = con_cuenta(cuenta(Some("Ana"), "ana@gmail.com", "", 0));
    assert_eq!(regresar_con_codigo(&servicio, "sin-espera"), None);
    let estado = iniciar(&servicio);
    for otra in [
        format!("windgets://otra/ruta?state={estado}&code=x"),
        format!("https://auth/callback?state={estado}&code=x"),
        "windgets://auth/callback?state=otro&code=x".to_string(),
        "no es una dirección".to_string(),
    ] {
        assert_eq!(esperar(servicio.atender_regreso(&otra)), None, "{otra}");
    }
    assert!(servicio.auth().llamadas().is_empty());
    assert_eq!(
        regresar_con_codigo(&servicio, &estado).unwrap().status,
        Estado::Success
    );
}

#[test]
fn rnf_20_rnf_36_direccion_de_autorizacion() {
    // RNF-20 y RNF-36 · Navegador predeterminado con PKCE (S256) y solo openid, email y profile.
    let (servicio, _) = servicio();
    let (direccion, _) = servicio.iniciar_google(true).unwrap();
    let espera = servicio.espera_de_google().unwrap();
    let url = reqwest::Url::parse(&direccion).unwrap();
    assert_eq!(url.path(), "/auth/v1/authorize");
    let pares: std::collections::HashMap<String, String> = url.query_pairs().into_owned().collect();
    assert_eq!(pares["provider"], "google");
    assert_eq!(pares["scopes"], PERMISOS);
    assert_eq!(pares["code_challenge_method"], "s256");
    assert_eq!(pares["code_challenge"], desafio(&espera.verificador));
    assert_eq!(
        pares["redirect_to"],
        format!("windgets://auth/callback?state={}", espera.estado)
    );
    // El verificador cumple RFC 7636: de 43 a 128 caracteres de [A-Za-z0-9-._~].
    assert_eq!(espera.verificador.len(), 64);
    assert!(
        espera
            .verificador
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "-._~".contains(c))
    );
}

#[test]
fn pkce_base64_url_y_desafio() {
    // RFC 4648 § 10 (sin relleno) y el ejemplo del apéndice B de RFC 7636.
    assert_eq!(base64_url(b""), "");
    assert_eq!(base64_url(b"f"), "Zg");
    assert_eq!(base64_url(b"fo"), "Zm8");
    assert_eq!(base64_url(b"foo"), "Zm9v");
    assert_eq!(base64_url(b"foobar"), "Zm9vYmFy");
    assert_eq!(base64_url(&[0xfb, 0xff]), "-_8");
    assert_eq!(
        desafio("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
        "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    );
    assert_ne!(google::aleatorio(), google::aleatorio());
}

#[test]
fn leer_el_regreso_y_la_sesion_de_google() {
    // INT-01, paso 3: código o error, también en el fragmento.
    assert_eq!(
        leer_regreso("windgets://auth/callback?state=s1&code=c1"),
        Some(google::Regreso::Codigo {
            estado: "s1".into(),
            codigo: "c1".into()
        })
    );
    assert_eq!(
        leer_regreso("windgets://auth/callback?state=s1#error=access_denied&error_description=x"),
        Some(google::Regreso::Error {
            estado: "s1".into(),
            error: "access_denied".into(),
            descripcion: "x".into()
        })
    );
    // INT-01, paso 4: la respuesta de grant_type=pkce con los datos de la cuenta de Google.
    let cuerpo = r#"{ "access_token": "eyJ", "refresh_token": "r1", "expires_in": 3600,
        "user": { "id": "u1", "email": "ana@gmail.com", "created_at": "2026-11-21T20:00:00.120000Z",
        "last_sign_in_at": "2026-11-21T20:00:01.5Z", "user_metadata": { "full_name": "Ana Gómez", "name": "Ana" } } }"#;
    let google = leer_sesion_de_google(cuerpo).unwrap();
    assert_eq!(
        (google.correo.as_str(), google.nombre.as_deref()),
        ("ana@gmail.com", Some("Ana Gómez"))
    );
    assert!(google.nueva(google::CUENTA_NUEVA_MS));
    let vieja = r#"{ "access_token": "eyJ", "refresh_token": "r1", "expires_in": 3600,
        "user": { "id": "u1", "email": "ana@gmail.com", "created_at": "2026-10-01T10:00:00Z",
        "last_sign_in_at": "2026-11-21T20:00:01Z", "user_metadata": { "alias": "Anita" } } }"#;
    let google = leer_sesion_de_google(vieja).unwrap();
    assert!(!google.nueva(google::CUENTA_NUEVA_MS));
    assert_eq!(
        (google.nombre, google.sesion.alias.as_str()),
        (None, "Anita")
    );
}
