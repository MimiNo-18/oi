param([string]$SiteRoot = 'C:\Users\tyn31\Documents\小手机')

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 8765)
$listener.Start()

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
        $requestLine = $reader.ReadLine()
        while ($reader.ReadLine()) {}
        $target = ($requestLine -split ' ')[1]
        $relativePath = ([Uri]::UnescapeDataString(($target -split '\?')[0])).TrimStart('/')
        if (-not $relativePath) { $relativePath = 'qr-album-roundtrip-test.html' }
        $filePath = Join-Path $SiteRoot $relativePath
        if (Test-Path -LiteralPath $filePath) {
            $bytes = [IO.File]::ReadAllBytes($filePath)
            $contentType = if ($filePath.EndsWith('.js')) { 'text/javascript' } else { 'text/html; charset=utf-8' }
            $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
        } else {
            $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
            $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
        }
        $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
