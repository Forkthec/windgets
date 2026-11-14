; Instalador .exe todo en uno de Windgets (CD-02; contrato INT-13 en contratos.md). Plantilla propia para el
; empaquetador NSIS de Tauri (convenciones.md, «Instalador»), hecha a partir de la plantilla de Tauri 2.12.
;
; Pasos (CD-02-HU01-ET22): Opciones, Instalación en curso e Instalación completada.
; Códigos de salida (DP-19, para pruebas automáticas): 0 instalada; 1 cancelada; 2 computador no compatible o
; sin espacio; 3 instalador dañado; 4 falla con reversión.
; Modo silencioso (/S, solo pruebas automáticas): reinstala o repara sin preguntar; /SINARRANQUE deja sin marcar
; «Abrir la aplicación al iniciar Windows».
Unicode true
ManifestDPIAware true
ManifestDPIAwareness PerMonitorV2
; Controles comunes v6: los mensajes con opciones propias usan TaskDialogIndirect.
XPStyle on
; La integridad la comprueba VerificarIntegridad con su propio mensaje (CD-02-HU01-CA12): el mensaje de la
; comprobación de NSIS es fijo, en inglés, y no se puede cambiar.
CRCCheck off

!if "{{compression}}" == "none"
  SetCompress off
!else
  SetCompressor /SOLID "{{compression}}"
!endif

