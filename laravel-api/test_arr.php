<?php
$data = [ "habitaciones" => [ ["id" => 30, "habitacion" => "Doble"], ["habitacion" => "Sencilla"] ] ];
var_dump(array_column($data["habitaciones"], "id"));

