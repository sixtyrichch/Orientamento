<?php
header('Content-Type: application/json');
ini_set('display_errors',1);
error_reporting(E_ALL);

// SUPPORTA POST JSON o x-www-form-urlencoded
$input = file_get_contents('php://input');
$id = null;
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $data = json_decode($input, true);
    $id = $data['id'] ?? null;
} else {
    // parse form-encoded
    parse_str($input, $data);
    $id = $data['id'] ?? $_POST['id'] ?? null;
}

if (!$id) {
    echo json_encode(['status'=>'error','message'=>'No id provided']);
    exit;
}
$id = intval($id);

// trova la root del progetto (assume file in /b/delete_post.php)
$root = realpath(__DIR__);

// Scansiona tutti i posts.json nella tree e rimuovi il post
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($it as $file) {
    if (strtolower($file->getFilename()) === 'posts.json' || preg_match('/_posts\.json$/i', $file->getFilename())) {
        $path = $file->getPathname();
        $arr = json_decode(file_get_contents($path), true);
        if (!is_array($arr)) continue;
        $changed = false;
        $new = [];
        foreach ($arr as $p) {
            if (isset($p['id']) && intval($p['id']) === $id) {
                // elimina file fisici associati (se sono riferimenti a uploads/)
                if (!empty($p['files']) && is_array($p['files'])) {
                    foreach ($p['files'] as $f) {
                        if (!empty($f['data']) && strpos($f['data'], 'uploads/') === 0) {
                            $fp = $root . '/' . $f['data'];
                            if (file_exists($fp)) @unlink($fp);
                        }
                    }
                }
                $changed = true;
                // non aggiungere questo post all'array new
            } else {
                $new[] = $p;
            }
        }
        if ($changed) {
            file_put_contents($path, json_encode(array_values($new), JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
        }
    }
}

echo json_encode(['status'=>'ok']);
exit;
