<?php
header('Content-Type: application/json');

$postsFile = __DIR__ . "/posts.json";
if(!file_exists($postsFile)){
    echo json_encode(["success"=>false,"error"=>"posts.json non trovato"]);
    exit;
}

$posts = json_decode(file_get_contents($postsFile), true);
$data = json_decode(file_get_contents("php://input"), true);

if(!isset($data['id'])){
    echo json_encode(["success"=>false,"error"=>"ID post mancante"]);
    exit;
}

$postId = $data['id'];
$currentUser = $data['currentUser'] ?? null;

// Filtra i post: elimina solo se ID corrisponde e ownerEmail = currentUser
$posts = array_filter($posts, function($post) use($postId, $currentUser){
    return !($post['id'] == $postId && $post['ownerEmail'] === $currentUser);
});

file_put_contents($postsFile, json_encode(array_values($posts), JSON_PRETTY_PRINT));
echo json_encode(["success"=>true]);
?>
