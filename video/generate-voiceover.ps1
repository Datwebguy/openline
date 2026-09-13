$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$text = Get-Content -Raw (Join-Path $PSScriptRoot 'voiceover.txt')
$assetDirectory = Join-Path $PSScriptRoot '..\public\video'
$output = Join-Path $assetDirectory 'openline-voiceover.wav'
$null = New-Item -ItemType Directory -Force $assetDirectory
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 1
$synth.Volume = 100
$preferred = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -match 'David|Mark|Guy|Zira' } | Select-Object -First 1
if ($preferred) { $synth.SelectVoice($preferred.VoiceInfo.Name) }
$synth.SetOutputToWaveFile($output)
$synth.Speak($text)
$synth.Dispose()
Write-Output "Generated $output"
