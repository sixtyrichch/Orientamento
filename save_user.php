<?php
// save_user.php
// Riceve JSON { username, password } e appende a users.txt nella stessa cartella.
// ATTENZIONE: salva password in chiaro. Per produzione usare hashing e protezione.

header('Content-Type: application/json');

$raw = file_get_contents('php://input');
if(!$raw){
  echo json_encode(['ok'=>false,'msg'=>'No input']);
  exit;
}

$data = json_decode($raw, true);
if(!$data || !isset($data['username']) || !isset($data['password'])){
  echo json_encode(['ok'=>false,'msg'=>'Invalid data']);
  exit;
}

$username = str_replace(["\n","\r",","], ["","",""], trim($data['username']));
$password = str_replace(["\n","\r",","], ["","",""], trim($data['password']));

$line = $username . "," . $password . "\n";

// File path (same folder)
$file = __DIR__ . '/users.txt';

// Append safely (file locking)
if(file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false){
  echo json_encode(['ok'=>false,'msg'=>'Impossibile scrivere users.txt']);
  exit;
}

echo json_encode(['ok'=>true,'msg'=>'Saved']);
