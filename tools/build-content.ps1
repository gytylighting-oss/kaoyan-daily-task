Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$outFile = Join-Path $root 'generated-content.js'
$wordSources = @(
  @{ Dir = Join-Path $root '【27必考词｜U1-U26】'; Group = '必考词'; Order = 1 },
  @{ Dir = Join-Path $root '【27基础词带背笔记｜U1-U30】'; Group = '基础词'; Order = 2 }
)

function Read-XlsxRows {
  param([string]$Path)

  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
  try {
    $strings = @()
    $sharedEntry = $zip.GetEntry('xl/sharedStrings.xml')
    if ($sharedEntry) {
      $reader = [IO.StreamReader]::new($sharedEntry.Open())
      [xml]$shared = $reader.ReadToEnd()
      $reader.Close()
      foreach ($si in $shared.sst.si) {
        $text = ''
        if ($si.t) {
          $text = [string]$si.t
        } elseif ($si.r) {
          foreach ($run in $si.r) {
            $text += [string]$run.t
          }
        }
        $strings += $text
      }
    }

    $sheetEntry = $zip.GetEntry('xl/worksheets/sheet1.xml')
    $reader = [IO.StreamReader]::new($sheetEntry.Open())
    [xml]$sheet = $reader.ReadToEnd()
    $reader.Close()

    $rows = @()
    foreach ($row in $sheet.worksheet.sheetData.row) {
      $values = @()
      foreach ($cell in $row.c) {
        $value = [string]$cell.v
        if ($cell.t -eq 's' -and $value -ne '') {
          $values += $strings[[int]$value]
        } else {
          $values += $value
        }
      }
      $rows += ,$values
    }
    return $rows
  } finally {
    $zip.Dispose()
  }
}

function Get-UnitNumber {
  param([string]$Name)
  if ($Name -match 'U(\d+)') {
    return [int]$Matches[1]
  }
  return 999
}

$words = @()
$seenTerms = @{}

foreach ($source in $wordSources) {
  if (-not (Test-Path $source.Dir)) { continue }
  $files = Get-ChildItem $source.Dir -Filter '*.xlsx' | Sort-Object @{Expression = { Get-UnitNumber $_.Name }}

  foreach ($file in $files) {
    $unit = Get-UnitNumber $file.Name
    $rows = Read-XlsxRows $file.FullName
    foreach ($row in $rows | Select-Object -Skip 2) {
      if ($row.Count -lt 4) { continue }
      $term = ([string]$row[0]).Trim()
      if (-not $term -or $term -eq '单词') { continue }
      $key = $term.ToLowerInvariant()
      if ($seenTerms.ContainsKey($key)) { continue }
      $seenTerms[$key] = $true

      $words += [ordered]@{
        id = "$($source.Group)-u$unit-$($words.Count + 1)"
        group = $source.Group
        unit = $unit
        term = $term
        ipa = ([string]$row[1]).Trim()
        pos = ([string]$row[2]).Trim()
        meaning = ([string]$row[3]).Trim()
        exam = ([string]$row[4]).Trim()
        sentence = ([string]$row[5]).Trim()
        translation = ([string]$row[6]).Trim()
        memory = ([string]$row[7]).Trim()
        source = $file.Name
      }
    }
  }
}

function Add-SupplementWordsFromText {
  param([int]$TargetTotal = 5200)

  $textFiles = @()
  $singleWritingOcr = Join-Path $root 'writing-ocr.txt'
  if (Test-Path $singleWritingOcr) { $textFiles += Get-Item $singleWritingOcr }
  foreach ($dirName in @('writing-folder-ocr', 'phrase-folder-ocr')) {
    $dir = Join-Path $root $dirName
    if (Test-Path $dir) {
      $textFiles += Get-ChildItem $dir -Filter '*.txt'
    }
  }
  if (-not $textFiles.Count) { return }

  $stop = @{}
  @(
    'nanguazi','page','pdf','http','https','www','com','your','with','that','this',
    'from','they','them','their','there','then','than','when','what','which','would',
    'could','should','about','into','onto','also','because','while','where','were',
    'been','being','have','has','had','will','shall','does','done','doing','very'
  ) | ForEach-Object { $stop[$_] = $true }

  $counts = @{}
  $examples = @{}
  foreach ($file in $textFiles) {
    $lines = [IO.File]::ReadLines($file.FullName)
    foreach ($line in $lines) {
      $cleanLine = ($line -replace '\s+', ' ').Trim()
      if (-not $cleanLine -or $cleanLine.Length -lt 12) { continue }
      foreach ($match in [regex]::Matches($cleanLine, '\b[A-Za-z][A-Za-z]{3,17}\b')) {
        $term = $match.Value.ToLowerInvariant()
        if ($stop.ContainsKey($term)) { continue }
        if ($script:seenTerms.ContainsKey($term)) { continue }
        if (-not $counts.ContainsKey($term)) {
          $counts[$term] = 0
          $examples[$term] = $cleanLine
        }
        $counts[$term] = [int]$counts[$term] + 1
      }
    }
  }

  $needed = [Math]::Max(0, $TargetTotal - $script:words.Count)
  if ($needed -le 0) { return }

  $candidates = $counts.GetEnumerator() |
    Where-Object { $_.Value -ge 2 } |
    Sort-Object @{ Expression = { -1 * [int]$_.Value } }, Name |
    Select-Object -First $needed

  foreach ($entry in $candidates) {
    $term = [string]$entry.Name
    if ($script:seenTerms.ContainsKey($term)) { continue }
    $script:seenTerms[$term] = $true
    $example = [string]$examples[$term]
    if ($example.Length -gt 180) { $example = $example.Substring(0, 180) + '...' }
    $supplementId = "supplement-" + ($script:words.Count + 1)
    $script:words = @($script:words) + [pscustomobject]@{
      id = $supplementId;
      group = '资料补充词';
      unit = 999;
      term = $term;
      ipa = '';
      pos = '';
      meaning = '资料补充词：先结合例句认读，后续可继续精修释义。';
      exam = '来自作文、短语或真题语境资料，用来补齐查词和复习断点。';
      sentence = $example;
      translation = '';
      memory = '先会读、会认，再放回原句理解。';
      source = 'OCR资料补充';
    }
  }
}

