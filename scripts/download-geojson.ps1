$geoDir = "C:\Users\Chintan\Documents\project_india\india-data-dashboard\public\data\geo"
$outFile = "$geoDir\india-states.geojson"

New-Item -ItemType Directory -Force $geoDir | Out-Null

$url = "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson"
Invoke-WebRequest -Uri $url -OutFile $outFile
Write-Host "Downloaded. File size: $((Get-Item $outFile).Length) bytes"

$json = Get-Content $outFile -Raw | ConvertFrom-Json
Write-Host "Total features: $($json.features.Count)"
Write-Host ""
Write-Host "State names (ST_NM):"
$json.features | ForEach-Object { $_.properties.ST_NM } | Sort-Object | ForEach-Object { Write-Host "  $_" }
