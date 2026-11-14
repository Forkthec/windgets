"""Pruebas de la interfaz del instalador (CD-02) en Windows, como las haría una persona.

Abre el instalador con su interfaz, pulsa sus opciones, lee los textos de cada paso y de cada mensaje, toma una
captura de pantalla en cada punto y comprueba el resultado en el computador (archivos, accesos directos y
registro). Complementa a instalador.ps1, que prueba el modo silencioso.

Los botones se pulsan con mensajes de Windows (WM_COMMAND y TDM_CLICK_BUTTON), sin mover el mouse, para que la
prueba no dependa de qué ventana tiene el foco.

Uso:
  python installer/pruebas/interfaz.py --instalador Windgets-Setup.exe --salida resultados --grupo compatible
  python installer/pruebas/interfaz.py --instalador Windgets-Setup.exe --salida resultados --grupo no-compatible
Con --disco-pequeno W: prueba además el espacio insuficiente en esa unidad (CD-02-HU01-CA04).
"""

import argparse
import json
import os
import shutil
import subprocess
import threading
import time
import traceback
import winreg
from pathlib import Path

import psutil
import win32api
import win32con
import win32gui
import win32process
from PIL import ImageGrab
from pywinauto import Desktop
from win32com.shell import shell, shellcon

# Textos literales de CD-02 (los CA son la autoridad; los mismos de installer.nsi).
NO_COMPATIBLE = (
    "Este computador no es compatible. Necesitas Windows 10 versión 22H2 o Windows 11, de 64 bits (x64)."
)
SIN_ESPACIO = "No hay suficiente espacio en disco. Libera al menos 500 MB e intenta de nuevo."
YA_INSTALADA = "Windgets ya está instalada. ¿Deseas reinstalarla?"
INCOMPLETA = "Encontramos una instalación incompleta. Vamos a repararla."
FALLA = "No pudimos completar la instalación. No se hicieron cambios en tu computador."
DANADO = "El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page."
CONFIRMAR_CANCELAR = "¿Deseas cancelar la instalación?"
CANCELADA = "La instalación se canceló."
COMPLETADA = "Instalación completada."
ELIMINAR_INSTALADOR = "Ya puedes eliminar el archivo del instalador que descargaste."
ARRANQUE = "Abrir la aplicación al iniciar Windows"
ESPACIO_REQUERIDO = "Espacio requerido: 500 MB"

CARPETA = Path(os.environ["LOCALAPPDATA"]) / "Programs" / "Windgets"
DESINSTALACION = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Windgets"
RUN = r"Software\Microsoft\Windows\CurrentVersion\Run"
ESQUEMA = r"Software\Classes\windgets"
ESCRITORIO = Path(shell.SHGetFolderPath(0, shellcon.CSIDL_DESKTOPDIRECTORY, None, 0)) / "Windgets.lnk"
MENU_INICIO = Path(shell.SHGetFolderPath(0, shellcon.CSIDL_PROGRAMS, None, 0)) / "Windgets.lnk"

ID_SIGUIENTE = 1  # «Instalar» en Opciones; «Cerrar» en Instalación completada
ID_CANCELAR = 2
ID_ENCABEZADO = 1037  # título del paso (MUI2)
TDM_CLICK_BUTTON = win32con.WM_USER + 102
OPCION_1 = 101  # primera opción de los mensajes con dos opciones (installer.nsi, Elegir)
OPCION_2 = 102


class Falla(Exception):
    pass


# ---------------------------------------------------------------------------------------------------------
# Registro y archivos
# ---------------------------------------------------------------------------------------------------------


def leer(clave, valor):
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, clave) as k:
            return winreg.QueryValueEx(k, valor)[0]
    except OSError:
        return None


def escribir(clave, valor, dato):
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, clave) as k:
        winreg.SetValueEx(k, valor, 0, winreg.REG_SZ, dato)


def existe(clave):
    try:
        winreg.OpenKey(winreg.HKEY_CURRENT_USER, clave).Close()
        return True
    except OSError:
        return False


