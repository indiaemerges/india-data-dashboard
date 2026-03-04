# ── State name mapping: API names → GeoJSON ST_NM ─────────────────────────────
$nameMap = @{
    "Andaman & Nicobar Islands"            = "Andaman & Nicobar"
    "Dadra & Nagar Haveli & Daman & Diu"   = "Dadra and Nagar Haveli and Daman and Diu"
    "Dadra & Nagar Haveli"                 = "Dadra and Nagar Haveli and Daman and Diu"
    "Daman & Diu"                          = "Dadra and Nagar Haveli and Daman and Diu"
}

function Map-StateName($name) {
    if ($nameMap.ContainsKey($name)) { return $nameMap[$name] }
    return $name
}

# ── Read PLFS UR file ──────────────────────────────────────────────────────────
$urFile = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\toolu_01NDbStEFLDK9Ev8vBX2AyGs.txt'
$urRaw  = [System.IO.File]::ReadAllText($urFile)
$urJson = $urRaw | ConvertFrom-Json
Write-Host "PLFS UR: $($urJson.meta_data.totalRecords) records"

# ── Read PLFS female LFPR file ─────────────────────────────────────────────────
$lfprFile = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772646164059.txt'
$lfprRaw  = [System.IO.File]::ReadAllText($lfprFile)
$lfprJson = $lfprRaw | ConvertFrom-Json
Write-Host "PLFS female LFPR: $($lfprJson.meta_data.totalRecords) records"

# ── Read CPI state file ────────────────────────────────────────────────────────
$cpiFile = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\toolu_01P1mj8j7XLtTEJuX8WMK8FY.txt'
$cpiRaw  = [System.IO.File]::ReadAllText($cpiFile)
$cpiJson = $cpiRaw | ConvertFrom-Json
Write-Host "CPI: $($cpiJson.meta_data.totalRecords) records, pages: $($cpiJson.meta_data.totalPages)"

# ── Filter PLFS to exclude All India and quarterly breakdowns ──────────────────
$urRecords   = $urJson.data   | Where-Object { $_.state -ne "All India" -and $_.quarter -eq "all" }
$lfprRecords = $lfprJson.data | Where-Object { $_.state -ne "All India" -and $_.quarter -eq "all" }

# Get sorted years from UR data
$years = $urRecords | Select-Object -ExpandProperty year -Unique | Sort-Object
Write-Host "PLFS years: $($years -join ', ')"

# Get all unique state names in PLFS
$plfsStates = $urRecords | Select-Object -ExpandProperty state -Unique | Sort-Object
Write-Host "PLFS states ($($plfsStates.Count)): $($plfsStates -join ', ')"

# ── Build per-state arrays ─────────────────────────────────────────────────────
$statesOut = @()
foreach ($stateName in $plfsStates) {
    $geoName = Map-StateName $stateName

    # UR per year
    $urArr = @()
    foreach ($yr in $years) {
        $rec = $urRecords | Where-Object { $_.state -eq $stateName -and $_.year -eq $yr }
        if ($rec -and $rec.value -ne $null -and $rec.value -ne "") {
            $urArr += [double]$rec.value
        } else {
            $urArr += $null
        }
    }

    # female LFPR per year
    $lfprArr = @()
    foreach ($yr in $years) {
        $rec = $lfprRecords | Where-Object { $_.state -eq $stateName -and $_.year -eq $yr }
        if ($rec -and $rec.value -ne $null -and $rec.value -ne "") {
            $lfprArr += [double]$rec.value
        } else {
            $lfprArr += $null
        }
    }

    $statesOut += [PSCustomObject]@{
        stateName    = $stateName
        geoName      = $geoName
        ur_person    = $urArr
        lfpr_female  = $lfprArr
    }
}

