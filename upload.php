<?php
header("Content-Type: application/json");
ini_set('display_errors',1);
error_reporting(E_ALL);

// Parametri inviati dal client
$title = trim($_POST['title'] ?? '') ?: "Senza titolo";
$desc = trim($_POST['desc'] ?? '');
$section = trim($_POST['section'] ?? ''); // es: "Informatica_e_telecomunicazioni/Sist_Reti" o "Informatica_e_telecomunicazioni"
$ownerName = trim($_POST['ownerName'] ?? 'Utente');
$ownerEmail = trim($_POST['ownerEmail'] ?? '');

// Validazione minima
if (!$section) {
    echo json_encode(['success'=>false,'error'=>'Section mancante']);
    exit;
}

// Normalizza: settore e materia
$parts = explode('/', $section);
$sector = $parts[0] ?? '';
$subject = $parts[1] ?? ''; // può essere vuoto se si invia direttamente al settore

// Funzione per leggere/creare file json
function read_json_file($path){
    if(!file_exists($path)) return [];
    $txt = file_get_contents($path);
    $arr = json_decode($txt, true);
    return is_array($arr) ? $arr : [];
}

function write_json_file($path, $arr){
    file_put_contents($path, json_encode(array_values($arr), JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
}

// 1) Carica posts.json generale
$generalFile = __DIR__ . '/posts.json';
$generalPosts = read_json_file($generalFile);

// Genera un id unico basato sul massimo attuale (intero 32-bit)
$maxId = 0;
foreach ($generalPosts as $p) if (!empty($p['id'])) $maxId = max($maxId, intval($p['id']));
$newId = $maxId + 1;

// 2) prepara uploaded files (se vuoi salvare su disco invece di base64 modifica qui)
$uploadedFiles = [];
if (!empty($_FILES['files'])) {
    // support multi-file: files[name] as array
    $names = $_FILES['files']['name'];
    $tmp_names = $_FILES['files']['tmp_name'];
    $types = $_FILES['files']['type'];
    for ($i=0; $i < count($names); $i++){
        if (!is_uploaded_file($tmp_names[$i])) continue;
        $name = $names[$i];
        $type = $types[$i] ?? mime_content_type($tmp_names[$i]);
        // Qui salvo i file nella cartella uploads/ con nome unico
        $uploads_dir = __DIR__ . '/uploads';
        if (!is_dir($uploads_dir)) mkdir($uploads_dir, 0755, true);
        $uniq = time() . "_" . preg_replace('/[^a-zA-Z0-9_\.-]/','_', $name);
        $dest = $uploads_dir . '/' . $uniq;
        if (move_uploaded_file($tmp_names[$i], $dest)) {
            // salvo il percorsorelativo per il browser
            $uploadedFiles[] = [
                'name' => $name,
                'type' => $type,
                'data' => 'uploads/' . $uniq
            ];
        }
    }
}

// 3) nuovo oggetto post (con campi minimi + id)
$newPost = [
    'id' => $newId,
    'title' => $title,
    'text' => $desc,
    'section' => $subject ? ($sector . '/' . $subject) : $sector,
    'sector' => $sector,
    'subject' => $subject,
    'ownerName' => $ownerName,
    'ownerEmail' => $ownerEmail,
    'files' => $uploadedFiles,
    'timestamp' => time()
];

// 4) aggiungi all'inizio (order by newest)
array_unshift($generalPosts, $newPost);
write_json_file($generalFile, $generalPosts);

// 5) salva anche nel file del settore: /{sector}/posts.json
$sectorFile = __DIR__ . '/' . $sector . '/posts.json';
$sectorPosts = read_json_file($sectorFile);
array_unshift($sectorPosts, $newPost);
write_json_file($sectorFile, $sectorPosts);

// 6) salva anche nel file della materia se presente: /{sector}/{subject}_posts.json
if ($subject) {
    $subjectFile = __DIR__ . '/' . $sector . '/' . $subject . '_posts.json';
    $subjectPosts = read_json_file($subjectFile);
    array_unshift($subjectPosts, $newPost);
    write_json_file($subjectFile, $subjectPosts);
}

echo json_encode(['success'=>true,'id'=>$newId]);
exit;
?>