Add-SupplementWordsFromText -TargetTotal 5200

$phrases = @(
  @{ phrase='according to'; meaning='根据；按照'; example='According to the passage, practice matters more than speed.'; translation='根据文章，练习比速度更重要。' },
  @{ phrase='as a result'; meaning='结果；因此'; example='He reviewed words every day. As a result, he remembered them better.'; translation='他每天复习单词，因此记得更牢。' },
  @{ phrase='as far as'; meaning='就……而言；远到'; example='As far as learning is concerned, repetition is essential.'; translation='就学习而言，重复是必要的。' },
  @{ phrase='as well as'; meaning='也；和'; example='Writing needs grammar as well as vocabulary.'; translation='写作既需要语法，也需要词汇。' },
  @{ phrase='be aware of'; meaning='意识到'; example='We should be aware of common traps in reading.'; translation='我们应该意识到阅读中的常见陷阱。' },
  @{ phrase='be based on'; meaning='以……为基础'; example='This plan is based on your daily schedule.'; translation='这个计划以你的日程为基础。' },
  @{ phrase='be likely to'; meaning='可能'; example='A simple plan is more likely to last.'; translation='简单计划更可能坚持下去。' },
  @{ phrase='be responsible for'; meaning='对……负责'; example='Each learner is responsible for daily review.'; translation='每个学习者都要对每日复习负责。' },
  @{ phrase='bring about'; meaning='导致；带来'; example='Small habits can bring about real progress.'; translation='小习惯能带来真正的进步。' },
  @{ phrase='carry out'; meaning='执行；开展'; example='It is important to carry out the plan every day.'; translation='每天执行计划很重要。' },
  @{ phrase='come up with'; meaning='提出；想出'; example='You need to come up with examples in writing.'; translation='写作时你需要想出例子。' },
  @{ phrase='deal with'; meaning='处理；应对'; example='The course teaches you how to deal with long sentences.'; translation='这门课教你如何处理长难句。' },
  @{ phrase='depend on'; meaning='取决于；依靠'; example='Memory depends on review, not only attention.'; translation='记忆取决于复习，而不只是注意力。' },
  @{ phrase='due to'; meaning='由于'; example='Many mistakes are due to weak grammar.'; translation='许多错误是由于语法薄弱。' },
  @{ phrase='focus on'; meaning='集中于'; example='Tonight we focus on one sentence.'; translation='今晚我们专注一个句子。' },
  @{ phrase='for example'; meaning='例如'; example='For example, one word can appear in many phrases.'; translation='例如，一个词可以出现在许多短语里。' },
  @{ phrase='in addition'; meaning='此外'; example='In addition, phrase practice helps writing.'; translation='此外，短语练习有助于写作。' },
  @{ phrase='in contrast'; meaning='相比之下'; example='In contrast, isolated words are harder to remember.'; translation='相比之下，孤立单词更难记。' },
  @{ phrase='in terms of'; meaning='就……而言'; example='In terms of English, vocabulary is the first step.'; translation='就英语而言，词汇是第一步。' },
  @{ phrase='lead to'; meaning='导致；通向'; example='Daily repetition can lead to steady progress.'; translation='每日重复能带来稳定进步。' },
  @{ phrase='make a difference'; meaning='产生影响'; example='Ten minutes of review can make a difference.'; translation='十分钟复习也能产生影响。' },
  @{ phrase='pay attention to'; meaning='注意'; example='Pay attention to the verb before translating.'; translation='翻译前注意谓语动词。' },
  @{ phrase='play a role in'; meaning='在……中发挥作用'; example='Vocabulary plays a key role in reading.'; translation='词汇在阅读中发挥关键作用。' },
  @{ phrase='take advantage of'; meaning='利用'; example='Take advantage of short breaks at work.'; translation='利用上班间隙。' },
  @{ phrase='take part in'; meaning='参加'; example='More students take part in online learning.'; translation='更多学生参加在线学习。' },
  @{ phrase='take place'; meaning='发生'; example='Real change takes place through daily action.'; translation='真正的改变通过每日行动发生。' },
  @{ phrase='the same as'; meaning='和……一样'; example='Review is not the same as reading once.'; translation='复习不等于看一遍。' },
  @{ phrase='turn into'; meaning='变成'; example='A repeated phrase can turn into a writing sentence.'; translation='反复练习的短语可以变成写作句。' },
  @{ phrase='with regard to'; meaning='关于；就……而言'; example='With regard to writing, examples are necessary.'; translation='关于写作，例子是必要的。' },
  @{ phrase='work out'; meaning='解决；锻炼'; example='You can work out a problem step by step.'; translation='你可以一步步解决问题。' }
) | ForEach-Object -Begin { $i = 1 } -Process {
  [ordered]@{
    id = "p$i"
    phrase = $_.phrase
    meaning = $_.meaning
    example = $_.example
    translation = $_.translation
    source = 'seeded-phrase-list'
  }
  $i++
}

