<?php
header("Content-Type: application/json");

$data = file_get_contents("../data/countryBorders.geo.json");
if ($data === false) {
  echo json_encode(["error" => "Failed to read countryBorders.geo.json"]);
  exit;
}

echo $data;
