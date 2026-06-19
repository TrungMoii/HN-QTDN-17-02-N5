# Script tao file .docx – khong dung ky tu dac biet trong PowerShell strings
# Tat ca noi dung tieng Viet da duoc ASCII-safe hoa
param()
Set-StrictMode -Off
Add-Type -AssemblyName System.IO.Compression.FileSystem

$outDir  = "e:\HN-QTDN-17-02-N5\docs"
$tmpDir  = "$outDir\_tmp_docx"
$outFile = "$outDir\BaoCao_ERP_TaiSan_TaiChinh_HRM.docx"

if (Test-Path $tmpDir)  { Remove-Item $tmpDir  -Recurse -Force }
if (Test-Path $outFile) { Remove-Item $outFile -Force }

$null = New-Item -ItemType Directory "$tmpDir\_rels"
$null = New-Item -ItemType Directory "$tmpDir\word"
$null = New-Item -ItemType Directory "$tmpDir\word\_rels"

# --- [Content_Types].xml ---
$ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml"  ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml"   ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>'
[System.IO.File]::WriteAllText("$tmpDir\[Content_Types].xml", $ct, [System.Text.Encoding]::UTF8)

# --- _rels/.rels ---
$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'
[System.IO.File]::WriteAllText("$tmpDir\_rels\.rels", $rels, [System.Text.Encoding]::UTF8)

# --- word/_rels/document.xml.rels ---
$wrels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'
[System.IO.File]::WriteAllText("$tmpDir\word\_rels\document.xml.rels", $wrels, [System.Text.Encoding]::UTF8)

Write-Host "[1/4] Structure files OK"
