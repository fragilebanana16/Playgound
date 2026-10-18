# =============================================================================
#  check-ui-glyphs.ps1 -- build-time guard + generator for the ImGui panel font
#
#  Why
#      ImGui's built-in "common Chinese" glyph range does NOT contain every
#      character, and a missing glyph is drawn as "?" *silently*.  src/ui.cpp
#      therefore carries an explicit list, kPanelGlyphs, that is added to the
#      atlas on top of the common ranges.  If someone edits a panel string and
#      forgets to regenerate that list, the panel quietly loses a character.
#
#  What
#      Scans every *string literal* in src/ui.cpp (comments are stripped first,
#      with a proper state machine, so a quote inside a comment cannot shift
#      the pairing), collects the CJK / full-width characters, and
#          without -Print : fails (exit 1) if any of them is missing from
#                           kPanelGlyphs -- wired into CMakeLists.txt POST_BUILD
#          with    -Print : prints the exact string to paste into kPanelGlyphs
#
#  Usage
#      powershell -ExecutionPolicy Bypass -File tools\check-ui-glyphs.ps1
#      powershell -ExecutionPolicy Bypass -File tools\check-ui-glyphs.ps1 -Print
#
#  NOTE: keep this file ASCII-only (Windows PowerShell 5.1 reads BOM-less
#        files as ANSI).  Chinese documentation lives in README.md.
# =============================================================================

param(
    [switch] $Print
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot            # ...\cc
$src  = Join-Path $root 'src\ui.cpp'

if (-not (Test-Path -LiteralPath $src)) {
    Write-Host "ui-glyphs: src\ui.cpp not found -> $src"
    exit 1
}

# UTF-8 (no BOM) on purpose: Get-Content -Raw would use the ANSI codepage.
$text = [IO.File]::ReadAllText($src, [Text.UTF8Encoding]::new($false))

function In-Range([int] $c) {
    return (($c -ge 0x4E00 -and $c -le 0x9FFF) -or      # CJK unified ideographs
            ($c -ge 0x3000 -and $c -le 0x303F) -or      # CJK punctuation
            ($c -ge 0xFF00 -and $c -le 0xFFEF))         # full-width forms
}

# --- strip comments (keep code and string literals verbatim) ----------------
# State machine: 0 = code, 1 = string, 2 = line comment, 3 = block comment
# A naive regex would trip over the quotes inside this file's comments (one
# stray quote shifts every following "literal"), hence the state machine.
$stripped = [Text.StringBuilder]::new()
$state = 0
$i = 0
$n = $text.Length
while ($i -lt $n) {
    $ch = $text[$i]
    $next = if ($i + 1 -lt $n) { $text[$i + 1] } else { [char]0 }
    switch ($state) {
        0 {
            if ($ch -eq '"') { $state = 1; [void]$stripped.Append($ch) }
            elseif ($ch -eq '/' -and $next -eq '/') { $state = 2; $i++ }
            elseif ($ch -eq '/' -and $next -eq '*') { $state = 3; $i++ }
            else { [void]$stripped.Append($ch) }
        }
        1 {
            [void]$stripped.Append($ch)
            if ($ch -eq '\') { if ($i + 1 -lt $n) { [void]$stripped.Append($text[$i + 1]); $i++ } }
            elseif ($ch -eq '"') { $state = 0 }
        }
        2 {
            if ($ch -eq "`n") { $state = 0; [void]$stripped.Append("`n") }
        }
        3 {
            if ($ch -eq '*' -and $next -eq '/') { $state = 0; $i++ }
        }
    }
    $i++
}
$code = $stripped.ToString()

# --- every CJK/full-width char that appears in a string literal -------------
$used = [Collections.Generic.HashSet[int]]::new()
foreach ($m in [regex]::Matches($code, '"((?:[^"\\]|\\.)*)"')) {
    foreach ($ch in $m.Groups[1].Value.ToCharArray()) {
        $c = [int]$ch
        if (In-Range $c) { [void]$used.Add($c) }
    }
}
$sorted = @($used | Sort-Object)
$joined = -join ($sorted | ForEach-Object { [char]$_ })

if ($Print) {
    Write-Output $joined
    exit 0
}

# --- the kPanelGlyphs list itself ------------------------------------------
$decl = [regex]::Match($code, 'kPanelGlyphs\s*=\s*[\r\n\s]*"((?:[^"\\]|\\.)*)"')
if (-not $decl.Success) {
    Write-Host "ui-glyphs: kPanelGlyphs literal not found in src\ui.cpp"
    exit 1
}
$listed = [Collections.Generic.HashSet[int]]::new()
foreach ($ch in $decl.Groups[1].Value.ToCharArray()) { [void]$listed.Add([int]$ch) }

$missing = @($sorted | Where-Object { -not $listed.Contains($_) } | Sort-Object)

if ($missing.Count -gt 0) {
    $codes = ($missing | ForEach-Object { 'U+{0:X4}' -f $_ }) -join ' '
    Write-Host ''
    Write-Host "ui-glyphs: FAILED - $($missing.Count) CJK char(s) used in src\ui.cpp are not in kPanelGlyphs."
    Write-Host "           They would be drawn as '?' with no warning."
    Write-Host "           $codes"
    Write-Host "           Fix: run  powershell -File tools\check-ui-glyphs.ps1 -Print"
    Write-Host "           and paste the result over the kPanelGlyphs literal."
    Write-Host ''
    exit 1
}

Write-Host "ui-glyphs: OK ($($sorted.Count) CJK/full-width chars, all present in kPanelGlyphs)"
exit 0
