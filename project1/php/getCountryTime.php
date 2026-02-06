<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES TIMEZONEDB API TO GET COUNTRY TIME BASED ON ISO2 CODE https://timezonedb.com/api
//gets ISO2 code from query parameter

require_once __DIR__ . "/libs.php";

//gets API key from config.php
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["timeZone_API_KEY"];

if(!$apiKey){
    respond(500, "error", "OpenCage API key not available");
}

if(!isset($_GET["iso2"]) || (!isset($_GET["name"]))){
   respond(400, "error", "No country provided");
}

$iso2 = $_GET["iso2"];
$name = $_GET["name"];
$url = "https://api.timezonedb.com/v2.1/list-time-zone?key={$apiKey}&format=json&country=" . urlencode($iso2);
$response = callApi($url);

if($response === false){
    respond(500, "error", "Failed to reach TimezoneDB API");
}

$data = json_decode($response, true);

$timezone = $data["zones"][0]["zoneName"] ?? null;

if(!$timezone){
    respond(404, "error", "No timezone for country: $iso2");
}

$result = [
    "timezone" => $timezone,
    "name" => $name
];

respond(200, "success", "Timezone loaded successfully", $result);
?>