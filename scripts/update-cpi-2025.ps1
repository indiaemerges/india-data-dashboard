# update-cpi-2025.ps1
# Reads the 2025 CPI API result and merges it into cpi-state.json

$apiFile  = "C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\toolu_01Tm34ihdLfheCz9TrovtSGH.txt"
$cpiFile  = "C:\Users\Chintan\Documents\project_india\india-data-dashboard\public\data\mospi\cpi-state.json"

# ── Load API result ──────────────────────────────────────────────────────────
$apiRaw   = Get-Content $apiFile -Raw | ConvertFrom-Json
$apiData  = $apiRaw.data   # array of records

# ── Month name → zero-padded month string ─────────────────────────────────────
$monthMap = @{
    "January"   = "2025-01"
    "February"  = "2025-02"
    "March"     = "2025-03"
    "April"     = "2025-04"
    "May"       = "2025-05"
    "June"      = "2025-06"
    "July"      = "2025-07"
    "August"    = "2025-08"
    "September" = "2025-09"
    "October"   = "2025-10"
    "November"  = "2025-11"
    "December"  = "2025-12"
}

# ── Build lookup: stateName → (monthKey → inflation) ─────────────────────────
$lookup = @{}
foreach ($row in $apiData) {
    if ($row.state -eq "All India") { continue }
    $mn = $monthMap[$row.month]
    if (-not $mn) { continue }
    if (-not $lookup.ContainsKey($row.state)) { $lookup[$row.state] = @{} }
    $val = if ($row.inflation -ne $null -and $row.inflation -ne "") {
        [double]$row.inflation
    } else { $null }
    $lookup[$row.state][$mn] = $val
}

Write-Host "States found in 2025 API data: $($lookup.Keys.Count)"

# ── State name mapping (API names → JSON stateName) ─────────────────────────
# The API uses slightly different names for a couple of states vs our JSON
$nameMap = @{
    "Dadra & Nagar Haveli"       = "Dadra and Nagar Haveli and Daman and Diu"
    "Daman & Diu"                = "Dadra and Nagar Haveli and Daman and Diu"
    "Andaman & Nicobar Islands"  = "Andaman & Nicobar Islands"
    "Jammu & Kashmir"            = "Jammu & Kashmir"
}

# ── Load existing JSON ────────────────────────────────────────────────────────
$cpi = Get-Content $cpiFile -Raw | ConvertFrom-Json

# ── New months to append ─────────────────────────────────────────────────────
$newMonths = @("2025-01","2025-02","2025-03","2025-04","2025-05","2025-06",
               "2025-07","2025-08","2025-09","2025-10","2025-11","2025-12")

# Extend the months array
$cpi.months = $cpi.months + $newMonths
$cpi.lastUpdated = "2026-03-05"

# ── Append inflation values for each state ────────────────────────────────────
$matched = 0
$unmatched = @()

foreach ($stateObj in $cpi.states) {
    $jsonName = $stateObj.stateName   # e.g. "Andaman & Nicobar Islands"

    # Try direct match first, then nameMap
    $apiName  = if ($lookup.ContainsKey($jsonName)) {
        $jsonName
    } else {
        # Find reverse mapping
        $found = $null
        foreach ($k in $nameMap.Keys) {
            if ($nameMap[$k] -eq $jsonName) { $found = $k; break }
        }
        $found
    }

    # Build 12 values for this state
    $vals = @()
    foreach ($mn in $newMonths) {
        if ($apiName -and $lookup.ContainsKey($apiName) -and $lookup[$apiName].ContainsKey($mn)) {
            $vals += $lookup[$apiName][$mn]
        } else {
            $vals += $null
        }
    }

    # Append to existing inflation array
    $stateObj.inflation = $stateObj.inflation + $vals

    if ($apiName -and $lookup.ContainsKey($apiName)) {
        $matched++
    } else {
        $unmatched += $jsonName
    }
}

Write-Host "Matched: $matched | Unmatched: $($unmatched.Count)"
if ($unmatched.Count -gt 0) { Write-Host "Unmatched states: $($unmatched -join ', ')" }

# ── Verify month count matches inflation count ────────────────────────────────
$expectedLen = $cpi.months.Count   # should be 24
$ok = $true
foreach ($s in $cpi.states) {
    if ($s.inflation.Count -ne $expectedLen) {
        Write-Host "MISMATCH: $($s.stateName) has $($s.inflation.Count) values, expected $expectedLen"
        $ok = $false
    }
}
if ($ok) { Write-Host "All states have $expectedLen inflation values - OK" }

# ── Save ─────────────────────────────────────────────────────────────────────
$cpi | ConvertTo-Json -Depth 6 | Set-Content $cpiFile -Encoding UTF8
Write-Host "Saved: $cpiFile"
