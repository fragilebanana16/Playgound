<?php
header('Content-Type: application/json; charset=utf-8');

// 允许的视频扩展名
$videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mpeg', '.mpg', '.ts', '.m2ts'];

function scanVideoDirectory($dir) {
    global $videoExtensions;
    $videos = [];

    if (!is_dir($dir)) {
        return ['error' => '目录不存在: ' . $dir];
    }

    if (!is_readable($dir)) {
        return ['error' => '无法读取目录: ' . $dir];
    }

    try {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $extension = strtolower('.' . $file->getExtension());
                
                if (in_array($extension, $videoExtensions)) {
                    $videos[] = [
                        'name' => $file->getFilename(),
                        'path' => str_replace('\\', '/', $file->getPathname()),
                        'size' => $file->getSize(),
                        'modified' => $file->getMTime()
                    ];
                }
            }
        }

        // 按文件名排序
        usort($videos, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        return ['videos' => $videos];

    } catch (Exception $e) {
        return ['error' => '扫描出错: ' . $e->getMessage()];
    }
}

// 获取POST参数
$path = isset($_POST['path']) ? $_POST['path'] : '';

if (empty($path)) {
    echo json_encode(['error' => '请提供目录路径']);
    exit;
}

// 扫描目录
$result = scanVideoDirectory($path);
echo json_encode($result, JSON_UNESCAPED_UNICODE);
?>