{{#if signed_plugins_path}}
!addplugindir "{{signed_plugins_path}}"
{{/if}}

!include MUI2.nsh
!include nsDialogs.nsh
!include LogicLib.nsh
!include FileFunc.nsh
!include x64.nsh
!include WordFunc.nsh
!include "utils.nsh"
!include "FileAssociation.nsh"
!include "Win\COM.nsh"
!include "Win\Propkey.nsh"
!include "Win\RestartManager.nsh"
!include "StrFunc.nsh"

{{#if installer_hooks}}
!include "{{installer_hooks}}"
{{/if}}

!define WEBVIEW2APPGUID "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"

!define MANUFACTURER "{{manufacturer}}"
!define PRODUCTNAME "{{product_name}}"
!define VERSION "{{version}}"
!define VERSIONWITHBUILD "{{version_with_build}}"
!define INSTALLMODE "{{install_mode}}"
!define INSTALLERICON "{{installer_icon}}"
!define UNINSTALLERICON "{{uninstaller_icon}}"
!define MAINBINARYNAME "{{main_binary_name}}"
!define MAINBINARYSRCPATH "{{main_binary_path}}"
!define BUNDLEID "{{bundle_id}}"
!define COPYRIGHT "{{copyright}}"
!define OUTFILE "{{out_file}}"
!define ADDITIONALPLUGINSPATH "{{additional_plugins_path}}"
!define INSTALLWEBVIEW2MODE "{{install_webview2_mode}}"
!define WEBVIEW2INSTALLERARGS "{{webview2_installer_args}}"
!define WEBVIEW2BOOTSTRAPPERPATH "{{webview2_bootstrapper_path}}"
!define WEBVIEW2INSTALLERPATH "{{webview2_installer_path}}"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCTNAME}"
!define MANUKEY "Software\${MANUFACTURER}"
!define MANUPRODUCTKEY "${MANUKEY}\${PRODUCTNAME}"
!define RUNKEY "Software\Microsoft\Windows\CurrentVersion\Run"
!define ESQUEMAKEY "Software\Classes\windgets"
!define ESTIMATEDSIZE "{{estimated_size}}"

; Requisitos del sistema (CD-02-HU01-ET04; D-050, D-057).
!define COMPILACION_WIN10_22H2 19045
!define COMPILACION_WIN11 22000
!define ESPACIO_REQUERIDO_MB 500

; Marca de integridad que agrega installer/sellar.mjs al final del .exe: "WGI1" y el CRC-32 de lo anterior.
!define MARCA_INTEGRIDAD 0x31494757

; Textos literales de CD-02 (los CA son la autoridad).
!define TXT_NO_COMPATIBLE "Este computador no es compatible. Necesitas Windows 10 versión 22H2 o Windows 11, de 64 bits (x64)."
!define TXT_SIN_ESPACIO "No hay suficiente espacio en disco. Libera al menos 500 MB e intenta de nuevo."
!define TXT_YA_INSTALADA "Windgets ya está instalada. ¿Deseas reinstalarla?"
!define TXT_INCOMPLETA "Encontramos una instalación incompleta. Vamos a repararla."
!define TXT_FALLA "No pudimos completar la instalación. No se hicieron cambios en tu computador."
!define TXT_DANADO "El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page."
!define TXT_CONFIRMAR_CANCELAR "¿Deseas cancelar la instalación?"
!define TXT_CANCELADA "La instalación se canceló."
!define TXT_COMPLETADA "Instalación completada."
!define TXT_ELIMINAR_INSTALADOR "Ya puedes eliminar el archivo del instalador que descargaste."
!define TXT_ARRANQUE "Abrir la aplicación al iniciar Windows"
; DUDA: CD-02-HU01-CA04 pide ver el espacio disponible y el requerido sin texto literal (docs/DUDAS.md).
!define TXT_ESPACIO_REQUERIDO "Espacio requerido: ${ESPACIO_REQUERIDO_MB} MB"
!define TXT_ESPACIO_DISPONIBLE "Espacio disponible:"

; Variables que usa la macro CheckIfAppIsRunning de utils.nsh (Tauri).
Var PassiveMode

Var Arranque          ; 1 si «Abrir la aplicación al iniciar Windows» está marcada (CD-02-HU02)
Var Estado            ; "", "completa" o "incompleta"
Var EspacioLibreMB
Var EnCurso           ; 1 mientras corre el paso Instalación en curso
Var Cancelar          ; 1 cuando se confirmó «Cancelar instalación» con la instalación en curso
Var Respaldo          ; carpeta de la instalación anterior, renombrada mientras se instala
Var HabiaInstalacion
Var TeniaArranque
Var ArranqueAnterior
Var TeniaEstado
Var EstadoAnterior
Var CasillaArranque
Var BotonInstalar
; Mensaje con dos opciones propias (Elegir). Usa solo $R5 a $R9, que ninguna sección usa, porque también se
; llama desde .onUserAbort mientras la sección corre en otro hilo.
Var ElegirTexto
Var ElegirOpcion1
Var ElegirOpcion2
Var ElegirMemoria1
Var ElegirMemoria2
Var ElegirMemoriaTexto
Var ElegirMemoriaTitulo
Var ElegirMemoriaBotones
Var ElegirMemoriaConfig
Var Terminada         ; 1 en el paso Instalación completada: cerrar ya no pregunta si se cancela

Name "${PRODUCTNAME}"
BrandingText "${PRODUCTNAME}"
OutFile "${OUTFILE}"
; Instalación por usuario, sin permisos de administrador (INT-13).
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\${PRODUCTNAME}"

VIProductVersion "${VERSIONWITHBUILD}"
VIAddVersionKey "ProductName" "${PRODUCTNAME}"
VIAddVersionKey "FileDescription" "${PRODUCTNAME}"
VIAddVersionKey "LegalCopyright" "${COPYRIGHT}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"

!addplugindir "${ADDITIONALPLUGINSPATH}"

!if "${INSTALLERICON}" != ""
  !define MUI_ICON "${INSTALLERICON}"
!endif
!if "${UNINSTALLERICON}" != ""
  !define MUI_UNICON "${UNINSTALLERICON}"
!endif

; ---------------------------------------------------------------------------------------------------------
; Mensajes con dos opciones propias (RT-04: confirmación y aviso). $R9 queda en 1 (primera opción) o 2
; (segunda opción, también con Esc o al cerrar el mensaje).
; ---------------------------------------------------------------------------------------------------------
!macro Elegir TEXTO OPCION1 OPCION2
  StrCpy $ElegirTexto "${TEXTO}"
  StrCpy $ElegirOpcion1 "${OPCION1}"
  StrCpy $ElegirOpcion2 "${OPCION2}"
  Call Elegir
!macroend

; TASKDIALOGCONFIG y TASKDIALOG_BUTTON están empaquetados a 1 byte (commctrl.h); el instalador es de 32 bits.
!define TDC_TAMANO 96
!define TDF_ALLOW_DIALOG_CANCELLATION 0x0008
!define TDF_POSITION_RELATIVE_TO_WINDOW 0x1000

Function Elegir
  ${If} ${Silent}
    StrCpy $R9 2
    Return
  ${EndIf}
  ; Cada cadena en su propia memoria (TaskDialogIndirect recibe sus direcciones).
  System::Call '*(&w${NSIS_MAX_STRLEN} "$ElegirOpcion1") p .R5'
  StrCpy $ElegirMemoria1 $R5
  System::Call '*(&w${NSIS_MAX_STRLEN} "$ElegirOpcion2") p .R5'
  StrCpy $ElegirMemoria2 $R5
  System::Call '*(&w${NSIS_MAX_STRLEN} "$ElegirTexto") p .R5'
  StrCpy $ElegirMemoriaTexto $R5
  System::Call '*(&w${NSIS_MAX_STRLEN} "${PRODUCTNAME}") p .R5'
  StrCpy $ElegirMemoriaTitulo $R5
  System::Call '*(i 101, p $ElegirMemoria1, i 102, p $ElegirMemoria2) p .R5'
  StrCpy $ElegirMemoriaBotones $R5
  IntOp $R6 ${TDF_ALLOW_DIALOG_CANCELLATION} | ${TDF_POSITION_RELATIVE_TO_WINDOW}
  System::Call '*(i ${TDC_TAMANO}, p $HWNDPARENT, p 0, i R6, i 0, p $ElegirMemoriaTitulo, p 0, p 0, p $ElegirMemoriaTexto, i 2, p $ElegirMemoriaBotones, i 102, i 0, p 0, i 0, p 0, p 0, p 0, p 0, p 0, p 0, p 0, p 0, i 0) p .R5'
  StrCpy $ElegirMemoriaConfig $R5
  System::Call 'comctl32::TaskDialogIndirect(p $ElegirMemoriaConfig, *i .R7, p 0, p 0) i .R8'
  System::Free $ElegirMemoriaConfig
  System::Free $ElegirMemoriaBotones
  System::Free $ElegirMemoriaTitulo
  System::Free $ElegirMemoriaTexto
  System::Free $ElegirMemoria2
  System::Free $ElegirMemoria1
  ${If} $R8 == "0"
    ${If} $R7 = 101
      StrCpy $R9 1
    ${Else}
      StrCpy $R9 2
    ${EndIf}
    Return
  ${EndIf}
  ; Sin TaskDialogIndirect: Sí es la primera opción y No, la segunda.
  MessageBox MB_YESNO|MB_DEFBUTTON2 "$ElegirTexto$\r$\n$\r$\nSí: $ElegirOpcion1$\r$\nNo: $ElegirOpcion2" IDYES elegir_primera
  StrCpy $R9 2
  Return
  elegir_primera:
  StrCpy $R9 1
FunctionEnd

; ---------------------------------------------------------------------------------------------------------
; Comprobaciones antes de hacer cualquier cambio (CD-02-HU01-ET03, ET04, ET17).
; ---------------------------------------------------------------------------------------------------------

; Calcula el CRC-32 del propio .exe sin sus 8 bytes finales y lo compara con la marca de installer/sellar.mjs.
; Una descarga incompleta pierde la marca y una dañada no coincide (CD-02-HU01-CA12). Deja $0 en 1 si está bien.
Function VerificarIntegridad
  StrCpy $0 0
  ; GENERIC_READ, FILE_SHARE_READ, OPEN_EXISTING
  System::Call 'kernel32::CreateFileW(w "$EXEPATH", i 0x80000000, i 1, p 0, i 3, i 0, p 0) p .r1'
  ${If} $1 = -1
    Return
  ${EndIf}
  System::Call 'kernel32::GetFileSize(p r1, p 0) i .r2'
  ${If} $2 > 8
    ; PAGE_READONLY y FILE_MAP_READ
    System::Call 'kernel32::CreateFileMappingW(p r1, p 0, i 2, i 0, i 0, p 0) p .r3'
    ${If} $3 P<> 0
      System::Call 'kernel32::MapViewOfFile(p r3, i 4, i 0, i 0, p 0) p .r4'
      ${If} $4 P<> 0
        IntOp $5 $2 - 8
        System::Call 'ntdll::RtlComputeCrc32(i 0, p r4, i r5) i .r6'
        IntPtrOp $7 $4 + $5
        System::Call '*$7(i .r8, i .r9)'
        ${If} $8 = ${MARCA_INTEGRIDAD}
        ${AndIf} $9 = $6
          StrCpy $0 1
        ${EndIf}
        System::Call 'kernel32::UnmapViewOfFile(p r4)'
      ${EndIf}
      System::Call 'kernel32::CloseHandle(p r3)'
    ${EndIf}
  ${EndIf}
  System::Call 'kernel32::CloseHandle(p r1)'
FunctionEnd

; Windows 10 versión 22H2 (compilación 19045) o Windows 11 (22000 o posterior), con procesador x64. Deja $0 en 1
; si cumple (CD-02-HU01-CA03, ET04).
Function VerificarSistema
  StrCpy $0 0
  ${IfNot} ${IsNativeAMD64}
    Return
  ${EndIf}
  SetRegView 64
  ReadRegStr $1 HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion" "CurrentBuildNumber"
  SetRegView lastused
  ${If} $1 = ${COMPILACION_WIN10_22H2}
  ${OrIf} $1 >= ${COMPILACION_WIN11}
    StrCpy $0 1
  ${EndIf}
FunctionEnd

Function MedirEspacio
  ${GetRoot} "$INSTDIR" $1
  ${DriveSpace} "$1\" "/D=F /S=M" $EspacioLibreMB
FunctionEnd

; La instalación está completa si el Núcleo existe y la última instalación terminó; incompleta si una
; instalación anterior se interrumpió (CD-02-HU01-CA05, CA09).
Function LeerEstado
  ReadRegStr $Estado HKCU "${MANUPRODUCTKEY}" "Estado"
  ${If} $Estado == "completa"
  ${AndIfNot} ${FileExists} "$INSTDIR\${MAINBINARYNAME}.exe"
    StrCpy $Estado "incompleta"
  ${EndIf}
FunctionEnd

Function .onInit
  StrCpy $Arranque 1
  StrCpy $EnCurso 0
  StrCpy $Cancelar 0
  StrCpy $Terminada 0
  StrCpy $PassiveMode 0
  SetShellVarContext current

  Call VerificarIntegridad
  ${If} $0 <> 1
    MessageBox MB_ICONSTOP "${TXT_DANADO}" /SD IDOK
    SetErrorLevel 3
    Quit
  ${EndIf}

  Call VerificarSistema
  ${If} $0 <> 1
    MessageBox MB_ICONSTOP "${TXT_NO_COMPATIBLE}" /SD IDOK
    SetErrorLevel 2
    Quit
  ${EndIf}

  ${GetOptions} $CMDLINE "/SINARRANQUE" $0
  ${IfNot} ${Errors}
    StrCpy $Arranque 0
  ${EndIf}

  Call LeerEstado
  ${If} ${Silent}
    Call MedirEspacio
    ${If} $EspacioLibreMB < ${ESPACIO_REQUERIDO_MB}
      SetErrorLevel 2
      Quit
    ${EndIf}
  ${EndIf}
FunctionEnd

; ---------------------------------------------------------------------------------------------------------
; Paso Opciones (CD-02-HU01-ET01, ET05; CD-02-HU02).
; ---------------------------------------------------------------------------------------------------------
Page custom PaginaOpciones SalirDeOpciones

Function PaginaOpciones
  !insertmacro MUI_HEADER_TEXT "Opciones" "${PRODUCTNAME} ${VERSION}"
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  Call MedirEspacio
  ${NSD_CreateLabel} 0 0 100% 12u "${TXT_ESPACIO_REQUERIDO}"
  Pop $0
  ${NSD_CreateLabel} 0 14u 100% 12u "${TXT_ESPACIO_DISPONIBLE} $EspacioLibreMB MB"
  Pop $0

  ${NSD_CreateCheckbox} 0 36u 100% 12u "${TXT_ARRANQUE}"
  Pop $CasillaArranque
  ${If} $Arranque = 1
    ${NSD_Check} $CasillaArranque
  ${EndIf}

  ; «Instalar» y «Cancelar» (los botones del instalador).
  GetDlgItem $BotonInstalar $HWNDPARENT 1
  SendMessage $BotonInstalar ${WM_SETTEXT} 0 "STR:Instalar"
  GetDlgItem $0 $HWNDPARENT 3
  ShowWindow $0 ${SW_HIDE}

  ; Con menos de 500 MB libres: mensaje y «Instalar» deshabilitada (RT-04, opción deshabilitada).
  ${If} $EspacioLibreMB < ${ESPACIO_REQUERIDO_MB}
    ${NSD_CreateLabel} 0 56u 100% 24u "${TXT_SIN_ESPACIO}"
    Pop $0
    EnableWindow $BotonInstalar 0
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function SalirDeOpciones
  ${NSD_GetState} $CasillaArranque $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $Arranque 1
  ${Else}
    StrCpy $Arranque 0
  ${EndIf}

  Call LeerEstado
  ${If} $Estado == "completa"
    ; CD-02-HU01-CA05 a CA07
    !insertmacro Elegir "${TXT_YA_INSTALADA}" "Reinstalar" "Cancelar"
    ${If} $R9 <> 1
      SetErrorLevel 1
      Quit
    ${EndIf}
  ${ElseIf} $Estado == "incompleta"
    ; CD-02-HU01-CA09 a CA11
    !insertmacro Elegir "${TXT_INCOMPLETA}" "Reparar" "Cancelar"
    ${If} $R9 <> 1
      SetErrorLevel 1
      Quit
    ${EndIf}
  ${EndIf}
FunctionEnd

; «Cancelar» en el paso Opciones o con la instalación en curso (CD-02-HU03). «Seguir instalando» es la opción
; que cierra el mensaje sin cancelar (D-149). MUI2 la llama desde .onUserAbort; Abort mantiene abierto el
; instalador.
!define MUI_CUSTOMFUNCTION_ABORT AlCancelar
Function AlCancelar
  ${If} $Terminada = 1
    Return
  ${EndIf}
  !insertmacro Elegir "${TXT_CONFIRMAR_CANCELAR}" "Cancelar instalación" "Seguir instalando"
  ${If} $EnCurso = 1
    ${If} $R9 = 1
      ; La sección revierte los cambios en su siguiente punto de cancelación (CD-02-HU03-CA02).
      StrCpy $Cancelar 1
      GetDlgItem $R8 $HWNDPARENT 2
      EnableWindow $R8 0
    ${EndIf}
    ; La instalación sigue: o termina, o se revierte desde la sección (CD-02-HU03-CA03).
    Abort
  ${EndIf}
  ${If} $R9 <> 1
    ; Vuelve al paso Opciones (CD-02-HU03-CA06).
    Abort
  ${EndIf}
  ; Antes de instalar no hay nada que revertir (CD-02-HU03-CA05, ET07).
  SetErrorLevel 1
FunctionEnd

; ---------------------------------------------------------------------------------------------------------
; Paso Instalación en curso.
; ---------------------------------------------------------------------------------------------------------
!define MUI_PAGE_HEADER_TEXT "Instalación en curso"
!define MUI_PAGE_HEADER_SUBTEXT "${PRODUCTNAME} ${VERSION}"
!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "${TXT_COMPLETADA}"
!define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT ""
!define MUI_INSTFILESPAGE_ABORTHEADER_TEXT "${TXT_FALLA}"
!define MUI_INSTFILESPAGE_ABORTHEADER_SUBTEXT ""
!insertmacro MUI_PAGE_INSTFILES

; ---------------------------------------------------------------------------------------------------------
; Paso Instalación completada (CD-02-HU01-ET02, CA02).
; ---------------------------------------------------------------------------------------------------------
Page custom PaginaCompletada

Function PaginaCompletada
  StrCpy $Terminada 1
  !insertmacro MUI_HEADER_TEXT "Instalación completada" "${PRODUCTNAME} ${VERSION}"
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateLabel} 0 0 100% 12u "${TXT_COMPLETADA}"
  Pop $0
  ${NSD_CreateLabel} 0 16u 100% 12u "${TXT_ELIMINAR_INSTALADOR}"
  Pop $0
  ${NSD_CreateButton} 0 40u 100u 16u "Abrir Windgets"
  Pop $0
  ${NSD_OnClick} $0 AbrirWindgets

  GetDlgItem $0 $HWNDPARENT 1
  SendMessage $0 ${WM_SETTEXT} 0 "STR:$(^CloseBtn)"
  GetDlgItem $0 $HWNDPARENT 2
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 3
  ShowWindow $0 ${SW_HIDE}
  nsDialogs::Show
FunctionEnd

; Abre la aplicación como el usuario, sin la elevación del instalador. Sin sesión iniciada abre Inicio de
; sesión (RT-01-ET06; CD-02-HU01-CA02).
Function AbrirWindgets
  Pop $0
  nsis_tauri_utils::RunAsUser "$INSTDIR\${MAINBINARYNAME}.exe" ""
  ; Avanza al final (cierra el instalador) sin pasar por «Cancelar».
  SendMessage $HWNDPARENT 0x408 1 0
FunctionEnd

; Desinstalador (la entrada de desinstalación es parte del contrato INT-13; desinstalar no tiene HU, DP-15).
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

{{#each languages}}
!insertmacro MUI_LANGUAGE "{{this}}"
{{/each}}
{{#each language_files}}
  !include "{{this}}"
{{/each}}

; ---------------------------------------------------------------------------------------------------------
; Reversión (CD-02-HU01-ET07, CD-02-HU03-ET03; RNF-15: 0 archivos y 0 entradas residuales).
; ---------------------------------------------------------------------------------------------------------
Function Revertir
  ; La carpeta de instalación es siempre $LOCALAPPDATA\Programs\Windgets (no hay paso para elegirla).
  ${If} ${FileExists} "$INSTDIR\*.*"
    RMDir /r "$INSTDIR"
  ${EndIf}
  ${If} $Respaldo != ""
    Rename "$Respaldo" "$INSTDIR"
  ${EndIf}

  ${If} $HabiaInstalacion = 0
    DeleteRegKey HKCU "${UNINSTKEY}"
    DeleteRegKey HKCU "${ESQUEMAKEY}"
    Delete "$DESKTOP\${PRODUCTNAME}.lnk"
    Delete "$SMPROGRAMS\${PRODUCTNAME}.lnk"
  ${EndIf}

  ${If} $TeniaArranque = 1
    WriteRegStr HKCU "${RUNKEY}" "${PRODUCTNAME}" "$ArranqueAnterior"
  ${Else}
    DeleteRegValue HKCU "${RUNKEY}" "${PRODUCTNAME}"
  ${EndIf}

  ${If} $TeniaEstado = 1
    WriteRegStr HKCU "${MANUPRODUCTKEY}" "Estado" "$EstadoAnterior"
  ${Else}
    DeleteRegValue HKCU "${MANUPRODUCTKEY}" "Estado"
    ${If} $HabiaInstalacion = 0
      DeleteRegValue HKCU "${MANUPRODUCTKEY}" ""
    ${EndIf}
    DeleteRegKey /ifempty HKCU "${MANUPRODUCTKEY}"
    DeleteRegKey /ifempty HKCU "${MANUKEY}"
  ${EndIf}
FunctionEnd

; Punto de cancelación: si se confirmó «Cancelar instalación», revierte y cierra.
!macro PuntoDeCancelacion
  ${If} $Cancelar = 1
    Call Revertir
    MessageBox MB_ICONINFORMATION "${TXT_CANCELADA}" /SD IDOK
    SetErrorLevel 1
    Quit
  ${EndIf}
!macroend

; Falla: revierte, informa y ofrece «Reintentar» (vuelve al paso Opciones) o «Cerrar» (CD-02-HU01-CA08, ET23).
!macro FallaDeInstalacion
  Call Revertir
  !insertmacro Elegir "${TXT_FALLA}" "Reintentar" "Cerrar"
  ${If} $R9 = 1
    Exec '"$EXEPATH"'
  ${EndIf}
  SetErrorLevel 4
  Quit
!macroend

!macro SiHayError
  ${If} ${Errors}
    !insertmacro FallaDeInstalacion
  ${EndIf}
!macroend

; ---------------------------------------------------------------------------------------------------------
; Secciones.
; ---------------------------------------------------------------------------------------------------------
Section Preparar
  StrCpy $EnCurso 1
  ; NSIS deshabilita «Cancelar» en este paso; se habilita para CD-02-HU03-CA01 (lo atiende .onUserAbort).
  GetDlgItem $0 $HWNDPARENT 2
  EnableWindow $0 1

  ; Estado anterior, para revertir sin dejar residuos.
  StrCpy $HabiaInstalacion 0
  ReadRegStr $0 HKCU "${UNINSTKEY}" "DisplayName"
  ${If} $0 != ""
    StrCpy $HabiaInstalacion 1
  ${EndIf}
  ClearErrors
  ReadRegStr $ArranqueAnterior HKCU "${RUNKEY}" "${PRODUCTNAME}"
  ${If} ${Errors}
    StrCpy $TeniaArranque 0
  ${Else}
    StrCpy $TeniaArranque 1
  ${EndIf}
  ClearErrors
  ReadRegStr $EstadoAnterior HKCU "${MANUPRODUCTKEY}" "Estado"
  ${If} ${Errors}
    StrCpy $TeniaEstado 0
  ${Else}
    StrCpy $TeniaEstado 1
  ${EndIf}
  ClearErrors
SectionEnd

Section WebView2
  ReadRegStr $4 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\${WEBVIEW2APPGUID}" "pv"
  ${If} $4 == ""
    ReadRegStr $4 HKCU "SOFTWARE\Microsoft\EdgeUpdate\Clients\${WEBVIEW2APPGUID}" "pv"
  ${EndIf}
  ${If} $4 == ""
    ; WebView2 viaja dentro del instalador (D-179): sin descargas durante la instalación.
    !if "${INSTALLWEBVIEW2MODE}" == "offlineInstaller"
      Delete "$TEMP\MicrosoftEdgeWebView2RuntimeInstaller.exe"
      File "/oname=$TEMP\MicrosoftEdgeWebView2RuntimeInstaller.exe" "${WEBVIEW2INSTALLERPATH}"
      ExecWait '"$TEMP\MicrosoftEdgeWebView2RuntimeInstaller.exe" ${WEBVIEW2INSTALLERARGS} /install' $1
      Delete "$TEMP\MicrosoftEdgeWebView2RuntimeInstaller.exe"
      ${If} $1 <> 0
        !insertmacro FallaDeInstalacion
      ${EndIf}
    !else
      !error "Windgets incluye WebView2 completo: bundle.windows.webviewInstallMode debe ser offlineInstaller"
    !endif
  ${EndIf}
  !insertmacro PuntoDeCancelacion
SectionEnd

Section Install
  ClearErrors
  !insertmacro CheckIfAppIsRunning "$INSTDIR\${MAINBINARYNAME}.exe" "${PRODUCTNAME}"
  ClearErrors

  ; Desde aquí, si el computador se apaga, la instalación queda incompleta (CD-02-HU01-CA09).
  WriteRegStr HKCU "${MANUPRODUCTKEY}" "Estado" "incompleta"

  ; Reinstalar o reparar: la instalación anterior se aparta y se borra solo al terminar (ET18, ET19).
  StrCpy $Respaldo ""
  ${If} ${FileExists} "$INSTDIR.anterior\*.*"
    RMDir /r "$INSTDIR.anterior"
  ${EndIf}
  ClearErrors
  ${If} ${FileExists} "$INSTDIR\*.*"
    Rename "$INSTDIR" "$INSTDIR.anterior"
    !insertmacro SiHayError
    StrCpy $Respaldo "$INSTDIR.anterior"
  ${EndIf}

  CreateDirectory "$INSTDIR"
  !insertmacro SiHayError
  SetOutPath $INSTDIR
  SetOverwrite on

  File "${MAINBINARYSRCPATH}"
  !insertmacro SiHayError
  !insertmacro PuntoDeCancelacion

  {{#each resources_dirs}}
    CreateDirectory "$INSTDIR\\{{this}}"
  {{/each}}
  {{#each resources}}
    File /a "/oname={{this.[1]}}" "{{no-escape @key}}"
  {{/each}}
  {{#each binaries}}
    File /a "/oname={{this}}" "{{no-escape @key}}"
  {{/each}}
  !insertmacro SiHayError
  ${IfNot} ${FileExists} "$INSTDIR\${MAINBINARYNAME}.exe"
    !insertmacro FallaDeInstalacion
  ${EndIf}
  !insertmacro PuntoDeCancelacion

  WriteUninstaller "$INSTDIR\uninstall.exe"
  !insertmacro SiHayError

  ; Esquema windgets:// (INT-10).
  WriteRegStr HKCU "${ESQUEMAKEY}" "" "URL:${BUNDLEID} protocol"
  WriteRegStr HKCU "${ESQUEMAKEY}" "URL Protocol" ""
  WriteRegStr HKCU "${ESQUEMAKEY}\DefaultIcon" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
  WriteRegStr HKCU "${ESQUEMAKEY}\shell\open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""

  ; Inicio automático según la casilla (CD-02-HU02; INT-08).
  ${If} $Arranque = 1
    WriteRegStr HKCU "${RUNKEY}" "${PRODUCTNAME}" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" --autostart"
  ${Else}
    DeleteRegValue HKCU "${RUNKEY}" "${PRODUCTNAME}"
    ; Si el valor no existía, DeleteRegValue marca error; no es una falla de la instalación.
    ClearErrors
  ${EndIf}

  ; Entrada de desinstalación del usuario (INT-13).
  WriteRegStr HKCU "${MANUPRODUCTKEY}" "" $INSTDIR
  WriteRegStr HKCU "${UNINSTKEY}" "MainBinaryName" "${MAINBINARYNAME}.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${PRODUCTNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\""
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "${MANUFACTURER}"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$\"$INSTDIR$\""
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" "1"
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" "1"
  IntFmt $0 "0x%08X" ${ESTIMATEDSIZE}
  WriteRegDWORD HKCU "${UNINSTKEY}" "EstimatedSize" "$0"
  !insertmacro SiHayError
  !insertmacro PuntoDeCancelacion

  ; Accesos directos en el escritorio y en el menú Inicio (CD-02-HU01-ET11).
  CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
  !insertmacro SiHayError
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
  !insertmacro SiHayError
  ; Identificador de la aplicación en los accesos directos (utils.nsh de Tauri); no decide el resultado.
  !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\${PRODUCTNAME}.lnk"
  !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"
  ClearErrors
  !insertmacro PuntoDeCancelacion

  ; Último punto: a partir de aquí la instalación ya terminó y no se cancela.
  StrCpy $EnCurso 0
  GetDlgItem $0 $HWNDPARENT 2
  EnableWindow $0 0
  !insertmacro PuntoDeCancelacion

  ${If} $Respaldo != ""
    RMDir /r "$Respaldo"
  ${EndIf}
  WriteRegStr HKCU "${MANUPRODUCTKEY}" "Estado" "completa"
  ; Pasa sola al paso Instalación completada.
  SetAutoClose true
SectionEnd

Function un.onInit
  SetShellVarContext current
  StrCpy $PassiveMode 0
FunctionEnd

Section Uninstall
  !insertmacro CheckIfAppIsRunning "$INSTDIR\${MAINBINARYNAME}.exe" "${PRODUCTNAME}"

  Delete "$INSTDIR\${MAINBINARYNAME}.exe"
  {{#each resources}}
    Delete "$INSTDIR\\{{this.[1]}}"
  {{/each}}
  {{#each binaries}}
    Delete "$INSTDIR\\{{this}}"
  {{/each}}
  Delete "$INSTDIR\uninstall.exe"
  {{#each resources_ancestors}}
  RMDir /REBOOTOK "$INSTDIR\\{{this}}"
  {{/each}}
  RMDir "$INSTDIR"

  !insertmacro DeleteAppUserModelId
  Delete "$SMPROGRAMS\${PRODUCTNAME}.lnk"
  Delete "$DESKTOP\${PRODUCTNAME}.lnk"

  ReadRegStr $0 HKCU "${ESQUEMAKEY}\shell\open\command" ""
  ${If} $0 == "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""
    DeleteRegKey HKCU "${ESQUEMAKEY}"
  ${EndIf}
  DeleteRegValue HKCU "${RUNKEY}" "${PRODUCTNAME}"
  DeleteRegKey HKCU "${UNINSTKEY}"
  DeleteRegKey HKCU "${MANUPRODUCTKEY}"
  DeleteRegKey /ifempty HKCU "${MANUKEY}"
SectionEnd