def borrar_clave(clave):
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, clave, 0, winreg.KEY_ALL_ACCESS) as k:
            while True:
                try:
                    borrar_clave(clave + "\\" + winreg.EnumKey(k, 0))
                except OSError:
                    break
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, clave)
    except OSError:
        pass


def claves_del_producto():
    """Claves HKCU\\Software\\<fabricante>\\Windgets (el fabricante sale del identificador de la app)."""
    claves = []
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Software") as k:
        i = 0
        while True:
            try:
                nombre = winreg.EnumKey(k, i)
            except OSError:
                break
            i += 1
            if nombre.lower() != "microsoft" and existe(rf"Software\{nombre}\Windgets"):
                claves.append(rf"Software\{nombre}\Windgets")
    return claves


def estado():
    for clave in claves_del_producto():
        valor = leer(clave, "Estado")
        if valor is not None:
            return valor
    return None


def nucleo():
    return CARPETA / (leer(DESINSTALACION, "MainBinaryName") or "windgets.exe")


def cerrar_procesos():
    for p in psutil.process_iter(["name"]):
        nombre = (p.info["name"] or "").lower()
        if nombre.startswith("windgets") or nombre in ("uninstall.exe",):
            try:
                p.kill()
            except psutil.Error:
                pass
    time.sleep(0.5)


def limpiar():
    """Deja el computador sin Windgets (sin el desinstalador, que no tiene HU: DP-15)."""
    cerrar_procesos()
    for ruta in (CARPETA, Path(str(CARPETA) + ".anterior")):
        if ruta.is_dir():
            shutil.rmtree(ruta, ignore_errors=True)
        elif ruta.exists():
            ruta.unlink()
    for ruta in (ESCRITORIO, MENU_INICIO):
        if ruta.exists():
            ruta.unlink()
    for clave in [DESINSTALACION, ESQUEMA] + claves_del_producto():
        borrar_clave(clave)
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN, 0, winreg.KEY_SET_VALUE) as k:
            winreg.DeleteValue(k, "Windgets")
    except OSError:
        pass


def residuos():
    """RNF-15: 0 archivos y 0 entradas residuales. Devuelve lo que quedó."""
    quedan = []
    if CARPETA.exists():
        quedan.append("la carpeta de instalación")
    if Path(str(CARPETA) + ".anterior").exists():
        quedan.append("la copia de la instalación anterior")
    if existe(DESINSTALACION):
        quedan.append("la entrada de desinstalación")
    if existe(ESQUEMA):
        quedan.append("el esquema windgets://")
    if ESCRITORIO.exists():
        quedan.append("el acceso directo del escritorio")
    if MENU_INICIO.exists():
        quedan.append("el acceso directo del menú Inicio")
    if leer(RUN, "Windgets") is not None:
        quedan.append("el inicio automático")
    if estado() is not None:
        quedan.append("la marca de instalación")
    return quedan


def sin_residuos():
    quedan = residuos()
    if quedan:
        raise Falla("Quedó en el computador: " + ", ".join(quedan))


# ---------------------------------------------------------------------------------------------------------
# Ventanas
# ---------------------------------------------------------------------------------------------------------


def dialogos():
    encontrados = []

    def ver(h, _):
        if win32gui.IsWindowVisible(h) and win32gui.GetClassName(h) == "#32770":
            encontrados.append(h)
        return True

    win32gui.EnumWindows(ver, None)
    return encontrados


def hijos(h):
    encontrados = []
    try:
        win32gui.EnumChildWindows(h, lambda c, _: encontrados.append(c) or True, None)
    except win32gui.error:
        pass
    return encontrados


def es_principal(h):
    return any(win32gui.GetDlgCtrlID(c) == ID_ENCABEZADO for c in hijos(h))


def es_mensaje_con_opciones(h):
    return any(win32gui.GetClassName(c) == "DirectUIHWND" for c in hijos(h))


