<?php
header('Content-Type: application/json');

$id = $_POST['id'] ?? null;
if (!$id) {
    echo json_encode(['status'=>'error','message'=>'No ID']);
    exit;
}

// Attempt root detection
$root = realpath(__DIR__ . "/../..");
if (!is_dir($root) || !file_exists($root . "/posts.json")) {
    $root = realpath(__DIR__ . "/..");
}
if (!is_dir($root)) {
    $root = __DIR__;
}

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if (basename($file) === "posts.json") {
        $arr = json_decode(file_get_contents($file), true);
        if (!$arr) $arr = [];
        $new = array_filter($arr, fn($p) => $p["id"] !== $id);
        file_put_contents($file, json_encode(array_values($new), JSON_PRETTY_PRINT));
    }
}

echo json_encode(['status'=>'ok']);
?>