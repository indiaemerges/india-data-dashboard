$f1 = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772558523322.txt'
$f2 = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772558531796.txt'

$c1 = [System.IO.File]::ReadAllText($f1)
$c2 = [System.IO.File]::ReadAllText($f2)

$d1 = ($c1 | ConvertFrom-Json).data
$d2 = ($c2 | ConvertFrom-Json).data

Write-Host "File1 records: $($d1.Count)"
Write-Host "File2 records: $($d2.Count)"

# Show unique indicators in each file
$inds1 = $d1 | Select-Object -ExpandProperty indicator -Unique
Write-Host "File1 indicators: $($inds1 -join ', ')"

$inds2 = $d2 | Select-Object -ExpandProperty indicator -Unique
Write-Host "File2 indicators: $($inds2 -join ', ')"

# Show unique years
$years = $d1 | Select-Object -ExpandProperty year -Unique | Sort-Object
Write-Host "Years ($($years.Count)): $($years -join ', ')"

# Show unique NIC codes with descriptions
$nics = $d1 | Where-Object { $_.indicator -eq 'Gross Value Added' -and $_.year -eq '2023-24' } | Select-Object nic_code, nic_description | Sort-Object { [int]$_.nic_code }
Write-Host "`nNIC codes ($($nics.Count)):"
foreach ($n in $nics) {
    Write-Host "  $($n.nic_code): $($n.nic_description)"
}
