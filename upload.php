<?php
header('Content-Type: application/json');

$uploadDir = __DIR__ . '/uploads/';
if(!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$uploadedFiles = [];
if(isset($_FILES['files'])){
    foreach($_FILES['files']['tmp_name'] as $key => $tmpName){
        $filename = basename($_FILES['files']['name'][$key]);
        $targetPath = $uploadDir . $filename;
        if(move_uploaded_file($tmpName, $targetPath)){
            $uploadedFiles[] = [
                'name' => $filename,
                'type' => $_FILES['files']['type'][$key],
                'data' => 'uploads/' . $filename
            ];
        } else {
            echo json_encode(['success'=>false,'error'=>"Errore caricamento $filename"]);
            exit;
        }
    }
}

$postsFile = __DIR__ . '/posts.json';
$posts = file_exists($postsFile) ? json_decode(file_get_contents($postsFile), true) : [];

// Nuovo post
$newPost = [
    'id' => time(),
    'title' => $_POST['title'] ?? 'Senza titolo',
    'text' => $_POST['desc'] ?? '',
    'section' => $_POST['section'] ?? 'dashboard',
    'files' => $uploadedFiles,
    'ownerName' => $_POST['ownerName'] ?? 'Utente',
    'ownerEmail' => $_POST['ownerEmail'] ?? 'email@esempio.com'
];

array_unshift($posts, $newPost);

file_put_contents($postsFile, json_encode($posts, JSON_PRETTY_PRINT));

echo json_encode(['success'=>true,'files'=>$uploadedFiles]);
?>
