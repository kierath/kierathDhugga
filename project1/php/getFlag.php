<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES REST COUNTRIES API TO GET COUNTRY FLAG BASED ON ISO2 CODE https://restcountries.com/

require_once __DIR__ . "/libs.php";

//if there is not iso2 
if(!isset($_GET["iso2"]) || trim($_GET["iso2"]) === ""){
    respond(400, "error", "No ISO2 code provided");
}

$iso2 = $_GET["iso2"];

$url = "https://restcountries.com/v3.1/alpha/" . urlencode($iso2);

$response = callApi($url);
if($response === false){
    respond(500, "error", "Failed to reach Rest Countries API");
}
$data = json_decode($response, true);

//if data empty then no flag found
if(empty($data[0]["flags"]["png"])){
    respond(404, "error", "Flag not found or ISO2");
}

//first flag png
$flag = $data[0]["flags"]["png"];

$result = [
    "flag" => $flag
];

respond(200, "success", "Country information loaded successfully", $result);
?>