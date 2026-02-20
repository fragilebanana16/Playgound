<?php
// 获取视频文件路径
$file = isset($_GET['file']) ? $_GET['file'] : '';

if (empty($file)) {
    header('HTTP/1.1 400 Bad Request');
    die('未指定文件');
}

if (!file_exists($file)) {
    header('HTTP/1.1 404 Not Found');
    die('文件不存在');
}

if (!is_readable($file)) {
    header('HTTP/1.1 403 Forbidden');
    die('无法读取文件');
}

$filesize = filesize($file);
$filename = basename($file);

// 获取文件的MIME类型
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime_type = finfo_file($finfo, $file);
finfo_close($finfo);

// 如果无法检测MIME类型，使用默认值
if (!$mime_type) {
    $mime_type = 'video/mp4';
}

// 支持范围请求（用于视频拖动）
$range = isset($_SERVER['HTTP_RANGE']) ? $_SERVER['HTTP_RANGE'] : '';

if ($range) {
    // 解析Range请求
    list($unit, $range) = explode('=', $range, 2);
    
    if ($unit == 'bytes') {
        list($start, $end) = explode('-', $range, 2);
        
        $start = intval($start);
        $end = ($end === '') ? $filesize - 1 : intval($end);
        $length = $end - $start + 1;
        
        // 设置HTTP头
        header('HTTP/1.1 206 Partial Content');
        header('Content-Type: ' . $mime_type);
        header('Content-Length: ' . $length);
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $filesize);
        header('Accept-Ranges: bytes');
        
        // 输出指定范围的文件内容
        $fp = fopen($file, 'rb');
        fseek($fp, $start);
        
        $buffer = 1024 * 8; // 8KB缓冲
        while (!feof($fp) && ($p = ftell($fp)) <= $end) {
            if ($p + $buffer > $end) {
                $buffer = $end - $p + 1;
            }
            echo fread($fp, $buffer);
            flush();
        }
        
        fclose($fp);
    }
} else {
    // 正常请求，返回整个文件
    header('HTTP/1.1 200 OK');
    header('Content-Type: ' . $mime_type);
    header('Content-Length: ' . $filesize);
    header('Accept-Ranges: bytes');
    header('Content-Disposition: inline; filename="' . $filename . '"');
    
    // 输出文件
    readfile($file);
}

exit;
?>
