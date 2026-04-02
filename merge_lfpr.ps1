# ============================================================
# merge_lfpr.ps1
# Adds lfpr_male and lfpr_person to plfs-state.json
# ============================================================

$apiFile  = 'C:/Users/Chintan/.claude/projects/C--Users-Chintan-Documents-project-India/3ea051c0-c03b-4532-b223-5a0005f6b2e2/tool-results/mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772720498585.txt'
$plfsFile = 'C:/Users/Chintan/Documents/project_india/india-data-dashboard/public/data/mospi/plfs-state.json'

# ----------------------------------------------------------
# 1. Read and filter API data
# ----------------------------------------------------------
Write-Host "Reading API data..."
$raw     = Get-Content $apiFile -Raw -Encoding UTF8
$json    = $raw | ConvertFrom-Json
$records = $json.data

Write-Host ("Total API records: " + $records.Count)

$filtered = $records | Where-Object {
    $_.quarter       -eq 'all' -and
    $_.state         -ne 'All India' -and
    $_.sector        -eq 'rural + urban' -and
    $_.religion      -eq 'all' -and
    $_.socialGroup   -eq 'all' -and
    $_.AgeGroup      -eq '15 years and above' -and
    $_.weekly_status -eq 'PS+SS' -and
    $_.General_Education -eq 'all' -and
    ($_.gender -eq 'male' -or $_.gender -eq 'person')
}
Write-Host ("Filtered aggregate state records: " + $filtered.Count)

# ----------------------------------------------------------
# 2. Build lookup: stateName -> year -> gender -> value
#    Key the lookup by API state name (before mapping)
# ----------------------------------------------------------
$lookup = @{}   # $lookup[apiStateName][year][gender] = value

foreach ($rec in $filtered) {
    $sn = $rec.state
    $yr = $rec.year
    $gn = $rec.gender
    $vl = $rec.value

    if (-not $lookup.ContainsKey($sn))      { $lookup[$sn]      = @{} }
    if (-not $lookup[$sn].ContainsKey($yr)) { $lookup[$sn][$yr] = @{} }
    $lookup[$sn][$yr][$gn] = $vl
}

Write-Host ("Unique API states in lookup: " + $lookup.Count)

# ----------------------------------------------------------
# 3. State name mapping: API name -> plfs stateName
#    (API uses stateName as-is for most; special cases below)
# ----------------------------------------------------------
# The plfs-state.json uses "stateName" which matches the API
# state name directly for all states EXCEPT the merged UT.
# API has: "Dadra & Nagar Haveli" and "Daman & Diu" separately.
# plfs has: "Dadra & Nagar Haveli", "Daman & Diu", AND
#            "Dadra & Nagar Haveli & Daman & Diu"
# We map each API state to the corresponding plfs stateName(s).

# Build reverse map: API state name -> list of plfs stateNames
$apiToPlfs = @{
    'Andaman & Nicobar Islands'              = @('Andaman & Nicobar Islands')
    'Dadra & Nagar Haveli'                   = @('Dadra & Nagar Haveli')
    'Daman & Diu'                            = @('Daman & Diu')
}
# All other API states map 1-to-1 to the same stateName in plfs

# ----------------------------------------------------------
# 4. Read existing plfs-state.json
# ----------------------------------------------------------
Write-Host "Reading plfs-state.json..."
$plfsRaw  = Get-Content $plfsFile -Raw -Encoding UTF8
$plfsObj  = $plfsRaw | ConvertFrom-Json
$years    = $plfsObj.years   # ["2017-18","2018-19",...]
$statesArr = $plfsObj.states

Write-Host ("plfs years: " + ($years -join ', '))
Write-Host ("plfs states count: " + $statesArr.Count)

# ----------------------------------------------------------
# 5. Helper: build a space-separated 7-value string
#    given a hashtable of year->value and the years array
# ----------------------------------------------------------
function Build-ValueString {
    param($yearLookup, $yearsArr)
    $parts = @()
    foreach ($yr in $yearsArr) {
        if ($yearLookup -and $yearLookup.ContainsKey($yr)) {
            $parts += $yearLookup[$yr]
        } else {
            $parts += ''
        }
    }
    # Join with single space (empty slots become blank)
    return ($parts -join ' ')
}

# ----------------------------------------------------------
# 6. Merge: add lfpr_male and lfpr_person to each state
# ----------------------------------------------------------
$matchedCount = 0

foreach ($stateObj in $statesArr) {
    $plfsStateName = $stateObj.stateName

    # Find the API state name that corresponds to this plfs state
    # Default: same name
    $apiStateName = $plfsStateName

    # Check if there's an override in apiToPlfs (handles special cases)
    # For this dataset, plfs stateName == API state name for all except
    # "Dadra & Nagar Haveli & Daman & Diu" (merged) which has no API entry
    # The individual ones match directly by stateName.

    $yearLookupMale   = $null
    $yearLookupPerson = $null

    if ($lookup.ContainsKey($apiStateName)) {
        $matchedCount++
        $yearData = $lookup[$apiStateName]
        # Build year->value maps for male and person
        $maleMap   = @{}
        $personMap = @{}
        foreach ($yr in $yearData.Keys) {
            if ($yearData[$yr].ContainsKey('male'))   { $maleMap[$yr]   = $yearData[$yr]['male']   }
            if ($yearData[$yr].ContainsKey('person')) { $personMap[$yr] = $yearData[$yr]['person'] }
        }
        $yearLookupMale   = $maleMap
        $yearLookupPerson = $personMap
    }
    # else: no API data for this plfs state -> all blanks

    $maleStr   = Build-ValueString -yearLookup $yearLookupMale   -yearsArr $years
    $personStr = Build-ValueString -yearLookup $yearLookupPerson -yearsArr $years

    # Add properties to the state object
    $stateObj | Add-Member -MemberType NoteProperty -Name 'lfpr_male'   -Value $maleStr   -Force
    $stateObj | Add-Member -MemberType NoteProperty -Name 'lfpr_person' -Value $personStr -Force
}

Write-Host ("States matched with API data: " + $matchedCount)

# ----------------------------------------------------------
# 7. Write back to plfs-state.json
# ----------------------------------------------------------
Write-Host "Writing updated plfs-state.json..."
$outputJson = $plfsObj | ConvertTo-Json -Depth 10
# Write with UTF8 (no BOM)
[System.IO.File]::WriteAllText($plfsFile, $outputJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. File written."

# ----------------------------------------------------------
# 8. Verification: print first state's lfpr_male and lfpr_person
# ----------------------------------------------------------
$verify = Get-Content $plfsFile -Raw -Encoding UTF8 | ConvertFrom-Json
$first  = $verify.states[0]
Write-Host ""
Write-Host "=== VERIFICATION ==="
Write-Host ("First state stateName : " + $first.stateName)
Write-Host ("lfpr_male             : " + $first.lfpr_male)
Write-Host ("lfpr_person           : " + $first.lfpr_person)
Write-Host ("lfpr_female (existing): " + $first.lfpr_female)
Write-Host ""

# Show a few more states for spot-checking
Write-Host "=== SPOT CHECK (first 5 states) ==="
$verify.states[0..4] | ForEach-Object {
    Write-Host ("  " + $_.stateName + " | male: " + $_.lfpr_male + " | person: " + $_.lfpr_person)
}
