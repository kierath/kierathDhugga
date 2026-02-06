<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

//THIS FILE USES OPEN CAGE API TO GET THE USERS LOCATION;
require_once __DIR__ . "/libs.php";

//gets API key from config.php
$config = require_once __DIR__ . "/../config.php";

$apiKey = $config["location_API_KEY"];

if(!$apiKey){
    respond(500, "error", "OpenCage API key not available");
}

if(!isset($_GET["lat"]) || !isset($_GET['lng'])){
    respond(400, "error", "No latitutude or longitude provided");
}

$lat = $_GET["lat"];
$lng = $_GET["lng"];


$url = "https://api.opencagedata.com/geocode/v1/json?q=$lat+$lng&key=$apiKey";

$response = callApi($url);

if($response === false){
    respond(500, "error", "Failed to reach Open Cage API");
}

$data = json_decode($response, true);

if(!$data || empty($data["results"][0])){
    respond(404, "error", "Country not found");
}


$country = $data["results"][0]["components"];
$countryCode = strtoupper($data["results"][0]["components"]["country_code"]); //strtoupper so all characters uppercase

$result = [
    "country" => $country,
    "iso2" => $countryCode
];

respond(200, "success", "Location data loaded successfully", $result);

?>