# ── Build PLFS state JSON ──────────────────────────────────────────────────────
$plfsOut = [PSCustomObject]@{
    source       = "MoSPI PLFS (Annual)"
    sourceUrl    = "https://www.mospi.gov.in/"
    lastUpdated  = (Get-Date -Format "yyyy-MM-dd")
    notes        = "Combined (rural+urban), PS+SS basis, age 15+. Excludes All India aggregate."
    years        = $years
    states       = $statesOut
}

$plfsOutPath = "C:\Users\Chintan\Documents\project_india\india-data-dashboard\public\data\mospi\plfs-state.json"
$plfsOut | ConvertTo-Json -Depth 10 | Set-Content -Path $plfsOutPath -Encoding UTF8
Write-Host "Written: $plfsOutPath"

# ── Process CPI state data ─────────────────────────────────────────────────────
# Filter to Combined sector, group=General, exclude All India
# Use December 2024 as the reference "latest" snapshot, and also monthly series
$cpiRecords = $cpiJson.data | Where-Object {
    $_.state -ne "All India" -and
    $_.sector -eq "Combined" -and
    $_.group -eq "General"
}

# Get unique months in the data (sorted)
$cpiMonths = $cpiRecords | Select-Object -ExpandProperty month -Unique
Write-Host "CPI months in file: $($cpiMonths -join ', ')"

# Get unique CPI state names
$cpiStateNames = $cpiRecords | Select-Object -ExpandProperty state -Unique | Sort-Object
Write-Host "CPI states ($($cpiStateNames.Count)): $($cpiStateNames -join ', ')"

# Build month label list (YYYY-MM format for each month present)
$monthOrder = @("January","February","March","April","May","June","July","August","September","October","November","December")
$monthNum   = @{}
for ($i = 0; $i -lt $monthOrder.Count; $i++) { $monthNum[$monthOrder[$i]] = ($i + 1) }

# Get distinct year-month combinations sorted
$yearMonthPairs = $cpiRecords | Select-Object year, month -Unique | Sort-Object year, { $monthNum[$_.month] }
$monthLabels = $yearMonthPairs | ForEach-Object {
    $m = $monthNum[$_.month]
    "$($_.year)-{0:D2}" -f $m
}

Write-Host "CPI month labels ($($monthLabels.Count)): $($monthLabels[0]) to $($monthLabels[-1])"

# Build per-state CPI arrays
$cpiStatesOut = @()
foreach ($stateName in $cpiStateNames) {
    $geoName = Map-StateName $stateName
    $inflArr = @()
    foreach ($pair in $yearMonthPairs) {
        $rec = $cpiRecords | Where-Object {
            $_.state -eq $stateName -and
            $_.year  -eq $pair.year -and
            $_.month -eq $pair.month
        }
        if ($rec -and $rec.inflation -ne $null -and $rec.inflation -ne "") {
            $inflArr += [double]$rec.inflation
        } else {
            $inflArr += $null
        }
    }
    $cpiStatesOut += [PSCustomObject]@{
        stateName = $stateName
        geoName   = $geoName
        inflation = $inflArr
    }
}

$cpiOut = [PSCustomObject]@{
    source      = "MoSPI CPI (State-wise)"
    sourceUrl   = "https://www.mospi.gov.in/"
    lastUpdated = (Get-Date -Format "yyyy-MM-dd")
    notes       = "Headline CPI (General), Combined (rural+urban), base year 2012=100. YoY % change."
    months      = $monthLabels
    states      = $cpiStatesOut
}

$cpiOutPath = "C:\Users\Chintan\Documents\project_india\india-data-dashboard\public\data\mospi\cpi-state.json"
$cpiOut | ConvertTo-Json -Depth 10 | Set-Content -Path $cpiOutPath -Encoding UTF8
Write-Host "Written: $cpiOutPath"
Write-Host ""
Write-Host "Done! Summary:"
Write-Host "  plfs-state.json: $($statesOut.Count) states, $($years.Count) years"
Write-Host "  cpi-state.json:  $($cpiStatesOut.Count) states, $($monthLabels.Count) months"