def textos(h):
    """Textos visibles de una ventana. Los mensajes con opciones (TaskDialog) se leen con UI Automation."""
    vistos = [win32gui.GetWindowText(h)]
    vistos += [win32gui.GetWindowText(c) for c in hijos(h) if win32gui.IsWindowVisible(c)]
    if es_mensaje_con_opciones(h):
        try:
            for d in Desktop(backend="uia").window(handle=h).descendants():
                vistos.append(d.window_text())
        except Exception as e:  # noqa: BLE001 (solo para el diagnóstico)
            vistos.append(f"<UI Automation: {e}>")
    return [t.replace("&", "") for t in vistos if t]


def describir():
    return "; ".join(f"[{' | '.join(textos(h))}]" for h in dialogos()) or "ninguna"


def esperar(condicion, que, segundos=30, cada=0.1):
    fin = time.time() + segundos
    while time.time() < fin:
        for h in dialogos():
            try:
                if condicion(h):
                    return h
            except win32gui.error:
                pass
        time.sleep(cada)
    raise Falla(f"No apareció {que}. Ventanas abiertas: {describir()}")


def con_texto(texto):
    return lambda h: not es_principal(h) and any(texto in t for t in textos(h))


def principal(segundos=30):
    return esperar(es_principal, "la ventana del instalador", segundos)


def control(h, texto):
    for c in hijos(h):
        if win32gui.GetWindowText(c).replace("&", "") == texto and win32gui.IsWindowVisible(c):
            return c
    return None


def en_opciones(h):
    return es_principal(h) and control(h, ARRANQUE) is not None


def en_completada(h):
    return es_principal(h) and control(h, "Abrir Windgets") is not None


def pulsar(h, id_boton):
    """Pulsa un botón de la ventana del instalador o de un mensaje simple."""
    win32api.PostMessage(h, win32con.WM_COMMAND, id_boton, win32gui.GetDlgItem(h, id_boton))


def pulsar_control(c):
    padre = win32gui.GetParent(c)
    win32api.PostMessage(padre, win32con.WM_COMMAND, win32gui.GetDlgCtrlID(c), c)


def elegir(h, opcion):
    """Elige una de las dos opciones de un mensaje con opciones propias."""
    win32api.PostMessage(h, TDM_CLICK_BUTTON, opcion, 0)


def habilitado(h, id_boton):
    return bool(win32gui.IsWindowEnabled(win32gui.GetDlgItem(h, id_boton)))


def mensaje_con_opciones(texto, opcion1, opcion2):
    """Espera el mensaje y comprueba que es el cuadro con las dos opciones propias (no el «Sí/No» de reserva)."""
    h = esperar(con_texto(texto), f"el mensaje «{texto}»")
    if not es_mensaje_con_opciones(h):
        raise Falla(f"El mensaje «{texto}» salió con «Sí» y «No» en vez de «{opcion1}» y «{opcion2}».")
    vistos = textos(h)
    for opcion in (opcion1, opcion2):
        if opcion not in vistos:
            raise Falla(f"El mensaje «{texto}» no muestra la opción «{opcion}». Muestra: {vistos}")
    return h


# ---------------------------------------------------------------------------------------------------------
# Registro de resultados
# ---------------------------------------------------------------------------------------------------------


