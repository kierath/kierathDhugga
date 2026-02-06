<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES GEO.JSON DATA
require_once __DIR__ . "/libs.php";
//RETURNS ALL COUNTRY CODES AND NAMES
$data = file_get_contents("../data/countryBorders.geo.json");

if ($data === false) {
    respond(500, "error", "Failed to read countryBorders.geo.json");
}

$json = json_decode($data, true);

if($json === null) {
    respond(500, "error", "Failed to decode countryBorders.geo.json");
}
//countries array
$countries = [];
$features = $json["features"]; //get the features first


foreach ($features as $feature) {
    //grabs country name and ISO2 code
    $name = $feature["properties"]["name"];
    $iso2 = $feature["properties"]["iso_a2"];

    $countries[] = [
        "name" => $name,
        "iso2" => $iso2
    ];
}

usort($countries, function ($a, $b) {
    return strcmp($a["name"], $b["name"]);
});

respond(200, "success", "Country list loaded successfully", $countries);
?>