# Pruebas automáticas del instalador (CD-02), en Windows y en modo silencioso (/S). Comprueban el resultado en
# el computador: archivos, accesos directos, registro y códigos de salida (INT-13, DP-19). Lo que necesita
# la interfaz del instalador o otro Windows (CA03, CA04, CA07, CA11, CD-02-HU03) se prueba a mano en máquina
# virtual (plan_construccion.md, P04).
#
# Uso: pwsh installer/pruebas/instalador.ps1 -Instalador <ruta del .exe sellado>
param([Parameter(Mandatory)] [string] $Instalador)

$ErrorActionPreference = 'Stop'
$Instalador = (Resolve-Path $Instalador).Path
$Carpeta = Join-Path $env:LOCALAPPDATA 'Programs\Windgets'
$Desinstalacion = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Windgets'
$Arranque = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$Esquema = 'HKCU:\Software\Classes\windgets'
$Escritorio = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Windgets.lnk'
$MenuInicio = Join-Path ([Environment]::GetFolderPath('Programs')) 'Windgets.lnk'
$script:Fallas = 0
$script:Fabricante = $null

function Ejecutar([string] $Exe, [string[]] $Argumentos = @()) {
  $proceso = Start-Process -FilePath $Exe -ArgumentList (@('/S') + $Argumentos) -Wait -PassThru
  return $proceso.ExitCode
}

function Comprobar([bool] $Condicion, [string] $Que) {
  if (-not $Condicion) { throw "No se cumple: $Que" }
}

function Prueba([string] $Nombre, [scriptblock] $Cuerpo) {
  try {
    & $Cuerpo
    Write-Host "ok     $Nombre"
  } catch {
    $script:Fallas++
    Write-Host "FALLA  $Nombre`n       $($_.Exception.Message)"
  }
}

function ClaveDelProducto {
  if (-not $script:Fabricante) {
    $script:Fabricante = (Get-ItemProperty $Desinstalacion -ErrorAction SilentlyContinue).Publisher
  }
  if ($script:Fabricante) { return "HKCU:\Software\$($script:Fabricante)\Windgets" }
  return $null
}

function Estado {
  $clave = ClaveDelProducto
  if (-not $clave) { return $null }
  return (Get-ItemProperty $clave -ErrorAction SilentlyContinue).Estado
}

function ValorDeArranque {
  return (Get-ItemProperty $Arranque -ErrorAction SilentlyContinue).Windgets
}

function Nucleo {
  return Join-Path $Carpeta ((Get-ItemProperty $Desinstalacion).MainBinaryName)
}

# Deja el computador sin Windgets (sin pasar por el desinstalador, que no tiene HU: DP-15).
function Limpiar {
  $clave = ClaveDelProducto
  foreach ($ruta in @($Carpeta, "$Carpeta.anterior", $Escritorio, $MenuInicio)) {
    if (Test-Path $ruta) { Remove-Item $ruta -Recurse -Force }
  }
  foreach ($ruta in @($Desinstalacion, $Esquema, $clave)) {
    if ($ruta -and (Test-Path $ruta)) { Remove-Item $ruta -Recurse -Force }
  }
  Remove-ItemProperty $Arranque -Name Windgets -ErrorAction SilentlyContinue
}

# RNF-15: 0 archivos y 0 entradas residuales.
function SinResiduos {
  Comprobar (-not (Test-Path $Carpeta)) 'no queda la carpeta de instalación'
  Comprobar (-not (Test-Path "$Carpeta.anterior")) 'no queda la copia de la instalación anterior'
  Comprobar (-not (Test-Path $Desinstalacion)) 'no queda la entrada de desinstalación'
  Comprobar (-not (Test-Path $Esquema)) 'no queda el esquema windgets://'
  Comprobar (-not (Test-Path $Escritorio)) 'no queda el acceso directo del escritorio'
  Comprobar (-not (Test-Path $MenuInicio)) 'no queda el acceso directo del menú Inicio'
  Comprobar ($null -eq (ValorDeArranque)) 'no queda el inicio automático'
}

Limpiar
$huellaOriginal = (Get-FileHash $Instalador).Hash

Prueba 'CD-02-HU01-CA12 · Instalador descargado incompleto' {
  $incompleto = Join-Path $env:RUNNER_TEMP 'Windgets-incompleto.exe'
  Copy-Item $Instalador $incompleto -Force
  $archivo = [IO.File]::Open($incompleto, 'Open', 'ReadWrite')
  $archivo.SetLength($archivo.Length - 4096)
  $archivo.Close()
  Comprobar ((Ejecutar $incompleto) -eq 3) 'el código de salida es 3 (instalador dañado)'
  SinResiduos
}

