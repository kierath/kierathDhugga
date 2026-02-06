<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES GEO.JSON DATA
require_once __DIR__ . "/libs.php";
//RETURNS THE FEATURE FOR A SELECTED COUNTRY
$data = file_get_contents("../data/countryBorders.geo.json");

if ($data === false) {
    respond(500, "error", "Failed to read countryBorders.geo.json");
}

$json = json_decode($data, true);
if($json === null) {
    respond(500, "error", "Failed to decode JSON data");
}

$iso2 = $_GET['iso2'] ?? $_GET['countryCode'] ?? '';

if(!$iso2) {
    //if theres no iso2 return all countries
    respond(200, "success", "All countries loaded", $json["features"]);
}


$countryFeature = null;

//loop through features to find the matching country
foreach ($json["features"] as $feature) {
    if(strtoupper($feature["properties"]["iso_a2"]) === strtoupper($iso2)) {
        $countryFeature = $feature;
        break;
    }
}

if($countryFeature) {
    respond(200, "success", "Country found", $countryFeature);
} else {
    respond(404, "error", "Country not found");
}
?>