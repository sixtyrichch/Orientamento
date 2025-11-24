<?php
header('Content-Type: application/json');

// Leggi i dati inviati
$data = json_decode(file_get_contents('php://input'), true);
$postId = $data['id'] ?? null;

if(!$postId){
    echo json_encode(['success'=>false,'error'=>'ID non fornito']);
    exit;
}

$postsFile = __DIR__ . '/posts.json';
if(!file_exists($postsFile)){
    echo json_encode(['success'=>false,'error'=>'File posts.json non trovato']);
    exit;
}

$posts = json_decode(file_get_contents($postsFile), true);
if(!$posts){
    echo json_encode(['success'=>false,'error'=>'Errore lettura posts.json']);
    exit;
}

// Trova il post da eliminare
$postIndex = null;
foreach($posts as $i => $p){
    if($p['id'] == $postId){
        $postIndex = $i;
        break;
    }
}

if($postIndex === null){
    echo json_encode(['success'=>false,'error'=>'Post non trovato']);
    exit;
}

// Elimina i file associati al post
if(!empty($posts[$postIndex]['files'])){
    foreach($posts[$postIndex]['files'] as $file){
        $filePath = __DIR__ . '/' . $file['data'];
        if(file_exists($filePath)) unlink($filePath);
    }
}

// Rimuovi il post dall’array
array_splice($posts, $postIndex, 1);

// Salva il file aggiornato
file_put_contents($postsFile, json_encode($posts, JSON_PRETTY_PRINT));

echo json_encode(['success'=>true]);
?>