Prueba 'CD-02-HU01-CA12 · Instalador descargado dañado' {
  $danado = Join-Path $env:RUNNER_TEMP 'Windgets-danado.exe'
  $bytes = [IO.File]::ReadAllBytes($Instalador)
  $medio = [int]($bytes.Length / 2)
  $bytes[$medio] = $bytes[$medio] -bxor 0xFF
  [IO.File]::WriteAllBytes($danado, $bytes)
  Comprobar ((Ejecutar $danado) -eq 3) 'el código de salida es 3 (instalador dañado)'
  SinResiduos
}

Prueba 'CD-02-HU01-CA01 · Instalación exitosa' {
  Comprobar ((Ejecutar $Instalador) -eq 0) 'el código de salida es 0'
  Comprobar (Test-Path (Nucleo)) 'el Núcleo está en %LOCALAPPDATA%\Programs\Windgets'
  Comprobar (Test-Path (Join-Path $Carpeta 'assets\templates\default')) 'la plantilla por defecto viaja con la aplicación (D-198)'
  Comprobar (Test-Path $Escritorio) 'acceso directo en el escritorio (ET11)'
  Comprobar (Test-Path $MenuInicio) 'acceso directo en el menú Inicio (ET11)'
  $comando = (Get-ItemProperty "$Esquema\shell\open\command").'(default)'
  Comprobar ($comando -eq "`"$(Nucleo)`" `"%1`"") 'esquema windgets:// registrado (INT-10)'
  Comprobar ((Estado) -eq 'completa') 'la instalación queda completa'
  Comprobar ((Get-FileHash $Instalador).Hash -eq $huellaOriginal) 'el .exe descargado no cambia (ET10)'
}

Prueba 'CD-02-HU02-CA01 · Instalar con inicio automático' {
  Comprobar ((ValorDeArranque) -eq "`"$(Nucleo)`" --autostart") 'registra el inicio automático (INT-08)'
}

Prueba 'CD-02-HU01-CA06 · Reinstalar la aplicación' {
  $recurso = Get-ChildItem (Join-Path $Carpeta 'assets') -Recurse -File | Select-Object -First 1
  Remove-Item $recurso.FullName
  Comprobar ((Ejecutar $Instalador) -eq 0) 'el código de salida es 0'
  Comprobar (Test-Path $recurso.FullName) 'repite la instalación completa'
  Comprobar (-not (Test-Path "$Carpeta.anterior")) 'borra la instalación anterior al terminar'
  Comprobar ((Estado) -eq 'completa') 'la instalación queda completa'
}

Prueba 'CD-02-HU01-CA10 · Reparar la instalación incompleta' {
  Remove-Item (Nucleo)
  Set-ItemProperty (ClaveDelProducto) -Name Estado -Value 'incompleta'
  Comprobar ((Ejecutar $Instalador) -eq 0) 'el código de salida es 0'
  Comprobar (Test-Path (Nucleo)) 'instala de nuevo'
  Comprobar ((Estado) -eq 'completa') 'la instalación queda completa'
}

Prueba 'CD-02-HU02-CA02 · Instalar sin inicio automático' {
  Limpiar
  Comprobar ((Ejecutar $Instalador @('/SINARRANQUE')) -eq 0) 'el código de salida es 0'
  Comprobar ($null -eq (ValorDeArranque)) 'no registra el inicio automático'
  Comprobar (Test-Path (Nucleo)) 'instala la aplicación'
}

Prueba 'CD-02-HU01-CA08 · Error durante la instalación' {
  Limpiar
  # Un archivo con el nombre de la carpeta de instalación impide crearla.
  New-Item -ItemType Directory -Force (Split-Path $Carpeta) | Out-Null
  Set-Content -Path $Carpeta -Value 'bloqueo'
  try {
    Comprobar ((Ejecutar $Instalador) -eq 4) 'el código de salida es 4 (falla con reversión)'
    Comprobar ((Get-Item $Carpeta) -is [IO.FileInfo]) 'deja el computador como estaba'
    Comprobar (-not (Test-Path $Desinstalacion)) 'no queda la entrada de desinstalación'
    Comprobar (-not (Test-Path $Esquema)) 'no queda el esquema windgets://'
    Comprobar (-not (Test-Path $Escritorio)) 'no queda el acceso directo del escritorio'
    Comprobar ($null -eq (ValorDeArranque)) 'no queda el inicio automático'
    $sinClave = -not (Get-ChildItem HKCU:\Software -ErrorAction SilentlyContinue |
        Where-Object { Test-Path (Join-Path $_.PSPath 'Windgets') } |
        Where-Object { (Get-ItemProperty (Join-Path $_.PSPath 'Windgets')).Estado })
    Comprobar $sinClave 'no queda la marca de instalación incompleta'
  } finally {
    Remove-Item $Carpeta -Force
  }
}

Limpiar
if ($script:Fallas -gt 0) {
  Write-Host "$script:Fallas prueba(s) del instalador en rojo."
  exit 1
}
Write-Host 'Pruebas del instalador en verde.'
