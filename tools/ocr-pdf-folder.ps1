param(
  [string]$SourceDir,
  [string]$OutputDir,
  [string]$LanguageTag = "zh-CN",
  [int]$RenderWidth = 1800
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] > $null
[Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime] > $null
[Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType = WindowsRuntime] > $null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] > $null
[Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime] > $null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] > $null
[Windows.Graphics.Imaging.BitmapPixelFormat, Windows.Graphics.Imaging, ContentType = WindowsRuntime] > $null
[Windows.Graphics.Imaging.BitmapAlphaMode, Windows.Graphics.Imaging, ContentType = WindowsRuntime] > $null
[Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] > $null

$asTaskMethods = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq "AsTask" }

function Await-Operation {
  param($Operation, [Type]$ResultType)
  $method = $asTaskMethods |
    Where-Object { $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq "IAsyncOperation``1" } |
    Select-Object -First 1
  $task = $method.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  $task.Wait()
  return $task.Result
}

function Await-Action {
  param($Action)
  $method = $asTaskMethods |
    Where-Object { $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq "IAsyncAction" } |
    Select-Object -First 1
  $task = $method.Invoke($null, @($Action))
  $task.Wait()
}

if (-not (Test-Path $SourceDir)) {
  throw "SourceDir not found: $SourceDir"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$ocrLanguage = [Windows.Globalization.Language]::new($LanguageTag)
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($ocrLanguage)
if (-not $engine) {
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}
if (-not $engine) {
  throw "Windows OCR language is not available: $LanguageTag"
}

$pdfs = Get-ChildItem -Path $SourceDir -Filter "*.pdf" | Sort-Object Name
foreach ($pdf in $pdfs) {
  Write-Host "OCR $($pdf.Name)"
  $storageFile = Await-Operation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($pdf.FullName)) ([Windows.Storage.StorageFile])
  $document = Await-Operation ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($storageFile)) ([Windows.Data.Pdf.PdfDocument])
  $outPath = Join-Path $OutputDir ($pdf.BaseName + ".txt")
  $allPages = New-Object System.Collections.Generic.List[string]

  for ($i = 0; $i -lt $document.PageCount; $i++) {
    $pageNumber = $i + 1
    Write-Host "  page $pageNumber / $($document.PageCount)"
    $page = $document.GetPage([uint32]$i)
    try {
      $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
      $options = [Windows.Data.Pdf.PdfPageRenderOptions]::new()
      $options.DestinationWidth = [uint32]$RenderWidth
      Await-Action ($page.RenderToStreamAsync($stream, $options))
      $stream.Seek(0) | Out-Null
      $decoder = Await-Operation ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
      $bitmap = Await-Operation ($decoder.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied)) ([Windows.Graphics.Imaging.SoftwareBitmap])
      $result = Await-Operation ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
      $lines = @($result.Lines | ForEach-Object { $_.Text })
      $allPages.Add("===== $($pdf.Name) page $pageNumber =====") | Out-Null
      $allPages.Add(($lines -join [Environment]::NewLine)) | Out-Null
      $stream.Dispose()
    } finally {
      $page.Dispose()
    }
  }

  [IO.File]::WriteAllText($outPath, ($allPages -join ([Environment]::NewLine + [Environment]::NewLine)), [Text.UTF8Encoding]::new($false))
}

Write-Host "Done -> $OutputDir"
