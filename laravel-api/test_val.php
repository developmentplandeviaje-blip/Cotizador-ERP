<?php require "vendor/autoload.php"; $v = validator(["a" => [["id" => 1]]], ["a" => "array"]); var_dump($v->validated());
