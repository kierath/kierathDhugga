<?php
header("Content-Type: application/json");

$data = file_get_contents("../data/countryBorders.geo.json");
$json = json_decode($data, true);

$countryCode = $_GET['countryCode'] ?? '';

if(!countryCode){
    echo json_encode(["error" => "No country code provided"]);
    exit;
}

$countryFeature = null;

foreach ($json["features"] as $feature) {
    if ($feature["properties"]["iso_a2"] === $countryCode) {
        $countryFeature = $feature;
        break;
    }
}

if($countryFeature) {
    echo json_encode([
        "data" => $countryFeature
    ]);
} else {
    echo json_encode(["error" => "Country not found"]);
}
?>