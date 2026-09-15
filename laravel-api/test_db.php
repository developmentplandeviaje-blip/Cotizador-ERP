<?php
$pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname=plandeviaje_bd", "root", "");
$stmt = $pdo->query("SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'hotel'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