class Informe:
    def __init__(self, salida: Path):
        self.salida = salida
        salida.mkdir(parents=True, exist_ok=True)
        self.pruebas = []
        self.numero = 0
        self.actual = None

    def captura(self, que):
        time.sleep(0.6)  # que termine de dibujarse
        self.numero += 1
        nombre = f"{self.numero:02d}-{que}.png"
        ImageGrab.grab(all_screens=True).save(self.salida / nombre)
        self.actual["capturas"].append({"archivo": nombre, "que": que})

    def nota(self, texto):
        self.actual["notas"].append(texto)

    def prueba(self, ids, nombre, cuerpo):
        self.actual = {"ids": ids, "nombre": nombre, "resultado": "ok", "detalle": "", "capturas": [], "notas": []}
        inicio = time.time()
        try:
            cuerpo(self)
        except Exception as e:  # noqa: BLE001 (cada prueba informa su falla y sigue la siguiente)
            self.actual["resultado"] = "falla"
            self.actual["detalle"] = str(e) if isinstance(e, Falla) else traceback.format_exc()
            try:
                self.captura("falla")
            except Exception:  # noqa: BLE001
                pass
        finally:
            cerrar_procesos()
        self.actual["segundos"] = round(time.time() - inicio, 1)
        self.pruebas.append(self.actual)
        marca = "ok    " if self.actual["resultado"] == "ok" else "FALLA "
        print(f"{marca} {' '.join(ids)} · {nombre}", flush=True)
        if self.actual["detalle"]:
            print("       " + self.actual["detalle"].replace("\n", "\n       "), flush=True)

    def guardar(self, grupo):
        datos = {
            "grupo": grupo,
            "windows": win32api.GetVersionEx(1)[:3],
            "compilacion": leer_hklm(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber"),
            "producto": leer_hklm(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName"),
            "pruebas": self.pruebas,
        }
        (self.salida / "resultados.json").write_text(json.dumps(datos, ensure_ascii=False, indent=2), "utf-8")
        return all(p["resultado"] == "ok" for p in self.pruebas)


def leer_hklm(clave, valor):
    try:
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, clave) as k:
            return str(winreg.QueryValueEx(k, valor)[0])
    except OSError:
        return None


# ---------------------------------------------------------------------------------------------------------
# Pasos comunes
# ---------------------------------------------------------------------------------------------------------


def abrir(instalador, *argumentos):
    return subprocess.Popen([str(instalador), *argumentos])


def salida(proceso, esperado, segundos=60):
    try:
        codigo = proceso.wait(segundos)
    except subprocess.TimeoutExpired:
        raise Falla(f"El instalador no se cerró en {segundos} s. Ventanas abiertas: {describir()}") from None
    if codigo != esperado:
        raise Falla(f"El código de salida es {codigo}; se esperaba {esperado}.")


def comprobar_opciones(inf, h):
    """CD-02-HU01-ET01: espacio requerido, casilla marcada por defecto, «Instalar» y «Cancelar»."""
    vistos = textos(h)
    if ESPACIO_REQUERIDO not in vistos:
        raise Falla(f"El paso Opciones no muestra «{ESPACIO_REQUERIDO}». Muestra: {vistos}")
    if not any(t.startswith("Espacio disponible: ") for t in vistos):
        raise Falla(f"El paso Opciones no muestra el espacio disponible. Muestra: {vistos}")
    casilla = control(h, ARRANQUE)
    if win32gui.SendMessage(casilla, win32con.BM_GETCHECK, 0, 0) != win32con.BST_CHECKED:
        raise Falla(f"La casilla «{ARRANQUE}» no está marcada por defecto.")
    if win32gui.GetWindowText(win32gui.GetDlgItem(h, ID_SIGUIENTE)).replace("&", "") != "Instalar":
        raise Falla("El paso Opciones no muestra la opción «Instalar».")
    if win32gui.GetWindowText(win32gui.GetDlgItem(h, ID_CANCELAR)).replace("&", "") != "Cancelar":
        raise Falla("El paso Opciones no muestra la opción «Cancelar».")
    inf.nota("Opciones: " + " | ".join(vistos))


def instalar_hasta_completada(inf, h, que="completada"):
    pulsar(h, ID_SIGUIENTE)
    h = esperar(en_completada, "el paso Instalación completada", 120)
    vistos = textos(h)
    for texto in (COMPLETADA, ELIMINAR_INSTALADOR):
        if texto not in vistos:
            raise Falla(f"El paso Instalación completada no muestra «{texto}». Muestra: {vistos}")
    inf.captura(que)
    return h


def cerrar_completada(h):
    pulsar(h, ID_SIGUIENTE)


def comprobar_instalada():
    if not nucleo().exists():
        raise Falla(f"No está el Núcleo en {nucleo()}.")
    if not (CARPETA / "assets" / "templates" / "default").exists():
        raise Falla("No está la plantilla por defecto (D-198).")
    if not ESCRITORIO.exists() or not MENU_INICIO.exists():
        raise Falla("Faltan los accesos directos del escritorio o del menú Inicio (ET11).")
    if estado() != "completa":
        raise Falla(f"La instalación no quedó completa (marca: {estado()}).")


def ventanas_de_la_app():
    pids = {p.pid for p in psutil.process_iter(["name"]) if (p.info["name"] or "").lower() == "windgets.exe"}
    encontradas = []

    def ver(h, _):
        if win32gui.IsWindowVisible(h) and win32process.GetWindowThreadProcessId(h)[1] in pids:
            if win32gui.GetWindowText(h):
                encontradas.append(h)
        return True

    win32gui.EnumWindows(ver, None)
    return encontradas


# ---------------------------------------------------------------------------------------------------------
# Pruebas
# ---------------------------------------------------------------------------------------------------------


def pruebas_compatible(inf: Informe, instalador: Path, temporal: Path, disco_pequeno):
    limpiar()

    def incompleto(inf):
        archivo = temporal / "Windgets-incompleto.exe"
        shutil.copy(instalador, archivo)
        with open(archivo, "r+b") as f:
            f.truncate(archivo.stat().st_size - 4096)
        proceso = abrir(archivo)
        h = esperar(con_texto(DANADO), f"el mensaje «{DANADO}»")
        inf.nota(f"Título del mensaje: «{win32gui.GetWindowText(h)}»")
        inf.captura("descarga-incompleta")
        pulsar(h, win32con.IDOK)
        proceso.wait(30)
        inf.nota(f"Código de salida: {proceso.returncode}")
        if proceso.returncode == 0:
            raise Falla("El instalador incompleto terminó como si hubiera instalado.")
        sin_residuos()

    inf.prueba(["CD-02-HU01-CA12"], "Instalador descargado incompleto", incompleto)

    def danado(inf):
        archivo = temporal / "Windgets-danado.exe"
        datos = bytearray(instalador.read_bytes())
        datos[len(datos) // 2] ^= 0xFF
        archivo.write_bytes(datos)
        proceso = abrir(archivo)
        h = esperar(con_texto(DANADO), f"el mensaje «{DANADO}»")
        inf.captura("descarga-danada")
        pulsar(h, win32con.IDOK)
        salida(proceso, 3)
        sin_residuos()

    inf.prueba(["CD-02-HU01-CA12"], "Instalador descargado dañado", danado)

    def volver_a_opciones(inf):
        proceso = abrir(instalador)
        h = esperar(en_opciones, "el paso Opciones")
        comprobar_opciones(inf, h)
        inf.captura("paso-opciones")
        pulsar(h, ID_CANCELAR)
        m = mensaje_con_opciones(CONFIRMAR_CANCELAR, "Cancelar instalación", "Seguir instalando")
        inf.captura("cancelar-desde-opciones")
        elegir(m, OPCION_2)
        time.sleep(1)
        h = esperar(en_opciones, "el paso Opciones después de «Seguir instalando»", 10)
        if any(con_texto(CONFIRMAR_CANCELAR)(x) for x in dialogos()):
            raise Falla("El mensaje sigue abierto después de «Seguir instalando».")
        inf.captura("volver-a-opciones")
        # CD-02-HU03-CA05
        pulsar(h, ID_CANCELAR)
        m = mensaje_con_opciones(CONFIRMAR_CANCELAR, "Cancelar instalación", "Seguir instalando")
        elegir(m, OPCION_1)
        salida(proceso, 1)
        sin_residuos()

    inf.prueba(
        ["CD-02-HU01-ET01", "CD-02-HU03-CA04", "CD-02-HU03-CA06", "CD-02-HU03-CA05"],
        "Paso Opciones, cancelar y volver, cancelar y cerrar",
        volver_a_opciones,
    )

    def cancelar_en_curso(inf, confirmar):
        proceso = abrir(instalador)
        h = esperar(en_opciones, "el paso Opciones")
        pulsar(h, ID_SIGUIENTE)
        fin = time.time() + 60
        while time.time() < fin:
            if win32gui.GetWindowText(win32gui.GetDlgItem(h, ID_ENCABEZADO)) == "Instalación en curso" and habilitado(
                h, ID_CANCELAR
            ):
                break
            if en_completada(h):
                raise Falla("La instalación terminó antes de poder pulsar «Cancelar».")
            time.sleep(0.02)
        else:
            raise Falla("«Cancelar» no se habilitó en el paso Instalación en curso.")
        pulsar(h, ID_CANCELAR)
        m = mensaje_con_opciones(CONFIRMAR_CANCELAR, "Cancelar instalación", "Seguir instalando")
        inf.captura("cancelar-en-curso")
        return proceso, h, m

    def confirmar_cancelacion(inf):
        proceso, _, m = cancelar_en_curso(inf, True)
        elegir(m, OPCION_1)
        aviso = esperar(con_texto(CANCELADA), f"el mensaje «{CANCELADA}»", 120)
        inf.captura("instalacion-cancelada")
        pulsar(aviso, win32con.IDOK)
        salida(proceso, 1)
        sin_residuos()

    inf.prueba(
        ["CD-02-HU03-CA01", "CD-02-HU03-CA02"],
        "Cancelar con la instalación en curso y confirmar",
        confirmar_cancelacion,
    )
    limpiar()

    def seguir_instalando(inf):
        proceso, h, m = cancelar_en_curso(inf, False)
        elegir(m, OPCION_2)
        h = esperar(en_completada, "el paso Instalación completada", 120)
        inf.captura("siguio-instalando")
        cerrar_completada(h)
        salida(proceso, 0)
        comprobar_instalada()

    inf.prueba(["CD-02-HU03-CA03"], "Seguir con la instalación", seguir_instalando)
    limpiar()

    def instalacion_exitosa(inf):
        proceso = abrir(instalador)
        h = esperar(en_opciones, "el paso Opciones")
        comprobar_opciones(inf, h)
        pulsar(h, ID_SIGUIENTE)
        h = esperar(en_completada, "el paso Instalación completada", 120)
        vistos = textos(h)
        for texto in (COMPLETADA, ELIMINAR_INSTALADOR, "Abrir Windgets"):
            if texto not in vistos:
                raise Falla(f"El paso Instalación completada no muestra «{texto}». Muestra: {vistos}")
        inf.captura("instalacion-completada")
        comprobar_instalada()
        valor = leer(RUN, "Windgets")
        if valor != f'"{nucleo()}" --autostart':
            raise Falla(f"No registró el inicio automático (INT-08). Valor: {valor}")
        # CD-02-HU01-CA02
        pulsar_control(control(h, "Abrir Windgets"))
        salida(proceso, 0, 30)
        fin = time.time() + 45
        while time.time() < fin and not ventanas_de_la_app():
            time.sleep(0.5)
        ventanas = ventanas_de_la_app()
        if not ventanas:
            raise Falla("«Abrir Windgets» no abrió la aplicación.")
        time.sleep(5)  # que la vista web termine de cargar
        inf.nota("Ventanas de la aplicación: " + ", ".join(f"«{win32gui.GetWindowText(v)}»" for v in ventanas))
        inf.captura("aplicacion-abierta")

    inf.prueba(
        ["CD-02-HU01-CA01", "CD-02-HU02-CA01", "CD-02-HU01-CA02"],
        "Instalación exitosa con inicio automático y abrir Windgets",
        instalacion_exitosa,
    )

    def ya_instalada(inf, opcion):
        proceso = abrir(instalador)
        h = esperar(en_opciones, "el paso Opciones")
        pulsar(h, ID_SIGUIENTE)
        m = mensaje_con_opciones(YA_INSTALADA, "Reinstalar", "Cancelar")
        return proceso, m

    def cancelar_reinstalacion(inf):
        antes = nucleo().stat().st_mtime
        proceso, m = ya_instalada(inf, OPCION_2)
        inf.captura("ya-instalada")
        elegir(m, OPCION_2)
        salida(proceso, 1)
        if nucleo().stat().st_mtime != antes or estado() != "completa":
            raise Falla("«Cancelar» cambió la instalación.")

    inf.prueba(["CD-02-HU01-CA05", "CD-02-HU01-CA07"], "Aplicación ya instalada y cancelar", cancelar_reinstalacion)

    def reinstalar(inf):
        recurso = next(p for p in (CARPETA / "assets").rglob("*") if p.is_file())
        recurso.unlink()
        proceso, m = ya_instalada(inf, OPCION_1)
        elegir(m, OPCION_1)
        h = esperar(en_completada, "el paso Instalación completada", 120)
        inf.captura("reinstalada")
        cerrar_completada(h)
        salida(proceso, 0)
        if not recurso.exists():
            raise Falla("No repitió la instalación completa.")
        comprobar_instalada()

    inf.prueba(["CD-02-HU01-CA06"], "Reinstalar la aplicación", reinstalar)

    def incompleta(inf):
        for clave in claves_del_producto():
            escribir(clave, "Estado", "incompleta")
        proceso = abrir(instalador)
        h = esperar(en_opciones, "el paso Opciones")
        pulsar(h, ID_SIGUIENTE)
        m = mensaje_con_opciones(INCOMPLETA, "Reparar", "Cancelar")
        return proceso, m

    def cancelar_reparacion(inf):
        proceso, m = incompleta(inf)
        inf.captura("instalacion-incompleta")
        elegir(m, OPCION_2)
        salida(proceso, 1)
        if estado() != "incompleta":
            raise Falla("«Cancelar» cambió la instalación incompleta.")

    inf.prueba(["CD-02-HU01-CA09", "CD-02-HU01-CA11"], "Instalación incompleta y cancelar", cancelar_reparacion)

    def reparar(inf):
        nucleo().unlink()
        proceso, m = incompleta(inf)
        elegir(m, OPCION_1)
        h = esperar(en_completada, "el paso Instalación completada", 120)
        inf.captura("reparada")
        cerrar_completada(h)
        salida(proceso, 0)
        comprobar_instalada()

    inf.prueba(["CD-02-HU01-CA10"], "Reparar la instalación incompleta", reparar)
    limpiar()

    def sin_arranque(inf):
        proceso = abrir(instalador)
        h = esperar(en_opciones, "el paso Opciones")
        win32gui.SendMessage(control(h, ARRANQUE), win32con.BM_SETCHECK, win32con.BST_UNCHECKED, 0)
        inf.captura("casilla-desmarcada")
        h = instalar_hasta_completada(inf, h, "instalada-sin-arranque")
        cerrar_completada(h)
        salida(proceso, 0)
        comprobar_instalada()
        if leer(RUN, "Windgets") is not None:
            raise Falla("Registró el inicio automático con la casilla desmarcada.")

    inf.prueba(["CD-02-HU02-CA02"], "Instalar sin inicio automático", sin_arranque)
    limpiar()

    def error_durante_la_instalacion(inf):
        CARPETA.parent.mkdir(parents=True, exist_ok=True)
        CARPETA.write_text("bloqueo")  # un archivo con el nombre de la carpeta impide crearla
        try:
            proceso = abrir(instalador)
            h = esperar(en_opciones, "el paso Opciones")
            pulsar(h, ID_SIGUIENTE)
            m = mensaje_con_opciones(FALLA, "Reintentar", "Cerrar")
            inf.captura("error-de-instalacion")
            # «Reintentar» vuelve al paso Opciones (ET23).
            elegir(m, OPCION_1)
            salida(proceso, 4)
            h = esperar(en_opciones, "el paso Opciones después de «Reintentar»", 30)
            inf.captura("reintentar")
            pulsar(h, ID_SIGUIENTE)
            m = mensaje_con_opciones(FALLA, "Reintentar", "Cerrar")
            elegir(m, OPCION_2)
            fin = time.time() + 30
            while time.time() < fin and any(es_principal(x) for x in dialogos()):
                time.sleep(0.2)
            if any(es_principal(x) for x in dialogos()):
                raise Falla("«Cerrar» no cerró el instalador.")
            if not CARPETA.is_file():
                raise Falla("No dejó el computador como estaba.")
            quedan = [r for r in residuos() if r != "la carpeta de instalación"]
            if quedan:
                raise Falla("Quedó en el computador: " + ", ".join(quedan))
        finally:
            cerrar_procesos()
            if CARPETA.is_file():
                CARPETA.unlink()

    inf.prueba(
        ["CD-02-HU01-CA08"], "Error durante la instalación, «Reintentar» y «Cerrar»", error_durante_la_instalacion
    )
    limpiar()

    if disco_pequeno:

        def sin_espacio(inf):
            proceso = abrir(instalador, f"/D={disco_pequeno}\\Windgets")
            h = esperar(en_opciones, "el paso Opciones")
            vistos = textos(h)
            inf.nota("Opciones: " + " | ".join(vistos))
            inf.captura("sin-espacio")
            if SIN_ESPACIO not in vistos:
                raise Falla(f"El paso Opciones no muestra «{SIN_ESPACIO}». Muestra: {vistos}")
            if habilitado(h, ID_SIGUIENTE):
                raise Falla("«Instalar» sigue habilitada sin espacio suficiente.")
            pulsar(h, ID_CANCELAR)
            elegir(mensaje_con_opciones(CONFIRMAR_CANCELAR, "Cancelar instalación", "Seguir instalando"), OPCION_1)
            salida(proceso, 1)
            sin_residuos()

        inf.prueba(["CD-02-HU01-CA04"], f"Espacio en disco insuficiente (unidad {disco_pequeno})", sin_espacio)


def pruebas_no_compatible(inf: Informe, instalador: Path):
    limpiar()

    def no_compatible(inf):
        proceso = abrir(instalador)
        h = esperar(con_texto(NO_COMPATIBLE), f"el mensaje «{NO_COMPATIBLE}»")
        inf.captura("no-compatible")
        pulsar(h, win32con.IDOK)
        salida(proceso, 2)
        sin_residuos()

    inf.prueba(["CD-02-HU01-CA03"], "Versión de Windows no compatible", no_compatible)


def main():
    argumentos = argparse.ArgumentParser()
    argumentos.add_argument("--instalador", required=True)
    argumentos.add_argument("--salida", required=True)
    argumentos.add_argument("--grupo", choices=["compatible", "no-compatible"], required=True)
    argumentos.add_argument("--disco-pequeno")
    a = argumentos.parse_args()

    instalador = Path(a.instalador).resolve()
    inf = Informe(Path(a.salida))
    temporal = Path(os.environ.get("RUNNER_TEMP", os.environ["TEMP"]))
    # Un vigilante: si una prueba se queda esperando, el job no se queda colgado para siempre.
    threading.Timer(25 * 60, lambda: os._exit(2)).start()
    try:
        if a.grupo == "compatible":
            pruebas_compatible(inf, instalador, temporal, a.disco_pequeno)
        else:
            pruebas_no_compatible(inf, instalador)
    finally:
        limpiar()
    bien = inf.guardar(a.grupo)
    print("Pruebas de interfaz en verde." if bien else "Hay pruebas de interfaz en rojo.", flush=True)
    os._exit(0 if bien else 1)


if __name__ == "__main__":
    main()