$requiredPhraseTerms = @(
  'be contrary to', 'in and out', 'prefer...to', 'lack of', 'by accident',
  'contribute to', 'provide...with', 'if only', 'rather than', 'be obliged to',
  'aim for', 'give up', 'in theory', 'take measures', 'depend on',
  'at large', 'give in', 'be inclined to', 'concern for', 'no longer',
  'go against', 'show up', 'only if', 'renege on', 'take advantage of',
  'keep...from doing', 'on behalf of', 'be confronted with', 'be unlikely to', 'stay away from',
  'take the lead', 'be considered as', 'be puzzled by', 'by nature', 'as a result',
  'pay attention to', 'be dominant over', 'get over', 'at the end of', 'as usual',
  'a bit of', 'be peculiar to', 'as for', 'derive from', 'be generous to',
  'sum up', 'die out', 'in contrast', "take one's stand", 'wipe out',
  'search for', 'be resistant to', 'up in arms', 'approve of', 'benefit from',
  'be similar to', 'subscribe to', 'seek to', 'make no difference', 'add to',
  'turn out', 'as if', 'as a result of', 'intend to', 'trade with',
  'cast doubt on', 'lose faith in', 'would rather', 'anything but', 'do harm to',
  'owe to', 'be cautious about', 'refer to', 'in terms of', 'be applicable to',
  'in turn', 'feel/be disappointed at', 'set out', 'make up', 'sign on',
  'prior to', 'exert influence on', 'take pride in', 'suffer from', 'conform to',
  'fail to', 'be obsessed with', 'instead of', 'stick to', 'in brief',
  'be conscious of', 'no less than', 'by all means', 'on average', 'accuse of',
  'have nothing to do with', 'stumble on', 'in fact', 'at odds with', 'compete with',
  'in favor of', 'draw a conclusion', 'insist on', 'show sympathy for', 'once for all',
  'be equipped with', 'put down to', 'comply with', 'bring about', 'cling to',
  'persuade sb. into', 'ward off', 'shut down', 'in addition', 'be accessible to',
  'be interested in', 'in trouble', 'such as', 'take efforts', 'play a role in',
  'impinge on', 'out of date', 'result in', 'for instance', 'for fear of/that',
  'as a means of', 'be second to', 'for example', 'be vulnerable to', 'prevent...from doing',
  'evolve from', 'on the basis of', 'on the contrary', 'slow down', 'result from',
  'be deprived of', 'deal with', 'in consequence', 'provide for', 'at stake',
  'be satisfied with', 'split up', 'draw on', 'stress the importance of', 'so that',
  'regard as', 'be accountable to', 'be entitled to', 'discontent with', 'put forward'
)

$seenPhraseTerms = @{}
foreach ($phrase in $phrases) {
  $seenPhraseTerms[$phrase.phrase.ToLowerInvariant()] = $true
}

foreach ($term in $requiredPhraseTerms) {
  $key = $term.ToLowerInvariant()
  if ($seenPhraseTerms.ContainsKey($key)) { continue }
  $seenPhraseTerms[$key] = $true
  $phrases += [ordered]@{
    id = "pdf-phrase-$($phrases.Count + 1)"
    phrase = $term
    meaning = '短语资料补充：先记核心中文，再放进例句和写作里复习。'
    example = "Try to use $term in one sentence today."
    translation = '今天试着用这个短语写一个句子。'
    source = '短语PDF整理'
  }
}

$content = [ordered]@{
  generatedAt = (Get-Date).ToString('s')
  words = $words
  phrases = $phrases
}

$json = $content | ConvertTo-Json -Depth 6
$script = "window.KAOYAN_CONTENT = $json;`n"
[IO.File]::WriteAllText($outFile, $script, [Text.UTF8Encoding]::new($false))

Write-Host "Generated $($words.Count) words and $($phrases.Count) phrases -> $outFile"

