# =============================================================================
#  vendor-deps.ps1 -- rebuild third_party/ from the local downloads
#
#  Purpose
#      Copies the exact slice of Filament that this project links into
#      third_party/, so the project becomes self-contained: no absolute paths
#      to the source tree or to the original release package are needed.
#      It also vendors the two things the release package does NOT ship and
#      that are therefore compiled from source:
#          third_party\imgui\   ImGui 1.92.5 core + imgui_impl_win32
#          src\filagui\         Filament's ImGui bridge (libs/filagui)
#
#  Run it when
#      - third_party/ is missing or damaged
#      - you move the project to another machine
#      - you upgrade Filament (point -FilamentDist at the new package)
#
#  Usage
#      powershell -ExecutionPolicy Bypass -File tools\vendor-deps.ps1
#      powershell -ExecutionPolicy Bypass -File tools\vendor-deps.ps1 ^
#                 -FilamentDist "D:\deps\filament-v1.77.3-windows"
#      powershell -ExecutionPolicy Bypass -File tools\vendor-deps.ps1 -WithSdl2
#
#  NOTE: keep this file ASCII-only.
#      Windows PowerShell 5.1 reads BOM-less files as ANSI, which corrupts
#      non-ASCII source (it can even eat line breaks and merge lines).
#      Chinese documentation lives in third_party\README.md instead.
# =============================================================================
param(
    [string] $FilamentDist = 'G:\filament-main\MyHelloTriangle\third_party\filament-v1.77.3-windows',
    [string] $FilamentSrc  = 'G:\filament-main\filament-main',
    [string] $Sdl2Root     = 'G:\SDL2-devel-2.32.2-VC\SDL2-2.32.2',
    # SDL2 is NOT vendored by default: the viewer uses raw Win32 and does not
    # link SDL2.  See step 5 below / third_party\README.md.
    [switch] $WithSdl2
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot            # ...\cc
$Dst         = Join-Path $ProjectRoot 'third_party'
$DistDst     = Join-Path $Dst 'filament-v1.77.3-windows'
$ExtraDst    = Join-Path $Dst 'filament-extra-include'
$ImguiDst    = Join-Path $Dst 'imgui'
$FilaguiDst  = Join-Path $ProjectRoot 'src\filagui'
$Sdl2Dst     = Join-Path $Dst 'sdl2-2.32.2'

# The 25 libraries this project actually links.  Keep in sync with
# FL_CORE / FL_GLTF / FL_EXTRA in CMakeLists.txt.
$Libs = @(
    'filament','backend','bluegl','bluevk','filabridge','filaflat','smol-v',
    'utils','geometry','ibl','image','zstd','abseil',
    'gltfio_core','uberarchive','uberzlib','ktxreader','stb','imageio-lite',
    'meshoptimizer','mikktspace','basis_transcoder','dracodec',
    'camutils','getopt'
)

$Tools = @('matc.exe','cmgen.exe')

# --- helpers ---------------------------------------------------------------
function New-Dir([string] $Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Copy-One([string] $SrcFile, [string] $DstFile) {
    if (-not (Test-Path -LiteralPath $SrcFile)) {
        throw "source not found: $SrcFile"
    }
    New-Dir (Split-Path -Parent $DstFile)
    Copy-Item -LiteralPath $SrcFile -Destination $DstFile -Force
}

function Copy-Dir([string] $SrcDir, [string] $DstDir) {
    if (-not (Test-Path -LiteralPath $SrcDir)) {
        throw "source directory not found: $SrcDir"
    }
    New-Dir $DstDir
    # -Path (not -LiteralPath) so that the '*' wildcard is expanded.
    Copy-Item -Path (Join-Path $SrcDir '*') -Destination $DstDir -Recurse -Force
}

# --- 1. Filament headers ---------------------------------------------------
Write-Host "[1/6] filament headers ..."
Copy-Dir (Join-Path $FilamentDist 'include') (Join-Path $DistDst 'include')

# --- 2. Filament libraries (mt = Release /MT only) -------------------------
Write-Host "[2/6] filament libraries (mt, $($Libs.Count) of them) ..."
$srcMt = Join-Path $FilamentDist 'lib\x86_64\mt'
$dstMt = Join-Path $DistDst 'lib\x86_64\mt'
foreach ($l in $Libs) {
    Copy-One (Join-Path $srcMt "$l.lib") (Join-Path $dstMt "$l.lib")
}

# --- 3. Filament command line tools ----------------------------------------
Write-Host "[3/6] filament tools ..."
foreach ($t in $Tools) {
    Copy-One (Join-Path $FilamentDist "bin\$t") (Join-Path $DistDst "bin\$t")
}

# --- 4. Headers the release package does not ship --------------------------
#     cgltf is a single-header library; copy just the files, not the whole
#     upstream repo (.github / fuzz / test / tnt are of no use to us).
Write-Host "[4/6] supplemental headers (from the source tree) ..."
$cgltfSrc = Join-Path $FilamentSrc 'third_party\cgltf'
foreach ($f in @('cgltf.h','cgltf_write.h','LICENSE','README.md')) {
    Copy-One (Join-Path $cgltfSrc $f) (Join-Path $ExtraDst "cgltf\$f")
}
Copy-Dir (Join-Path $FilamentSrc 'libs\filabridge\include') (Join-Path $ExtraDst 'filabridge')
Copy-Dir (Join-Path $FilamentSrc 'libs\utils\include')      (Join-Path $ExtraDst 'utils')

# --- 5. ImGui + filagui -- compiled from source, NOT linked ----------------
#     The release package ships no imgui.lib / filagui.lib and no filagui or
#     filamentapp headers, so the control panel is built from source:
#         third_party\imgui\   ImGui core (4 cpp) + the Win32 input backend
#         src\filagui\         Filament's ImGui -> Filament bridge
#     imgui_demo.cpp is deliberately skipped (it only exists for the demo
#     window; the build would be dead weight).  The backend files normally live
#     in backends\ -- they are flattened into the same directory here.
Write-Host "[5/6] imgui + filagui (sources) ..."
$imguiSrc = Join-Path $FilamentSrc 'third_party\imgui'
foreach ($f in @('imgui.cpp','imgui.h','imgui_draw.cpp','imgui_internal.h',
                 'imgui_tables.cpp','imgui_widgets.cpp','imconfig.h',
                 'imstb_rectpack.h','imstb_textedit.h','imstb_truetype.h','LICENSE.txt')) {
    Copy-One (Join-Path $imguiSrc $f) (Join-Path $ImguiDst $f)
}
foreach ($f in @('imgui_impl_win32.cpp','imgui_impl_win32.h')) {
    Copy-One (Join-Path $imguiSrc "backends\$f") (Join-Path $ImguiDst $f)
}
$filaguiSrc = Join-Path $FilamentSrc 'libs\filagui'
foreach ($f in @('ImGuiHelper.cpp','ImGuiExtensions.cpp')) {
    Copy-One (Join-Path $filaguiSrc "src\$f") (Join-Path $FilaguiDst $f)
}
foreach ($f in @('ImGuiHelper.h','ImGuiExtensions.h','ImGuiMath.h')) {
    Copy-One (Join-Path $filaguiSrc "include\filagui\$f") (Join-Path $FilaguiDst $f)
}

# --- 6. SDL2 -- opt-in, OFF by default -------------------------------------
#     Not vendored because nothing links it: the window is raw Win32
#     (RegisterClassExW / CreateWindowExW / PeekMessage).  Also note this
#     package is the DYNAMIC build (SDL2.lib + SDL2.dll) -- adopting it would
#     add SDL2.dll next to the exe and break the single-exe / zero-DLL setup.
#     If you do adopt SDL2 later, prefer building it statically from source.
if ($WithSdl2) {
    Write-Host "[6/6] SDL2 (opt-in): copying x64 subset ..."
    Copy-Dir (Join-Path $Sdl2Root 'include') (Join-Path $Sdl2Dst 'include')
    foreach ($f in @('SDL2.lib','SDL2main.lib','SDL2.dll')) {
        Copy-One (Join-Path $Sdl2Root "lib\x64\$f") (Join-Path $Sdl2Dst "lib\x64\$f")
    }
} else {
    Write-Host "[6/6] SDL2 skipped (not linked; pass -WithSdl2 to vendor it anyway)"
}

# --- summary ---------------------------------------------------------------
$stat = Get-ChildItem -LiteralPath $Dst -Recurse -File |
        Measure-Object -Property Length -Sum
Write-Host ''
Write-Host ('vendored {0} files, {1:N1} MB -> {2}' -f `
        $stat.Count, ($stat.Sum / 1MB), $Dst)
Write-Host ''
Write-Host 'Next: delete build\ and configure again, e.g.'
Write-Host '      cmake -G "Visual Studio 17 2022" -A x64 -S . -B build'
