# generate-asi-final.ps1
# Combines partial ASI JSON with the freshly fetched totals to produce asi-annual.json

$partialPath = 'C:\Users\Chintan\Documents\project_india\india-data-dashboard\public\data\mospi\asi-partial.json'
$outPath     = 'C:\Users\Chintan\Documents\project_india\india-data-dashboard\public\data\mospi\asi-annual.json'

$partial = Get-Content $partialPath -Raw | ConvertFrom-Json

# years in ascending order (from partial)
$years = $partial.years

Write-Host "Years: $($years -join ', ')"

# Additional totals fetched fresh from MCP (indicators 2, 15, 31, 34, 35)
# Data returned in descending year order - need to match to $years (ascending)
$rawExtra = @(
    @{ year="2008-09"; factories=149382; output=327279786;  personsEngaged=11327485; maleWorkers=4779073; femaleWorkers=1198255 },
    @{ year="2009-10"; factories=152633; output=373303593;  personsEngaged=11792055; maleWorkers=4934978; femaleWorkers=1218745 },
    @{ year="2010-11"; factories=172177; output=467621696;  personsEngaged=12694853; maleWorkers=5313027; femaleWorkers=1228195 },
    @{ year="2011-12"; factories=175710; output=570366932;  personsEngaged=13430483; maleWorkers=5522560; femaleWorkers=1305720 },
    @{ year="2012-13"; factories=179102; output=602594536;  personsEngaged=12950025; maleWorkers=5378880; femaleWorkers=1229327 },
    @{ year="2013-14"; factories=185690; output=655525116;  personsEngaged=13538114; maleWorkers=5424723; femaleWorkers=1509498 },
    @{ year="2014-15"; factories=189468; output=688381205;  personsEngaged=13881386; maleWorkers=5569324; femaleWorkers=1383853 },
    @{ year="2015-16"; factories=191062; output=686235375;  personsEngaged=14299710; maleWorkers=5676858; femaleWorkers=1500850 },
    @{ year="2016-17"; factories=194380; output=726551423;  personsEngaged=14911189; maleWorkers=5937545; femaleWorkers=1525953 },
    @{ year="2017-18"; factories=195584; output=807217258;  personsEngaged=15614619; maleWorkers=6183512; femaleWorkers=1593685 },
    @{ year="2018-19"; factories=197145; output=928179908;  personsEngaged=16280211; maleWorkers=6414332; femaleWorkers=1569506 },
    @{ year="2019-20"; factories=198628; output=898330129;  personsEngaged=16624291; maleWorkers=6454363; femaleWorkers=1582701 },
    @{ year="2020-21"; factories=200395; output=880921387;  personsEngaged=16089700; maleWorkers=6225277; femaleWorkers=1424116 },
    @{ year="2021-22"; factories=200576; output=1192715147; personsEngaged=17215350; maleWorkers=6637049; femaleWorkers=1498634 },
    @{ year="2022-23"; factories=206523; output=1448660228; personsEngaged=18494962; maleWorkers=7068638; femaleWorkers=1596643 },
    @{ year="2023-24"; factories=212990; output=1532716609; personsEngaged=19589131; maleWorkers=7423421; femaleWorkers=1641491 }
)

# Build lookup by year
$extraMap = @{}
foreach ($r in $rawExtra) { $extraMap[$r.year] = $r }

# Build arrays in year order
$factories     = $years | ForEach-Object { $extraMap[$_].factories }
$output        = $years | ForEach-Object { $extraMap[$_].output }
$personsEngaged = $years | ForEach-Object { $extraMap[$_].personsEngaged }
$maleWorkers   = $years | ForEach-Object { $extraMap[$_].maleWorkers }
$femaleWorkers = $years | ForEach-Object { $extraMap[$_].femaleWorkers }

Write-Host "Factories: $($factories[0]) -> $($factories[-1])"
Write-Host "Output: $($output[0]) -> $($output[-1])"

# Build complete totals object
$totals = [ordered]@{
    factories      = $factories
    output         = $output
    gva            = $partial.totals.gva
    fixedCapital   = $partial.totals.fixedCapital
    workers        = $partial.totals.workers
    personsEngaged = $personsEngaged
    maleWorkers    = $maleWorkers
    femaleWorkers  = $femaleWorkers
    wages          = $partial.totals.wages
}

# Build final output
$out = [ordered]@{
    source       = 'MoSPI, Annual Survey of Industries'
    sourceUrl    = 'https://mospi.gov.in/annual-survey-industries'
    lastUpdated  = '2025-03-01'
    notes        = 'NIC 2008 classification. Financial values in INR lakhs. Combined (Rural+Urban) sector. All India.'
    years        = $years
    totals       = $totals
    byNIC        = $partial.byNIC
}

$json = $out | ConvertTo-Json -Depth 10 -Compress
[System.IO.File]::WriteAllText($outPath, $json, [System.Text.Encoding]::UTF8)
Write-Host "Written $($json.Length) chars to $outPath"

# Verify
$verify = Get-Content $outPath -Raw | ConvertFrom-Json
Write-Host "Verification: $($verify.byNIC.Count) NIC sectors, $($verify.years.Count) years"
Write-Host "Sample GVA latest: $($verify.totals.gva[-1])"
Write-Host "Sample factories latest: $($verify.totals.factories[-1])"
Write-Host "byNIC[0].nicCode: $($verify.byNIC[0].nicCode) ($($verify.byNIC[0].nicNameShort))"
Write-Host "byNIC[0] GVA latest: $($verify.byNIC[0].gva[-1])"
