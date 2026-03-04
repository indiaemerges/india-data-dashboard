# generate-asi.ps1
# Reads the MCP API result files and produces public/data/mospi/asi-annual.json

$f1 = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772558523322.txt'
$f2 = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772558531796.txt'

Write-Host "Reading file 1 (GVA + Workers)..."
$d1 = (Get-Content $f1 -Raw | ConvertFrom-Json).data
Write-Host "Reading file 2 (Fixed Capital + Wages)..."
$d2 = (Get-Content $f2 -Raw | ConvertFrom-Json).data

Write-Host "File1 records: $($d1.Count)"
Write-Host "File2 records: $($d2.Count)"

# Extract unique sorted years
$years = $d1 | Select-Object -ExpandProperty year -Unique | Sort-Object
Write-Host "Years: $($years.Count)"

# Build lookup: indicator -> nic_code -> year -> value
function Get-ValueGrid {
    param($data, $indicatorName)
    $grid = @{}
    foreach ($row in $data) {
        if ($row.indicator -ne $indicatorName) { continue }
        $nic = $row.nic_code
        $yr  = $row.year
        $val = $null
        if ($row.value -ne $null -and $row.value -ne '' -and $row.value -ne '-') {
            $val = [double]$row.value
        }
        if (-not $grid.ContainsKey($nic)) { $grid[$nic] = @{} }
        $grid[$nic][$yr] = $val
    }
    return $grid
}

$gvaGrid   = Get-ValueGrid $d1 'Gross Value Added'
$wkrGrid   = Get-ValueGrid $d1 'Total Number of Workers'
$capGrid   = Get-ValueGrid $d2 'Fixed Capital'
$wageGrid  = Get-ValueGrid $d2 'Wages and Salaries Including Employer''s Contribution'

Write-Host "Built grids. GVA NICs: $($gvaGrid.Count)"

# Short name map for NIC codes
$shortNames = @{
    '01'    = 'Agriculture'
    '08'    = 'Mining & Quarrying'
    '10'    = 'Food Products'
    '11'    = 'Beverages'
    '12'    = 'Tobacco'
    '13'    = 'Textiles'
    '14'    = 'Wearing Apparel'
    '15'    = 'Leather'
    '16'    = 'Wood Products'
    '17'    = 'Paper Products'
    '18'    = 'Printing'
    '19'    = 'Petroleum & Coke'
    '20'    = 'Chemicals'
    '21'    = 'Pharmaceuticals'
    '22'    = 'Rubber & Plastics'
    '23'    = 'Non-metallic Minerals'
    '24'    = 'Basic Metals'
    '25'    = 'Fabricated Metals'
    '26'    = 'Electronics'
    '27'    = 'Electrical Equipment'
    '28'    = 'Machinery'
    '29'    = 'Motor Vehicles'
    '30'    = 'Other Transport'
    '31'    = 'Furniture'
    '32'    = 'Other Mfg.'
    '33'    = 'Repair & Installation'
    '38'    = 'Waste Management'
    '58'    = 'Publishing'
    '99998' = 'Other'
    '99999' = 'All India'
}

# Build byNIC array (exclude 99998 and 99999)
$nicOrder = @('10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','01','08','38','58')
$byNic = @()

foreach ($nic in $nicOrder) {
    if (-not $gvaGrid.ContainsKey($nic)) {
        Write-Host "WARNING: NIC $nic not found in GVA grid"
        continue
    }
    $gvaArr   = $years | ForEach-Object { $v = $gvaGrid[$nic][$_];   if ($v -ne $null) { [math]::Round($v) } else { $null } }
    $wkrArr   = $years | ForEach-Object { $v = $wkrGrid[$nic][$_];   if ($v -ne $null) { [math]::Round($v) } else { $null } }
    $capArr   = $years | ForEach-Object { $v = $capGrid[$nic][$_];   if ($v -ne $null) { [math]::Round($v) } else { $null } }
    $wageArr  = $years | ForEach-Object { $v = $wageGrid[$nic][$_];  if ($v -ne $null) { [math]::Round($v) } else { $null } }

    # Get description from first matching row
    $desc = ($d1 | Where-Object { $_.nic_code -eq $nic } | Select-Object -First 1).nic_description

    $entry = [ordered]@{
        nicCode    = $nic
        nicName    = $desc
        nicNameShort = $shortNames[$nic]
        gva        = $gvaArr
        workers    = $wkrArr
        fixedCapital = $capArr
        wages      = $wageArr
    }
    $byNic += $entry
}

Write-Host "byNIC entries: $($byNic.Count)"

# All India totals from 99999 rows
$totGva  = $years | ForEach-Object { $v = $gvaGrid['99999'][$_];  if ($v -ne $null) { [math]::Round($v) } else { $null } }
$totWkr  = $years | ForEach-Object { $v = $wkrGrid['99999'][$_];  if ($v -ne $null) { [math]::Round($v) } else { $null } }
$totCap  = $years | ForEach-Object { $v = $capGrid['99999'][$_];  if ($v -ne $null) { [math]::Round($v) } else { $null } }
$totWage = $years | ForEach-Object { $v = $wageGrid['99999'][$_]; if ($v -ne $null) { [math]::Round($v) } else { $null } }

Write-Host "Sample All India GVA: first=$($totGva[0]), last=$($totGva[-1])"
Write-Host "Sample All India Workers: first=$($totWkr[0]), last=$($totWkr[-1])"

# NOTE: We still need factories, output, persons engaged, male/female workers from Call A
# Those will be added separately. For now we embed placeholders so the file is valid.
# The totals that we have from files 1+2: gva, workers, fixedCapital, wages
# We need from the MCP re-fetch: factories, output, personsEngaged, maleWorkers, femaleWorkers

# Build output object (partial — without factories/output/persons)
$out = [ordered]@{
    source      = 'MoSPI, Annual Survey of Industries'
    sourceUrl   = 'https://mospi.gov.in/web/mospi/reports-publications/-/reports/view/templateOne/15002?p_p_id=122_INSTANCE_MjVG&category=3957'
    lastUpdated = '2025-03-01'
    notes       = 'Classification year 2008. Values in INR lakhs unless otherwise noted. Combined (Rural+Urban) sector.'
    years       = $years
    totals      = [ordered]@{
        gva          = $totGva
        workers      = $totWkr
        fixedCapital = $totCap
        wages        = $totWage
    }
    byNIC       = $byNic
}

$json = $out | ConvertTo-Json -Depth 10 -Compress
$outPath = 'C:\Users\Chintan\Documents\project_india\india-data-dashboard\public\data\mospi\asi-partial.json'
[System.IO.File]::WriteAllText($outPath, $json, [System.Text.Encoding]::UTF8)
Write-Host "Written to $outPath ($($json.Length) chars)"
