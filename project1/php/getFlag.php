<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES REST COUNTRIES API TO GET COUNTRY FLAG BASED ON ISO2 CODE https://restcountries.com/

require_once __DIR__ . "/libs.php";

$config = require_once __DIR__ . "/../config.php";

//if there is not iso2 
if(!isset($_GET["iso2"]) || trim($_GET["iso2"]) === ""){
    respond(400, "error", "No ISO2 code provided");
}

$iso2 = $_GET["iso2"];

$apiKey = $config["restCountries_API_KEY"];

if(!$apiKey){
    respond(500, "error", "Rest Countries API key not available");
}

$url = "https://api.restcountries.com/countries/v5/codes.alpha_2/" . urlencode($iso2);

$response = callApi($url, [
    "Authorization: Bearer " . $apiKey
]);

if($response === false){
    respond(500, "error", "Failed to reach Rest Countries API");
}

$data = json_decode($response, true);

$country = $data["data"]["objects"][0] ?? null;

if(!$country){
    respond(404, "error", "Country not found");
}


$flag = $country["flag"]["url_png"] ?? null;

if(!$flag){
    respond(404, "error", "Flag not found");
}

$result = [
    "flag" => $flag
];

respond(200, "success", "Country information loaded successfully", $result);
?>