$f1 = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772646073476.txt'
$f2 = 'C:\Users\Chintan\.claude\projects\C--Users-Chintan-Documents-project-India\3ea051c0-c03b-4532-b223-5a0005f6b2e2\tool-results\mcp-be345d6d-3109-4f5f-9599-6a42bdc84336-4_get_data-1772646079136.txt'

$raw1 = [System.IO.File]::ReadAllText($f1)
$json1 = $raw1 | ConvertFrom-Json
Write-Host "File 1 (UR): totalRecords=$($json1.meta_data.totalRecords), totalPages=$($json1.meta_data.totalPages)"
Write-Host "First record:"
$json1.data[0] | ConvertTo-Json -Depth 3

Write-Host ""
$raw2 = [System.IO.File]::ReadAllText($f2)
$json2 = $raw2 | ConvertFrom-Json
Write-Host "File 2 (LFPR female): totalRecords=$($json2.meta_data.totalRecords), totalPages=$($json2.meta_data.totalPages)"
Write-Host "First record:"
$json2.data[0] | ConvertTo-Json -Depth 3
